#!/bin/sh
# Exit 0 when the app at $1 matches the web-app template. Print one line per failure.
set -u
root=${1:-}
if [ -z "$root" ] || [ ! -d "$root" ]; then
  echo "usage: check.sh <app>" >&2
  exit 2
fi
fail=0
say() {
  printf '%s\n' "$1" >&2
  fail=1
}
need() {
  [ -e "$root/$1" ] || say "missing $1"
}

need tsconfig.json
need .gitignore
need .dev.vars.example
need wrangler.jsonc
need package.json
need vite.config.ts
need src/router.tsx
need src/routeTree.gen.ts
need src/routes/__root.tsx
need src/routes/index.tsx
need src/server/db/schema.ts
need src/server/db/client.ts
need src/server/auth/policy.ts
need src/server/functions/health.ts
need public/sw.js
need public/offline.html
need public/manifest.webmanifest
need drizzle/0000_sessions.sql
need .github/workflows/release.yml
need deploy/branches.json
need scripts/verify.sh
need scripts/screenshot.sh
need scripts/release.sh
need scripts/branch-env.sh
need scripts/notify.sh
need scripts/version.sh
need tests/ready.test.ts

grep -q '"~/\*"' "$root/tsconfig.json" || say "tsconfig is missing the ~/* path alias"
for name in node_modules .output dist .dev.vars .env .wrangler screenshots; do
  grep -q "$name" "$root/.gitignore" || say "gitignore is missing $name"
done
grep -q 'solid-start/server-entry' "$root/wrangler.jsonc" || say "wrangler main is not the Solid Start server entry"
grep -q 'nodejs_compat' "$root/wrangler.jsonc" || say "wrangler is missing nodejs_compat"
grep -q 'observability' "$root/wrangler.jsonc" || say "wrangler observability is not enabled"
grep -q 'd1_databases' "$root/wrangler.jsonc" || say "wrangler is missing a D1 binding"
grep -q 'react-start' "$root/wrangler.jsonc" && say "wrangler points at the React server entry"
grep -q '@tanstack/solid-start' "$root/package.json" || say "package.json is missing Solid Start"
grep -q '"solid-js"' "$root/package.json" || say "package.json is missing solid-js"
grep -q '"version"' "$root/package.json" || say "package.json is missing a version"
grep -q '"test"' "$root/package.json" || say "package.json is missing the test script"
grep -q '^DEPLOY_WEBHOOK_URL=$' "$root/.dev.vars.example" || say ".dev.vars.example is missing DEPLOY_WEBHOOK_URL"
grep -q 'scripts/release.sh' "$root/.github/workflows/release.yml" || say "workflow does not run scripts/release.sh"
grep -q 'scripts/release.sh check' "$root/.github/workflows/release.yml" || say "workflow does not separate the check step"
grep -q 'scripts/release.sh deploy' "$root/.github/workflows/release.yml" || say "workflow does not separate the deploy step"
grep -q 'scripts/release.sh notify' "$root/.github/workflows/release.yml" || say "workflow does not separate the notify step"
grep -q 'persist-credentials: false' "$root/.github/workflows/release.yml" || say "checkout keeps credentials"
grep -q 'contents: read' "$root/.github/workflows/release.yml" || say "workflow permissions are not contents: read"
grep -q 'concurrency:' "$root/.github/workflows/release.yml" || say "workflow has no concurrency group"
grep -q 'skip deploy' "$root/.github/workflows/release.yml" || say "unlisted branch has no skip step"
grep -q 'environment: release' "$root/.github/workflows/release.yml" || say "deploy jobs do not reference the GitHub Environment"
[ "$(grep -c 'environment: release' "$root/.github/workflows/release.yml")" -eq 1 ] || say "release environment is not only on the deploy job"
grep -q 'name: worker-dist' "$root/.github/workflows/release.yml" || say "deploy job does not receive the worker build"
grep -q '.wrangler/deploy/config.json' "$root/.github/workflows/release.yml" || say "deploy job does not receive the Wrangler redirect"
grep -q '"deploy": "sh scripts/release.sh"' "$root/package.json" || say "npm run deploy skips the branch map"
grep -q 'branch not in data' "$root/scripts/branch-env.sh" || say "a listed branch with a bad environment can skip"
grep -q 'version##\*+' "$root/scripts/release.sh" || say "deploy tag does not use the last plus"
grep -q '"database_name": ".*-staging"' "$root/wrangler.jsonc" || say "staging reuses the production D1 name"
grep -q 'deploy/branches.json' "$root/scripts/branch-env.sh" || say "branch map is not read"
grep -q '"react"' "$root/package.json" && say "package.json depends on react"
grep -q 'solid-start' "$root/vite.config.ts" || say "vite config is missing the Solid Start plugin"
grep -q 'react-start' "$root/vite.config.ts" && say "vite config uses the React Start plugin"
grep -q 'manifest.webmanifest' "$root/src/routes/__root.tsx" || say "root route does not link the manifest"
grep -q 'serviceWorker.register' "$root/src/routes/index.tsx" || say "the app does not register the service worker"
grep -q 'passkey' "$root/src/server/auth/policy.ts" || say "auth policy is missing passkeys"
grep -q 'sk-live-\|AKIA[0-9A-Z]\{16\}\|BEGIN PRIVATE KEY' "$root/.dev.vars.example" && say ".dev.vars.example contains a secret"

if grep -R -n -E 'sk-live-|AKIA[0-9A-Z]{16}|BEGIN PRIVATE KEY' "$root/src" "$root/public" "$root/drizzle" >/dev/null 2>&1; then
  say "a secret is in the source"
fi
if grep -R -n -E "from ['\\\"]react['\\\"]|from ['\\\"]react-dom['\\\"]" "$root/src" >/dev/null 2>&1; then
  say "a file imports react"
fi
client_dirs=
for dir in src/routes src/components src/lib src/pwa; do
  [ -d "$root/$dir" ] && client_dirs="$client_dirs $root/$dir"
done
if [ -n "$client_dirs" ] && grep -R -n -E "from ['\"]~/server/(db|auth)|from ['\"].*server/(db|auth)|from ['\"]cloudflare:workers['\"]" $client_dirs >/dev/null 2>&1; then
  say "client code imports server-only code"
fi
if grep -R -n 'geolocation' "$root/src" >/dev/null 2>&1 && [ ! -f "$root/src/pwa/map-cache.ts" ]; then
  say "geolocation is used without src/pwa/map-cache.ts"
fi

[ "$fail" = 0 ] && echo ok
[ "$fail" = 0 ]
