#!/bin/sh
# Rewrite the web-app README marker block from a destination the agent passes.
# Does not call grok, does not write a log, and does not create the app.
set -eu

dest=""
readme=""
main_status=""
staging_status=""
usage="-"

while [ $# -gt 0 ]; do
  case "$1" in
    --dest)
      dest=${2:-}
      shift 2
      ;;
    --readme)
      readme=${2:-}
      shift 2
      ;;
    --main-status)
      main_status=${2:-}
      shift 2
      ;;
    --staging-status)
      staging_status=${2:-}
      shift 2
      ;;
    --usage)
      usage=${2:-}
      shift 2
      ;;
    *)
      echo "unknown argument: $1" >&2
      echo "usage: evaluate.sh --dest DEST [--readme FILE] [--main-status N] [--staging-status N] [--usage TEXT]" >&2
      exit 2
      ;;
  esac
done

if [ -z "$dest" ] || [ ! -d "$dest" ]; then
  echo "missing --dest" >&2
  exit 2
fi

here=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
if [ -z "$readme" ]; then
  readme=$(CDPATH= cd -- "$here/.." && pwd)/README.md
fi

export EVAL_DEST="$dest"
export EVAL_README="$readme"
export EVAL_MAIN="$main_status"
export EVAL_STAGING="$staging_status"
export EVAL_USAGE="$usage"

python3 - <<'PY'
import os, re, subprocess
from datetime import datetime, timezone
from pathlib import Path

dest = Path(os.environ["EVAL_DEST"]).resolve()
readme_path = Path(os.environ["EVAL_README"])
main_status = os.environ.get("EVAL_MAIN", "")
staging_status = os.environ.get("EVAL_STAGING", "")
usage = os.environ.get("EVAL_USAGE") or "-"
text = readme_path.read_text()
start = "<!-- eval-status:start -->"
end = "<!-- eval-status:end -->"
if start not in text or end not in text:
    raise SystemExit("README is missing eval-status markers")
before, rest = text.split(start, 1)
block, after = rest.split(end, 1)
prompt = ""
for line in block.splitlines():
    if not line.startswith("|"):
        continue
    cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
    if not cells or cells[0] in {"Prompt", "---"} or set(cells[0]) <= {"-"}:
        continue
    prompt = cells[0]
    break
if not prompt or "|" in prompt:
    raise SystemExit("README prompt cell is missing")

skip = {"node_modules", "dist", ".git"}

def files():
    for dirpath, dirnames, filenames in os.walk(dest):
        dirnames[:] = [name for name in dirnames if name not in skip]
        for name in filenames:
            yield Path(dirpath) / name

def rel(path):
    return path.relative_to(dest).as_posix()

def read(path):
    try:
        return path.read_text(errors="replace")
    except OSError:
        return ""

word = {
    "stripe": re.compile(r"(?<![A-Za-z0-9])stripe(?![A-Za-z0-9])"),
    "Stripe": re.compile(r"(?<![A-Za-z0-9])Stripe(?![A-Za-z0-9])"),
    "passkey": re.compile(r"(?<![A-Za-z0-9])passkey(?![A-Za-z0-9])"),
    "phone-otp": re.compile(r"(?<![A-Za-z0-9])phone-otp(?![A-Za-z0-9])"),
}

hits = {name: [] for name in word}
void_auth = False
void_db = False
account_id = False
tanstack = False
for path in files():
    body = read(path)
    name = rel(path)
    if "void/auth" in body:
        void_auth = True
    if re.search(r"""from ["']void/db["']""", body):
        void_db = True
    if "account_id" in body:
        account_id = True
    if name != "package-lock.json" and "@tanstack/solid-start" in body:
        tanstack = True
    for key, pattern in word.items():
        if pattern.search(body):
            hits[key].append(name)

package = read(dest / "package.json")
config = read(dest / "void.config.ts")
vite = read(dest / "vite.config.ts")
mcp = read(dest / "routes" / "mcp.ts")
workflow_path = dest / ".github" / "workflows" / "void-deploy.yml"
workflow = read(workflow_path)
check_sh = read(dest / "scripts" / "check.sh")

create_ok = (
    re.search(r'"name"\s*:\s*"eval-app"', package)
    and re.search(r"title:\s*'Eval App'", config)
    and not (dest / "src" / "server" / "auth" / "policy.ts").exists()
    and not void_auth
    and not void_db
    and not (dest / ".joules-answers.json").exists()
)
absent_ok = not any(hits.values())
stack_ok = (
    'target: "cloudflare"' in config
    and "workerName(" in config
    and not account_id
    and not (dest / "wrangler.jsonc").exists()
    and not (dest / "src" / "server.ts").exists()
    and not tanstack
    and "voidPlugin()" in vite
    and "voidSolid()" in vite
)
tools = re.findall(r'registerTool\(\s*"([^"]+)"', mcp)
health_ok = tools == ["healthcheck"] and 'mcpPath = "/mcp"' in mcp and not re.search(r"oauth", mcp, re.I)

check_chunk = ""
deploy_chunk = ""
check_at = workflow.find("\n  check:\n")
deploy_at = workflow.find("\n  deploy:\n")
if check_at >= 0:
    check_chunk = workflow[check_at:deploy_at if deploy_at > check_at else len(workflow)]
if deploy_at >= 0:
    deploy_chunk = workflow[deploy_at:]
check_clean = bool(check_chunk) and "CLOUDFLARE" not in check_chunk and "account_id" not in check_chunk
deploy_line = "npx void deploy --platform cloudflare"
ran = subprocess.run(
    ["npm", "run", "deploy"],
    cwd=dest,
    text=True,
    capture_output=True,
)
printed = "void deploy --platform cloudflare" in ran.stdout and deploy_line in workflow
lock_ok = True
lock_path = dest / "void.lock.json"
if lock_path.exists():
    try:
        lock = __import__("json").loads(lock_path.read_text())
    except ValueError:
        lock_ok = False
    else:
        resolved = lock.get("resolved") if isinstance(lock, dict) else None
        extra = set(resolved or {}) - {"name", "compatibility_date"}
        blob = lock_path.read_text()
        lock_ok = isinstance(resolved, dict) and not extra and "account" not in blob and "database" not in blob
release_ok = (
    printed
    and ran.returncode == 2
    and check_clean
    and lock_ok
)
validated_ok = (
    main_status == "0"
    and staging_status == "0"
    and "does not deploy" in check_sh
)

rows = {
    "Create": 20 if create_ok else 0,
    "Absent": 15 if absent_ok else 0,
    "Stack": 20 if stack_ok else 0,
    "Health": 15 if health_ok else 0,
    "Release": 15 if release_ok else 0,
    "Validated": 15 if validated_ok else 0,
}
result = "pass" if all(value == cap for value, cap in zip(rows.values(), (20, 15, 20, 15, 15, 15))) else "fail"
when = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
usage_cell = usage.replace("|", "/")
row = (
    f"| {prompt} | {when} | {result} | {rows['Create']} | {rows['Absent']} | "
    f"{rows['Stack']} | {rows['Health']} | {rows['Release']} | {rows['Validated']} | {usage_cell} |"
)
table = "\n".join([
    "",
    "| Prompt | When | Result | Create | Absent | Stack | Health | Release | Validated | Usage |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    row,
    "",
])
readme_path.write_text(before + start + "\n" + table + end + after)
print(row)
if not create_ok or not absent_ok or not stack_ok or not health_ok or not release_ok:
    detail = {
        "void_auth": void_auth,
        "void_db": void_db,
        "account_id": account_id,
        "tanstack": tanstack,
        "hits": {key: value for key, value in hits.items() if value},
        "tools": tools,
        "deploy_code": ran.returncode,
        "deploy_stdout": ran.stdout.strip(),
        "check_clean": check_clean,
    }
    print(detail, file=__import__("sys").stderr)
PY
