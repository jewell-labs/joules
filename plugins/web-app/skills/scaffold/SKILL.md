---
name: scaffold
description: >
  Write a Void pages app on Cloudflare Workers from the current docs. The
  app releases the branches it lists and serves one public HTTP healthcheck.
  Use when the user wants a new web app, or runs /scaffold. The parent
  plugin is web-app.
when-to-use: >
  create a web app, Void pages on Cloudflare Workers, plan a web app, /scaffold
argument-hint: "[app directory]"
metadata:
  author: Joules
  short-description: Write a Void pages app
---

# Scaffold

The plugin `web-app` is the parent. This skill is the procedure. Commands `plan`, `create`, `validate`, and `evaluate` are the parts. Follow the part the user named.

The handoff between parts is the reply. A child session returns a summary. Do not write an answers file, a plan file, or a log.

Open the current Void docs before you write or score an app. Use https://void.cloud and the docs shipped inside the installed `void` package. When the `cloudflare`, `cloudflare-web-apps`, or `workers-best-practices` skills are installed, follow them for the Cloudflare part. Do not copy those skills into this plugin.

When the user wants TanStack routing, stop this procedure. Follow Void's TanStack guide and `cloudflare-web-apps`.

Deploy, push, or spend only when the user asked. A file in the tree is not a Cloudflare login.

## Plan

1. Run `--help` on the Void commands the docs you opened tell you to use. Do not invent a flag.
2. Map the user prompt onto those commands. Use a default the help text prints when the user did not override it.
3. An unknown is a required choice that is still empty, a companion the docs require for a value already chosen, or a phrase that fits two documented values. One companion set is one question. A printed default is not a question. A bare "create a web app" asks only required choices that have no default, one per turn.
4. When one unknown remains, ask it and stop.
5. When none remain, return the decisions Create will follow. Include the destination, the package name, the title, and each override of a printed default.

Do not write a file. Do not create the app.

## Create

Write the app from the plan reply and the docs you opened. This plugin has no template and no generator.

The app is its own Cloudflare Worker. Its worker name is its package name. Do not attach it to another project. Keep server secrets on the server, and do not import a server database or auth module into a client component. Include one public HTTP healthcheck and no OAuth, unless the user asked otherwise. Include a check per mapped branch that typechecks, tests, and builds, and that check does not deploy. A push workflow and Workers Builds must not both deploy the same branch. The repository is private unless the user asked for it to be public.

Solid is the interface when the user did not name another one the Void docs support. Record a passkey or phone-code policy only when the user chose that policy, and do not implement the ceremony. Use database sessions only when the user chose both a database and sessions. Enable Void auth only when the user chose it. Add an offline page when the user chose offline.

Do not install more than the docs require to build the app. Return the destination path.

## Validate

The directory is the path Create returned, or the directory the user named.

1. Run `npm test` in that directory.
2. For each branch the app maps, run the branch check Create included. Do not deploy.
3. Return pass or fail, and the check names. Pass means `npm test` and every branch check exited 0.

When the user did not name a directory to keep, and Evaluate does not still need the directory, delete it. When Evaluate called you, leave the directory until the README row is written.

## Evaluate

Read the Prompt cell in this plugin's `README.md`, between `<!-- eval-status:start -->` and `<!-- eval-status:end -->`.

1. Keep `{{dest}}` in the file. When the user did not name a directory, substitute a temporary directory for `{{dest}}` in the prompt you follow.
2. Follow Plan, then Create, then Validate.
3. Score that app with the Rubric section, from its source and from the validate return. Rewrite only the marker block. A row is its points or 0. Usage is `-` unless this turn's summary shows usage. Do not write a log.
4. Return the row you wrote.

When the user did not name a directory to keep, delete the destination after the row is written.

## Rubric

This scores the app the README prompt created. A row is its points or 0. Pass means every row is full. The maximum is 100.

Do not open an answers file or a session log. The README table is the record.

| Row | Points | Evidence |
| --- | --- | --- |
| Create | 20 | `package.json` name is `eval-app`. `void.config.ts` title is `Eval App`. No auth policy file, no `void/auth`, no `void/db` import, no `.joules-answers.json`. |
| Absent | 15 | Tree minus `node_modules` has no `stripe`, `Stripe`, `passkey`, or `phone-otp`. |
| Stack | 20 | Cloudflare target through `workerName`. No `account_id`, `wrangler.jsonc`, `src/server.ts`, or `@tanstack/solid-start`. A mention of that package only inside `package-lock.json` does not fail this row. |
| Health | 15 | One `healthcheck` tool at `/mcp`. No OAuth. |
| Release | 15 | Deploy job runs `npx void deploy --platform cloudflare`. Check job has no Cloudflare token or account id. `npm run deploy` prints that line and exits 2. `void.lock.json` is absent, or it only names the worker and a compatibility date. |
| Validated | 15 | Both branch checks from the validate return exited 0 and did not deploy. |
