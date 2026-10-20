# Changelog

All versions of Couch PiP, newest first. Every version was tested on a Steam
Machine before the next one was made.

## 0.4.3

- Build fix: the bundled file no longer contains paths from the build machine,
  so anyone's rebuild matches the published file byte for byte (checked by the
  **Verify build** action).

## 0.4.2: Security hardening

- Only `http` and `https` addresses can be opened (no local files or other
  schemes), including in saved settings and bookmarks.
- The remote never connects to Steam's own pages (store, community, chat),
  which hold your Steam login.
- Updates are only accepted from this repository, pinned to an exact commit,
  with a SHA-256 fingerprint.
- Trackpad reading closes any receiver connection that isn't sending
  controller data within 3 seconds.
- The plugin log records only the site name, not full addresses.
- Size limits on data read from Steam's local DevTools port.
- Reproducible build with pinned tool versions, checked by a **Verify build**
  GitHub Action. New [SECURITY.md](SECURITY.md).

## 0.4.1: Cleanup and documentation

- New README, this changelog, and a [how it was made](docs/how-it-was-made.md)
  write-up.
- Licensing: the LICENSE file now names the original author and this project
  while keeping the original notices. Added `THIRD_PARTY_NOTICES.md` (also
  included in the plugin download).
- Replaced the original project's screenshots with a new banner image.
- Removed unused editor scripts from the original template.
- The remote's live input line now only shows when diagnostics are on.

## 0.4.0: Trackpads work on the Steam Controller (2026)

- Steam on the Steam Machine doesn't pass trackpad movement to plugins. While
  the remote is open, the plugin now reads the trackpads straight from the
  controller, using the report format documented in SDL.
- Right trackpad moves the cursor, left trackpad scrolls, right stick moves the
  cursor. No admin (root) permission needed.

## 0.3.7

- Switch on Steam's "analog input" messages while the remote is open. (Steam
  still didn't send trackpad data this way, which led to 0.4.0.)

## 0.3.6

- Fixed the trackpad cursor and clicks on YouTube. YouTube blocks scripts from
  inserting raw HTML, and the cursor was drawn that way.
- Diagnostics: list Steam's controller functions and the controller devices
  the system sees.

## 0.3.5

- Look for Steam's controller functions in more places, since newer Steam
  builds don't put them where plugins usually look.
- Also listen to Steam's analog input channel for trackpads and sticks.

## 0.3.4

- The remote's button guide no longer runs off the bottom of a TV. The
  browser view is now sized to end just above the guide.

## 0.3.3

- Listen for the trackpads in every way Steam might send them, and show a
  live line of what arrives, to find out why they didn't respond.

## 0.3.2: Fixed the blank picture

- Filling the window right as a video started left Steam's view blank. Auto
  fill now waits for about 3 seconds of steady playback.
- When the picture changes size, the fill is redone so it draws correctly.

## 0.3.1

- Kept a nearly invisible layer over a filled video so the browser keeps
  drawing it.
- Diagnostics: **Snapshot page** (what the browser is drawing) and **Safe
  mode** (no changes to web pages).
- Fill / full page button in the Quick Access Menu.

## 0.3.0: Fine tuning and self-update

- Fixed the filled player landing off-screen on some sites, which looked like
  a black picture. If a site can't be filled, the page is left as it was.
- Size slider from 10% to 80% of the screen, plus left/right and up/down
  fine-tune sliders.
- Self-update: checks GitHub for new versions, shows a notification and an
  **Update** button that uses Decky's install prompt.
- Diagnostics: **Check video fill**.

## 0.2.0: Positions, fill window, trackpads

- 3×3 position grid: corners, middle of each side, top, bottom and center.
- No scrollbars on web pages. When a video plays, the player fills the
  picture; the sites' own fullscreen buttons do the same.
- First version of trackpad support in the remote.

## 0.1.0: First Couch PiP version

Forked from Picture in Picture 1.0.0 by Ross Squires.

- Sized from Steam's real screen size instead of the Steam Deck's, so it fits
  1080p, 1440p and 4K TVs. Four sizes and edge spacings.
- Controller remote: move a highlight with the D-pad, click with A, type with
  Y, plus play/pause, seek, volume and browser back.
- Playback buttons in the Quick Access Menu.
- Built-in site shortcuts and saved bookmarks for home servers.
- Diagnostics panel.

## Picture in Picture 1.0.0 (original project)

By Ross Squires, <https://github.com/rossimo/decky-pip>. Showed a website over
the game in one of eight positions, with size and margin sliders and an
expand mode. Couch PiP is built on this.
