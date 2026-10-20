# Third-party notices

Couch PiP is released under the BSD 3-Clause License (see `LICENSE`). It
builds on, bundles, or learned from the following projects.

## Based on

**Picture in Picture (decky-pip)** by Ross Squires
<https://github.com/rossimo/decky-pip>, BSD 3-Clause License.
Couch PiP is a fork of this project. The idea of showing a Steam browser view
over a running game, and the original placement code, come from it. Its
license and copyright notices are kept in `LICENSE`.

**decky-plugin-template** by Steam Deck Homebrew
<https://github.com/SteamDeckHomebrew/decky-plugin-template>, BSD 3-Clause
License. The original project was started from this template; its notices
are kept in `LICENSE`.

## Bundled in the plugin (`dist/index.js`)

**react-icons** <https://github.com/react-icons/react-icons>, MIT License:

> Copyright 2018 kamijin_fanta <kamijin@live.jp>
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to
> deal in the Software without restriction, including without limitation the
> rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
> sell copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
> FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
> IN THE SOFTWARE.

**Font Awesome Free 5 icons** (TV, gamepad, play, back/forward, volume and
expand icons, via react-icons) by Fonticons, Inc. <https://fontawesome.com/>,
licensed under CC BY 4.0 <https://creativecommons.org/licenses/by/4.0/>.
The icons are used unmodified.

## Used at runtime, not included

**Decky Loader** and **@decky/ui** by Steam Deck Homebrew
<https://github.com/SteamDeckHomebrew/decky-loader>. Couch PiP runs inside
Decky Loader and uses the React and UI components it provides. None of their
code is copied into this project.

## Referenced

**SDL (Simple DirectMedia Layer)** <https://github.com/libsdl-org/SDL>,
zlib License. The layout of the Steam Controller (2026) trackpad reports
used in `main.py` was taken from SDL's `SDL_hidapi_steam_triton.c` and
`steam/controller_structs.h`. No SDL code is included; the report format was
re-implemented in Python.

## Trademarks

Steam, Steam Deck, Steam Machine and Steam Controller are trademarks of Valve
Corporation. YouTube, Netflix, Twitch, Plex, Jellyfin, Disney+ and Prime Video
are trademarks of their respective owners. They are named only to describe
what the plugin works with. Couch PiP is not affiliated with or endorsed by
any of them.
