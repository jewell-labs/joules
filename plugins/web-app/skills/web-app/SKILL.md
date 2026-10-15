---
name: web-app
description: >
  Create a TanStack Start app on Cloudflare Workers from the web-app
  template, or make an existing app pass the web-app check. Use when the
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

When the user wants a new app, follow `commands/create.md` in the plugin root. That command runs `scripts/create.sh`, which copies `template/`.

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

## Approval

Deploy, push, spend, or create a live database only when the user asked. A protected branch and Workers Builds are account steps. Say so when they are not done. Do not treat a file as that account step.
