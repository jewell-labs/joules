---
name: web-app
description: >
  Make one TanStack Start app on Cloudflare Workers pass the web-app check.
  Use when the user wants that app brought up to the compliant example, or
  asks to make an app 100% compliant, including /web-app.
when-to-use: >
  make this app compliant, TanStack Start on Cloudflare Workers, Solid UI,
  /web-app
argument-hint: "[app directory]"
metadata:
  author: Joules
  short-description: Make a web app pass the web-app check
---

# Web app

Bring one app up to the check that ships with this plugin. Fix only the failures it prints.

This plugin sits on `cloudflare`, `cloudflare-web-apps`, `wrangler`, and `stripe`. Product choice stays in `cloudflare`. TanStack Start and Solid wiring stay in `cloudflare-web-apps`. Wrangler commands stay in `wrangler`. Payments stay in `stripe`. When one of those skills is not installed, open the page that skill cites and follow it. Do not copy those steps into this plugin.

## Inputs

The app directory. When the user does not name one, use the current directory.

## Steps

1. The plugin root is the directory that contains `skills/web-app/SKILL.md`. From that file, the check is `../../tests/check.sh`.
2. Run `sh <plugin-root>/tests/check.sh <app>`.
3. Fix every failure line. Leave passing files alone. `examples/compliant` under the plugin root is one tree that passes. Use it as a shape reference. Do not replace the app with that tree.
4. Follow the official skill that owns the failure. Leave scaffold commands, package versions, and wrangler fields on the page you opened.
5. Run the check again. Stop when it prints `ok`.

## Return

Return the app path, the check output, and the files you changed.

## Approval

Deploy, push, spend, or create a live database only when the user asked. A protected branch and Workers Builds are account steps. Say so when they are not done. Do not treat a file as that account step.
