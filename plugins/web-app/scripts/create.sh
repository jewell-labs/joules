#!/bin/sh
# Write a native Void app. Flags and defaults live in create.mjs.
set -eu
here=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
exec node "$here/create.mjs" "$@"
