#!/bin/sh
# Print package.json version plus the short git sha. Do not write it back.
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
pkg=$(node -p "require('./package.json').version")
if [ -z "$pkg" ] || [ "$pkg" = "undefined" ]; then
  echo "package.json has no version" >&2
  exit 1
fi
sha=$(git rev-parse --short HEAD 2>/dev/null || printf '%s' 'nogit')
printf '%s+%s\n' "$pkg" "$sha"
