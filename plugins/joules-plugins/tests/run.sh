#!/bin/sh
# Run one headless Grok session per case.
#
# grok has no per-prompt --plugin flag. A new `grok -p` session loads the
# plugins that `grok plugin enable` has turned on, and the prompt's slash
# name selects the skill. This script enables that plugin, then runs:
#
#   grok --cwd <sandbox> --prompt-file <case> --verbatim --always-approve \
#     --output-format json --max-turns 16 --no-subagents --disable-web-search \
#     --deny 'Bash(grok plugin install*)' \
#     --deny 'Bash(grok plugin marketplace*)' \
#     --deny 'Bash(git push*)' \
#     --deny 'Bash(curl*)' --deny 'Bash(wget*)'
#
# The sandbox is a copy of fixtures/market beside this script, so the
# session cannot write the Joules checkout. Cases are cases/<name>.txt.
# Pass a case name, or no argument for every case. --print shows the command.
# The raw log is saved under logs/<case>/ (transcript, diff, stderr). A second
# headless session scores that log in one shot, with tools removed, and fills
# every RUBRIC.md row. A missing row or a point other than 0 or the cell fails.

set -u

here=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
plugin_dir=$(dirname "$here")
plugin=$(basename "$plugin_dir")
root=$(dirname "$(dirname "$plugin_dir")")
fixture="$here/fixtures/market"
cases="$here/cases"
readme="$plugin_dir/README.md"
print_only=0
if [ "${1:-}" = "--print" ]; then
  print_only=1
  shift
fi

want="${1:-}"

fail=0
ran=0

result_of() {
  grep -oE 'RESULT: (pass|fail|refused)' "$1" 2>/dev/null | tail -n 1 | awk '{print $2}'
}

clean_tree() {
  [ -z "$(git -C "$1" status --porcelain)" ]
}



rubric="$plugin_dir/skills/$plugin/RUBRIC.md"
row_names="Load Job Procedure Future-proof Catalog Safety Components Hosts Behavior"
bad=0

pts() {
  sed -n "s/^| $1 (\([0-9][0-9]*\)).*/\1/p" "$rubric" | head -n 1
}

mark() {
  name=$1
  how=$2
  points=$(pts "$name")
  case "$how" in
    pass) val=$points ;;
    fail) val=0; bad=1 ;;
    *) val="-" ;;
  esac
  printf '%s\t%s\n' "$name" "$val" >> "$log/rows.tsv"
  printf '%-14s %s\n' "$name" "$val"
}

no_secret() {
  ! grep -R -F 'sk-live-TESTSECRET' "$1/plugins" "$1/.grok-plugin" >/dev/null
}

score_case() {
  kind=$1
  work=$2
  text=$3
  : > "$log/rows.tsv"
  bad=0
  result=$(result_of "$text")
  echo "sandbox"
  case "$kind" in
    create-basic-plugin)
      if [ "$result" = pass ] && grok plugin validate "$work/plugins/hello-note" >/dev/null 2>&1; then mark Load pass; else mark Load fail; fi
      if [ -f "$work/plugins/hello-note/.grok-plugin/plugin.json" ] && [ -f "$work/plugins/hello-note/skills/hello-note/SKILL.md" ]; then mark Job pass; else mark Job fail; fi
      mark Procedure skip
      mark Future-proof skip
      if grep -F '"hello-note"' "$work/.grok-plugin/marketplace.json" >/dev/null 2>&1; then mark Catalog pass; else mark Catalog fail; fi
      if no_secret "$work"; then mark Safety pass; else mark Safety fail; fi
      mark Components skip
      mark Hosts skip
      if [ "$result" = pass ]; then mark Behavior pass; else mark Behavior fail; fi
      ;;
    evaluate-sample-plugin)
      if [ "$result" = pass ] && grok plugin validate "$work/plugins/sample-note" >/dev/null 2>&1; then mark Load pass; else mark Load fail; fi
      mark Job skip
      mark Procedure skip
      mark Future-proof skip
      mark Catalog skip
      if clean_tree "$work"; then mark Safety pass; else mark Safety fail; fi
      mark Components skip
      mark Hosts skip
      if [ "$result" = pass ]; then mark Behavior pass; else mark Behavior fail; fi
      ;;
    *)
      echo "no check for $kind" >&2
      bad=1
      ;;
  esac
  [ "$bad" = 0 ]
}

record_status() {
  kind=$1
  result=$2
  usage=$3
  when=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  python3 - "$readme" "$kind" "$result" "$when" "$usage" "${rows_file:-$log/rows.tsv}" "$cases" <<'PY'
import os, sys
path, kind, result, when, usage, rows_path, cases_dir = sys.argv[1:]
order = ["Load", "Job", "Procedure", "Future-proof", "Catalog", "Safety", "Components", "Hosts", "Behavior"]
kinds = sorted(name[:-4] for name in os.listdir(cases_dir) if name.endswith(".txt"))
scores = {name: "-" for name in order}
try:
    for line in open(rows_path):
        name, val = line.rstrip("\n").split("\t", 1)
        scores[name] = val
except FileNotFoundError:
    pass
cells = [kind, when, result] + [scores[name] for name in order] + [usage or "-"]
row = "| " + " | ".join(cells) + " |"
text = open(path).read()
start = "<!-- joules-test-status:start -->"
end = "<!-- joules-test-status:end -->"
block = text.split(start, 1)[1].split(end, 1)[0]
lines = [line for line in block.splitlines() if line.startswith("|")]
header, sep = lines[0], lines[1]
kept = {}
for line in lines[2:]:
    prompt = line.split("|")[1].strip()
    kept[prompt] = line
kept[kind] = row
body = [header, sep] + [kept.get(name, "| " + name + " | - | not run | " + " | ".join(["-"] * 10) + " |") for name in kinds]
replacement = start + "\n" + "\n".join(body) + "\n" + end
open(path, "w").write(text.split(start, 1)[0] + replacement + text.split(end, 1)[1])
PY
}

usage_of() {
  python3 - "$1" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
usage = data.get("usage") or {}
parts = []
if usage.get("input_tokens") is not None:
    parts.append("%s in" % usage["input_tokens"])
if usage.get("output_tokens") is not None:
    parts.append("%s out" % usage["output_tokens"])
if data.get("num_turns") is not None:
    parts.append("%s turns" % data["num_turns"])
if data.get("total_cost_usd") is not None:
    parts.append("$%s" % data["total_cost_usd"])
sys.stdout.write(", ".join(parts) if parts else "-")
PY
}

save_log() {
  saved="$here/logs/$kind"
  rm -rf "$saved"
  mkdir -p "$saved"
  cp "$prompt" "$saved/prompt.txt"
  [ -f "$text" ] && cp "$text" "$saved/reply.txt"
  [ -f "$err" ] && cp "$err" "$saved/stderr.txt"
  [ -f "$out" ] && cp "$out" "$saved/grok-out.json"
  {
    echo "=== status ==="
    git -C "$work" status --porcelain
    echo "=== diff ==="
    git -C "$work" diff HEAD
    echo "=== untracked ==="
    git -C "$work" ls-files --others --exclude-standard | while IFS= read -r f; do
      [ -n "$f" ] || continue
      [ -f "$work/$f" ] || continue
      size=$(wc -c < "$work/$f" | tr -d ' ')
      echo "=== $f ==="
      if [ "$size" -lt 20000 ]; then
        cat "$work/$f"
      else
        echo "[$size bytes omitted]"
      fi
    done
  } > "$saved/diff.txt"
  cp "$rubric" "$saved/RUBRIC.md"
  python3 - "$saved/grok-out.json" "$saved/transcript.txt" <<'PY'
import glob, json, os, sys
out_path, dest = sys.argv[1:]
data = json.load(open(out_path))
session_id = data.get("sessionId") or ""
matches = glob.glob(os.path.expanduser("~/.grok/sessions/*/%s/chat_history.jsonl" % session_id))
if not matches:
    sys.stderr.write("no transcript for %s\n" % session_id)
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

def clip(text, limit):
    text = (text or "").strip()
    if len(text) <= limit:
        return text
    return text[:limit] + "\n...[truncated]"

def user_text(raw):
    for tag in ("<skill_information>", "<system-reminder>"):
        at = raw.find(tag)
        if at >= 0:
            raw = raw[:at]
    raw = raw.strip()
    if raw.startswith("<"):
        return ""
    return raw

chunks = []
for line in open(chat):
    event = json.loads(line)
    kind = event.get("type")
    if kind == "user":
        body = user_text(text_of(event.get("content")))
        if body:
            chunks.append("## User\n" + body)
    elif kind == "assistant":
        body = text_of(event.get("content")).strip()
        if body:
            chunks.append("## Assistant\n" + body)
        for call in event.get("tool_calls") or []:
            args = call.get("arguments")
            if not isinstance(args, str):
                args = json.dumps(args, sort_keys=True)
            chunks.append("## Tool\nname: %s\narguments: %s" % (call.get("name") or "", clip(args, 12000)))
    elif kind == "tool_result":
        chunks.append("## Tool result\n" + clip(text_of(event.get("content")), 12000))
if not chunks:
    sys.stderr.write("empty transcript for %s\n" % session_id)
    sys.exit(1)
open(dest, "w").write("\n\n".join(chunks) + "\n")
PY
}

evaluate_log() {
  saved=$1
  schema=$(tr -d '\n' < "$here/eval-schema.json")
  eval_cwd=$(mktemp -d "${TMPDIR:-/tmp}/joules-plugin-eval.XXXXXX")
  {
    cat "$here/evaluate-run.txt"
    echo
    echo "===== RUBRIC.md ====="
    sed 's/^/  /' "$saved/RUBRIC.md"
    echo
    echo "===== transcript.txt ====="
    sed 's/^/  /' "$saved/transcript.txt"
    echo
    echo "===== diff.txt ====="
    sed 's/^/  /' "$saved/diff.txt"
    echo
    echo "===== stderr.txt ====="
    if [ -f "$saved/stderr.txt" ]; then
      sed 's/^/  /' "$saved/stderr.txt"
    fi
  } > "$saved/eval-prompt.txt"
  echo "eval"
  eval_status=0
  grok \
    --cwd "$eval_cwd" \
    --prompt-file "$saved/eval-prompt.txt" \
    --verbatim \
    --json-schema "$schema" \
    --output-format json \
    --max-turns 2 \
    --no-subagents \
    --disable-web-search \
    --always-approve \
    --reasoning-effort low \
    --tools __none__ \
    --deny 'MCPTool(*)' \
    --system-prompt-override 'You score one finished test run. The log is in the user message. Return only the JSON object. Do not use tools.' \
    >"$saved/eval-out.json" 2>"$saved/eval-err.txt" || eval_status=$?
  rm -rf "$eval_cwd"
  if [ "$eval_status" != 0 ]; then
    echo "FAIL $plugin/$kind (eval grok exit)"
    tail -n 20 "$saved/eval-err.txt" >&2
    return 1
  fi
  python3 - "$saved/eval-out.json" "$saved/scores.tsv" "$rubric" <<'PY'
import json, re, sys
out_path, tsv_path, rubric_path = sys.argv[1:]
data = json.load(open(out_path))
if data.get("type") == "error":
    sys.stderr.write((data.get("message") or "error") + "\n")
    sys.exit(1)
scores = data.get("structuredOutput")
if isinstance(scores, str):
    try:
        scores = json.loads(scores)
    except json.JSONDecodeError:
        scores = None
if not isinstance(scores, dict) or not scores:
    raw = data.get("text") or ""
    try:
        scores = json.loads(raw)
    except json.JSONDecodeError:
        start, end = raw.find("{"), raw.rfind("}")
        if start < 0 or end < start:
            sys.stderr.write("eval did not return JSON\n")
            sys.exit(1)
        scores = json.loads(raw[start:end + 1])
caps = {}
for line in open(rubric_path):
    match = re.match(r"\| ([^|]+?) \((\d+)\)", line)
    if match:
        caps[match.group(1)] = int(match.group(2))
if not caps:
    sys.stderr.write("rubric has no rows\n")
    sys.exit(1)
missing = [name for name in caps if name not in scores]
if missing:
    sys.stderr.write("missing rows: %s\n" % ", ".join(missing))
    sys.exit(1)
bad = False
lines = []
seen = {}
for name, cap in caps.items():
    cell = scores.get(name) or {}
    points = cell.get("points") if isinstance(cell, dict) else None
    evidence = (cell.get("evidence") or "").strip() if isinstance(cell, dict) else ""
    if isinstance(points, bool) or not isinstance(points, int) or points not in (0, cap) or len(evidence) < 12:
        sys.stderr.write("%s invalid points=%r\n" % (name, points))
        bad = True
        points = 0
    seen.setdefault(evidence, []).append(name)
    lines.append("%s\t%s" % (name, points))
    print("%-14s %s | %s" % (name, points, evidence))
for evidence, names in seen.items():
    if evidence and len(names) > 3:
        sys.stderr.write("same evidence on %s\n" % ", ".join(names))
        bad = True
open(tsv_path, "w").write("\n".join(lines) + "\n")
if bad:
    sys.exit(1)
PY
}

run_one() {
  kind=$1
  prompt="$cases/$kind.txt"
  [ -f "$prompt" ] || {
    echo "missing $prompt" >&2
    fail=$((fail + 1))
    return
  }
  ran=$((ran + 1))
  work=$(mktemp -d "${TMPDIR:-/tmp}/joules-plugin-test.XXXXXX")
  log=$(mktemp -d "${TMPDIR:-/tmp}/joules-plugin-log.XXXXXX")
  cp -R "$fixture/." "$work/"
  git -C "$work" init -q
  git -C "$work" add -A
  git -C "$work" -c user.name=joules -c user.email=joules@example.com commit -q -m init

  echo "=== $plugin/$kind ==="
  if [ "$print_only" = 1 ]; then
    printf 'grok plugin enable %s\n' "$plugin"
    printf "grok --cwd %s --prompt-file %s --verbatim --always-approve --output-format json --max-turns 16 --no-subagents --disable-web-search --deny '%s' --deny '%s' --deny '%s' --deny '%s' --deny '%s'\n" \
      "$work" "$prompt" 'Bash(grok plugin install*)' 'Bash(grok plugin marketplace*)' 'Bash(git push*)' 'Bash(curl*)' 'Bash(wget*)'
    printf "grok --cwd <tmp> --prompt-file logs/%s/eval-prompt.txt --verbatim --json-schema <eval-schema.json> --output-format json --max-turns 2 --no-subagents --disable-web-search --always-approve --reasoning-effort low --tools __none__ --deny '%s'\n" \
      "$kind" 'MCPTool(*)'
    rm -rf "$work" "$log"
    return
  fi

  grok plugin enable "$plugin" >/dev/null 2>&1 || {
    echo "FAIL $plugin/$kind (plugin enable)"
    fail=$((fail + 1))
    rm -rf "$work" "$log"
    return
  }

  out="$log/grok-out.json"
  err="$log/grok-err.txt"
  if ! grok \
    --cwd "$work" \
    --prompt-file "$prompt" \
    --verbatim \
    --always-approve \
    --output-format json \
    --max-turns 16 \
    --no-subagents \
    --disable-web-search \
    --deny 'Bash(grok plugin install*)' \
    --deny 'Bash(grok plugin marketplace*)' \
    --deny 'Bash(git push*)' \
    --deny 'Bash(curl*)' \
    --deny 'Bash(wget*)' \
    >"$out" 2>"$err"
  then
    echo "FAIL $plugin/$kind (grok exit)"
    tail -n 20 "$err" >&2
    record_status "$kind" fail "-"
    fail=$((fail + 1))
    echo "kept $work"
    echo "log $log"
    return
  fi

  text="$log/grok-text.txt"
  if ! python3 - "$out" "$text" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
if data.get("type") == "error":
    sys.stderr.write(data.get("message", "error") + "\n")
    sys.exit(1)
open(sys.argv[2], "w").write(data.get("text") or "")
PY
  then
    echo "FAIL $plugin/$kind (no text)"
    record_status "$kind" fail "-"
    fail=$((fail + 1))
    echo "kept $work"
    echo "log $log"
    return
  fi

  usage=$(usage_of "$out" 2>/dev/null || true)
  if ! save_log; then
    echo "FAIL $plugin/$kind (transcript)"
    record_status "$kind" fail "$usage"
    fail=$((fail + 1))
    echo "kept $work"
    echo "log $saved"
    return
  fi
  sandbox_ok=0
  score_case "$kind" "$work" "$text" && sandbox_ok=1
  rows_file="$saved/scores.tsv"
  eval_ok=0
  evaluate_log "$saved" && eval_ok=1
  if [ "$sandbox_ok" = 1 ] && [ "$eval_ok" = 1 ]; then
    echo "PASS $plugin/$kind"
    record_status "$kind" pass "$usage"
    rm -rf "$work" "$log"
  else
    echo "FAIL $plugin/$kind"
    record_status "$kind" fail "$usage"
    echo "--- reply ---"
    cat "$text"
    echo
    echo "kept $work"
    echo "log $saved"
    fail=$((fail + 1))
  fi
}

for prompt in "$cases"/*.txt; do
  [ -f "$prompt" ] || continue
  kind=$(basename "$prompt" .txt)
  case "$want" in
    "" | "$kind" | "$plugin" | "$plugin/$kind") run_one "$kind" ;;
  esac
done

if [ "$ran" = 0 ]; then
  echo "no case matched: ${want:-all}" >&2
  echo "usage: plugins/<name>/tests/run.sh [--print] [case]" >&2
  exit 1
fi

echo "$ran run, $fail failed"
[ "$fail" = 0 ]
