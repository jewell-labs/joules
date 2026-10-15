#!/bin/sh
# One prompt: "create a web app".
#
# The agent must ask for the destination directory, the package name, and the
# title before it writes the app. This script is the oracle. It is not a second
# Grok session, and it does not invent answers. It resumes the same session
# with the fixed answers below, then checks the directory the script created.
# grok flags live in with_flags.
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
sentinel_src="$here/fixtures/.tanstack/sentinel"
sentinel_plant="$plugin_dir/template/.tanstack/sentinel"

print_only=0
if [ "${1:-}" = "--print" ]; then
  print_only=1
fi

prompt_text=$(python3 -c 'import pathlib,sys; print(pathlib.Path(sys.argv[1]).read_text().strip())' "$case_file")
if [ "$prompt_text" != "create a web app" ]; then
  echo "prompt text is not exactly: create a web app" >&2
  exit 1
fi

fail() {
  printf 'fail %s\n' "$1" >&2
  exit 1
}

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

# One flag list for the printed command and the real invocation.
with_flags() {
  mode=$1
  shift
  set -- "$@" \
    --verbatim \
    --always-approve \
    --output-format json \
    --max-turns 16 \
    --no-subagents \
    --disable-web-search \
    --disallowed-tools ask_user_question \
    --deny 'Bash(grok plugin install*)' \
    --deny 'Bash(grok plugin marketplace*)' \
    --deny 'Bash(git push*)' \
    --deny 'Bash(curl*)' \
    --deny 'Bash(wget*)' \
    --deny 'Bash(npx wrangler deploy*)' \
    --deny 'Bash(wrangler deploy*)' \
    --deny 'Bash(npm run deploy*)'
  if [ "$mode" = print ]; then
    printf '%s' "$1"
    shift
    for arg in "$@"; do
      printf ' %s' "$arg"
    done
    printf '\n'
    return 0
  fi
  run_grok "$@"
}

if [ "$print_only" = 1 ]; then
  printf 'grok plugin install %s --trust\n' "$plugin_dir"
  printf 'grok plugin enable %s\n' "$plugin"
  with_flags print grok --cwd '<sandbox>' --prompt-file "$case_file"
  with_flags print grok --cwd '<sandbox>' --resume '<same session>' -p '<oracle answers>'
  exit 0
fi

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
  rm -f "$sentinel_plant"
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

# realpath collapses a trailing slash on TMPDIR and /var -> /private/var.
work=$(mktemp -d "${TMPDIR:-/tmp}/joules-web-app.XXXXXX")
work=$(python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$work")
log="$here/logs/create-web-app"
rm -rf "$log"
mkdir -p "$log"
dest="$work/$name"
mkdir -p "$(dirname "$sentinel_plant")"
cp "$sentinel_src" "$sentinel_plant"

echo "=== $plugin/create-web-app ==="
if ! with_flags run grok \
  --cwd "$work" \
  --prompt-file "$case_file" \
  >"$log/ask.json" 2>"$log/ask.err"
then
  tail -n 30 "$log/ask.err" >&2
  echo "kept $work" >&2
  fail "ask grok exit"
fi

session=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("sessionId") or "")' "$log/ask.json")
[ -n "$session" ] || fail "ask session"

python3 - "$session" "$log/ask.txt" "$work" <<'PY' || fail "questions"
import glob, json, os, re, shlex, sys
session, log_path, work = sys.argv[1:]
work = os.path.realpath(work)
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

def inside(path):
    if not path or path.startswith("-") or path.startswith("&"):
        return True
    abs_path = path if os.path.isabs(path) else os.path.join(work, path)
    try:
        abs_path = os.path.realpath(abs_path)
    except OSError:
        return False
    return abs_path == work or abs_path.startswith(work + os.sep)

def shell_outside(command):
    hits = []
    for match in re.finditer(r"(?:^|[\s;|&])(\d*)>>?\s*([^\s;&|]+)", command):
        path = match.group(2)
        if path.startswith("&"):
            continue
        if not inside(path):
            hits.append(path)
    try:
        parts = shlex.split(command)
    except ValueError:
        parts = command.split()
    bins = {"cp", "mv", "rsync", "install", "ln", "tee", "mkdir", "touch", "rm"}
    i = 0
    while i < len(parts):
        tok = parts[i]
        if tok in ("&&", "||", ";", "|"):
            i += 1
            continue
        if tok in bins or os.path.basename(tok) in bins:
            args = []
            i += 1
            while i < len(parts) and parts[i] not in ("&&", "||", ";", "|"):
                if not parts[i].startswith("-"):
                    args.append(parts[i])
                i += 1
            if args and not inside(args[-1]):
                hits.append(args[-1])
            continue
        if os.path.basename(tok) == "tar" or tok == "tar":
            i += 1
            argv = [tok]
            while i < len(parts) and parts[i] not in ("&&", "||", ";", "|"):
                argv.append(parts[i])
                i += 1
            if "-C" in argv and any("x" in a for a in argv if a.startswith("-")):
                dest = argv[argv.index("-C") + 1]
                if not inside(dest):
                    hits.append(dest)
            continue
        i += 1
    return hits

labels = ("destination", "package name", "title")
replies = []
early = False
outside = []
readonly = {"read_file", "grep", "list_dir", "glob", "web_search", "web_fetch", "open_page", "todo_write"}
for line in open(chat):
    event = json.loads(line)
    if event.get("type") != "assistant":
        continue
    replies.append(text_of(event.get("content")))
    for call in event.get("tool_calls") or []:
        name = call.get("name") or ""
        args = call.get("arguments")
        if not isinstance(args, str):
            args = json.dumps(args)
        if args and "create.sh" in args and "--dest" in args:
            early = True
        parsed = None
        try:
            parsed = json.loads(args) if args else None
        except json.JSONDecodeError:
            parsed = None
        if name == "run_terminal_command" or (isinstance(parsed, dict) and isinstance(parsed.get("command"), str)):
            command = parsed.get("command") if isinstance(parsed, dict) else args
            outside.extend(shell_outside(command or ""))
            continue
        if name.lower() in readonly:
            continue
        if any(part in name.lower() for part in ("write", "edit", "delete", "patch", "remove", "rename", "move", "copy")):
            strings = []
            def walk(value, out):
                if isinstance(value, str):
                    out.append(value)
                elif isinstance(value, dict):
                    for item in value.values():
                        walk(item, out)
                elif isinstance(value, list):
                    for item in value:
                        walk(item, out)
            walk(parsed if parsed is not None else args, strings)
            for item in strings:
                if item.startswith("/") and not inside(item):
                    outside.append(item)

open(log_path, "w").write("\n".join(replies))
if early:
    sys.stderr.write("create.sh ran before the oracle answered\n")
    sys.exit(1)
if outside:
    sys.stderr.write("wrote outside the sandbox: %s\n" % ", ".join(outside))
    sys.exit(1)

def negated(line):
    return re.search(r"\b(not|never|n't)\b(?:\W+\w+){0,8}\b(ask|destination|package name|title)\b", line, re.I)

def question_line(line):
    text = line.strip()
    if not text:
        return False
    if "?" in text:
        return True
    return re.match(r"^(\d+[.)]|[-*])\s+", text) is not None

def asked_labels(line):
    low = line.lower()
    hits = []
    # A directory question is the destination question even when it does not repeat that word.
    if "destination" in low or (
        re.search(r"\b(where|which|what)\b", low) and re.search(r"\b(directory|folder|path)\b", low)
    ):
        hits.append("destination")
    if "package name" in low or re.search(r"\bpackage\b", low):
        hits.append("package name")
    if re.search(r"\btitle\b", low):
        hits.append("title")
    return hits

found = set()
for reply in replies:
    for line in reply.splitlines():
        if negated(line) or not question_line(line):
            continue
        hits = asked_labels(line)
        if len(hits) == 1:
            found.add(hits[0])
missing = [label for label in labels if label not in found]
if missing:
    sys.stderr.write("missing questions: %s\n" % ", ".join(missing))
    sys.exit(1)
PY

python3 - "$work" <<'PY' || fail "wrote the app before the questions were answered"
import os, sys
work = os.path.realpath(sys.argv[1])
markers = {
    "package.json", "wrangler.jsonc", "vite.config.ts", "tsconfig.json",
    "src/server.ts", "src/server/mcp.ts",
}
for dirpath, dirnames, filenames in os.walk(work):
    rel = os.path.relpath(dirpath, work)
    parts = [] if rel == "." else rel.split(os.sep)
    if parts[:1] == [".git"]:
        continue
    if parts[:1] == [".grok"]:
        for name in filenames:
            rel_file = os.path.join(rel, name)
            tail = rel_file.split(".grok" + os.sep, 1)[-1]
            if tail in markers or tail.startswith("src" + os.sep) or tail.startswith("public" + os.sep) or tail.startswith("deploy" + os.sep) or name in ("package.json", "wrangler.jsonc"):
                sys.stderr.write("app file under .grok: %s\n" % rel_file)
                sys.exit(1)
        continue
    if rel != ".":
        sys.stderr.write("wrote before questions: %s\n" % rel)
        sys.exit(1)
    if filenames:
        sys.stderr.write("wrote before questions: %s\n" % filenames[0])
        sys.exit(1)
PY

oracle="$log/oracle.txt"
printf 'destination: %s\npackage name: %s\ntitle: %s\n' "$dest" "$name" "$title" > "$oracle"

if ! with_flags run grok \
  --cwd "$work" \
  --resume "$session" \
  -p "$(cat "$oracle")" \
  >"$log/create.json" 2>"$log/create.err"
then
  tail -n 30 "$log/create.err" >&2
  echo "kept $work" >&2
  fail "create grok exit"
fi

python3 - "$session" "$log/create.txt" "$dest" "$name" "$title" <<'PY' || fail "create.sh"
import glob, json, os, re, shlex, sys
session, log_path, dest, name, title = sys.argv[1:]
dest = os.path.realpath(dest)
matches = glob.glob(os.path.expanduser("~/.grok/sessions/*/%s/chat_history.jsonl" % session))
if not matches:
    sys.stderr.write("no transcript\n")
    sys.exit(1)
chat = max(matches, key=os.path.getmtime)
commands = []
ok = False

def flag(argv, flag_name):
    if flag_name not in argv:
        return None
    index = argv.index(flag_name)
    if index + 1 >= len(argv):
        return None
    return argv[index + 1]

for line in open(chat):
    event = json.loads(line)
    if event.get("type") != "assistant":
        continue
    for call in event.get("tool_calls") or []:
        if (call.get("name") or "") != "run_terminal_command":
            continue
        args = call.get("arguments")
        if not isinstance(args, str):
            args = json.dumps(args)
        try:
            parsed = json.loads(args)
        except json.JSONDecodeError:
            continue
        command = parsed.get("command") if isinstance(parsed, dict) else None
        if not isinstance(command, str):
            continue
        commands.append(command)
        for chunk in re.split(r"\s*(?:&&|\|\||;|\n)\s*", command):
            try:
                argv = shlex.split(chunk)
            except ValueError:
                continue
            if not any(os.path.basename(item) == "create.sh" for item in argv):
                continue
            got_dest = flag(argv, "--dest")
            if got_dest is None:
                continue
            if flag(argv, "--name") == name and flag(argv, "--title") == title and os.path.realpath(got_dest) == dest:
                ok = True
open(log_path, "w").write("\n".join(commands))
if not ok:
    sys.stderr.write("no create.sh --dest %s --name %s --title %s\n" % (dest, name, title))
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
require("src/server.ts", "pathname === mcpPath")
require("src/server.ts", "mcpHandler.fetch")
reject("src/server.ts", "react-start")
reject("src/server.ts", "stdio")
mcp = text("src/server/mcp.ts")
if mcp.count("registerTool") != 1:
    errors.append("healthcheck tool count is %s" % mcp.count("registerTool"))
for needle in (
    "createMcpHandler(createServer",
    "structuredContent: output",
    "healthcheck",
    "ok: true",
    "agents/mcp/server",
    "mcpPath = '/mcp'",
):
    if needle not in mcp:
        errors.append("mcp missing %s" % needle)
for needle in ("cloudflare:workers", "env.DB", "SESSION", "secret", "process.env", "stdio", "registerPrompt", "registerResource", "db/"):
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
if (app / ".tanstack").exists():
    errors.append("copied .tanstack")
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
rm -rf "$expected"
if [ -e "$dest/.tanstack/sentinel" ] || grep -R -q -F -e joules-web-app-tanstack-sentinel "$dest"; then
  echo "kept $work" >&2
  fail "tanstack cache copied"
fi

if [ ! -d "$plugin_dir/template/node_modules/agents" ]; then
  (cd "$plugin_dir/template" && npm ci) || fail "template install"
fi
ln -s "$plugin_dir/template/node_modules" "$dest/node_modules"
(cd "$dest" && npm run build) || {
  echo "kept $work" >&2
  fail "build"
}
(cd "$dest" && sh scripts/verify.sh --built) || {
  echo "kept $work" >&2
  fail "verify"
}
node --input-type=module --eval '
import { pathToFileURL } from "node:url"
const dest = process.argv[1]
const worker = (await import(pathToFileURL(dest + "/dist/server/index.js").href)).default
const version = "2026-07-28"
async function post(method, params, name) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method,
    params: {
      ...params,
      _meta: {
        "io.modelcontextprotocol/protocolVersion": version,
        "io.modelcontextprotocol/clientCapabilities": {},
        "io.modelcontextprotocol/clientInfo": { name: "probe", version: "0" },
      },
    },
  }
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "mcp-protocol-version": version,
    "mcp-method": method,
  }
  if (name) headers["mcp-name"] = name
  const response = await worker.fetch(new Request("https://acme-app.example/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }))
  const text = await response.text()
  if (response.status !== 200) {
    console.error(text)
    process.exit(1)
  }
  return JSON.parse(text)
}
const listed = await post("tools/list", {})
const tools = listed.result.tools
if (!Array.isArray(tools) || tools.length !== 1 || tools[0].name !== "healthcheck") {
  console.error("tools", JSON.stringify(tools))
  process.exit(1)
}
const called = await post("tools/call", { name: "healthcheck", arguments: {} }, "healthcheck")
const result = called.result
const text = result.content && result.content[0] && result.content[0].text
if (text !== "{\"ok\":true}" || !result.structuredContent || result.structuredContent.ok !== true) {
  console.error(JSON.stringify(called))
  process.exit(1)
}
' "$dest" || {
  echo "kept $work" >&2
  fail "healthcheck"
}

rm -rf "$work"
echo "PASS $plugin/create-web-app"
