# How Couch PiP was made

A short account of how this plugin came together, written for anyone curious
about the process or wanting to build something similar.

## The idea

The goal was simple: watch something in a small window while playing a game on
a Steam Machine connected to a TV, and control it with the Steam Controller.
It should work with YouTube, streaming sites and home media servers like
Jellyfin and Plex.

## Starting point

Decky Loader lets plugins add panels to SteamOS's Quick Access Menu, so a
Decky plugin was the natural fit. While planning how to draw video over a game,
we found [Picture in Picture](https://github.com/rossimo/decky-pip) by Ross
Squires, which already did the hardest part: it asks Steam to open one of its
own browser views and keeps it on screen above the game. Since it's released
under the BSD 3-Clause License, we forked it rather than starting over.

Trying the original on a Steam Machine showed two problems: it was sized for
the Steam Deck's small screen, so it was huge on a TV, and the controller
couldn't interact with the web page.

## How the work was done

The project owner described what they wanted and tested each version on a real
Steam Machine. [Claude](https://claude.ai), Anthropic's AI assistant, wrote the
code in a cloud workspace and pushed each version to this repository.

Claude couldn't run Steam itself, so testing happened in layers:

- The backend was tested against a real Chromium browser with sample pages
  (clicking, typing, scrolling, filling a playing video).
- The interface was tested in a stand-in for Steam and Decky at 720p, 1080p,
  1440p and Steam Deck sizes.
- The owner then tried each version on the Steam Machine and sent back photos
  of the plugin's diagnostics screens when something didn't work.

That last step mattered most. Several problems only appeared on real hardware,
and the diagnostics screens were added specifically so they could be pinned
down in one round instead of by guessing.

## Problems we hit and how they were solved

**The picture was the wrong size on a TV.** The original assumed the Steam
Deck's screen size. Couch PiP measures Steam's actual window instead.

**The controller couldn't reach the web page.** Steam's browser view doesn't
take controller input while a game runs. The fix was a "remote": a Steam dialog
that catches every button press, and a small backend that drives the page
through Steam's local developer tools port, the same one Decky uses. It sends
real clicks, key presses and typed text, and moves a visible highlight around
the page like a TV app.

**Videos didn't fill the small window.** A helper script in the page hides
scrollbars and enlarges the video player to fill the picture.

**The picture went black, then white.** Two separate causes. On some sites,
parts of the page made the enlarged player land off-screen; that was fixed by
neutralizing them and checking the result. Then the owner noticed that filling
worked if done by hand after the video had started. Filling at the very moment
a video starts left Steam's view blank, so auto-fill now waits a few seconds.

**The trackpads didn't respond.** This took the most rounds. On the Steam
Machine, Steam doesn't pass trackpad movement to plugins at all: one function
was missing, and the other channel stayed silent even when switched on. The
diagnostics showed the controller's receiver was readable directly, so the
plugin now reads the trackpads from the controller itself while the remote is
open, using the report format documented in the open-source SDL library.

**Updating was a chore.** Decky only updates plugins from its official store.
Couch PiP checks this repository for a newer version and hands the download to
Decky's normal install prompt, so updating is one press.

## Versions

Each step is listed in the [changelog](../CHANGELOG.md).

## Licensing and credit

Couch PiP keeps the original project's BSD 3-Clause License and its copyright
notices, and credits the original author in the README, the LICENSE file and
the plugin's metadata. Bundled icons and other sources are listed in
[THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
