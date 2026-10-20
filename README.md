# Couch PiP

Watch YouTube, Netflix, Twitch, Plex, Jellyfin or any website in a small
window over your game on a Steam Machine (or Steam Deck), and control it with
your controller.

Based on [Picture in Picture](https://github.com/rossimo/decky-pip) by Ross
Squires. What's new in this fork:

- **Sized for TVs.** Uses the real size of Steam's screen instead of the Steam
  Deck's, so it fits 1080p, 1440p and 4K. Four picture sizes (S to XL) and
  four edge spacings.
- **Controller remote.** "Control page with controller" opens a remote that
  moves a highlight around the page with the D-pad, so you can sign in, search
  and pick episodes without a mouse.
- **Playback buttons** in the Quick Access Menu: back/ahead 10s, play/pause,
  volume.
- **Saved sources.** Built-in shortcuts plus your own bookmarks, e.g. your home
  Jellyfin or Plex server.
- **Fills the window.** No scrollbars, and when a video starts playing the
  player fills the whole picture (the sites' own fullscreen buttons do the
  same). Press Menu in the remote to switch back to the full page.
- **Trackpads.** In the remote, the right trackpad (or right stick) is a mouse,
  clicking the right trackpad clicks, and the left trackpad scrolls.
- **Nine positions:** corners, middle of each side, and center.

## Install (developer mode)

1. If the original "Picture in Picture" plugin is installed, uninstall it first.
2. In Decky's settings, turn on **Developer mode**.
3. In the new **Developer** tab, choose **Install plugin from ZIP file** and
   pick `couch-pip.zip`. (Or unzip it into `~/homebrew/plugins/` and restart
   Decky.)

## Using it

Open the Quick Access Menu (`...` button), then the Decky tab, then Couch PiP.

- **Open / Change…** picks what to watch. Add your Jellyfin or Plex server with
  "+ Add Jellyfin, Plex server or any site…", e.g. `192.168.1.20:8096`.
- **Control page with controller** opens the remote:

| Button | Action |
| --- | --- |
| D-pad | Move the highlight |
| A | Click what's highlighted (text boxes open the keyboard) |
| B | Leave the remote |
| X | Play / pause |
| Y | Type text |
| L1 / R1 | Back / ahead 10 seconds |
| L2 / R2 | Volume down / up |
| View | Browser back |
| Menu | Fill window / full page |
| Right trackpad or right stick | Move the mouse cursor |
| Right trackpad click | Click under the cursor |
| Left trackpad | Scroll |

When you close the Quick Access Menu, the picture stays on top of your game and
the controller goes back to the game.

## How it works

- The picture is one of Steam's own built-in browser views, kept on screen above
  the game with the same layer Steam uses for notification pop-ups
  (`src/pip.tsx`).
- The remote talks to that page through Steam's DevTools port (the same one
  Decky uses), sending real clicks, key presses and typed text (`main.py`).
  No root access and no extra Python packages are needed.

## Known limits

- It relies on undocumented parts of the Steam client, so a Steam update can
  break it.
- Netflix, Disney+ and Prime Video need DRM support in Steam's browser. They
  may not play, or may play at lower quality.
- If the picture is the wrong size or in the wrong place, turn on
  **Show diagnostics** and try **Use device pixels**.

## Building

With the normal toolchain:

```sh
pnpm i
pnpm build        # writes dist/index.js
```

Then copy `plugin.json`, `package.json`, `main.py`, `dist/` and `LICENSE` into
`~/homebrew/plugins/couch-pip/` on the device.

## License

BSD-3-Clause. See `LICENSE`; the original copyright notice is kept there.
