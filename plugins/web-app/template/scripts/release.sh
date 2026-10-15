#!/bin/sh
# Test, verify, screenshot, and deploy only a branch listed in deploy/branches.json.
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"

status=0
info=$(sh "$root/scripts/branch-env.sh") || status=$?
if [ "$status" = 3 ]; then
  echo "skip deploy"
  exit 0
fi
[ "$status" = 0 ] || exit "$status"
branch=$(printf '%s\n' "$info" | sed -n '1p')
environment=$(printf '%s\n' "$info" | sed -n '2p')
[ -n "$branch" ] && [ -n "$environment" ] || {
  echo "branch map returned nothing" >&2
  exit 2
}

version=$(sh "$root/scripts/version.sh")
sha=${version#*+}

if [ "${RELEASE_PLAN:-}" = 1 ]; then
  echo "plan branch=$branch environment=$environment version=$version"
  echo "npm test"
  # Vite reads CLOUDFLARE_ENV while building. wrangler deploy --env does not retarget that build.
  echo "CLOUDFLARE_ENV=$environment npm run build"
  echo "sh scripts/verify.sh --built"
  echo "sh scripts/screenshot.sh"
  echo "npx wrangler deploy --tag $sha --message $version --var APP_VERSION:$version"
  echo "sh scripts/notify.sh"
  exit 0
fi

npm test
# A second commit with the version would push this branch and run the workflow again.
CLOUDFLARE_ENV=$environment npm run build
sh "$root/scripts/verify.sh" --built
sh "$root/scripts/screenshot.sh"
npx wrangler deploy --tag "$sha" --message "$version" --var "APP_VERSION:$version"
app=$(node -p "require('./package.json').name")
APP_NAME=$app \
  BRANCH=$branch \
  ENVIRONMENT=$environment \
  APP_VERSION=$version \
  DEPLOY_RESULT=deployed \
  sh "$root/scripts/notify.sh"
