---
name: web-app
description: >
  Create a TanStack Start app on Cloudflare Workers from the web-app
  template, or make an existing app pass the web-app check. The template
  carries the release workflow for branches it lists. Use when the
  user wants a new app from that template, wants an app made 100% compliant,
  or runs /web-app.
when-to-use: >
  create a web app, copy the web-app template, make this app compliant,
  TanStack Start on Cloudflare Workers, /web-app
argument-hint: "[app directory]"
metadata:
  author: Joules
  short-description: Create an app from the template, or pass the check
---

# Web app

Do one of two jobs.

This plugin sits on `cloudflare`, `cloudflare-web-apps`, `wrangler`, and `stripe`. Product choice stays in `cloudflare`. TanStack Start and Solid wiring stay in `cloudflare-web-apps`. Wrangler commands stay in `wrangler`. Payments stay in `stripe`. When one of those skills is not installed, open the page that skill cites and follow it. Do not copy those steps into this plugin.

The plugin root is the directory that contains `skills/web-app/SKILL.md`.

## Create

When the user wants a new app, follow `commands/create.md` in the plugin root. That command runs `scripts/create.sh`, which copies `template/`. The copy includes `.github/workflows/release.yml`. That workflow is the extra step on top of `cloudflare`, `cloudflare-web-apps`, and `wrangler`. The scripts still run when those plugins are not installed.

## Check an existing app

Fix only the failures the check prints.

### Inputs

The app directory. When the user does not name one, use the current directory.

### Steps

1. From this skill file, the check is `../../tests/check.sh`.
2. Run `sh <plugin-root>/tests/check.sh <app>`.
3. Fix every failure line. Leave passing files alone. `template/` under the plugin root is one tree that passes. Use it as a shape reference. Do not replace the app with that tree.
4. Follow the official skill that owns the failure. Leave scaffold commands, package versions, and wrangler fields on the page you opened.
5. Run the check again. Stop when it prints `ok`.

### Return

Return the app path, the check output, and the files you changed.

## Release

The template's `README` and `.github/workflows/release.yml` are the release steps. `deploy/branches.json` maps a branch to a Wrangler environment. The workflow runs on every push and deploys only a listed branch. Do not copy Wrangler flags, action versions, or event lists out of that workflow into this skill. Follow the `wrangler` skill for the deploy command and the `cloudflare` skill for Workers Builds. Read the current pages, and do not copy them into this skill:

- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
- https://developers.cloudflare.com/workers/vite-plugin/reference/cloudflare-environments/

Run `scripts/release.sh` with `RELEASE_PLAN=1` to see the plan. Run it without that only when the user asked to deploy. Connecting the repository, creating each environment's live D1 database, and setting CI secrets are account steps. Say so when they are not done.

## Approval

Deploy, push, spend, or create a live database only when the user asked. A protected branch and Workers Builds are account steps. Say so when they are not done. Do not treat a file as that account step.
