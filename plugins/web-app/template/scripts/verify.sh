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

# Pieces stay split so this file does not contain the needles it searches for.
pat=$(printf '%s%s|%s%s|%s%s|%s|%s %s' \
  'sk-' 'live-' \
  'sk_' 'live_' \
  'rk_' 'live_' \
  'AKIA[0-9A-Z]{16}' \
  'BEGIN' 'PRIVATE KEY')
# .env and .dev.vars are gitignored credentials. .dev.vars.example is tracked, so it stays in the scan.
hits=$(find . \
  \( -name node_modules -o -name dist -o -name .wrangler -o -name .output -o -name .git -o -name screenshots \
    -o -name .env -o -name '.env.*' -o -name .dev.vars \
    -o \( -name '.dev.vars.*' ! -name .dev.vars.example \) \
  \) -prune \
  -o -type f -exec grep -I -l -E "$pat" {} + 2>/dev/null || true)
if [ -n "$hits" ]; then
  echo "a secret is in the tree" >&2
  exit 1
fi
echo ok
