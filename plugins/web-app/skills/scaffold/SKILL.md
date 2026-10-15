---
name: scaffold
description: >
  Write or extend a Void pages app on Cloudflare Workers from the current
  docs. The app persists each deploy so another computer can clone that
  version, deploys with Void, and serves one public HTTP healthcheck.
  Use when the user wants a new web app, a new page, a table, a stream,
  a feature, a page tool, a clone, a deploy, or a rewind, or runs /scaffold.
  The parent plugin is web-app.
when-to-use: >
  create a web app, extend a web app, add a page, add a table, add a stream,
  add a feature, WebMCP, screenshot, debug a page, one-off read, Void pages
  on Cloudflare Workers, plan a web app, clone a worker version, deploy,
  rewind, /scaffold
argument-hint: "[app directory]"
metadata:
  author: Joules
  short-description: Write or extend a Void pages app
---

# Scaffold

The plugin `web-app` is the parent. This skill is the procedure. Commands `plan`, `create`, `extend`, `validate`, `clone`, `deploy`, and `evaluate` are the parts. Follow the part the user named.

The handoff between parts is the reply. A child session returns a summary. Do not write an answers file, a plan file, or a log.

Every host that can read this repository follows this file. Do not fork the procedure. Credentials are environment variables. One-time browser steps are the public https links in Prepare. This plugin adds no MCP server. The app serves `/mcp` over https.

This procedure is on top of the official `cloudflare` plugin for Workers. Page tools follow WebMCP. Screenshots, console, network, and clicks follow the browser path in the repository Hosts section. The procedure still finishes from the Void docs and from HTTP checks when that browser is not installed. The official catalog has no plugin that writes a Void pages app.

Open the current docs before you write, extend, clone, deploy, rewind, or score an app. Use https://void.cloud and the docs shipped inside the installed `void` package, including deployment and the project commands. Start at https://void.cloud/reference/structure and the pages and database guides that page links. Read https://void.cloud/reference/api for streams. When the public docs and the package disagree, the package wins for files that must load. Use https://developers.cloudflare.com/workers/versions-and-deployments/ and https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/ for versions and rewind. When the `cloudflare`, `cloudflare-web-apps`, or `workers-best-practices` skills are installed, follow them for the Cloudflare part. Do not copy those skills into this plugin.

When the user wants TanStack routing, stop this procedure. Follow Void's TanStack guide and `cloudflare-web-apps`.

Deploy with the Void Cloudflare command the docs name. Do not run the Wrangler CLI, and do not add it as a dependency or a config file. Do not start a Void platform login.

A person must approve the one-time grants in Prepare, an auth ceremony, a payment, and a rewind. Deploy or spend only when the prompt asked. A file in the tree is not a Cloudflare login. Do not add a workflow file.

## Persistence

The app records where its source archives live. Write `persistence.json` at the app root before the first deploy. It has two fields. `name` is the package name plus `-versions`. `store` is a store the token can write. Open https://developers.cloudflare.com/kv/ and https://developers.cloudflare.com/r2/ and the limits page each links. A read that prints only status shows whether the token can write that store. One writable store is the default. More than one, when the prompt did not choose, is one question in Plan. When the chosen store refuses a write, stop and return https://dash.cloudflare.com/profile/api-tokens . Do not switch stores silently. Do not create a second resource for the same app.

The file, `.void/project.json`, and the archive contain no account id, subdomain, token, or email. Pin the account with `CLOUDFLARE_ACCOUNT_ID`.

Write `.void/project.json` as `{ "platform": "cloudflare" }` before `npx void project status` or `npx void project rollback`.

After each successful deploy, gzip the source and write it to that store. The key is `<worker name>/<version id>`. The version id is the one `npx void project status` prints for the deploy just made. Include the app source, tests, `package.json`, the lockfile, `void.config.ts`, `persistence.json`, and `.void/project.json`. Exclude `node_modules`, `dist`, `.env`, `void.lock.json`, and every other file under `.void`. Open the store's limits page before the write. When the gzip exceeds the value size that page lists, stop and say so.

The app gitignores `node_modules`, `dist`, `.env`, `.void`, `void.lock.json`, and `.void-wrangler.jsonc`.

## Prepare

Run this before Create spends on a new Worker, before Clone, and before Deploy. Skip it when the prompt says not to deploy or spend.

Both hosts read the same variable names from the environment. A secret stays in that host's own secret store. The client reads that secret itself. A shell error must not receive the secret as a program or an argument. Load it into the environment for the call, and do not print it. Neither host reads the other host's store. A missing grant stops the spend. Return that grant and its one link. Do not invent a Worker, a secret, or a persistence resource. Do not start a device-code login.

The non-secret ids you read stay in the host environment under the names the Void deploy page uses. Do not write an account id, a subdomain, a token, or an account email into this plugin or into the app source. The other host needs the same variables set by a person.

Check each grant with a read. Print status and counts. Do not print a token.

1. `CLOUDFLARE_API_TOKEN` is set. It is a user API token from https://dash.cloudflare.com/profile/api-tokens . Start from the Edit Cloudflare Workers template, then add the permission the chosen store's docs name. The template leaves account resources and zone resources unset. Set account resources to the one account that owns the Worker, and zone resources to all zones, before the token is created. Leave client IP filtering and TTL empty so another host can send the same token. An OAuth session from the Void CLI is not this token. When the variable is unset, load it from this host's secret store. Confirm the token with the verify call on https://developers.cloudflare.com/api/resources/user/subresources/tokens/methods/verify/ . That call returns the token id and a status. It does not return an account id. Read the account id from https://developers.cloudflare.com/api/resources/accounts/methods/list/ . When that list has one account, set `CLOUDFLARE_ACCOUNT_ID` to its id. When it has more than one, ask which account owns the Worker. Do not record the account name.
2. The account has a workers.dev subdomain. Read it from the subdomain endpoint on https://developers.cloudflare.com/workers/configuration/routing/workers-dev/ . When none exists, a person registers one. The first Worker deploy fails until it exists. When the Void deploy page says CI needs the subdomain, set `CLOUDFLARE_WORKERS_SUBDOMAIN`.
3. The persistence resource exists. Its name is the package name plus `-versions`, which is the `name` in `persistence.json` when that file exists. When it is missing and this run may spend, create it with the call the store's docs name. When that create fails, stop and return the link in step 1.

Return present or missing for each grant. Create, Clone, and Deploy may spend only when every grant the prompt needs is present.

## Plan

1. Run `--help` on the Void commands the docs you opened tell you to use. Do not invent a flag.
2. Map the user prompt onto those commands. Use a default the help text prints when the user did not override it.
3. An unknown is a required choice that is still empty, a companion the docs require for a value already chosen, a phrase that fits two documented values, or a new state that fits two existing destinations. One companion set is one question. A printed default is not a question. A prompt that says those states share one route is not a question. A bare "create a web app" asks only required choices that have no default, one per turn. A store is a question only when Persistence finds more than one the token can write and the prompt did not choose.
4. When one unknown remains, ask it and stop.
5. When none remain, return the decisions the next part will follow. Include the destination, the package name, the title, each destination, table, and stream the prompt names, and each override of a printed default. When the prompt asks for a Cloudflare project, include the store, the persistence name, and that the Worker is new and named as the package. When the prompt asks to clone, the next part is Clone. When the app already exists, the next part is Extend, or Deploy when the prompt asks to deploy. Otherwise it is Create.

Do not write a file. Do not create the app.

## Create

Write the app from the plan reply and the docs you opened. This plugin has no template and no generator.

When the decisions include a new Cloudflare project, run Prepare first. When a grant is missing, write nothing remotely. Return the missing grant and its link. Do not create a Worker or a persistence resource.

The app is its own Cloudflare Worker. Its worker name is its package name. Each environment the prompt names is its own worker and its own persistence name. Do not attach it to another project with a service binding, a route, or a dispatch namespace. Keep server secrets on the server, and do not import a server database or auth module into a client component. Include one public HTTP healthcheck and no OAuth, unless the user asked otherwise. That healthcheck is a tool at `/mcp`. When the prompt names no page read, it is the only tool.

Include a check that typechecks, tests, and builds. That check does not deploy. The app typecheck covers the app source. When the generated Void config makes that typecheck follow dependencies and fail on missing ambient types, skip that library check in the app config. A loader returns a concrete object for the props its page renders. The app's deploy script prints the Void Cloudflare deploy command the docs name and exits 2. It does not deploy.

Follow Persistence for `persistence.json`, `.void/project.json`, and the gitignore.

Solid is the interface when the user did not name another one the Void docs support. Record a passkey or phone-code policy only when the user chose that policy, and do not implement the ceremony. Use database sessions only when the user chose both a database and sessions. Enable Void auth only when the user chose it. Add an offline page when the user chose offline.

When the prompt names a destination, a table, or a stream, add it in this same turn by the Extend section. Register the page tools in this same turn by the Page tools section. Extend does not deploy.

Do not install more than the docs require to build the app.

When the decisions include a new Cloudflare project, and Prepare found every grant, follow Deploy. Return the destination path, the worker URL, and the version id. The return names no secrets.

When the decisions do not include a Worker, return the destination path only.

When the user wants to open the app in a browser, follow Preview. Do not deploy to do that.

## Clone

Use this to put one worker version on this computer. The inputs are the worker name, a version id, and a destination. `live` means the version receiving traffic. When no copy of the app is on this computer yet, read that version from the versions docs you opened. When the app is already here, `npx void project status` marks it `live`.

1. Run Prepare. When a grant is missing, write nothing. Return the missing grant and its link.
2. Read the archive Persistence describes for the key `<worker name>/<version id>`. Unpack it into the destination. The destination must not already contain an app.
3. Write `.void/project.json` as Persistence describes. Install dependencies from the lockfile.
4. Return the destination path and the version id. Do not deploy.

## Deploy

Use this when the prompt asks to deploy, and when Create includes a new Worker.

1. Run Prepare. When a grant is missing, do not deploy. Return the missing grant and its link.
2. Run `npm test` and the check. Do not deploy when either fails.
3. Deploy by running the Void Cloudflare command the docs you opened name. Do not deploy by running the deploy script.
4. Write the archive Persistence describes for the new version id.
5. Return the worker URL and the version id. When the archive write failed, include that the archive is missing. The return names no secrets.

## Rewind

Use this when the user asks to send traffic back to an older version. A person approves it. It moves traffic on that one worker.

1. Run Prepare. When a grant is missing, do not rewind. Return the missing grant and its link.
2. Write `.void/project.json` when it is missing, as Persistence describes.
3. Run `npx void project rollback` with the version id the project docs require.
4. Return the version id now receiving traffic. Leave every archive in place. Do not deploy.

Editing that older version is Clone, then changes, then Deploy. Deploy publishes a new version.

## Preview

Use this when someone needs to open the app in a browser. Do not deploy.

1. Start the app's dev server so it answers on localhost.
2. Follow https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/ . Install `cloudflared` from that page when the command is missing. Run the quick tunnel command that page shows, `cloudflared tunnel --url`, against the localhost URL.
3. Return the `https://*.trycloudflare.com` URL it prints. A browser on this machine and a browser on another machine both open that URL. localhost is only for a browser on the machine that runs the server.
4. The URL works while that process is running. It is not the Worker URL. A quick tunnel does not carry Server-Sent Events. Stop the server and the tunnel when the preview is finished, unless the user asked to keep them.

## Extend

Use this when the app already exists, and when Create's prompt names a destination, a table, or a stream.

The inputs are the plan reply, or the user prompt when it names an existing directory, plus the docs you opened.

1. Read the app's pages, schema, and streams. Match the conventions already in the tree.
2. A destination is one page file plus its server companion, in the pages directory https://void.cloud/reference/structure documents. A state of that destination stays in the component. Loaders and actions follow https://void.cloud/guide/pages-routing/loaders.
3. A table is one file in the schema directory that structure page documents, re-exported from the schema entry it names. Validators come from the package https://void.cloud/guide/database names. Create adds a database directory only when the prompt names a table. Extend leaves a database the app already has.
4. A stream is one live stream, as https://void.cloud/reference/api documents it. The page that changes the record publishes from its action. The page that shows the record subscribes. A value the prompt computes on the client is not a stream. Create adds a live-stream module only when the prompt names a stream. Extend leaves a stream the app already has.
5. A feature is the destinations, tables, and streams one prompt names. Add that set with steps 2 to 4. Do not add a feature directory, a second framework, a router package, an account id, or a second deploy path.
6. Register the page tools by the Page tools section.
7. Keep the healthcheck, the release checks, and every page the app already had, unless the prompt says to remove one.
8. Check with Validate. Do not deploy.
9. Return the paths you added, and any destination, table, or stream the prompt named that is still missing.

## Page tools

Use this for every page Create or Extend writes when the prompt names a page read. The inputs are those pages and the loader each page already has.

Open https://webmachinelearning.github.io/webmcp and https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md before registering a tool. Chrome's imperative guide is https://developer.chrome.com/docs/ai/webmcp/imperative-api. The spec wins when a guide disagrees.

1. Each destination registers one read tool on the document, the way the spec registers a tool. The tool returns that page's loader props. A mutation the prompt names calls that page's action. The browser does not open its own database path.
2. When the document has no model context, follow https://docs.mcp-b.ai/how-to/choose-runtime.md and load the polyfill that page names. The same tools then run in Chrome, Safari, and the browser inside an iOS or Android simulator. The spec wins when the polyfill disagrees.
3. Serve that same read at `/mcp`, beside the healthcheck, so a one-off client can call it without the page open. No OAuth unless the prompt asked.
4. A stream the prompt names is the feed a dashboard subscribes to. The read tool is the latest snapshot of that same feed.
5. Screenshots, console, network, clicks, and the device frame follow the browser path in the repository Hosts section. Drive a simulator with the host tool already installed. The app does not depend on Playwright, Puppeteer, or Selenium.
6. A tool result has no secret, token, cookie, or session. Mark a read the way the spec's annotations mark a read. Share a tool with another origin only when the prompt names that origin.

Return the tool names and the `/mcp` path.

## Validate

The directory is the path Create, Extend, or Clone returned, or the directory the user named.

1. Run `npm test` in that directory.
2. Run the check Create included. Do not deploy.
3. Return pass or fail, and the check names. Pass means `npm test` and the check exited 0.

When the user did not name a directory to keep, and Evaluate does not still need the directory, delete it. When Evaluate called you, leave the directory until the README row is written.

## Evaluate

Read the Prompt cells in this plugin's `README.md`, between `<!-- eval-status:start -->` and `<!-- eval-status:end -->`.

Score the row the user named. When they did not name one, score the first row whose Result cell is empty. One prompt per run. Do not reuse a directory from another row.

1. Keep `{{dest}}` in the file. When the user did not name a directory, substitute a temporary directory for `{{dest}}` in the prompt you follow.
2. Follow Plan, then Create. Create follows Extend for every destination, table, and stream that prompt names. Create follows Prepare and Deploy when that prompt asks for a Worker.
3. When Prepare returns a missing grant, do not write a score. Leave that row empty. Return the missing grant and its link. Leave the directory.
4. Otherwise follow Validate, then score that app with the Rubric section. A prompt that asks for a Worker is scored from the live worker URL, the live `/mcp` call, the version id from `npx void project status`, and a read of the archive for that version. A prompt that says not to deploy is scored from the source and from the validate return. Rewrite only that row inside the marker block. A row is its points or 0. A rubric row whose capability the prompt does not ask for is full when the app omits that capability too. Usage is `-` unless this turn's summary shows usage. The row names the worker URL and the version id only when this run created them, and it contains no secrets. Do not write a log.
5. Return the row you wrote.

When the user did not name a directory to keep, delete the destination after the row is written. When the row is not written, leave the directory.

## Rubric

This scores the app the chosen README prompt created. A row is its points or 0. A row for a destination, table, stream, page read, or layout rule the prompt does not ask for is full when the app omits it too. Pass means every row is full. The maximum is 100.

Do not open an answers file or a session log. The README table is the record. Score only from a file you opened or a command you ran.

| Row | Points | Evidence |
| --- | --- | --- |
| Create | 10 | `package.json` name is `eval-app`. `void.config.ts` title is the title in that prompt. No auth policy file, no `void/auth`, and no `void/db` import unless the prompt asked for a database or auth. No `.joules-answers.json`. |
| Absent | 10 | Tree minus `node_modules` has no `stripe`, `Stripe`, `passkey`, or `phone-otp` unless that prompt names one, and has no workflow file. |
| Stack | 10 | The Worker name is the package name. Nothing attaches this Worker to another project. No account id is committed. No `src/server.ts` and no `@tanstack/solid-start`. A mention of that package only inside `package-lock.json` does not fail this row. A generated Cloudflare file the Void docs say to gitignore does not fail this row when it is gitignored. |
| Pages | 15 | Every destination the prompt names is one page plus a server companion. Every state the prompt names is rendered by that page and is not its own route. The offline page exists when the prompt keeps it. |
| Data | 10 | Every table the prompt names is one schema file re-exported from the schema entry. The named loader reads that table. No table in the prompt means no `db` directory. |
| Streams | 10 | Every stream the prompt names has the publisher action and the subscribing page that prompt names. No stream in the prompt means no live-stream module. |
| Health | 5 | A `healthcheck` tool at `/mcp`. No OAuth. When the prompt asked for a Worker, a live call to the deployed `/mcp` returns that tool and any page read the prompt named, and no other tool. |
| Release | 10 | When the prompt asks for a Worker: the worker URL answers. `npx void project status` lists the deployed version. The archive for that version unpacks to this app and contains no account id. The tree has no workflow file. When the prompt says not to deploy: `npm run deploy` prints `npx void deploy --platform cloudflare` and exits 2. The check has no Cloudflare token or account id. A gitignored `void.lock.json` does not fail this row. A committed copy fails when it contains an account id. |
| Tools | 5 | No Playwright, Puppeteer, or Selenium dependency. When the prompt names a page read, each such page registers one read tool the way the current WebMCP spec says, and that same read is a tool at `/mcp`. |
| Design | 5 | Each layout rule in the prompt is visible in the page source. A waiting state the prompt names is not styled as a failure. An unavailable state the prompt names does not invent values. A prompt with no layout rule is full when Pages is full. |
| Validated | 10 | `npm test` and the check exited 0 and did not deploy. |
