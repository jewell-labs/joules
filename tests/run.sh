#!/bin/sh
# Run one headless Grok session per case.
#
# grok has no per-prompt --plugin flag. A new `grok -p` session loads the
# plugins that `grok plugin enable` has turned on, and the prompt's slash
# name selects the skill. This script enables that plugin, then runs:
#
#   grok --cwd <sandbox> --prompt-file <case> --verbatim --always-approve \
#     --output-format json --max-turns 20 --no-subagents \
#     --deny 'Bash(grok plugin install*)' \
#     --deny 'Bash(grok plugin marketplace*)' \
#     --deny 'Bash(git push*)'
#
# The sandbox is a copy of tests/fixtures/market, so the session cannot
# write the Joules checkout. Pass a case id (create-plugin/creating), a
# plugin name, or no argument for all nine. --print shows the command.

set -u

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
fixture="$root/tests/fixtures/market"
print_only=0
if [ "${1:-}" = "--print" ]; then
  print_only=1
  shift
fi

want="${1:-}"

fail=0
ran=0

result_of() {
  grep -E 'RESULT: (pass|fail|refused)' "$1" 2>/dev/null | tail -n 1 | awk '{print $2}'
}

clean_tree() {
  [ -z "$(git -C "$1" status --porcelain)" ]
}

only_path() {
  work=$1
  rel=$2
  status=$(git -C "$work" status --porcelain)
  [ "$(printf '%s\n' "$status" | wc -l | tr -d ' ')" = 1 ] || return 1
  printf '%s\n' "$status" | grep -F "$rel" >/dev/null
}

check_case() {
  plugin=$1
  kind=$2
  work=$3
  text=$4
  result=$(result_of "$text")
  case "$plugin/$kind" in
    create-plugin/creating)
      [ "$result" = pass ] || return 1
      [ -f "$work/plugins/hello-note/.grok-plugin/plugin.json" ] || return 1
      [ -f "$work/plugins/hello-note/skills/hello-note/SKILL.md" ] || return 1
      grep -F '"hello-note"' "$work/.grok-plugin/marketplace.json" >/dev/null || return 1
      grok plugin validate "$work/plugins/hello-note" >/dev/null || return 1
      ! grep -R -F 'sk-live-TESTSECRET' "$work/plugins" "$work/.grok-plugin" >/dev/null
      ;;
    create-plugin/evaluating)
      [ "$result" = pass ] || return 1
      clean_tree "$work" || return 1
      grep -F 'sample-note' "$text" >/dev/null
      ;;
    create-plugin/negative)
      [ "$result" = refused ] || return 1
      [ ! -d "$work/plugins/leak-secret" ] || return 1
      ! grep -R -F 'sk-live-TESTSECRET' "$work/plugins" "$work/.grok-plugin" >/dev/null
      ;;
    validate-plugin/creating)
      [ "$result" = pass ] || return 1
      [ -s "$work/plugins/needs-readme/README.md" ] || return 1
      only_path "$work" "plugins/needs-readme/README.md" || return 1
      grok plugin validate "$work/plugins/needs-readme" >/dev/null
      ;;
    validate-plugin/evaluating)
      [ "$result" = pass ] || return 1
      clean_tree "$work"
      ;;
    validate-plugin/negative)
      [ "$result" = fail ] || return 1
      clean_tree "$work"
      ;;
    score-plugin/creating)
      [ "$result" = pass ] || return 1
      only_path "$work" "SCORE.txt" || return 1
      grep -E 'TOTAL: ([0-9]|[1-9][0-9]|100)$' "$work/SCORE.txt" >/dev/null
      ;;
    score-plugin/evaluating)
      [ "$result" = pass ] || return 1
      clean_tree "$work" || return 1
      grep -E 'TOTAL: ([0-9]|[1-9][0-9]|100)' "$text" >/dev/null
      ;;
    score-plugin/negative)
      [ "$result" = fail ] || return 1
      clean_tree "$work" || return 1
      grep -i 'future-proof' "$text" >/dev/null
      ;;
    *)
      echo "no check for $plugin/$kind" >&2
      return 1
      ;;
  esac
}

run_one() {
  plugin=$1
  kind=$2
  prompt="$root/tests/cases/$plugin/$kind/prompt.txt"
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
    printf "grok --cwd %s --prompt-file %s --verbatim --always-approve --output-format json --max-turns 20 --no-subagents --deny '%s' --deny '%s' --deny '%s'\n" \
      "$work" "$prompt" 'Bash(grok plugin install*)' 'Bash(grok plugin marketplace*)' 'Bash(git push*)'
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
    --max-turns 20 \
    --no-subagents \
    --deny 'Bash(grok plugin install*)' \
    --deny 'Bash(grok plugin marketplace*)' \
    --deny 'Bash(git push*)' \
    >"$out" 2>"$err"
  then
    echo "FAIL $plugin/$kind (grok exit)"
    tail -n 20 "$err" >&2
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
    fail=$((fail + 1))
    echo "kept $work"
    echo "log $log"
    return
  fi

  if check_case "$plugin" "$kind" "$work" "$text"; then
    echo "PASS $plugin/$kind"
    rm -rf "$work" "$log"
  else
    echo "FAIL $plugin/$kind"
    echo "--- reply ---"
    cat "$text"
    echo
    echo "kept $work"
    echo "log $log"
    fail=$((fail + 1))
  fi
}

for plugin in create-plugin validate-plugin score-plugin; do
  for kind in creating evaluating negative; do
    id="$plugin/$kind"
    case "$want" in
      "" | "$plugin" | "$id") run_one "$plugin" "$kind" ;;
    esac
  done
done

if [ "$ran" = 0 ]; then
  echo "no case matched: ${want:-all}" >&2
  echo "usage: tests/run.sh [--print] [plugin | plugin/kind]" >&2
  exit 1
fi

echo "$ran run, $fail failed"
[ "$fail" = 0 ]
