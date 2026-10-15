#!/bin/sh
# Check the invariants this app deploys with. The app carries this script; it does not call the plugin check.
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"

if [ "${1:-}" != "--built" ]; then
  npm run build
fi

[ -d dist/client ] || { echo "build did not write dist/client" >&2; exit 1; }
for file in \
  public/manifest.webmanifest \
  public/offline.html \
  public/sw.js \
  dist/client/manifest.webmanifest \
  dist/client/offline.html \
  dist/client/sw.js
do
  [ -f "$file" ] || { echo "missing $file" >&2; exit 1; }
done

grep -q 'solid-start/server-entry' wrangler.jsonc || {
  echo "server entry is not the Solid one" >&2
  exit 1
}
if grep -q 'react-start' wrangler.jsonc; then
  echo "server entry is the React one" >&2
  exit 1
fi
if grep -R -n -E 'sk-live-|AKIA[0-9A-Z]{16}|BEGIN PRIVATE KEY' src >/dev/null 2>&1; then
  echo "a secret is in src" >&2
  exit 1
fi
echo ok
