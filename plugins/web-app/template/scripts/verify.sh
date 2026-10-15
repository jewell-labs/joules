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

# This app's only worker entry is src/server.ts.
if [ ! -f src/server.ts ]; then
  echo "missing src/server.ts" >&2
  exit 1
fi
if ! grep -q 'solid-start/server-entry' src/server.ts || ! grep -q '"main": "src/server.ts"' wrangler.jsonc; then
  echo "server entry is not the Solid one" >&2
  exit 1
fi
if grep -q 'react-start' wrangler.jsonc || grep -q 'react-start' src/server.ts; then
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
# Skip a credential file only when it is not part of the tree Git would commit.
# check-ignore exits 0 for an ignored untracked path and does not match a tracked path.
# create.sh does not run git init, so outside a repo those untracked files are still local.
ignored_credential() {
  base=${1##*/}
  case "$base" in
    .dev.vars.example) return 1 ;;
    .env|.env.*|.dev.vars|.dev.vars.*) ;;
    *) return 1 ;;
  esac
  if git -C "$root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if git -C "$root" check-ignore -q -- "$1"; then
      return 0
    fi
    return 1
  fi
  return 0
}
# A pipe would run the loop in a subshell, so a match could not exit this script.
while IFS= read -r file || [ -n "$file" ]; do
  if [ -z "$file" ]; then
    continue
  fi
  if ignored_credential "$file"; then
    continue
  fi
  if grep -I -q -E "$pat" "$file" 2>/dev/null; then
    echo "a secret is in the tree" >&2
    exit 1
  fi
done <<EOF
$(find . \
  \( -name node_modules -o -name dist -o -name .wrangler -o -name .output -o -name .git -o -name screenshots \) -prune \
  -o -type f -print)
EOF
echo ok
