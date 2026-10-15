#!/bin/sh
# Copy template/, apply one mutation, and ask /web-app to fix it.
#
#   tests/run.sh --check [name]
#     Copy the template. tests/check.sh must print ok. Apply each script in
#     tests/mutations, or the one named. The check must then fail.
#     Also run scripts/create.sh and confirm the copy passes the check.
#     This mode does not call grok.
#
#   tests/run.sh [--print] [name]
#     Install and enable this plugin, copy the example, apply the mutation,
#     and run:
#
#       grok --cwd <copy> --prompt-file tests/comply.txt --verbatim \
#         --always-approve --output-format json --max-turns 16 \
#         --no-subagents --disable-web-search \
#         --deny 'Bash(grok plugin install*)' \
#         --deny 'Bash(grok plugin marketplace*)' \
#         --deny 'Bash(git push*)' \
#         --deny 'Bash(curl*)' --deny 'Bash(wget*)' \
#         --deny 'Bash(npx wrangler deploy*)' \
#         --deny 'Bash(wrangler deploy*)' \
#         --deny 'Bash(npm run deploy*)'
#
#     The run passes when tests/check.sh prints ok. Logs are tests/logs/<name>/.

set -u

here=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
plugin_dir=$(dirname "$here")
plugin=$(basename "$plugin_dir")
example="$plugin_dir/template"
create="$plugin_dir/scripts/create.sh"
mutations="$here/mutations"
check="$here/check.sh"
prompt="$here/comply.txt"

mode=agent
if [ "${1:-}" = "--check" ]; then
  mode=check
  shift
elif [ "${1:-}" = "--print" ]; then
  mode=print
  shift
fi
want="${1:-}"

fail=0
ran=0

copy_app() {
  dest=$1
  rm -rf "$dest"
  mkdir -p "$dest"
  tar -C "$example" -cf - \
    --exclude node_modules \
    --exclude .wrangler \
    --exclude dist \
    --exclude .output \
    --exclude worker-configuration.d.ts \
    --exclude .DS_Store \
    . | tar -C "$dest" -xf -
}

pipeline_ok() {
  app=$1
  for file in \
    .github/workflows/release.yml \
    deploy/branches.json \
    scripts/verify.sh \
    scripts/screenshot.sh \
    scripts/release.sh \
    scripts/branch-env.sh \
    scripts/notify.sh \
    scripts/version.sh \
    tests/ready.test.ts
  do
    [ -f "$app/$file" ] || return 1
  done
  (cd "$app" && node --test tests/ready.test.ts) || return 1
  shim=$(mktemp -d "${TMPDIR:-/tmp}/joules-web-app-shim.XXXXXX")
  printf '%s\n' '#!/bin/sh' 'echo called >> "$DEPLOY_LOG"' 'exit 99' > "$shim/npx"
  cp "$shim/npx" "$shim/wrangler"
  chmod +x "$shim/npx" "$shim/wrangler"
  log=$(mktemp "${TMPDIR:-/tmp}/joules-web-app-deploy.XXXXXX")
  : > "$log"
  out=$(DEPLOY_LOG="$log" PATH="$shim:$PATH" BRANCH=not-a-mapped-branch sh "$app/scripts/release.sh") || {
    rm -rf "$shim" "$log"
    return 1
  }
  printf '%s\n' "$out" | grep -q 'skip deploy' || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$out" | grep -q 'wrangler deploy' && { rm -rf "$shim" "$log"; return 1; }
  [ ! -s "$log" ] || { rm -rf "$shim" "$log"; return 1; }
  out=$(DEPLOY_LOG="$log" PATH="$shim:$PATH" RELEASE_PLAN=1 BRANCH=main sh "$app/scripts/release.sh") || {
    rm -rf "$shim" "$log"
    return 1
  }
  printf '%s\n' "$out" | grep -q 'wrangler deploy' || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$out" | grep -q 'production' || { rm -rf "$shim" "$log"; return 1; }
  [ ! -s "$log" ] || { rm -rf "$shim" "$log"; return 1; }
  out=$(RELEASE_PLAN=1 BRANCH=staging sh "$app/scripts/release.sh") || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$out" | grep -q 'environment=staging' || { rm -rf "$shim" "$log"; return 1; }
  python3 - "$app/.github/workflows/release.yml" <<'PY' || { rm -rf "$shim" "$log"; return 1; }
import re, sys
text = open(sys.argv[1], encoding="utf-8").read()
parts = re.split(r"(?m)^(?=  [A-Za-z0-9_-]+:\s*$)", text)
jobs = {}
for part in parts:
    match = re.match(r"  ([A-Za-z0-9_-]+):\s*\n", part)
    if match:
        jobs[match.group(1)] = part

def job_of(needle):
    owners = [name for name, body in jobs.items() if needle in body]
    if len(owners) != 1:
        sys.exit(1)
    return jobs[owners[0]]

check = job_of("scripts/release.sh check")
deploy = job_of("scripts/release.sh deploy")
notify = job_of("scripts/release.sh notify")
if "CLOUDFLARE_API_TOKEN" in check or "DEPLOY_WEBHOOK_URL" in check:
    sys.exit(1)
if "environment:" in check:
    sys.exit(1)
if "DEPLOY_WEBHOOK_URL" in deploy or "environment: release" not in deploy:
    sys.exit(1)
if "CLOUDFLARE_API_TOKEN" in notify or "environment: release" not in notify:
    sys.exit(1)
PY
  : > "$log"
  deploy_status=0
  deploy_out=$(DEPLOY_LOG="$log" PATH="$shim:$PATH" BRANCH=main sh "$app/scripts/release.sh" deploy 2>&1) || deploy_status=$?
  [ "$deploy_status" != 0 ] || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$deploy_out" | grep -q 'skip deploy' && { rm -rf "$shim" "$log"; return 1; }
  [ ! -s "$log" ] || { rm -rf "$shim" "$log"; return 1; }
  if sh "$app/scripts/verify.sh" --built >/dev/null 2>&1; then
    rm -rf "$shim" "$log"
    return 1
  fi
  mkdir -p "$app/dist/client"
  cp "$app/public/manifest.webmanifest" "$app/public/offline.html" "$app/public/sw.js" "$app/dist/client/"
  built=$(sh "$app/scripts/verify.sh" --built) || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$built" | grep -q '^ok$' || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' 'rk_live_abc' > "$app/public/leak.txt"
  verify_status=0
  verify_out=$(sh "$app/scripts/verify.sh" --built 2>&1) || verify_status=$?
  rm -f "$app/public/leak.txt"
  [ "$verify_status" != 0 ] || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$verify_out" | grep -q 'a secret is in the tree' || { rm -rf "$shim" "$log"; return 1; }
  [ ! -e "$app/public/leak.txt" ] || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' 'STRIPE_SECRET_KEY=sk_live_localonly' > "$app/.dev.vars"
  printf '%s\n' 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE' > "$app/.env"
  built=$(sh "$app/scripts/verify.sh" --built) || { rm -f "$app/.dev.vars" "$app/.env"; rm -rf "$shim" "$log"; return 1; }
  rm -f "$app/.dev.vars" "$app/.env"
  printf '%s\n' "$built" | grep -q '^ok$' || { rm -rf "$shim" "$log"; return 1; }
  [ ! -e "$app/.dev.vars" ] && [ ! -e "$app/.env" ] || { rm -rf "$shim" "$log"; return 1; }
  cp "$app/.dev.vars.example" "$log.example"
  printf '\n%s\n' 'sk_live_example' >> "$app/.dev.vars.example"
  verify_status=0
  verify_out=$(sh "$app/scripts/verify.sh" --built 2>&1) || verify_status=$?
  cp "$log.example" "$app/.dev.vars.example"
  rm -f "$log.example"
  [ "$verify_status" != 0 ] || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$verify_out" | grep -q 'a secret is in the tree' || { rm -rf "$shim" "$log"; return 1; }
  : > "$log"
  deploy_status=0
  deploy_out=$(DEPLOY_LOG="$log" PATH="$shim:$PATH" BRANCH=main sh "$app/scripts/release.sh" deploy 2>&1) || deploy_status=$?
  [ "$deploy_status" != 0 ] || { rm -rf "$shim" "$log"; return 1; }
  grep -q 'called' "$log" || { rm -rf "$shim" "$log"; return 1; }
  hook='https://hooks.example/pipeline-ok-marker'
  : > "$log"
  printed=$(NOTIFY_PRINT=1 DEPLOY_WEBHOOK_URL="$hook" BRANCH=main sh "$app/scripts/release.sh" notify 2>"$log") || {
    rm -rf "$shim" "$log"
    return 1
  }
  printf '%s\n' "$printed" | grep -q '"environment": "production"' || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n%s\n' "$printed" "$(cat "$log")" | grep -q "$hook" && { rm -rf "$shim" "$log"; return 1; }
  python3 - "$app/package.json" <<'PY'
import json, sys
path = sys.argv[1]
data = json.load(open(path, encoding="utf-8"))
data["version"] = "1.2.3+meta"
json.dump(data, open(path, "w", encoding="utf-8"))
PY
  tagged=$(RELEASE_PLAN=1 BRANCH=main sh "$app/scripts/release.sh") || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$tagged" | grep -q 'wrangler deploy --tag meta' && { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$tagged" | grep -q -- '--message 1.2.3+meta+' || { rm -rf "$shim" "$log"; return 1; }
  python3 - "$app/package.json" <<'PY'
import json, sys
path = sys.argv[1]
data = json.load(open(path, encoding="utf-8"))
data["version"] = "0.1.0"
json.dump(data, open(path, "w", encoding="utf-8"))
PY
  python3 - "$app/deploy/branches.json" <<'PY'
import json, sys
path = sys.argv[1]
data = json.load(open(path, encoding="utf-8"))
data["main"] = ""
json.dump(data, open(path, "w", encoding="utf-8"))
PY
  bad_status=0
  bad_out=$(DEPLOY_LOG="$log" PATH="$shim:$PATH" BRANCH=main sh "$app/scripts/release.sh" 2>&1) || bad_status=$?
  [ "$bad_status" != 0 ] || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$bad_out" | grep -q 'skip deploy' && { rm -rf "$shim" "$log"; return 1; }
  [ ! -s "$log" ] || { rm -rf "$shim" "$log"; return 1; }
  python3 - "$app/deploy/branches.json" <<'PY'
import json, sys
path = sys.argv[1]
data = json.load(open(path, encoding="utf-8"))
data["main"] = "production"
json.dump(data, open(path, "w", encoding="utf-8"))
PY
  if DEPLOY_WEBHOOK_URL= APP_NAME=acme BRANCH=main ENVIRONMENT=production APP_VERSION=0.1.0+abc \
    sh "$app/scripts/notify.sh" >/dev/null 2>&1
  then
    rm -rf "$shim" "$log"
    return 1
  fi
  if NOTIFY_PRINT=1 DEPLOY_WEBHOOK_URL= APP_NAME=acme BRANCH=main ENVIRONMENT=production APP_VERSION=0.1.0+abc \
    sh "$app/scripts/notify.sh" >/dev/null 2>&1
  then
    rm -rf "$shim" "$log"
    return 1
  fi
  hook='https://hooks.example/pipeline-ok-marker'
  printed=$(NOTIFY_PRINT=1 DEPLOY_WEBHOOK_URL="$hook" APP_NAME=acme BRANCH=main ENVIRONMENT=production APP_VERSION=0.1.0+abc DEPLOY_RESULT=deployed \
    sh "$app/scripts/notify.sh" 2>"$log") || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$printed" | grep -q '"app": "acme"' || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$printed" | grep -q '"branch": "main"' || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$printed" | grep -q '"environment": "production"' || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$printed" | grep -q '"version": "0.1.0+abc"' || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$printed" | grep -q '"result": "deployed"' || { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n%s\n' "$printed" "$(cat "$log")" | grep -q "$hook" && { rm -rf "$shim" "$log"; return 1; }
  printf '%s\n' "$printed" | grep -q 'DEPLOY_WEBHOOK_URL' && { rm -rf "$shim" "$log"; return 1; }
  secret='SECRETTOKEN123'
  : > "$log"
  if DEPLOY_WEBHOOK_URL="https://user:${secret}@hooks.example/hook" APP_NAME=acme BRANCH=main ENVIRONMENT=production APP_VERSION=0.1.0+abc \
    sh "$app/scripts/notify.sh" >"$log.out" 2>"$log.err"
  then
    rm -rf "$shim" "$log" "$log.out" "$log.err"
    return 1
  fi
  if grep -q "$secret" "$log.out" "$log.err"; then
    rm -rf "$shim" "$log" "$log.out" "$log.err"
    return 1
  fi
  python3 - "$app" "$secret" <<'PY' || { rm -rf "$shim" "$log" "$log.out" "$log.err"; return 1; }
import os, subprocess, sys
app, secret = sys.argv[1:]
env = os.environ.copy()
env.update({
    "DEPLOY_WEBHOOK_URL": "https://" + secret + "\uff20" + "example.com/hook",
    "APP_NAME": "acme",
    "BRANCH": "main",
    "ENVIRONMENT": "production",
    "APP_VERSION": "0.1.0+abc",
})
proc = subprocess.run(["sh", os.path.join(app, "scripts/notify.sh")], env=env, capture_output=True, text=True)
if proc.returncode == 0 or secret in proc.stdout or secret in proc.stderr:
    sys.exit(1)
PY
  rm -rf "$shim" "$log" "$log.out" "$log.err"
}

check_one() {
  name=$1
  script=$2
  work=$(mktemp -d "${TMPDIR:-/tmp}/joules-web-app.XXXXXX")
  copy_app "$work/app"
  if [ "$name" = "template" ]; then
    if sh "$check" "$work/app" >/dev/null && pipeline_ok "$work/app"; then
      echo "ok   $name"
    else
      echo "fail $name" >&2
      fail=$((fail + 1))
    fi
  else
    sh "$script" "$work/app"
    if sh "$check" "$work/app" >/dev/null; then
      echo "fail $name (check passed on a broken copy)" >&2
      fail=$((fail + 1))
    else
      echo "ok   $name breaks the check"
    fi
  fi
  rm -rf "$work"
}

selected() {
  name=$1
  [ -z "$want" ] || [ "$want" = "$name" ]
}

if [ "$mode" = "check" ]; then
  if selected template; then
    ran=$((ran + 1))
    check_one template ""
  fi
  if selected create; then
    ran=$((ran + 1))
    work=$(mktemp -d "${TMPDIR:-/tmp}/joules-web-app.XXXXXX")
    bad=0
    sh "$create" --dest "$work/app" --name acme-app --title "Acme App" >/dev/null || bad=1
    sh "$check" "$work/app" >/dev/null || bad=1
    pipeline_ok "$work/app" || bad=1
    grep -q '"name": "acme-app"' "$work/app/package.json" || bad=1
    grep -q '"name": "acme-app"' "$work/app/package-lock.json" || bad=1
    grep -q '"database_name": "acme-app"' "$work/app/wrangler.jsonc" || bad=1
    grep -q '"database_name": "acme-app-staging"' "$work/app/wrangler.jsonc" || bad=1
    grep -q 'Acme App' "$work/app/src/routes/index.tsx" || bad=1
    grep -q 'Acme App' "$work/app/public/manifest.webmanifest" || bad=1
    grep -R -q -e '__APP_NAME__' -e '__APP_TITLE__' "$work/app" && bad=1
    sh "$create" --dest "$work/app" --name acme-app --title "Acme App" >/dev/null 2>&1 && bad=1
    sh "$create" --dest "$work/bad" --name 'Bad Name' --title "Nope" >/dev/null 2>&1 && bad=1
    sh "$create" </dev/null >/dev/null 2>&1 && bad=1
    if [ "$bad" = 0 ]; then
      echo "ok   create"
    else
      echo "fail create" >&2
      fail=$((fail + 1))
    fi
    rm -rf "$work"
  fi
  for script in "$mutations"/*.sh; do
    [ -f "$script" ] || continue
    name=$(basename "$script" .sh)
    selected "$name" || continue
    ran=$((ran + 1))
    check_one "$name" "$script"
  done
  if [ "$ran" = 0 ]; then
    echo "no mutation named $want" >&2
    exit 1
  fi
  [ "$fail" = 0 ]
  exit
fi

denies='Bash(grok plugin install*)
Bash(grok plugin marketplace*)
Bash(git push*)
Bash(curl*)
Bash(wget*)
Bash(npx wrangler deploy*)
Bash(wrangler deploy*)
Bash(npm run deploy*)'

for script in "$mutations"/*.sh; do
  [ -f "$script" ] || continue
  name=$(basename "$script" .sh)
  selected "$name" || continue
  ran=$((ran + 1))
  echo "=== $plugin/$name ==="
  if [ "$mode" = "print" ]; then
    printf 'grok plugin install %s --trust\n' "$plugin_dir"
    printf 'grok plugin enable %s\n' "$plugin"
    printf 'grok --cwd <copy of template/, mutation %s> --prompt-file %s --verbatim --always-approve --output-format json --max-turns 16 --no-subagents --disable-web-search' \
      "$name" "$prompt"
    printf '%s\n' "$denies" | while IFS= read -r deny; do
      printf " --deny '%s'" "$deny"
    done
    printf '\n'
    continue
  fi

  grok plugin install "$plugin_dir" --trust >/dev/null 2>&1 || {
    echo "FAIL $plugin/$name (plugin install)"
    fail=$((fail + 1))
    continue
  }
  grok plugin enable "$plugin" >/dev/null 2>&1 || {
    echo "FAIL $plugin/$name (plugin enable)"
    fail=$((fail + 1))
    continue
  }

  work=$(mktemp -d "${TMPDIR:-/tmp}/joules-web-app.XXXXXX")
  log="$here/logs/$name"
  rm -rf "$log"
  mkdir -p "$log"
  copy_app "$work/app"
  sh "$script" "$work/app"
  if sh "$check" "$work/app" >/dev/null; then
    echo "FAIL $plugin/$name (mutation did not break the check)"
    fail=$((fail + 1))
    rm -rf "$work"
    continue
  fi

  set -- \
    --cwd "$work/app" \
    --prompt-file "$prompt" \
    --verbatim \
    --always-approve \
    --output-format json \
    --max-turns 16 \
    --no-subagents \
    --disable-web-search
  while IFS= read -r deny; do
    [ -n "$deny" ] || continue
    set -- "$@" --deny "$deny"
  done <<'EOF'
Bash(grok plugin install*)
Bash(grok plugin marketplace*)
Bash(git push*)
Bash(curl*)
Bash(wget*)
Bash(npx wrangler deploy*)
Bash(wrangler deploy*)
Bash(npm run deploy*)
EOF
  if ! grok "$@" >"$log/grok-out.json" 2>"$log/grok-err.txt"
  then
    echo "FAIL $plugin/$name (grok exit)"
    tail -n 20 "$log/grok-err.txt" >&2
    echo "kept $work/app"
    echo "log $log"
    fail=$((fail + 1))
    continue
  fi

  if sh "$check" "$work/app"; then
    echo "ok   $name"
    rm -rf "$work"
  else
    echo "FAIL $plugin/$name (still failing the check)"
    echo "kept $work/app"
    echo "log $log"
    fail=$((fail + 1))
  fi
done

if [ "$ran" = 0 ]; then
  echo "no mutation named ${want:-"(none)"}" >&2
  exit 1
fi
[ "$fail" = 0 ]
