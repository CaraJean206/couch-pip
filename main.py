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
    async def open(cls, target: dict, focus: bool = True):
        ws = await WebSocket.connect(target["webSocketDebuggerUrl"])
        session = cls(target["id"], ws)
        if not focus:
            return session
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
    case 'videoonly':
    case 'fill':
      return window.__cpip ? window.__cpip.toggleFill(v) : 'Page helper not loaded';
    case 'status':
      return { paused: v.paused, time: v.currentTime, duration: v.duration, volume: v.volume, muted: v.muted };
  }
  return 'Unknown action';
})()
"""

# Installed into every page the PiP view loads (and re-run on each new page):
# - hides scrollbars
# - "fill": makes the video player cover the whole PiP window
# - fills automatically when a real video starts (not muted previews/trailers)
# - turns the sites' own fullscreen buttons into "fill the PiP window"
# - draws the trackpad mouse cursor
JS_HELPER = r"""
(() => {
  const OPTS = __OPTS__;
  if (window.__cpip) { Object.assign(window.__cpip.opts, OPTS); return 'updated'; }

  const css = `
    *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
    html, body { scrollbar-width: none !important; }
    .__cpip_fill { position: fixed !important; inset: 0 !important; left: 0 !important; top: 0 !important;
      width: 100vw !important; height: 100vh !important; max-width: none !important; max-height: none !important;
      min-width: 0 !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important;
      transform: none !important; z-index: 2147483640 !important; background: #000 !important; }
    #__cpip_shield { position: fixed; inset: 0; z-index: 2147483645; pointer-events: none; background: rgba(0,0,0,0.004); }
    video.__cpip_fill, .__cpip_fill video { width: 100% !important; height: 100% !important; left: 0 !important;
      top: 0 !important; object-fit: contain !important; }
    .__cpip_hide { visibility: hidden !important; }
    .__cpip_anc { transform: none !important; filter: none !important; perspective: none !important;
      contain: none !important; will-change: auto !important; backdrop-filter: none !important;
      container-type: normal !important; content-visibility: visible !important; }
    html.__cpip_filled, html.__cpip_filled body { overflow: hidden !important; }
    #__cpip_cursor { position: fixed; left: 0; top: 0; width: 22px; height: 22px; z-index: 2147483647;
      pointer-events: none; transition: opacity .3s; opacity: 0; filter: drop-shadow(0 1px 2px rgba(0,0,0,.8)); }
  `;
  const addStyle = () => {
    if (document.getElementById('__cpip_helper_style')) return;
    const s = document.createElement('style');
    s.id = '__cpip_helper_style';
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  };
  if (document.documentElement) addStyle();
  document.addEventListener('DOMContentLoaded', addStyle);

  const state = { el: null, video: null, hidden: [], ancestors: [], dismissed: null, failed: new WeakSet(), last: '' };

  // The player box: the outermost ancestor that is the same size as the video,
  // so controls and subtitles come along.
  const playerFor = (v) => {
    const r = v.getBoundingClientRect();
    let best = v, el = v.parentElement;
    while (el && el !== document.body && el !== document.documentElement) {
      const p = el.getBoundingClientRect();
      if (Math.abs(p.width - r.width) > 6 || Math.abs(p.height - r.height) > 6) break;
      best = el;
      el = el.parentElement;
    }
    return best;
  };

  const largestVideo = () => [...document.querySelectorAll('video')]
    .sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0] || null;

  const unfill = () => {
    const sh = document.getElementById('__cpip_shield');
    if (sh) sh.remove();
    if (state.el) state.el.classList.remove('__cpip_fill');
    state.hidden.forEach((e) => e.classList.remove('__cpip_hide'));
    state.hidden = [];
    state.ancestors.forEach((e) => e.classList.remove('__cpip_anc'));
    state.ancestors = [];
    state.el = null;
    state.video = null;
    document.documentElement.classList.remove('__cpip_filled');
  };

  // Is the filled player really covering the window, with its video on screen?
  const coversWindow = (el, video) => {
    const r = el.getBoundingClientRect();
    const okBox = Math.abs(r.left) < 4 && Math.abs(r.top) < 4 &&
      Math.abs(r.width - innerWidth) < 8 && Math.abs(r.height - innerHeight) < 8;
    if (!okBox || !video) return okBox;
    const v = video.getBoundingClientRect();
    const visible = v.width > 40 && v.height > 40 && v.right > 0 && v.bottom > 0 &&
      v.left < innerWidth && v.top < innerHeight && getComputedStyle(video).visibility === 'visible';
    return visible;
  };

  const applyFill = (el, video) => {
    addStyle();
    el.classList.add('__cpip_fill');
    for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
      const parent = node.parentElement;
      if (!parent) break;
      // Ancestors must not pin "fixed" to themselves (transform, filter, contain...).
      if (parent !== document.documentElement && parent !== document.body) {
        parent.classList.add('__cpip_anc');
        state.ancestors.push(parent);
      }
      // Hide everything that isn't the player or one of its ancestors.
      for (const sib of parent.children) {
        if (sib !== node && !sib.classList.contains('__cpip_hide') && sib.tagName !== 'STYLE' && sib.tagName !== 'SCRIPT') {
          sib.classList.add('__cpip_hide');
          state.hidden.push(sib);
        }
      }
    }
    state.el = el;
    state.video = video || el.querySelector('video') || (el.tagName === 'VIDEO' ? el : null);
    document.documentElement.classList.add('__cpip_filled');
    // A nearly invisible layer over the video keeps the browser drawing the
    // video itself instead of handing it to a display shortcut that Steam's
    // view may not show.
    const shield = document.createElement('div');
    shield.id = '__cpip_shield';
    document.documentElement.appendChild(shield);
  };

  // Fill the window with the player; if that doesn't work on this site, try
  // the bare video, and if that fails too, put the page back as it was rather
  // than leave a black window.
  const fill = (el, video) => {
    if (!el) return false;
    unfill();
    applyFill(el, video);
    if (coversWindow(el, state.video)) { state.last = 'filled player'; return true; }
    const v = state.video;
    if (v && el !== v) {
      unfill();
      applyFill(v, v);
      if (coversWindow(v, v)) { state.last = 'filled video only'; return true; }
    }
    unfill();
    if (v) state.failed.add(v);
    state.last = 'fill failed, page left as is';
    return false;
  };

  const status = () => {
    const vids = [...document.querySelectorAll('video')].map((v) => {
      const r = v.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top),
        paused: v.paused, muted: v.muted, duration: v.duration, ready: v.readyState };
    });
    const f = state.el && state.el.getBoundingClientRect();
    return { filled: !!state.el, fillTag: state.el ? state.el.tagName.toLowerCase() + (state.el.id ? '#' + state.el.id : '') : null,
      fillRect: f ? [f.left, f.top, f.width, f.height].map(Math.round) : null, window: [innerWidth, innerHeight],
      last: state.last, autofill: window.__cpip.opts.autofill, videos: vids };
  };

  const toggleFill = (v) => {
    if (state.el) {
      const dv = state.video;
      state.dismissed = dv ? { video: dv, src: dv.currentSrc || dv.src } : null;
      unfill();
      return 'Full page';
    }
    v = v || largestVideo();
    if (!v) return 'No video on this page';
    state.dismissed = null;
    return fill(playerFor(v), v) ? 'Filling window' : "Couldn't fill on this site";
  };

  // Sites' fullscreen buttons: fill the PiP window instead of the real screen.
  let fsEl = null, lastFs = null;
  const fireFs = () => {
    const target = fsEl || lastFs || document;
    for (const name of ['fullscreenchange', 'webkitfullscreenchange']) {
      target.dispatchEvent(new Event(name, { bubbles: true }));
    }
  };
  const request = function () {
    const el = this === document.documentElement || this === document.body
      ? (largestVideo() ? playerFor(largestVideo()) : null) : this;
    if (el) fill(el, el.querySelector ? el.querySelector('video') : null);
    fsEl = lastFs = this;
    setTimeout(fireFs, 0);
    return Promise.resolve();
  };
  const exit = function () {
    unfill();
    fsEl = null;
    setTimeout(fireFs, 0);
    return Promise.resolve();
  };
  try {
    Element.prototype.requestFullscreen = request;
    Element.prototype.webkitRequestFullscreen = request;
    Element.prototype.webkitRequestFullScreen = request;
    Document.prototype.exitFullscreen = exit;
    Document.prototype.webkitExitFullscreen = exit;
    Document.prototype.webkitCancelFullScreen = exit;
    for (const name of ['fullscreenElement', 'webkitFullscreenElement', 'webkitCurrentFullScreenElement']) {
      Object.defineProperty(Document.prototype, name, { configurable: true, get: () => fsEl });
    }
    for (const name of ['fullscreenEnabled', 'webkitFullscreenEnabled']) {
      Object.defineProperty(Document.prototype, name, { configurable: true, get: () => true });
    }
    Object.defineProperty(Document.prototype, 'webkitIsFullScreen', { configurable: true, get: () => !!fsEl });
  } catch (e) {}
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fsEl) document.exitFullscreen();
  }, true);

  // Auto-fill when a real video plays; undo when it goes away or ends.
  // Wait until it has played steadily for a few seconds, so the site has
  // finished setting up its player first (filling too early can leave
  // Steam's view showing a blank picture).
  const isRealPlayback = (v) => !v.paused && !v.muted && v.readyState > 2 &&
    (v.duration > 90 || v.duration === Infinity) && v.getBoundingClientRect().width > 80;
  const SETTLE_SECONDS = 3;
  let watch = null; // { video, src, start }
  setInterval(() => {
    if (state.el && (!state.el.isConnected || (state.video && (!state.video.isConnected || state.video.ended)))) {
      unfill();
      fsEl = null;
    }
    if (!window.__cpip.opts.autofill || state.el) { watch = null; return; }
    const v = [...document.querySelectorAll('video')].filter((x) => isRealPlayback(x) && !state.failed.has(x))
      .sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
    const d = state.dismissed;
    if (!v || (d && d.video === v && d.src === (v.currentSrc || v.src))) { watch = null; return; }
    const src = v.currentSrc || v.src;
    if (!watch || watch.video !== v || watch.src !== src) {
      watch = { video: v, src, start: v.currentTime };
      return;
    }
    if (v.currentTime - watch.start >= SETTLE_SECONDS) {
      watch = null;
      fill(playerFor(v), v);
    }
  }, 1000);

  // When the picture changes size (remote opened or closed, size slider),
  // redo the fill so Steam's view draws it fresh at the new size.
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (!state.el) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!state.el) return;
      const el = state.el, v = state.video;
      unfill();
      requestAnimationFrame(() => requestAnimationFrame(() => fill(el, v)));
    }, 400);
  });

  // Trackpad cursor.
  const cursor = { x: innerWidth / 2, y: innerHeight / 2, el: null, timer: null };
  const showCursor = () => {
    if (!cursor.el || !cursor.el.isConnected) {
      const c = document.createElement('div');
      c.id = '__cpip_cursor';
      // Built with DOM calls: sites like YouTube block inserting raw HTML.
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '22');
      svg.setAttribute('height', '22');
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', 'M3 2l7 19 2.6-7.6L20 11z');
      path.setAttribute('fill', '#fff');
      path.setAttribute('stroke', '#000');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);
      c.appendChild(svg);
      document.documentElement.appendChild(c);
      cursor.el = c;
    }
    cursor.el.style.transform = `translate(${cursor.x - 3}px, ${cursor.y - 2}px)`;
    cursor.el.style.opacity = '1';
    clearTimeout(cursor.timer);
    cursor.timer = setTimeout(() => { if (cursor.el) cursor.el.style.opacity = '0'; }, 3000);
  };
  const pointer = (dx, dy) => {
    cursor.x = Math.min(innerWidth - 1, Math.max(0, cursor.x + dx * innerWidth));
    cursor.y = Math.min(innerHeight - 1, Math.max(0, cursor.y + dy * innerHeight));
    showCursor();
    return { x: cursor.x, y: cursor.y, h: innerHeight };
  };

  window.__cpip = { opts: OPTS, fill, unfill, toggleFill, pointer, playerFor, state, status };
  return 'installed';
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
    opts: dict = {"autofill": True, "safe": False}
    helper_script_id: str | None = None

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
            self.helper_script_id = None
            self.session = await CDPSession.open(t, focus=not self.opts.get("safe"))
        except Exception as e:
            self.session = None
            return {"ok": False, "error": f"Couldn't connect to page: {e}"}
        log.info(f"attached to {t.get('url')} ({t['id']})")
        if not self.opts.get("safe"):
            await self._install_helper()
        return {"ok": True, "id": t["id"], "url": t.get("url"), "title": t.get("title")}

    def _helper_source(self) -> str:
        return JS_HELPER.replace("__OPTS__", json.dumps(self.opts))

    async def _install_helper(self):
        """Run the page helper now and on every page this view loads later."""
        if not self.session or not self.session.alive:
            return
        source = self._helper_source()
        try:
            await self.session.send("Page.enable")
        except Exception:
            pass
        try:
            if self.helper_script_id:
                await self.session.send("Page.removeScriptToEvaluateOnNewDocument", {"identifier": self.helper_script_id})
            res = await self.session.send("Page.addScriptToEvaluateOnNewDocument", {"source": source})
            self.helper_script_id = res.get("identifier")
        except Exception as e:
            log.warning(f"couldn't register page helper: {e}")
        try:
            await self.session.send("Runtime.evaluate", {"expression": source, "returnByValue": True})
        except Exception as e:
            log.warning(f"couldn't run page helper: {e}")

    async def set_options(self, autofill: bool, safe: bool = False):
        was_safe = bool(self.opts.get("safe"))
        self.opts = {**self.opts, "autofill": bool(autofill), "safe": bool(safe)}
        if not (self.session and self.session.alive):
            pass
        elif safe and not was_safe:
            # Remove every page change: stop injecting, undo, reload clean.
            try:
                if self.helper_script_id:
                    await self.session.send("Page.removeScriptToEvaluateOnNewDocument", {"identifier": self.helper_script_id})
                self.helper_script_id = None
                await self.session.send("Emulation.setFocusEmulationEnabled", {"enabled": False})
                await self.session.send("Page.reload", {})
            except Exception as e:
                log.warning(f"safe mode cleanup: {e}")
        elif not safe:
            try:
                await self.session.send("Emulation.setFocusEmulationEnabled", {"enabled": True})
            except Exception:
                pass
            await self._install_helper()
        return {"ok": True, "opts": self.opts}

    async def detach(self):
        if self.session:
            self.session.close()
            self.session = None
        self.helper_script_id = None
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

    async def pointer(self, dx: float, dy: float, wheel: float = 0, click: bool = False):
        """
        Trackpad / stick mouse. dx, dy and wheel are fractions of the page size;
        the page helper keeps the cursor position and draws it.
        """

        async def run():
            expr = f"window.__cpip ? window.__cpip.pointer({float(dx)!r}, {float(dy)!r}) : null"
            pos = await self._eval(expr)
            if not pos:
                await self._install_helper()
                pos = await self._eval(expr)
            if not pos:
                return "Page helper not loaded"
            x, y = pos["x"], pos["y"]
            await self._send("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": x, "y": y})
            if wheel:
                await self._send(
                    "Input.dispatchMouseEvent",
                    {"type": "mouseWheel", "x": x, "y": y, "deltaX": 0, "deltaY": float(wheel) * pos["h"]},
                )
            if click:
                base = {"x": x, "y": y, "button": "left", "clickCount": 1}
                await self._send("Input.dispatchMouseEvent", {"type": "mousePressed", **base})
                await self._send("Input.dispatchMouseEvent", {"type": "mouseReleased", **base})
                return "Clicked"
            return ""

        return await self._safe(run())

    async def fill_status(self):
        """What the page helper sees, for the diagnostics panel."""
        return await self._safe(self._eval("window.__cpip ? window.__cpip.status() : null"))

    async def snapshot(self):
        """A picture of what the browser itself is drawing for the page."""

        async def run():
            try:
                await self._send("Page.enable")
            except Exception:
                pass
            res = await self.session.send(
                "Page.captureScreenshot", {"format": "jpeg", "quality": 60}, timeout=8
            )
            return "data:image/jpeg;base64," + res["data"]

        return await self._safe(run())

    async def list_input_devices(self):
        """Controller devices the system sees (for choosing a direct-read approach)."""
        try:
            with open("/proc/bus/input/devices", "r", encoding="utf-8", errors="replace") as f:
                text = f.read()
        except Exception as e:
            return {"ok": False, "error": f"Can't read input devices: {e}"}
        devices = []
        for block in text.strip().split("\n\n"):
            name, handlers, abs_caps = "", "", ""
            for line in block.splitlines():
                if line.startswith("N: Name="):
                    name = line[8:].strip().strip('"')
                elif line.startswith("H: Handlers="):
                    handlers = line[12:].strip()
                elif line.startswith("B: ABS="):
                    abs_caps = line[7:].strip()
            events = [h for h in handlers.split() if h.startswith("event")]
            readable = [e for e in events if os.access(f"/dev/input/{e}", os.R_OK)]
            if name:
                devices.append({"name": name, "events": events, "readable": readable, "abs": abs_caps})
        hidraw = sorted(d for d in os.listdir("/dev") if d.startswith("hidraw")) if os.path.isdir("/dev") else []
        return {
            "ok": True,
            "user": os.environ.get("USER") or str(os.getuid()),
            "devices": devices,
            "hidraw": [{"dev": h, "readable": os.access(f"/dev/{h}", os.R_OK)} for h in hidraw],
        }
