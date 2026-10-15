---
name: web-app
description: >
  Create a TanStack Start app on Cloudflare Workers from the web-app
  template. The copy carries the release workflow for branches it lists
  and one public HTTP healthcheck any external bot can call. Use when
  the user wants a new app from that template or runs /web-app.
when-to-use: >
  create a web app, copy the web-app template, TanStack Start on
  Cloudflare Workers, /web-app
argument-hint: "[app directory]"
metadata:
  author: Joules
  short-description: Create an app from the template
---

# Web app

Create a new app, or check an existing copy.

This plugin sits on `cloudflare`, `cloudflare-web-apps`, and `wrangler`. Product choice stays in `cloudflare`. TanStack Start and Solid wiring stay in `cloudflare-web-apps`. Wrangler commands stay in `wrangler`. This template does not add payments. When the user wants payments later, that stays in `stripe`. When one of those skills is not installed, open the page that skill cites and follow it. Do not copy those steps into this plugin.

The plugin root is the directory that contains `skills/web-app/SKILL.md`.

## Create

When the user wants a new app, follow `commands/create.md` in the plugin root. That command runs `scripts/create.sh`, which copies `template/`. The copy includes `.github/workflows/release.yml` and one MCP server on the worker. The workflow is the extra step on top of `cloudflare`, `cloudflare-web-apps`, and `wrangler`. The scripts still run when those plugins are not installed.

Ask these three questions, one per line, and then stop:

Where should the app go?
What is the package name?
What is the title?

Do not guess them, do not write the app, and do not run `scripts/create.sh` until the user has answered each one.

## Healthcheck

The copy serves one MCP server on the worker's public HTTP path. Any external bot can call its one healthcheck. A stdio server does not satisfy that. The tool reads no secret, session, or database. Do not add a second tool, a Durable Object, or a credential for it. The handler and the tool schema stay on the current page, not in this skill:

- https://developers.cloudflare.com/agents/model-context-protocol/apis/handler-api/

Follow `agents-sdk` and `cloudflare-mcp` when those skills are installed. When they are not, open that page and follow it.

## An existing app

The app directory is the one the user names, or the current directory. Run that app's `npm test` and `scripts/verify.sh`. Fix only the failures they print. Do not replace the app with `template/`. Leave scaffold commands, package versions, and wrangler fields on the page you opened.

## Release

The template's `README` and `.github/workflows/release.yml` are the release steps. `deploy/branches.json` maps a branch to a Wrangler environment. The workflow runs on every push and deploys only a listed branch. Do not copy Wrangler flags, action versions, or event lists out of that workflow into this skill. Follow the `wrangler` skill for the deploy command and the `cloudflare` skill for Workers Builds. Read the current pages, and do not copy them into this skill:

- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
- https://developers.cloudflare.com/workers/vite-plugin/reference/cloudflare-environments/

Run `scripts/release.sh` with `RELEASE_PLAN=1` to see the plan. Run it without that only when the user asked to deploy. Connecting the repository, creating each environment's live D1 database, and creating the GitHub Environment the template README names are account steps. The workflow file does not limit that environment's deployment branches. Say so when they are not done.

## Approval

Deploy, push, spend, or create a live database only when the user asked. A protected branch and Workers Builds are account steps. Say so when they are not done. Do not treat a file as that account step.
