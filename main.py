"""
Couch PiP backend.

Drives the picture-in-picture browser page through Steam's Chromium (CEF)
DevTools endpoint, the same one Decky Loader itself uses (localhost:8080).
That lets the controller "remote" send real clicks, key presses and typed
text into the page, and control the video, while the game keeps the
controller.

No third-party Python packages are needed: the tiny HTTP + WebSocket client
below uses only the standard library.
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import struct
from urllib.parse import urlparse

try:
    import decky  # provided by Decky Loader at runtime

    log = decky.logger
except ImportError:  # local testing outside Decky
    import logging

    logging.basicConfig(level=logging.INFO)
    log = logging.getLogger("couch-pip")

CDP_HOST = "127.0.0.1"
CDP_PORT = int(os.environ.get("COUCH_PIP_CDP_PORT", "8080"))

# Pages that belong to Steam itself and must never be driven by the remote.
STEAM_URL_PREFIXES = (
    "https://steamloopback.host",
    "http://steamloopback.host",
    "about:",
    "chrome",
    "devtools",
    "data:",
)


# --------------------------------------------------------------------------
# Minimal HTTP + WebSocket client (stdlib only)
# --------------------------------------------------------------------------


async def http_get_json(path: str, timeout: float = 3.0):
    reader, writer = await asyncio.wait_for(
        asyncio.open_connection(CDP_HOST, CDP_PORT), timeout
    )
    try:
        writer.write(
            f"GET {path} HTTP/1.1\r\nHost: {CDP_HOST}:{CDP_PORT}\r\n"
            "Connection: close\r\n\r\n".encode()
        )
        await writer.drain()
        # Chromium's DevTools server may keep the socket open, so read the
        # body by Content-Length instead of waiting for the connection to close.
        head = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), timeout)
        length = None
        for line in head.split(b"\r\n"):
            if line.lower().startswith(b"content-length:"):
                length = int(line.split(b":", 1)[1].strip())
        if length is not None:
            body = await asyncio.wait_for(reader.readexactly(length), timeout)
        else:
            body = await asyncio.wait_for(reader.read(), timeout)
            if b"chunked" in head.lower():
                body = _dechunk(body)
    finally:
        writer.close()
    return json.loads(body.decode("utf-8", "replace"))


def _dechunk(data: bytes) -> bytes:
    out = b""
    while data:
        size_line, _, rest = data.partition(b"\r\n")
        size = int(size_line.split(b";")[0] or b"0", 16)
        if size == 0:
            break
        out += rest[:size]
        data = rest[size + 2 :]
    return out


class WebSocket:
    def __init__(self, reader, writer):
        self.reader = reader
        self.writer = writer

    @classmethod
    async def connect(cls, url: str, timeout: float = 3.0):
        u = urlparse(url)
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(u.hostname, u.port or 80, limit=2**24), timeout
        )
        key = base64.b64encode(os.urandom(16)).decode()
        path = u.path + (("?" + u.query) if u.query else "")
        writer.write(
            (
                f"GET {path} HTTP/1.1\r\nHost: {u.hostname}:{u.port}\r\n"
                "Upgrade: websocket\r\nConnection: Upgrade\r\n"
                f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n"
            ).encode()
        )
        await writer.drain()
        status = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), timeout)
        if b" 101 " not in status.split(b"\r\n", 1)[0]:
            writer.close()
            raise ConnectionError(status.split(b"\r\n", 1)[0].decode())
        return cls(reader, writer)

    async def send(self, text: str):
        payload = text.encode()
        header = bytearray([0x81])  # FIN + text frame
        n = len(payload)
        if n < 126:
            header.append(0x80 | n)
        elif n < 65536:
            header.append(0x80 | 126)
            header += struct.pack("!H", n)
        else:
            header.append(0x80 | 127)
            header += struct.pack("!Q", n)
        mask = os.urandom(4)
        header += mask
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        self.writer.write(bytes(header) + masked)
        await self.writer.drain()

    async def recv(self) -> str:
        message = b""
        while True:
            b1, b2 = await self.reader.readexactly(2)
            fin, opcode = b1 & 0x80, b1 & 0x0F
            n = b2 & 0x7F
            if n == 126:
                (n,) = struct.unpack("!H", await self.reader.readexactly(2))
            elif n == 127:
                (n,) = struct.unpack("!Q", await self.reader.readexactly(8))
            mask = await self.reader.readexactly(4) if b2 & 0x80 else None
            data = await self.reader.readexactly(n)
            if mask:
                data = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
            if opcode == 0x8:
                raise ConnectionError("websocket closed")
            if opcode == 0x9:  # ping -> pong
                self.writer.write(bytes([0x8A, 0x80 | len(data)]) + b"\0\0\0\0" + data)
                continue
            if opcode in (0x0, 0x1, 0x2):
                message += data
                if fin:
                    return message.decode("utf-8", "replace")

    def close(self):
        try:
            self.writer.close()
        except Exception:
            pass


class CDPSession:
    """One DevTools connection to one page, with request/response matching."""

    def __init__(self, target_id: str, ws: WebSocket):
        self.target_id = target_id
        self.ws = ws
        self.next_id = 0
        self.pending: dict[int, asyncio.Future] = {}
        self.reader_task = asyncio.ensure_future(self._read_loop())

    @classmethod
    async def open(cls, target: dict):
        ws = await WebSocket.connect(target["webSocketDebuggerUrl"])
        session = cls(target["id"], ws)
        # Make the page believe it has focus, so keyboard input and
        # "is the tab visible" checks behave while the game is in front.
        try:
            await session.send("Emulation.setFocusEmulationEnabled", {"enabled": True})
        except Exception as e:  # older CEF builds may not have it
            log.warning(f"focus emulation unavailable: {e}")
        return session

    @property
    def alive(self):
        return not self.reader_task.done()

    async def _read_loop(self):
        try:
            while True:
                msg = json.loads(await self.ws.recv())
                fut = self.pending.pop(msg.get("id"), None)
                if fut and not fut.done():
                    fut.set_result(msg)
        except Exception as e:
            for fut in self.pending.values():
                if not fut.done():
                    fut.set_exception(ConnectionError(str(e)))
            self.pending.clear()

    async def send(self, method: str, params: dict | None = None, timeout: float = 5.0):
        if not self.alive:
            raise ConnectionError("session closed")
        self.next_id += 1
        mid = self.next_id
        fut = asyncio.get_event_loop().create_future()
        self.pending[mid] = fut
        await self.ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
        msg = await asyncio.wait_for(fut, timeout)
        if "error" in msg:
            raise RuntimeError(msg["error"].get("message", str(msg["error"])))
        return msg.get("result", {})

    def close(self):
        self.reader_task.cancel()
        self.ws.close()


# --------------------------------------------------------------------------
# JavaScript run inside the PiP page
# --------------------------------------------------------------------------

# TV-style spatial navigation: move a visible highlight to the nearest
# clickable thing in the pressed direction. Works on any website.
JS_NAV = r"""
(() => {
  const dir = %s;
  const SEL = 'a[href],button,input:not([type=hidden]),select,textarea,summary,video,' +
    '[tabindex]:not([tabindex="-1"]),[role=button],[role=link],[role=menuitem],' +
    '[role=tab],[role=option],[role=checkbox],[role=switch],[contenteditable=true]';
  if (!document.getElementById('__cpip_style')) {
    const s = document.createElement('style');
    s.id = '__cpip_style';
    s.textContent = '.__cpip_focus{outline:4px solid #1a9fff !important;outline-offset:2px !important;' +
      'box-shadow:0 0 0 8px rgba(26,159,255,.35) !important;border-radius:4px}';
    (document.head || document.documentElement).appendChild(s);
  }
  const usable = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return null;
    if (el.disabled) return null;
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || st.display === 'none' || +st.opacity === 0) return null;
    return r;
  };
  let cur = window.__cpip_cur;
  if (!cur || !cur.isConnected || !usable(cur)) {
    const a = document.activeElement;
    cur = a && a !== document.body && a !== document.documentElement && usable(a) ? a : null;
  }
  const all = [...document.querySelectorAll(SEL)];
  let next = null;
  if (!cur) {
    // Nothing selected yet: start at the visible element closest to the top-left.
    let best = Infinity;
    for (const el of all) {
      const r = usable(el);
      if (!r || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      const d = Math.max(r.top, 0) * 2 + Math.max(r.left, 0);
      if (d < best) { best = d; next = el; }
    }
  } else {
    const c = usable(cur);
    const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
    let best = Infinity;
    for (const el of all) {
      if (el === cur || cur.contains(el) || el.contains(cur)) continue;
      const r = usable(el);
      if (!r) continue;
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      let along, across;
      if (dir === 'right') { if (r.left < c.right - 1 && x <= cx + 1) continue; along = Math.max(0, r.left - c.right); across = (r.bottom > c.top && r.top < c.bottom) ? 0 : Math.abs(y - cy); }
      else if (dir === 'left') { if (r.right > c.left + 1 && x >= cx - 1) continue; along = Math.max(0, c.left - r.right); across = (r.bottom > c.top && r.top < c.bottom) ? 0 : Math.abs(y - cy); }
      else if (dir === 'down') { if (r.top < c.bottom - 1 && y <= cy + 1) continue; along = Math.max(0, r.top - c.bottom); across = (r.right > c.left && r.left < c.right) ? 0 : Math.abs(x - cx); }
      else { if (r.bottom > c.top + 1 && y >= cy - 1) continue; along = Math.max(0, c.top - r.bottom); across = (r.right > c.left && r.left < c.right) ? 0 : Math.abs(x - cx); }
      const score = along + across * 3;
      if (score < best) { best = score; next = el; }
    }
  }
  if (!next) {
    // Nothing further that way: scroll instead, so long pages stay reachable.
    const step = innerHeight * 0.6;
    if (dir === 'down') scrollBy({ top: step, behavior: 'smooth' });
    else if (dir === 'up') scrollBy({ top: -step, behavior: 'smooth' });
    return cur ? 'edge' : 'none';
  }
  if (cur) cur.classList.remove('__cpip_focus');
  next.classList.add('__cpip_focus');
  window.__cpip_cur = next;
  try { next.focus({ preventScroll: true }); } catch (e) {}
  next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  const label = (next.getAttribute('aria-label') || next.innerText || next.value || next.title || next.tagName || '').trim();
  return label.replace(/\s+/g, ' ').slice(0, 60) || next.tagName.toLowerCase();
})()
"""

# Center of the highlighted element, for a real mouse click.
JS_TARGET_POINT = r"""
(() => {
  let el = window.__cpip_cur;
  if (!el || !el.isConnected) el = document.activeElement;
  if (!el || el === document.body) return null;
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2,
           editable: el.matches('input,textarea,[contenteditable=true],select') };
})()
"""

# Video controls. Netflix forbids setting currentTime directly, so it uses
# Netflix's own player API for seeking.
JS_MEDIA = r"""
(() => {
  const action = %s, amount = %s;
  const vids = [...document.querySelectorAll('video')]
    .sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight);
  const v = vids.find(v => v.readyState > 0) || vids[0];
  if (!v) return 'No video on this page';
  switch (action) {
    case 'toggle':
      if (v.paused) { v.play(); return 'Playing'; }
      v.pause(); return 'Paused';
    case 'seek':
      if (location.hostname.includes('netflix.')) {
        try {
          const vp = netflix.appContext.state.playerApp.getAPI().videoPlayer;
          const p = vp.getVideoPlayerBySessionId(vp.getAllPlayerSessionIds()[0]);
          p.seek(p.getCurrentTime() + amount * 1000);
          return (amount > 0 ? '+' : '') + amount + 's';
        } catch (e) { return 'Netflix seek failed'; }
      }
      v.currentTime = Math.max(0, v.currentTime + amount);
      return (amount > 0 ? '+' : '') + amount + 's';
    case 'volume':
      v.muted = false;
      v.volume = Math.min(1, Math.max(0, Math.round((v.volume + amount) * 20) / 20));
      return 'Volume ' + Math.round(v.volume * 100) + '%%';
    case 'mute':
      v.muted = !v.muted; return v.muted ? 'Muted' : 'Unmuted';
    case 'videoonly': {
      const id = '__cpip_videoonly';
      const old = document.getElementById(id);
      if (old) { old.remove(); v.classList.remove('__cpip_vo'); return 'Full page'; }
      const s = document.createElement('style');
      s.id = id;
      s.textContent = '.__cpip_vo{position:fixed !important;inset:0 !important;width:100vw !important;' +
        'height:100vh !important;max-width:none !important;max-height:none !important;z-index:2147483647 !important;' +
        'background:#000 !important;object-fit:contain !important;transform:none !important;margin:0 !important}' +
        'html,body{overflow:hidden !important}';
      (document.head || document.documentElement).appendChild(s);
      v.classList.add('__cpip_vo');
      return 'Video only';
    }
    case 'status':
      return { paused: v.paused, time: v.currentTime, duration: v.duration, volume: v.volume, muted: v.muted };
  }
  return 'Unknown action';
})()
"""

# Real key presses, sent through DevTools so the page's default actions run.
KEYS = {
    "Enter": ("Enter", "Enter", 13, "\r"),
    "Escape": ("Escape", "Escape", 27, None),
    "Backspace": ("Backspace", "Backspace", 8, None),
    "Tab": ("Tab", "Tab", 9, None),
    "Space": (" ", "Space", 32, " "),
    "ArrowLeft": ("ArrowLeft", "ArrowLeft", 37, None),
    "ArrowUp": ("ArrowUp", "ArrowUp", 38, None),
    "ArrowRight": ("ArrowRight", "ArrowRight", 39, None),
    "ArrowDown": ("ArrowDown", "ArrowDown", 40, None),
    "f": ("f", "KeyF", 70, "f"),
    "k": ("k", "KeyK", 75, "k"),
    "m": ("m", "KeyM", 77, "m"),
}


# --------------------------------------------------------------------------
# Plugin
# --------------------------------------------------------------------------


def _host(url: str) -> str:
    h = (urlparse(url).hostname or "").lower()
    for prefix in ("www.", "m.", "app."):
        if h.startswith(prefix):
            h = h[len(prefix) :]
    return h


def _is_steam_page(url: str) -> bool:
    return url.startswith(STEAM_URL_PREFIXES) or "steampowered.com" in url


class Plugin:
    session: CDPSession | None = None
    lock: asyncio.Lock | None = None

    async def _main(self):
        self.lock = asyncio.Lock()
        log.info("Couch PiP backend started")

    async def _unload(self):
        if self.session:
            self.session.close()
            self.session = None

    async def _uninstall(self):
        pass

    # ---- target discovery -------------------------------------------------

    async def list_targets(self):
        """All DevTools pages, for the diagnostics panel."""
        try:
            targets = await http_get_json("/json")
        except Exception as e:
            return {"ok": False, "error": f"Can't reach Steam's DevTools on port {CDP_PORT}: {e!r}"}
        return {
            "ok": True,
            "attached": self.session.target_id if self.session and self.session.alive else None,
            "targets": [
                {"id": t.get("id"), "type": t.get("type"), "title": t.get("title", "")[:80], "url": t.get("url", "")[:200]}
                for t in targets
            ],
        }

    async def attach(self, url: str, exclude_ids: list | None = None):
        """
        Find the PiP page among Steam's browser pages and connect to it.
        The page is matched by the site it is showing; the connection is then
        kept by page id, so later redirects (sign-in pages) don't lose it.
        """
        if self.lock is None:
            self.lock = asyncio.Lock()
        async with self.lock:
            return await self._attach(url, exclude_ids or [])

    async def _attach(self, url: str, exclude_ids: list):
        try:
            targets = await http_get_json("/json")
        except Exception as e:
            return {"ok": False, "error": f"Can't reach Steam's DevTools on port {CDP_PORT}: {e!r}"}
        pages = [
            t for t in targets
            if t.get("type") == "page" and t.get("webSocketDebuggerUrl")
            and not _is_steam_page(t.get("url", "")) and t.get("id") not in exclude_ids
        ]
        # Keep the current connection if its page still exists.
        if self.session and self.session.alive and any(t["id"] == self.session.target_id for t in pages):
            t = next(t for t in pages if t["id"] == self.session.target_id)
            return {"ok": True, "id": t["id"], "url": t.get("url"), "title": t.get("title")}
        want = _host(url)
        match = [t for t in pages if want and _host(t.get("url", "")) == want]
        if not match:
            match = [t for t in pages if want and want.split(".")[-2:] == _host(t.get("url", "")).split(".")[-2:]]
        if not match:
            return {"ok": False, "error": "PiP page not found yet", "pages": [t.get("url") for t in pages][:10]}
        t = match[0]
        if self.session:
            self.session.close()
        try:
            self.session = await CDPSession.open(t)
        except Exception as e:
            self.session = None
            return {"ok": False, "error": f"Couldn't connect to page: {e}"}
        log.info(f"attached to {t.get('url')} ({t['id']})")
        return {"ok": True, "id": t["id"], "url": t.get("url"), "title": t.get("title")}

    async def detach(self):
        if self.session:
            self.session.close()
            self.session = None
        return {"ok": True}

    async def _send(self, method: str, params: dict | None = None):
        if not self.session or not self.session.alive:
            raise ConnectionError("Not connected to the PiP page")
        return await self.session.send(method, params)

    async def _eval(self, expression: str):
        res = await self._send(
            "Runtime.evaluate",
            {"expression": expression, "returnByValue": True, "userGesture": True, "awaitPromise": False},
        )
        if "exceptionDetails" in res:
            raise RuntimeError(res["exceptionDetails"].get("text", "script error"))
        return res.get("result", {}).get("value")

    async def _safe(self, coro):
        try:
            return {"ok": True, "result": await coro}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    # ---- remote actions ---------------------------------------------------

    async def nav(self, direction: str):
        if direction not in ("up", "down", "left", "right"):
            return {"ok": False, "error": "bad direction"}
        return await self._safe(self._eval(JS_NAV % json.dumps(direction)))

    async def click(self):
        async def run():
            point = await self._eval(JS_TARGET_POINT)
            if not point:
                return "Nothing selected"
            x, y = point["x"], point["y"]
            base = {"x": x, "y": y, "button": "left", "clickCount": 1}
            await self._send("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": x, "y": y})
            await self._send("Input.dispatchMouseEvent", {"type": "mousePressed", **base})
            await self._send("Input.dispatchMouseEvent", {"type": "mouseReleased", **base})
            return "editable" if point.get("editable") else "Clicked"

        return await self._safe(run())

    async def key(self, name: str):
        if name not in KEYS:
            return {"ok": False, "error": f"unknown key {name}"}
        key, code, vk, text = KEYS[name]

        async def run():
            down = {"type": "keyDown" if text else "rawKeyDown", "key": key, "code": code,
                    "windowsVirtualKeyCode": vk, "nativeVirtualKeyCode": vk}
            if text:
                down["text"] = text
                down["unmodifiedText"] = text
            await self._send("Input.dispatchKeyEvent", down)
            await self._send("Input.dispatchKeyEvent", {"type": "keyUp", "key": key, "code": code,
                                                        "windowsVirtualKeyCode": vk, "nativeVirtualKeyCode": vk})
            return name

        return await self._safe(run())

    async def insert_text(self, text: str):
        async def run():
            await self._send("Input.insertText", {"text": text})
            return "Typed"

        return await self._safe(run())

    async def media(self, action: str, amount: float = 0):
        return await self._safe(self._eval(JS_MEDIA % (json.dumps(action), json.dumps(amount))))

    async def back(self):
        return await self._safe(self._eval("history.back(), 'Back'"))

    async def reload(self):
        return await self._safe(self._send("Page.reload", {}))
