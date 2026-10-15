#!/bin/sh
# The offline page, manifest, and service worker are removed.
set -u
app=$1
rm -f "$app/public/sw.js" "$app/public/offline.html" "$app/public/manifest.webmanifest"
