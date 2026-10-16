---
name: scaffold
description: >
  Write or extend a Void pages app on Cloudflare Workers from the current
  docs. The app deploys with Void and serves one public HTTP healthcheck.
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

The handoff between parts is the reply. A child session returns a summary. Do not write an answers file, a plan file, or a log. Every return names what this part did, the next part, and the command that part runs. A stop names why it stopped and the one action that unblocks it.

Every host that can read this repository follows this file. Do not fork the procedure. The Cloudflare credential is the browser session in Prepare. One-time browser steps are the public https links that login prints. This plugin adds no MCP server. The app serves `/mcp` over https.

This procedure is on top of the official `cloudflare` plugin for Workers. Page tools follow WebMCP. Screenshots, console, network, and clicks follow the browser path in the repository Hosts section. The procedure still finishes from the Void docs and from HTTP checks when that browser is not installed. The official catalog has no plugin that writes a Void pages app.

Open the current docs before you write, extend, clone, deploy, rewind, or score an app. When this part tells you to stop before that work, stop. Do not open a page and do not run a command. Use https://void.cloud and the docs in the installed `void` package, including deployment and the project commands. When the app depends on `void`, the package is `node_modules/void`. Otherwise the package is the global install in the Commands section of the joules-plugins skill `author`. Open the file `skills/void/SKILL.md` names for this step. Do not search the package. Start at https://void.cloud/reference/structure and the pages and database guides that page links. Read https://void.cloud/reference/api for streams. When the public docs and the package disagree, the package wins for files that must load. Use https://developers.cloudflare.com/workers/versions-and-deployments/ and https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/ for versions and rewind. When the `cloudflare`, `cloudflare-web-apps`, or `workers-best-practices` skills are installed, follow them for the Cloudflare part. Do not copy those skills into this plugin.

Node package commands follow the Commands section of the joules-plugins skill `author`. Run the global `void`. Inside the app, `pnpm exec void`. A repeated app command is `pnpm run <name>`.

When the user wants TanStack routing, stop this procedure. Follow Void's TanStack guide and `cloudflare-web-apps`.

## Language server

The plugin file `.lsp.json` is the TypeScript server in the LSP section of the guide shipped with `grok`: `typescript-language-server` for `.ts` and `.tsx`. The official catalog has no language-server plugin for this app. This plugin does not download the binary. When it is missing from `PATH`, install it as a global package by the Commands section of the joules-plugins skill `author`. The guide's install example uses `npm`. This procedure uses `pnpm add -g` for that same package and for the `typescript` package the server needs.

Create and Extend ask the host `lsp` tool for `hover` or `goToDefinition` on a TypeScript symbol before opening a file under `node_modules`. The tool reads the package installed in the workspace, so the answer tracks that version. Do not write a language-server client, and do not hardcode a store path. When the tool is off, stop and enable `lsp_tools` the way that chapter describes. A guide, a `--help` page, and a Prepare read stay on the page or command this skill names.

Passive diagnostics run after `search_replace` when the server starts. They do not replace Validate.

Deploy with the Void Cloudflare command the docs name. Do not run the Wrangler CLI, and do not add it as a dependency or a config file. The Void platform session is a Prepare grant.

A person must approve the one-time grants in Prepare, an auth ceremony, a payment, and a rewind. Deploy or spend only when the prompt asked. A file in the tree is not a Cloudflare login. Do not add a workflow file.

## Persistence

Void keeps the deployment on the Worker. A Cloudflare deploy records resource ids in `void.lock.json`, and `void connect` or `void deploy` writes `.void/project.json`. Commit `void.lock.json`. The Cloudflare integration and deployment pages in the installed package, and https://void.cloud/integrations/cloudflare , do not describe a source archive. Do not write `persistence.json`. Do not create a resource named for versions. Do not gzip the source into KV or R2.

Do not hand-write `.void/project.json`. `pnpm exec void project status` is the version read, and it needs the Void platform session from Prepare.

The app gitignores `node_modules`, `dist`, `.env`, `.void`, and `.void-wrangler.jsonc`. Do not gitignore `void.lock.json`. Do not hand-write an account id, a subdomain, an email, or a token into the app source.

## Prepare

Run this before Create spends on a new Worker, before Clone, and before Deploy. Skip it when the prompt says not to deploy or spend.

A computer that can open a browser uses the Cloudflare session from `void cloudflare login`. Run `void cloudflare login --help` and `void cloudflare status --help` before you add a flag. The public page is https://void.cloud/integrations/cloudflare . From that package, open `docs/integrations/cloudflare.md` and the Cloudflare authentication heading in `docs/reference/cli/auth.md`. `skills/void/SKILL.md` names those files. The command opens a browser, or prints a link and a code. The person confirms that code. The session stays in the store that CLI chooses. Do not copy it, print it, or read it out of the keychain. Another computer, including a Grok Bot, runs the same command, and the person confirms on that computer.

The same Prepare checks the Void platform session. `void account whoami` is the read. When it says to log in, the platform host is the URL the user named. Run `void connect <url>`, then `void account login`. Read `void connect --help` and `void account login --help` first. The package skill says not to infer a host. Do not run `void account token`. Do not print the session.

Do not set an API token, an API key, or an email. That includes a GitHub Actions secret. Unset any of those that are already set before login and before every command that must use the session. A set variable hides the session and the login command refuses. Do not print a credential.

Check the session with `void cloudflare status`. It prints the user and the accounts. When it lists one account, leave `CLOUDFLARE_ACCOUNT_ID` unset. The deploy page requires that variable when the credential can access more than one account. When status lists more than one, ask which account owns the Worker, then set `CLOUDFLARE_ACCOUNT_ID` in the environment only. A deployment account that status has not selected is chosen by a later connect or deploy. Do not write an account id, a subdomain, an email, or a token into this plugin or into the app source.

A missing session stops the spend. Name which session is missing. For Cloudflare, return `void cloudflare login` and the link that command prints. For the platform, return `void connect <url>` and `void account login`, and ask for the URL when the user has not named one. Do not invent a Worker, a secret, a host, or a resource. The next part waits until that session is present.

Check each remaining grant with a read that creates nothing. Print the status the command prints, the error code in the body, and counts. Do not print a credential or a catalog.

1. The Cloudflare browser session is present. `void cloudflare status` is the read.
2. The Void platform session is present. `void account whoami` is the read. A missing host is the question. Do not infer one.
3. The account has a workers.dev subdomain. The account read is the GET documented at https://developers.cloudflare.com/api/resources/workers/subresources/subdomains/methods/get/ . The workers.dev guide at https://developers.cloudflare.com/workers/configuration/routing/workers-dev/ describes the hostname and does not name that endpoint. Run `cf workers --help` from the `cf` binary shipped in the installed Void package, and use a command that help lists. That help has no command for the GET. When `cf workers list` shows a workers.dev URL, that hostname's subdomain is this grant. When the list shows none, return missing and that API page. Do not create a Worker to learn the subdomain, and do not register one. A 404, or an empty subdomain, means a person opens the Workers dashboard once. When the Void deploy page says that run needs the subdomain, set `CLOUDFLARE_WORKERS_SUBDOMAIN` in the environment only. A local deploy caches it. Do not write it into source.
4. Each product the prompt names is available on this account. Open that product's current pricing or getting-started page and the Void guide for it. Examples are https://developers.cloudflare.com/workers/platform/pricing/ , https://void.cloud/guide/sandboxes#requirements , and https://developers.cloudflare.com/r2/get-started/ . The list command is the leaf command that `cf` help in the installed Void package names, with the token and key variables unset. A group command without its leaf prints the root help. Classify the failure from the response body. A trailing hint from `cf` is not the classification when it disagrees with the body. A free allowance counts as available. An empty list counts as available. Cron Triggers are included with Workers. ISR is Void revalidation, provisioned on deploy. Neither is its own list. When the body says the plan or an entitlement does not include the product, return unavailable and the link that body or that page gives. When the body says the session lacks a permission, return missing and the person runs `void cloudflare login` again. A missing permission is not a missing plan. Do not send the person to create an API token. Learn this from the read. Do not learn it by deploying.

Return present, missing, or unavailable for the Cloudflare session, the Void platform session, the subdomain, and each named product. Name the next command for every missing or unavailable grant. Create, Clone, and Deploy may spend only when every grant the prompt needs is present and no named product is still unavailable.

## Plan

When the prompt names the package, the title, and the interface, and it does not leave a choice empty, those are the decisions. Do not open a web page. Do not run a command. Return the decisions and stop.

1. Run `--help` on the Void commands this prompt still needs. Do not invent a flag. Skip this step when the paragraph above already returned.
2. Map the user prompt onto those commands. Use a default the help text prints when the user did not override it.
3. An unknown is a required choice that is still empty, a companion the docs require for a value already chosen, a phrase that fits two documented values, a new state that fits two existing destinations, or a product Prepare returned as unavailable. One companion set is one question. The unavailable-product question is: still use it? Keeping it requires the link Prepare returned, then Prepare again. Dropping it removes that product from the decisions. A printed default is not a question. A prompt that says those states share one route is not a question. A bare "create a web app" asks only required choices that have no default, one per turn.
4. When one unknown remains, ask it and stop.
5. When none remain, return the decisions the next part will follow. Include the destination, the package name, the title, each destination, table, and stream the prompt names, and each override of a printed default. When the prompt asks for a Cloudflare project, the Worker is new and named as the package. Persistence is what that deploy records. When the prompt asks to clone, the next part is Clone. When the app already exists, the next part is Extend, or Deploy when the prompt asks to deploy. Otherwise it is Create.

Do not write a file. Do not create the app.

## Create

When the prompt forbids a wizard, do not run `void init`. Its `--help` has no flag for the toolchain, the interface, or the starter. Return that as the one question, write nothing, and stop.

When the prompt allows the wizard, run `void init --no-git` unless it asked for a git repository. That help has no flag for the toolchain, the interface, or the starter, so answer those prompts. Vite+ unless the prompt names Vite. Solid unless it names another interface. Static Pages unless it names D1, PostgreSQL, or MySQL. Skip deployment setup when the prompt says not to deploy. Leave the files that command writes.

Three edits have no Void command. Make only these. Do not rewrite the rest of a generated file.

1. Set `name` in `package.json` to the package name in the plan reply. Set `head.title` in `void.config.ts` to the title in that reply. The field is the `head` section of https://void.cloud/reference/config . When the prompt asks for a Cloudflare project, set `cloudflare.name` to that package name in the same file.
2. Write `routes/mcp.ts`. Export `GET` from `defineHandler` in `void`, as https://void.cloud/reference/api/handlers documents. With no page read, the only tool is `healthcheck`, marked read-only, and the handler returns that tool. No OAuth.
3. The `deploy` script in the next paragraph.

A file a Void command writes is produced by that command. Read its `--help`, then pass the arguments that help prints. Leave the file as the command wrote it. Any other piece no command writes stops this step as the one question. A TypeScript symbol is the Language server section. When a page is part of the app, its loader returns a concrete object for the props that page renders. Loaders follow https://void.cloud/guide/pages-routing/loaders.

When the decisions include a new Cloudflare project, run Prepare first. When a grant is missing, write nothing remotely. Return the missing grant and its link. Do not create a Worker.

The app is its own Cloudflare Worker. Its worker name is its package name. Each environment the prompt names is its own worker. Do not attach it to another project with a service binding, a route, or a dispatch namespace. Keep server secrets on the server, and do not import a server database or auth module into a client component. Include one public HTTP healthcheck and no OAuth, unless the user asked otherwise. That healthcheck is a tool at `/mcp`. When the prompt names no page read, it is the only tool.

Install dependencies with `pnpm install` and run `pnpm exec void prepare` before the build. Put the repeated commands in `scripts`. `dev`, `build`, and `preview` run `vp`. The build is `pnpm run build` and it does not deploy. When the prompt forbids a test script and a check script, do not add either. When the prompt asks for tests, add a test script and a check that typechecks, tests, and builds. That check does not deploy. The app typecheck covers the app source. When the generated Void config makes that typecheck follow dependencies and fail on missing ambient types, skip that library check in the app config. The `deploy` script does not deploy. It prints that it stopped, the next part is Deploy, and the command is `pnpm exec void deploy --platform cloudflare`, then exits 2. Run it with `pnpm run deploy`. Deploy runs only when the prompt or the user says to deploy, and only after Prepare.

Follow Persistence.

Solid is the interface when the user did not name another one the Void docs support. Record a passkey or phone-code policy only when the user chose that policy, and do not implement the ceremony. Use database sessions only when the user chose both a database and sessions. Enable Void auth only when the user chose it. Add an offline page when the user chose offline.

When the prompt names a destination, a table, or a stream, follow the Extend section in this same turn. When the prompt names a page read, follow the Page tools section in this same turn. Extend does not deploy.

Do not install more than the docs require to build the app.

Do not follow Deploy in this turn. Return the destination path, that Validate is next, and that Deploy waits until the prompt or the user says to deploy. The return names no secrets and no worker URL.

When the user wants to open the app in a browser, follow Preview. Do not deploy to do that.

## Clone

Use this to put one worker version on this computer. The inputs are the worker name, a version id, and a destination. `live` means the version receiving traffic. When no copy of the app is on this computer, stop at step 1. The next step is the git checkout the user names. When the app is already here, `pnpm exec void project status` marks it `live`.

1. When the prompt says not to deploy or spend, and no copy of the app is on this computer, stop. Do not run Prepare. The next step is the git checkout the user names.
2. Run Prepare. When a grant is missing, write nothing. Return the missing grant and its link.
3. This procedure does not keep a source archive. When no copy of the app is on this computer, stop. The next step is the git checkout the user names. The destination must not already contain an app.
4. Do not hand-write `.void/project.json`. Persistence says `void connect` or `void deploy` writes it. Install dependencies with `pnpm install` and run `pnpm exec void prepare`. When `pnpm exec void project status` needs that file and it is missing, stop. The next command is `void connect` with the host the user named. Do not deploy to create the file.
5. Return the destination path and the version id. Do not deploy.

## Deploy

Use this when the prompt asks to deploy. Create does not enter this section. Continue here after Validate, when the prompt or the user says to deploy.

1. When the prompt does not name the platform URL, stop. Ask for that URL. Do not run `void deploy`. The next commands are `void connect <url>` and `void account login`.
2. Run Prepare. When a grant is missing, or a named product is unavailable and Plan has no answer for it, do not deploy. Return that grant or product and its link.
3. Run the check in Validate. Do not deploy when it fails.
4. Deploy by running `pnpm exec void deploy --platform cloudflare` in the app. Do not combine `--project`. Do not deploy by running the deploy script.
5. Follow Persistence for the lockfile that command writes.
6. Read the worker URL the command prints, and read `/mcp`. `pnpm exec void project status` is the version id. Return the URL and that id. The return names no secrets.

## Rewind

Use this when the user asks to send traffic back to an older version. A person approves it. It moves traffic on that one worker.

1. Run Prepare. When a grant is missing, do not rewind. Return the missing grant and its link.
2. When `.void/project.json` is missing, stop. Do not hand-write it. The next command is `void connect` with the host the user named. Persistence says that command writes the file. Do not deploy to create it.
3. Run `pnpm exec void project rollback` with the version id the project docs require.
4. Return the version id now receiving traffic. Do not deploy.

Editing that older version is Clone, then changes, then Deploy. Deploy publishes a new version.

## Preview

Use this when someone needs to open the app in a browser. Do not deploy.

1. Start the app's dev server with `pnpm run dev` so it answers on localhost.
2. Follow https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/ . Install `cloudflared` from that page when the command is missing. Run the quick tunnel command that page shows, `cloudflared tunnel --url`, against the localhost URL.
3. Return the `https://*.trycloudflare.com` URL it prints. A browser on this machine and a browser on another machine both open that URL. localhost is only for a browser on the machine that runs the server.
4. The URL works while that process is running. It is not the Worker URL. A quick tunnel does not carry Server-Sent Events. Stop the server and the tunnel when the preview is finished, unless the user asked to keep them.

## Extend

Use this when the app already exists, and when Create's prompt names a destination, a table, or a stream. When the directory is not an app yet, stop. Do not run Create. The next part is Create.

The inputs are the plan reply, or the user prompt when it names an existing directory, plus the docs you opened. Run the Void command that writes each file, as Create describes. The generator page in the installed package is `docs/reference/cli/generate.md`.

1. Read the app's pages, schema, and streams. Match the conventions already in the tree.
2. A destination is one page file plus its server companion, in the pages directory https://void.cloud/reference/structure documents. A state of that destination stays in the component. Loaders and actions follow https://void.cloud/guide/pages-routing/loaders. Run `pnpm exec void gen --help`. When that help lists a command that writes the page, run it and leave the file as the command wrote it. When it lists none, that page is the one question in Create.
3. A table is the schema `pnpm exec void gen model` writes, then the migration `pnpm exec void db generate` writes. Read each `--help` first. Leave the files as the commands wrote them. `void gen model` writes `routes/api/`, not `pages/`. Validators come from the package https://void.cloud/guide/database names. Create adds a database directory only when the prompt names a table. Extend leaves a database the app already has.
4. A stream is one live stream, as https://void.cloud/reference/api documents it. Run `pnpm exec void gen --help`. When that help lists a command that writes the stream, run it and leave the file as the command wrote it. When it lists none, that stream is the one question in Create. The page that changes the record publishes from its action. The page that shows the record subscribes. A value the prompt computes on the client is not a stream. Extend leaves a stream the app already has.
5. A feature is the destinations, tables, and streams one prompt names. Follow steps 2 to 4 for that set. Do not add a feature directory, a second framework, a router package, an account id, or a second deploy path.
6. Register the page tools by the Page tools section.
7. Keep the healthcheck and every page the app already had, unless the prompt says to remove one.
8. Check with Validate. Do not deploy.
9. Return the paths you added, and any destination, table, or stream the prompt named that is still missing.

## Page tools

Use this for every page Create or Extend writes when the prompt names a page read. The inputs are those pages and the loader each page already has.

Open https://webmachinelearning.github.io/webmcp and https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md before registering a tool. Chrome's imperative guide is https://developer.chrome.com/docs/ai/webmcp/imperative-api. The spec wins when a guide disagrees.

1. Each destination registers one read tool on the document, the way the spec registers a tool. The tool returns that page's loader props. A mutation the prompt names calls that page's action. The browser does not open its own database path.
2. When the document has no model context, follow https://docs.mcp-b.ai/how-to/choose-runtime.md and load the polyfill that page names. The same tools then run in Chrome, Safari, and the browser inside an iOS or Android simulator. The spec wins when the polyfill disagrees.
3. Serve that same read at `/mcp`, beside the healthcheck, so a one-off client can call it without the page open. No OAuth unless the prompt asked. Do not edit a route a Void command wrote. When that route is the healthcheck, registering the page read beside it is the one question in Create. When the app sets `routing.revalidate`, list every query parameter that read uses in `routing.revalidateQueryAllowlist`. A mutation calls `revalidate` from `void/isr` for each path it changes. The page is https://void.cloud/guide/edge/revalidation .
4. A stream the prompt names is the feed a dashboard subscribes to. The read tool is the latest snapshot of that same feed.
5. Screenshots, console, network, clicks, and the device frame follow the browser path in the repository Hosts section. Drive a simulator with the host tool already installed. The app does not depend on Playwright, Puppeteer, or Selenium.
6. A tool result has no secret, token, cookie, or session. Mark a read the way the spec's annotations mark a read. Share a tool with another origin only when the prompt names that origin.

Return the tool names and the `/mcp` path.

## Validate

The directory is the path Create, Extend, or Clone returned, or the directory the user named. An app has a `package.json`. When that file is absent, return fail and that path. Do not run a command. Do not create the directory. Do not deploy.

1. Run the build Create names, `pnpm run build`, in that directory. Do not deploy.
2. When the prompt asked for tests and `package.json` has a `test` script, run `pnpm run test`.
3. Return pass or fail, and the check names. Pass means every command in this section exited 0. Name the next part: Deploy when the prompt or the user asked to deploy, otherwise stop and name the command that would deploy.

When the user did not name a directory to keep, and Evaluate does not still need the directory, delete it. When Evaluate called you, leave the directory until the README row is written.

## Evaluate

The table shape and the publish loop are the Records section of the joules-plugins skill `author`. This section is the app evidence. Write When, Result, the rubric points, and Usage on that one row. Write Version and URL only when this run created them. Leave Id, Prompt, Rows, and Expect unchanged. On each roadmap id in Rows, drop this run's old token and add `<run id>: pass` when Result equals Expect, or `<run id>: fail` when it does not. Leave every other roadmap cell, including `out of scope`, unchanged. When `author` is not in the checkout, the headers in this plugin's README are the record and this paragraph is the write rule. Publishing the plugin version is that Release section. This section does not tag.

Read the Prompt cells in this plugin's `README.md`, between `<!-- eval-status:start -->` and `<!-- eval-status:end -->`.

Score the row the user named. When they did not name one, score the first row whose Result cell is empty. One prompt per run. Do not reuse a directory from another row. When the prompt says not to write the row and not to follow it, name the run record and stop. Do not open a page and do not run a command.

1. Keep `{{dest}}` in the file. When the user did not name a directory, substitute a temporary directory for `{{dest}}` in the prompt you follow.
2. Follow Plan, then Create. Create follows Extend for every destination, table, and stream that prompt names. Create follows Prepare and Deploy when that prompt asks for a Worker. When the prompt says to clone that version, follow Clone into a second temporary directory and do not deploy the clone.
3. When Prepare returns a missing grant, do not write a score. Leave that row empty. Return the missing grant and its link. Leave the directory.
4. Otherwise follow Validate, then score that app with the Rubric section. A prompt that asks for a Worker is scored from the live worker URL, the live `/mcp` call, and the version id from `pnpm exec void project status` after the platform session in Prepare. Send a browser user agent on the live calls. There is no source archive. A prompt that says not to deploy is scored from the source and from the validate return. A row is its points or 0. A rubric row whose capability the prompt does not ask for is full when the app omits that capability too. That full cell does not add a roadmap id. Usage is `-` unless this turn's summary shows usage. The row contains no secrets. Write the row the way the opening paragraph describes. Do not write a log.
5. Return the row you wrote.

When the user did not name a directory to keep, delete the destination after the row is written. When the row is not written, leave the directory.

## Rubric

This scores the app the chosen README prompt created. A row is its points or 0. A row for a destination, table, stream, page read, or layout rule the prompt does not ask for is full when the app omits it too. Pass means every row is full. The maximum is 100.

Do not open an answers file or a session log. The README table is the record. Score only from a file you opened or a command you ran.

| Row | Points | Evidence |
| --- | --- | --- |
| Create | 10 | `package.json` name is `eval-app`. `void.config.ts` title is the title in that prompt. No auth policy file, no `void/auth`, and no `void/db` import unless the prompt asked for a database or auth. No `.joules-answers.json`. |
| Absent | 10 | Tree minus `node_modules` has no `stripe`, `Stripe`, `passkey`, or `phone-otp` unless that prompt names one, and has no workflow file. |
| Stack | 10 | The Worker name is the package name. Nothing attaches this Worker to another project. No account id is committed. No `src/server.ts` and no `@tanstack/solid-start`. A mention of that package only inside a lockfile does not fail this row. A generated Cloudflare file the Void docs say to gitignore does not fail this row when it is gitignored. |
| Pages | 15 | Every destination the prompt names is one page plus a server companion. Every state the prompt names is rendered by that page and is not its own route. The offline page exists when the prompt keeps it. |
| Data | 10 | Every table the prompt names is one schema file re-exported from the schema entry. The named loader reads that table. No table in the prompt means no `db` directory. |
| Streams | 10 | Every stream the prompt names has the publisher action and the subscribing page that prompt names. No stream in the prompt means no live-stream module. |
| Health | 5 | A `healthcheck` tool at `/mcp`. No OAuth. When the prompt asked for a Worker, a live call to the deployed `/mcp` returns that tool and any page read the prompt named, and no other tool. |
| Release | 10 | When the prompt asks for a Worker: the worker URL answers. `pnpm exec void project status` lists the deployed version. The tree has no workflow file and no source archive. When the prompt says not to deploy: `pnpm run deploy` exits 2, does not deploy, and names `pnpm exec void deploy --platform cloudflare` as the next command. The check has no Cloudflare token or account id. A gitignored `void.lock.json` does not fail this row. A committed copy fails when it contains an account id. |
| Tools | 5 | No Playwright, Puppeteer, or Selenium dependency. When the prompt names a page read, each such page registers one read tool the way the current WebMCP spec says, and that same read is a tool at `/mcp`. |
| Design | 5 | Each layout rule in the prompt is visible in the page source. A waiting state the prompt names is not styled as a failure. An unavailable state the prompt names does not invent values. A prompt with no layout rule is full when Pages is full. |
| Validated | 10 | The check in Validate exited 0 and did not deploy. |
