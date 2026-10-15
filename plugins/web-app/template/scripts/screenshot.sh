#!/bin/sh
# Capture the production preview. A browser is a dev tool; the app does not ship one.
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
port=${PREVIEW_PORT:-4173}
out="$root/screenshots"
mkdir -p "$out"
home_png="$out/home.png"
offline_png="$out/offline.png"
base="http://127.0.0.1:$port"

find_chrome() {
  if [ -n "${CHROME_PATH:-}" ] && [ -x "${CHROME_PATH}" ]; then
    printf '%s\n' "$CHROME_PATH"
    return
  fi
  for name in google-chrome google-chrome-stable chromium chromium-browser chrome; do
    if command -v "$name" >/dev/null 2>&1; then
      command -v "$name"
      return
    fi
  done
  mac="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  if [ -x "$mac" ]; then
    printf '%s\n' "$mac"
  fi
}

show_commands() {
  browser=${1:-<chrome>}
  echo "screenshot command: $browser --headless=new --disable-gpu --no-sandbox --window-size=1280,720 --screenshot=$home_png $base/" >&2
  echo "screenshot command: $browser --headless=new --disable-gpu --no-sandbox --window-size=1280,720 --screenshot=$offline_png $base/offline" >&2
}

if [ ! -f dist/client/offline.html ]; then
  npm run build
fi

log="$out/preview.log"
npm run preview -- --host 127.0.0.1 --port "$port" --strictPort >"$log" 2>&1 &
pid=$!
cleanup() {
  kill "$pid" 2>/dev/null || true
  pkill -P "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

ready=0
i=0
while [ "$i" -lt 90 ]; do
  if python3 -c 'import sys, urllib.error, urllib.request
try:
    urllib.request.urlopen(sys.argv[1], timeout=2)
except urllib.error.HTTPError:
    sys.exit(0)
except Exception:
    sys.exit(1)' "$base/" >/dev/null 2>&1; then
    ready=1
    break
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    break
  fi
  i=$((i + 1))
  sleep 1
done

chrome=$(find_chrome || true)
if [ "$ready" != 1 ]; then
  show_commands "$chrome"
  echo "preview did not start" >&2
  tail -n 40 "$log" >&2 || true
  exit 1
fi
if [ -z "$chrome" ]; then
  show_commands
  echo "headless browser not found" >&2
  exit 1
fi

profile=$(mktemp -d "${TMPDIR:-/tmp}/web-app-chrome.XXXXXX")
shot() {
  url=$1
  file=$2
  echo "screenshot command: $chrome --headless=new --disable-gpu --no-sandbox --window-size=1280,720 --screenshot=$file $url"
  "$chrome" \
    --headless=new \
    --disable-gpu \
    --no-sandbox \
    --hide-scrollbars \
    --user-data-dir="$profile" \
    --window-size=1280,720 \
    --screenshot="$file" \
    "$url"
}
shot "$base/" "$home_png"
shot "$base/offline" "$offline_png"
[ -s "$home_png" ] && [ -s "$offline_png" ]
