#!/usr/bin/env python3
"""
Packaging for Couch PiP releases.

  python3 package.py                    build couch-pip.zip from the current files
  python3 package.py --version-json SHA write version.json for the zip committed in SHA

Release steps:
  1. bump "version" in package.json, run `node build.mjs`, then `python3 package.py`
  2. commit and push (this commit contains the new couch-pip.zip)
  3. `python3 package.py --version-json <that commit's sha>`, commit and push again

version.json points at the zip pinned to its commit, with its SHA-256, so the
installed plugin's update check always gets a matching download.
"""

import hashlib
import json
import os
import sys
import zipfile

REPO_RAW = "https://raw.githubusercontent.com/CaraJean206/couch-pip"
FILES = ["plugin.json", "package.json", "main.py", "LICENSE", "README.md", "dist/index.js"]
ROOT = os.path.dirname(os.path.abspath(__file__))
ZIP = os.path.join(ROOT, "couch-pip.zip")


def build_zip():
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as z:
        for f in FILES:
            info = zipfile.ZipInfo(f"couch-pip/{f}", date_time=(2026, 1, 1, 0, 0, 0))
            info.external_attr = 0o644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            with open(os.path.join(ROOT, f), "rb") as src:
                z.writestr(info, src.read())
    print(f"wrote {ZIP} sha256={sha256(ZIP)}")


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def write_version_json(commit):
    with open(os.path.join(ROOT, "package.json")) as f:
        version = json.load(f)["version"]
    data = {"version": version, "zip": f"{REPO_RAW}/{commit}/couch-pip.zip", "sha256": sha256(ZIP)}
    with open(os.path.join(ROOT, "version.json"), "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--version-json":
        write_version_json(sys.argv[2])
    else:
        build_zip()
