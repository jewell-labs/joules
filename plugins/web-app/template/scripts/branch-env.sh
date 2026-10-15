#!/bin/sh
# Print the branch and its Wrangler environment.
# Exit 3 only when the branch is not a key. A listed key with a bad value exits 2.
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
branch=${1:-${BRANCH:-${GITHUB_REF_NAME:-}}}
if [ -z "$branch" ]; then
  branch=$(git -C "$root" rev-parse --abbrev-ref HEAD 2>/dev/null || true)
fi
if [ -z "$branch" ] || [ "$branch" = "HEAD" ]; then
  echo "branch is unknown" >&2
  exit 2
fi

status=0
environment=$(python3 - "$root/deploy/branches.json" "$branch" <<'PY'
import json, re, sys
path, branch = sys.argv[1:]
try:
    data = json.load(open(path, encoding="utf-8"))
except OSError as exc:
    sys.stderr.write(f"branch map: {exc}\n")
    sys.exit(2)
if not isinstance(data, dict):
    sys.stderr.write("branch map must be an object\n")
    sys.exit(2)
if branch not in data:
    sys.exit(3)
env = data[branch]
if not isinstance(env, str) or re.fullmatch(r"[A-Za-z0-9_-]+", env) is None:
    sys.stderr.write("environment name is not a single token\n")
    sys.exit(2)
sys.stdout.write(env)
PY
) || status=$?
if [ "$status" = 3 ]; then
  exit 3
fi
[ "$status" = 0 ] || exit "$status"
printf '%s\n%s\n' "$branch" "$environment"
