#!/bin/sh
# One prompt: "create a web app".
#
# The agent must ask for the destination directory, the package name, and the
# title before it writes the app. This script is the oracle. It is not a second
# Grok session, and it does not invent answers. It resumes the same session
# with the fixed answers below, then checks the directory the script created.
#
#   grok --cwd <sandbox> --prompt-file <case> --verbatim --always-approve \
#     --output-format json --max-turns 16 --no-subagents --disable-web-search \
#     --disallowed-tools ask_user_question \
#     --deny 'Bash(grok plugin install*)' \
#     --deny 'Bash(grok plugin marketplace*)' \
#     --deny 'Bash(git push*)' \
#     --deny 'Bash(curl*)' --deny 'Bash(wget*)' \
#     --deny 'Bash(npx wrangler deploy*)' \
#     --deny 'Bash(wrangler deploy*)' \
#     --deny 'Bash(npm run deploy*)'
#
# ask_user_question is removed so a headless run cannot wait on a question
# card. The oracle answers the reply in the same session.
# web-app is installed for this process's run and removed afterward when it
# was not already installed. The enabled list is put back either way.

set -u

here=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
plugin_dir=$(dirname "$here")
plugin=$(basename "$plugin_dir")
case_file="$here/cases/create-web-app.txt"
create="$plugin_dir/scripts/create.sh"
config=${GROK_CONFIG:-$HOME/.grok/config.toml}
name=acme-app
title='Acme App'

print_only=0
if [ "${1:-}" = "--print" ]; then
  print_only=1
fi

prompt_text=$(python3 -c 'import pathlib,sys; print(pathlib.Path(sys.argv[1]).read_text().strip())' "$case_file")
if [ "$prompt_text" != "create a web app" ]; then
  echo "prompt text is not exactly: create a web app" >&2
  exit 1
fi

if [ "$print_only" = 1 ]; then
  printf 'grok plugin install %s --trust\n' "$plugin_dir"
  printf 'grok plugin enable %s\n' "$plugin"
  printf 'grok --cwd <sandbox> --prompt-file %s --verbatim --always-approve --output-format json --max-turns 16 --no-subagents --disable-web-search --disallowed-tools ask_user_question' \
    "$case_file"
  printf " --deny '%s'" \
    'Bash(grok plugin install*)' \
    'Bash(grok plugin marketplace*)' \
    'Bash(git push*)' \
    'Bash(curl*)' \
    'Bash(wget*)' \
    'Bash(npx wrangler deploy*)' \
    'Bash(wrangler deploy*)' \
    'Bash(npm run deploy*)'
  printf '\n'
  printf 'grok --cwd <sandbox> --resume <same session> -p <oracle answers> [same flags]\n'
  exit 0
fi

fail() {
  printf 'fail %s\n' "$1" >&2
  exit 1
}

python3 - "$plugin_dir" <<'PY' || fail "plugin shape"
import pathlib, sys
root = pathlib.Path(sys.argv[1])
repo = root.parents[1]
skill = (root / "skills/web-app/SKILL.md").read_text()
lower = skill.lower()
if "grok.com" in lower or "grok bot" in lower:
    sys.exit("skill names a host")
if (root / ".mcp.json").exists():
    sys.exit("plugin mcp config")
if (root / "hooks").exists() or (root / "agents").exists():
    sys.exit("extra plugin component")
commands = list((root / "commands").glob("*.md"))
if [p.name for p in commands] != ["create.md"]:
    sys.exit("command set changed")
plugins = (repo / "plugins/joules-plugins/hooks/plugins.txt").read_text()
for banned in ("web-app", "stripe"):
    if banned in plugins.split():
        sys.exit("hooks/plugins.txt lists " + banned)
PY

installed_before=0
if grok plugin list --json | python3 -c 'import json,sys; sys.exit(0 if any(p.get("name")=="web-app" for p in json.load(sys.stdin)) else 1)'
then
  installed_before=1
fi
saved=$(mktemp)
cp "$config" "$saved"
restored=0
restore_plugins() {
  [ "$restored" = 1 ] && return
  restored=1
  if [ "$installed_before" = 0 ]; then
    grok plugin uninstall web-app --confirm >/dev/null 2>&1 || true
  fi
  python3 - "$config" "$saved" <<'PY'
import pathlib, re, sys
live, saved = sys.argv[1:]
def enabled(text):
    match = re.search(r"(?ms)^\[plugins\]\nenabled = \[.*?\n\]\n", text)
    if not match:
        sys.stderr.write("plugins.enabled missing\n")
        sys.exit(1)
    return match.group(0)
old = enabled(pathlib.Path(saved).read_text())
path = pathlib.Path(live)
text = path.read_text()
new = enabled(text)
if old != new:
    path.write_text(text.replace(new, old, 1))
PY
  rm -f "$saved"
}
trap restore_plugins EXIT

grok plugin install "$plugin_dir" --trust >/dev/null || fail "plugin install"
grok plugin enable "$plugin" >/dev/null || fail "plugin enable"

work=$(mktemp -d "${TMPDIR:-/tmp}/joules-web-app.XXXXXX")
log="$here/logs/create-web-app"
rm -rf "$log"
mkdir -p "$log"
git -C "$work" init -q
git -C "$work" -c user.name=joules -c user.email=joules@example.com commit -q --allow-empty -m init
dest="$work/$name"

run_grok() {
  python3 -c 'import os, signal, subprocess, sys
cmd = sys.argv[1:]
proc = subprocess.Popen(cmd, start_new_session=True)
try:
    code = proc.wait(timeout=900)
except subprocess.TimeoutExpired:
    os.killpg(proc.pid, signal.SIGTERM)
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        os.killpg(proc.pid, signal.SIGKILL)
        proc.wait(timeout=5)
    sys.stderr.write("grok timed out\n")
    raise SystemExit(124)
raise SystemExit(code)
' "$@"
}

denies() {
  set -- "$@" \
    --disallowed-tools ask_user_question \
    --deny 'Bash(grok plugin install*)' \
    --deny 'Bash(grok plugin marketplace*)' \
    --deny 'Bash(git push*)' \
    --deny 'Bash(curl*)' \
    --deny 'Bash(wget*)' \
    --deny 'Bash(npx wrangler deploy*)' \
    --deny 'Bash(wrangler deploy*)' \
    --deny 'Bash(npm run deploy*)'
  run_grok "$@"
}

echo "=== $plugin/create-web-app ==="
if ! denies grok \
  --cwd "$work" \
  --prompt-file "$case_file" \
  --verbatim \
  --always-approve \
  --output-format json \
  --max-turns 16 \
  --no-subagents \
  --disable-web-search \
  >"$log/ask.json" 2>"$log/ask.err"
then
  tail -n 30 "$log/ask.err" >&2
  echo "kept $work" >&2
  fail "ask grok exit"
fi

session=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("sessionId") or "")' "$log/ask.json")
[ -n "$session" ] || fail "ask session"

transcript_of() {
  python3 - "$1" "$2" <<'PY'
import glob, json, os, sys
session, dest = sys.argv[1:]
matches = glob.glob(os.path.expanduser("~/.grok/sessions/*/%s/chat_history.jsonl" % session))
if not matches:
    sys.stderr.write("no transcript\n")
    sys.exit(1)
chat = max(matches, key=os.path.getmtime)

def text_of(content):
    if isinstance(content, str):
        return content
    parts = []
    for block in content or []:
        if isinstance(block, dict) and block.get("type") == "text":
            parts.append(block.get("text") or "")
        elif isinstance(block, str):
            parts.append(block)
    return "\n".join(parts)

chunks = []
for line in open(chat):
    event = json.loads(line)
    kind = event.get("type")
    if kind == "assistant":
        body = text_of(event.get("content")).strip()
        if body:
            chunks.append(body)
        for call in event.get("tool_calls") or []:
            args = call.get("arguments")
            if not isinstance(args, str):
                args = json.dumps(args)
            chunks.append(args or "")
    elif kind == "tool_result":
        chunks.append(text_of(event.get("content")))
open(dest, "w").write("\n".join(chunks))
PY
}

transcript_of "$session" "$log/ask.txt" || fail "ask transcript"
python3 - "$session" <<'PY' || fail "questions"
import glob, json, os, sys
session = sys.argv[1]
matches = glob.glob(os.path.expanduser("~/.grok/sessions/*/%s/chat_history.jsonl" % session))
if not matches:
    sys.stderr.write("no transcript\n")
    sys.exit(1)
chat = max(matches, key=os.path.getmtime)
asked = []
early = False
for line in open(chat):
    event = json.loads(line)
    if event.get("type") != "assistant":
        continue
    content = event.get("content")
    if isinstance(content, str):
        asked.append(content)
    for call in event.get("tool_calls") or []:
        args = call.get("arguments")
        if not isinstance(args, str):
            args = json.dumps(args)
        if args and "create.sh" in args and "--dest" in args:
            early = True
text = "\n".join(asked).lower()
missing = [label for label in ("destination", "package name", "title") if label not in text]
if missing:
    sys.stderr.write("missing questions: %s\n" % ", ".join(missing))
    sys.exit(1)
if early:
    sys.stderr.write("create.sh ran before the oracle answered\n")
    sys.exit(1)
PY

if [ -n "$(find "$work" -mindepth 1 \( -name .git -o -name .grok \) -prune -o -print)" ]; then
  find "$work" -mindepth 1 \( -name .git -o -name .grok \) -prune -o -print >&2
  fail "wrote the app before the questions were answered"
fi

oracle="$log/oracle.txt"
printf 'destination: %s\npackage name: %s\ntitle: %s\n' "$dest" "$name" "$title" > "$oracle"

if ! denies grok \
  --cwd "$work" \
  --resume "$session" \
  -p "$(cat "$oracle")" \
  --verbatim \
  --always-approve \
  --output-format json \
  --max-turns 16 \
  --no-subagents \
  --disable-web-search \
  >"$log/create.json" 2>"$log/create.err"
then
  tail -n 30 "$log/create.err" >&2
  echo "kept $work" >&2
  fail "create grok exit"
fi

transcript_of "$session" "$log/create.txt" || fail "create transcript"
python3 - "$log/create.txt" "$dest" "$name" "$title" <<'PY' || fail "create.sh"
import pathlib, sys
text, dest, name, title = sys.argv[1:]
body = pathlib.Path(text).read_text()
for needle in ("scripts/create.sh", "--dest", "--name", "--title", dest, name, title):
    if needle not in body:
        sys.stderr.write("missing %s\n" % needle)
        sys.exit(1)
PY

check_app() {
  app=$1
  [ -d "$app" ] || fail "missing app"
  python3 - "$app" "$name" "$title" <<'PY'
import pathlib, sys
app = pathlib.Path(sys.argv[1])
name, title = sys.argv[2:]
errors = []
need = [
    "package.json", "vite.config.ts", "wrangler.jsonc", "tsconfig.json",
    "src/server.ts", "src/server/mcp.ts", "src/router.tsx",
    "src/routes/__root.tsx", "src/routes/index.tsx",
    "src/server/auth/policy.ts", "src/server/db/schema.ts", "src/server/db/client.ts",
    "src/server/functions/health.ts", "drizzle.config.ts", "drizzle/0000_sessions.sql",
    "public/sw.js", "public/offline.html", "public/manifest.webmanifest",
    "deploy/branches.json", ".github/workflows/release.yml",
    "scripts/verify.sh", "scripts/screenshot.sh", "scripts/version.sh",
    "scripts/release.sh", "scripts/notify.sh", "scripts/branch-env.sh",
    "README.md", "tests/ready.test.ts",
]
for rel in need:
    if not (app / rel).exists():
        errors.append("missing " + rel)

def text(rel):
    return (app / rel).read_text()

def require(rel, needle):
    if needle not in text(rel):
        errors.append("%s missing %s" % (rel, needle))

def reject(rel, needle):
    if needle in text(rel):
        errors.append("%s has %s" % (rel, needle))

require("package.json", '"name": "%s"' % name)
for needle in ("@tanstack/solid-start", '"solid-js"', "drizzle-orm", '"agents"', "@modelcontextprotocol/server"):
    require("package.json", needle)
reject("package.json", "stripe")
reject("package.json", '"react"')
require("vite.config.ts", "solid-start")
reject("vite.config.ts", "react-start")
require("wrangler.jsonc", '"main": "src/server.ts"')
require("wrangler.jsonc", "nodejs_compat")
require("wrangler.jsonc", "d1_databases")
require("wrangler.jsonc", "observability")
require("wrangler.jsonc", '"database_name": "%s"' % name)
require("wrangler.jsonc", '"database_name": "%s-staging"' % name)
require("wrangler.jsonc", '"production"')
require("wrangler.jsonc", '"staging"')
reject("wrangler.jsonc", "durable_objects")
reject("wrangler.jsonc", '"ai"')
require("src/server.ts", "solid-start/server-entry")
require("src/server.ts", "/mcp")
reject("src/server.ts", "react-start")
reject("src/server.ts", "stdio")
mcp = text("src/server/mcp.ts")
if mcp.count("registerTool") != 1:
    errors.append("healthcheck tool count is %s" % mcp.count("registerTool"))
for needle in ("createMcpHandler", "healthcheck", "ok: true", "agents/mcp/server"):
    if needle not in mcp:
        errors.append("mcp missing %s" % needle)
for needle in ("cloudflare:workers", "env.DB", "SESSION", "secret", "process.env", "stdio", "registerPrompt", "registerResource"):
    if needle in mcp:
        errors.append("mcp reads %s" % needle)
require("src/server/auth/policy.ts", "passkey")
require("src/server/auth/policy.ts", "phone-otp")
require("src/routes/index.tsx", "serviceWorker.register")
require("src/routes/index.tsx", title)
require("public/manifest.webmanifest", title)
require("deploy/branches.json", '"main": "production"')
require("deploy/branches.json", '"staging": "staging"')
require(".github/workflows/release.yml", "environment: release")
require(".github/workflows/release.yml", "scripts/release.sh")
for secret in ("CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "DEPLOY_WEBHOOK_URL"):
    require(".github/workflows/release.yml", secret)
readme = text("README.md")
for needle in (
    "GitHub Environment", "release", "main", "staging", "database_id",
    "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "DEPLOY_WEBHOOK_URL",
    "/mcp", "healthcheck",
):
    if needle not in readme:
        errors.append("README missing %s" % needle)
blob_parts = []
for path in app.rglob("*"):
    if path.is_file():
        blob_parts.append(path.read_text(errors="ignore"))
    elif path.is_dir() and not any(path.iterdir()):
        errors.append("empty directory %s" % path.relative_to(app))
blob = "\n".join(blob_parts)
for needle in ("__APP_NAME__", "__APP_TITLE__", "stripe", "Stripe"):
    if needle in blob:
        errors.append("tree contains %s" % needle)
if errors:
    sys.stderr.write("\n".join(errors) + "\n")
    sys.exit(1)
PY
}

check_app "$dest" || {
  echo "kept $work" >&2
  fail "created app"
}

expected=$(mktemp -d "${TMPDIR:-/tmp}/joules-web-app-expected.XXXXXX")
sh "$create" --dest "$expected/app" --name "$name" --title "$title" >/dev/null || fail "local create"
if ! diff -r "$expected/app" "$dest" >"$log/diff.txt"; then
  echo "created tree is not the create.sh copy" >&2
  echo "kept $work" >&2
  fail "create.sh copy"
fi
rm -rf "$expected" "$work"
echo "PASS $plugin/create-web-app"
