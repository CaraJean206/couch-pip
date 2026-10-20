# Security

Couch PiP runs on your Steam Machine or Steam Deck, which is a full Linux
computer. This page explains what the plugin can access, what it can't, and
how to check it yourself.

## What it runs as

- **Your normal user account, not root.** `plugin.json` requests no special
  permissions (`"flags": []`). It can't change system files or settings.
- **No programs or downloads are run.** The backend (`main.py`) uses only
  Python's standard library. It never starts other programs, never runs
  downloaded code, and never writes files.
- **The frontend isn't minified**, so `dist/index.js` in the download can be
  read directly.

## What it accesses

| What | Why | Limits |
| --- | --- | --- |
| Steam's local DevTools port (`127.0.0.1:8080`) | To control the picture-in-picture page from the remote | Decky Loader already enables this port; Couch PiP doesn't open it. Only the picture's page is controlled. Steam's own pages (store, community, chat, Steam's interface) are always skipped, because they hold your Steam login. |
| The web page shown in the picture | Hide scrollbars, fill the window with the video, draw the trackpad cursor, and do what you press in the remote | Changes affect only that page and only while it's open. **Safe mode** turns them all off. |
| Your controller's receiver (`/dev/hidraw*`) | Read trackpad movement on the Steam Controller (2026) | Only Valve devices, only while the remote is open, read-only. Any connection that isn't sending controller data is closed within 3 seconds. Only trackpad and right-stick movement is used; nothing is stored or logged. |
| `/proc/bus/input/devices` | The **Controller devices** diagnostic | Lists device names; only when you press the button. |

## Network

- **Websites you choose to open** in the picture. Only `http` and `https`
  addresses are allowed; local files and other schemes are refused.
- **Update checks:** about 20 seconds after Steam starts and every 6 hours,
  the plugin reads `version.json` from this GitHub repository. Nothing about
  you or your device is sent, though like any web request GitHub sees your IP
  address.
- Nothing else. There is no analytics or tracking.

## Updates

Updates are only accepted if `version.json`:

- points to `couch-pip.zip` in **this repository**, pinned to an exact commit
  (not a branch that could change), and
- includes the file's SHA-256 fingerprint. Decky Loader checks it before
  installing and refuses a mismatched file.

Every update also goes through Decky's normal install prompt, so nothing
installs without you pressing **Update**.

## Your data

- Settings and bookmarks are stored in Steam's local browser storage on your
  device. They never leave it.
- Text you type with the remote goes straight into the web page and isn't
  stored or logged.
- The plugin log (in Decky's log folder) records only the site name the remote
  connected to, not full addresses, which can contain sign-in tokens.

## Verify it yourself

- **Read the code.** It's all here: `main.py` (backend) and `src/` (frontend).
- **Check the build.** The build is reproducible: building the same source
  gives byte-for-byte identical files. The **Verify build** GitHub Action
  rebuilds `dist/index.js` and `couch-pip.zip` from source on every change and
  fails if they don't match what's published.

  To check on your own computer:

  ```sh
  npm install --no-save esbuild@0.28.2 react-icons@5.7.0
  node build.mjs && git diff --exit-code dist/index.js
  python3 package.py && git diff --exit-code couch-pip.zip
  ```

- **Virus scan.** You can upload `couch-pip.zip` to
  [VirusTotal](https://www.virustotal.com/). Keep in mind that antivirus
  scanners mostly look for known Windows malware, so a clean result says little
  about a Linux plugin. Reading the code and checking the build are stronger
  evidence.

## Known risks

- Couch PiP depends on undocumented parts of the Steam client. A Steam update
  may break it, though that shouldn't make it unsafe.
- Websites in the picture run in Steam's built-in browser, so they get the same
  protection as Steam's own web browser, no more and no less. Only open sites
  you'd open in a normal browser.
- If this GitHub account were taken over, a bad update could be published.
  Updates still need your confirmation in Decky's install prompt.

## Reporting a problem

Please report security issues privately through GitHub's **Report a
vulnerability** button on this repository's **Security** tab, or open an issue
if it's not sensitive.
