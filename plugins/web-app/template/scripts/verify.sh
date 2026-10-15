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
mark=$(mktemp "${TMPDIR:-/tmp}/joules-verify.XXXXXX")
find . \
  \( -name node_modules -o -name dist -o -name .wrangler -o -name .output -o -name .git -o -name screenshots \) -prune \
  -o -type f -print |
while IFS= read -r file; do
  if ignored_credential "$file"; then
    continue
  fi
  if grep -I -q -E "$pat" "$file" 2>/dev/null; then
    echo 1 > "$mark"
    break
  fi
done
if [ -s "$mark" ]; then
  rm -f "$mark"
  echo "a secret is in the tree" >&2
  exit 1
fi
rm -f "$mark"
echo ok
