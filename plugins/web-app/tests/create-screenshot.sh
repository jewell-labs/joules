#!/bin/sh
# Run create.sh and screenshot.sh. A copy under /tmp is the template under
# test, so a missed destination guard cannot write into this repo.
set -eu

here=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
plugin_dir=$(dirname "$here")
work=$(mktemp -d "${TMPDIR:-/tmp}/web-app-checks.XXXXXX")
shot_port=

cleanup() {
  status=$?
  if [ -n "$shot_port" ]; then
    lsof -nP -iTCP:"$shot_port" -sTCP:LISTEN -t 2>/dev/null | while read -r pid; do
      kill "$pid" 2>/dev/null || true
    done || true
  fi
  if [ "$status" -ne 0 ]; then
    echo "kept $work" >&2
  else
    rm -rf "$work"
  fi
}
trap cleanup EXIT

fail() {
  echo "fail: $*" >&2
  exit 1
}

copy="$work/plugin"
mkdir -p "$copy"
archive=$(mktemp "${TMPDIR:-/tmp}/web-app-checks-src.XXXXXX")
tar -C "$plugin_dir" -cf "$archive" \
  --exclude node_modules \
  --exclude dist \
  --exclude .wrangler \
  --exclude .output \
  --exclude .git \
  --exclude screenshots \
  --exclude logs \
  .
tar -C "$copy" -xf "$archive"
rm -f "$archive"
create="$copy/scripts/create.sh"
template="$copy/template"
[ -x "$create" ] || [ -f "$create" ] || fail "copy has no create.sh"
[ -d "$template" ] || fail "copy has no template"

reject_title() {
  label=$1
  title=$2
  dest="$work/rejected-$label"
  stdout="$work/$label.out"
  set +e
  sh "$create" --dest "$dest" --name acme-app --title "$title" >"$stdout" 2>"$work/$label.err"
  status=$?
  set -e
  [ "$status" -ne 0 ] || fail "$label exited 0"
  [ ! -s "$stdout" ] || fail "$label wrote $(cat "$stdout")"
  [ ! -e "$dest" ] || fail "$label created $dest"
}

blank="   "
reject_title blank "$blank"
reject_title empty ""
reject_title newline "$(printf 'a\nb')"
reject_title del "$(printf '\177')"
reject_title token "x__APP_y"

tokyo="$work/tokyo"
tokyo_title="東京"
tokyo_out=$(sh "$create" --dest "$tokyo" --name acme-app --title "$tokyo_title")
[ "$tokyo_out" = "$(python3 -c 'import os, sys; print(os.path.realpath(sys.argv[1]))' "$tokyo")" ] || fail "tokyo path"
python3 - "$tokyo" "$tokyo_title" <<'PY' || fail "tokyo title"
import json, pathlib, sys
app = pathlib.Path(sys.argv[1])
title = sys.argv[2]
data = json.loads((app / "public/manifest.webmanifest").read_text())
if data["name"] != title or data["short_name"] != title:
    sys.exit("manifest")
if title not in (app / "src/routes/index.tsx").read_text():
    sys.exit("index")
PY

nasty="$work/nasty"
python3 -c 'import pathlib, sys; pathlib.Path(sys.argv[1]).write_text("Say \"Hi\" & Joe'\''s <App>\u2028x")' "$work/nasty-title.txt"
nasty_title=$(cat "$work/nasty-title.txt")
sh "$create" --dest "$nasty" --name acme-app --title "$nasty_title" >"$work/nasty.out"
python3 - "$nasty" "$work/nasty-title.txt" <<'PY' || fail "manifest or readme"
import json, pathlib, sys
app = pathlib.Path(sys.argv[1])
title = pathlib.Path(sys.argv[2]).read_text()
data = json.loads((app / "public/manifest.webmanifest").read_text())
if data["name"] != title or data["short_name"] != title:
    sys.exit("manifest")
if not (app / "README.md").read_text().startswith("# " + title):
    sys.exit("readme")
offline = (app / "public/offline.html").read_text()
escaped = (
    title.replace("&", "&amp;")
    .replace("<", "&lt;")
    .replace(">", "&gt;")
    .replace('"', "&quot;")
    .replace("'", "&#39;")
)
if f"<title>{escaped}</title>" not in offline or "<App>" in offline:
    sys.exit("offline title")
PY
node --input-type=module - "$nasty" "$work/nasty-title.txt" <<'JS' || fail "js title"
import fs from "fs"
const app = process.argv[2]
const expected = fs.readFileSync(process.argv[3], "utf8")
function roundTrip(source, re) {
  const match = source.match(re)
  if (!match) {
    console.error("no literal")
    process.exit(1)
  }
  const value = Function("return (" + match[1] + ")")()
  if (value !== expected) {
    console.error("mismatch")
    process.exit(1)
  }
  // Node 26 accepts a raw U+2028 in a single-quoted string, so the value match is not the escape.
  const escape = "\\" + "u2028"
  if (!match[1].includes(escape) || match[1].includes("\u2028")) {
    console.error("U+2028 was not escaped in the literal")
    process.exit(1)
  }
}
roundTrip(
  fs.readFileSync(app + "/src/routes/index.tsx", "utf8"),
  /<h1>\{('(?:\\.|[^'])*')\}<\/h1>/,
)
roundTrip(
  fs.readFileSync(app + "/src/routes/__root.tsx", "utf8"),
  /title: ('(?:\\.|[^'])*')/,
)
JS

snap="$work/template-before"
find "$template" -print | sort >"$snap"
reject_inside() {
  label=$1
  dest=$2
  stdout="$work/inside-$label.out"
  set +e
  sh "$create" --dest "$dest" --name acme-app --title "Inside" >"$stdout" 2>"$work/inside-$label.err"
  status=$?
  set -e
  [ "$status" -ne 0 ] || fail "$label exited 0"
  [ ! -s "$stdout" ] || fail "$label printed a destination"
  grep -q "destination is inside the template" "$work/inside-$label.err" || fail "$label stderr"
}
reject_inside same "$template/same-case"
reject_inside alias "$copy/TEMPLATE/from-alias"
parent_alias="$(dirname "$copy")/PLUGIN/template/from-parent"
reject_inside parent "$parent_alias"
ln -s "$copy/TEMPLATE/from-link" "$work/link-into-template"
reject_inside symlink "$work/link-into-template"
find "$template" -print | sort >"$work/template-after"
diff -u "$snap" "$work/template-after" >/dev/null || fail "template gained an entry"

real_tar=$(command -v tar)
shim="$work/bin"
mkdir -p "$shim"
cat >"$shim/tar" <<EOF
#!/bin/sh
for arg in "\$@"; do
  if [ "\$arg" = "-cf" ]; then
    echo "tar -cf failed" >&2
    exit 1
  fi
done
exec "$real_tar" "\$@"
EOF
chmod +x "$shim/tar"
tar_dest="$work/tar-fail"
tar_out="$work/tar.out"
set +e
PATH="$shim:$PATH" sh "$create" --dest "$tar_dest" --name acme-app --title "Tar Fail" >"$tar_out" 2>"$work/tar.err"
tar_status=$?
set -e
[ "$tar_status" -ne 0 ] || fail "tar failure exited 0"
[ ! -s "$tar_out" ] || fail "tar failure printed $(cat "$tar_out")"
grep -q "tar -cf failed" "$work/tar.err" || fail "tar shim did not run"

shot="$work/shotapp"
shot_port=43173
if lsof -nP -iTCP:"$shot_port" -sTCP:LISTEN >/dev/null 2>&1; then
  fail "port $shot_port is in use"
fi
mkdir -p "$shot/scripts" "$shot/dist/client" "$shot/screenshots"
cp "$template/scripts/screenshot.sh" "$shot/scripts/screenshot.sh"
printf 'x\n' >"$shot/dist/client/offline.html"
cat >"$shot/package.json" <<'EOF'
{ "private": true, "scripts": { "preview": "python3 preview.py" } }
EOF
cat >"$shot/preview.py" <<'EOF'
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

port = 4173
args = sys.argv[1:]
if "--port" in args:
    port = int(args[args.index("--port") + 1])

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # / is up. /offline is the page screenshot.sh must refuse to capture.
        code = 500 if self.path.split("?", 1)[0] == "/offline" else 200
        body = b"no" if code == 500 else b"ok"
        self.send_response(code)
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, _fmt, *_args):
        pass

HTTPServer(("127.0.0.1", port), Handler).serve_forever()
EOF
echo "screenshot negative case, up to 90s"
set +e
(
  cd "$shot" && PREVIEW_PORT="$shot_port" sh scripts/screenshot.sh
) >"$work/shot.out" 2>"$work/shot.err"
shot_status=$?
set -e
[ "$shot_status" -ne 0 ] || fail "screenshot exited 0"
if find "$shot/screenshots" -name '*.png' -print -quit | grep -q .; then
  fail "screenshot wrote a png"
fi
grep -q "preview did not start" "$work/shot.err" || fail "screenshot stderr"

echo "PASS create-screenshot"
