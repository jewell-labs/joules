# web-app

Creates or extends a Void pages app in a directory you choose. The app is Solid on Cloudflare Workers by default. A page, a table, or a stream is one addition. Each deploy is persisted on Cloudflare so another computer can clone that version, then deploy again with Void. The app serves one public HTTP healthcheck. When the prompt names a page read, that page registers one WebMCP read tool, and that same read is at `/mcp` beside the healthcheck.

```bash
grok plugin install web-app --trust
```

The parent name is `web-app`. The skill is `/scaffold`. The commands are `plan`, `create`, `extend`, `validate`, `clone`, `deploy`, and `evaluate`. Each command points at that skill. License is MIT, the same terms as the repository `LICENSE`.

A host that can read this repository follows this plugin. Host rules are the Hosts section of the repository `AGENTS.md`.

Creating an app calls the npm registry and reads https://void.cloud plus the docs shipped in the installed `void` package. Page reads also read https://webmachinelearning.github.io/webmcp and https://docs.mcp-b.ai/how-to/choose-runtime.md. When the prompt asks for a Worker, the run calls the Cloudflare API to create the Worker, writes the source archive the skill's Persistence section names, and calls the Worker's public URL to read `/mcp`. Clone reads that archive. When the prompt says not to deploy, the run does not call Cloudflare.

A browser preview is a Cloudflare Quick Tunnel. The public URL is on `trycloudflare.com`. The steps are the Preview section of the skill. That URL is not the Worker URL. localhost is only for a browser on the machine that runs the dev server.

Credentials stay in the host environment. This plugin stores none of them. The names are `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_WORKERS_SUBDOMAIN` when the Void deploy page requires it. `CLOUDFLARE_API_TOKEN` is a user API token. A host loads it from its own secret store into that variable and does not print it. The one-time browser links and the read that checks each grant are the Prepare section of the skill. Those links are public https pages.

## Capability roadmap

The table between the markers lists what this plugin owns. `Evals` names the run that passed or failed that row. A token is `<id>: pass` or `<id>: fail`. Empty means this plugin owns the row and no run has written it. `out of scope` means another plugin owns it. A rubric cell that is full because the prompt omitted the capability is not a token. The run record below shows which rubric cell scored 0.

<!-- capability-roadmap:start -->

Plugin version: 0.12.0

| Id | Area | Item | Description | Evals |
| --- | --- | --- | --- | --- |
| shell | App | Void pages app | Solid on Cloudflare Workers, written from the current Void docs. | wa-release: pass |
| plan | App | Plan | Settles one unknown, then the decisions Create follows. | |
| create | App | Create | Writes the app, the check, and the exit-2 deploy script. | wa-release: pass |
| pages | App | Pages | One page plus a server companion. Waiting, ready, and unavailable stay on that page. | wa-surface: pass |
| tables | App | Tables | One schema file per table. The loader reads it. | wa-surface: pass |
| streams | App | Streams | The edit page publishes. The detail page subscribes. | wa-stream: pass |
| offline | App | Offline page | A page for when the network is down. | wa-release: pass |
| design | App | Layout states | Left-aligned. Waiting is not a failure. Unavailable shows no invented values. | wa-surface: pass |
| validate | App | Validate | `npm test` and the app check. The check does not deploy. | wa-release: pass |
| prepare | Deploy | Prepare | User API token, account id, workers.dev subdomain, and the version store. | wa-release: pass |
| deploy | Deploy | Deploy | The Void Cloudflare deploy, then the archive of that version. | wa-release: pass |
| persistence | Deploy | Persistence | Gzip of the source at `<worker>/<version>` in the store the token can write. | wa-release: pass |
| clone | Deploy | Clone | Unpack one archived version onto this computer. | wa-release: pass |
| rewind | Deploy | Rewind | Move traffic to an older version. A person approves it. Archives stay. | |
| preview | Deploy | Preview | A quick tunnel to the dev server. It does not carry Server-Sent Events. | |
| env | Deploy | Second environment | Each named environment is its own worker and its own version store. | |
| deploy-guard | Deploy | Deploy guard | `npm run deploy` prints the Void command and exits 2. | wa-surface: pass |
| health | MCP | Healthcheck | Public `healthcheck` tool at `/mcp`, no OAuth. | wa-release: pass |
| page-reads | MCP | Page reads | Each named page registers one WebMCP read, and the same read is a tool at `/mcp`. | wa-surface: pass |
| plugin-mcp | MCP | Plugin server | This plugin ships no MCP server. The app's `/mcp` route is the surface. | out of scope |
| connector | MCP | grok.com connector | A public https MCP a grok.com connector can attach to. | out of scope |
| safari | MCP | Safari and simulators | The same page tools through the WebMCP polyfill. | |
| browser | Browser | Signed-in browser | Clicks and screenshots in the person's browser. | out of scope |
| devtools | Browser | Console, network, trace | A performance trace, or the console and network log. | out of scope |
| auth | Identity | Auth ceremony | Passkey, phone code, or Void auth. Record a chosen policy. Leave the ceremony unimplemented. | out of scope |
| sessions | Identity | Sessions | A sessions table, only when the user chooses a database and sessions. | out of scope |
| turnstile | Identity | Bot check | Turnstile in front of a form. | out of scope |
| payments | Payments | Card payments | Stripe Checkout or PaymentIntents inside the app. | out of scope |
| billing | Payments | Connect and billing | Seller payouts and usage billing. | out of scope |
| database | Data | Product database | Schema files follow Void when a prompt names a table. Choosing the database product stays with the official Cloudflare plugin. | out of scope |
| durable-objects | Data | Durable Objects | Coordination beyond a Void live stream. | out of scope |
| app-files | Data | App file storage | Object storage for user files. | out of scope |
| secrets | Ops | Secrets | The token and the account id stay in the host environment. | wa-release: pass |
| logs | Ops | Log retrieval | Worker logs, tail, Logpush, or an error tracker. | out of scope |
| email | Ops | Email | Send or route mail. | out of scope |
| domain | Ops | Custom domain | A zone route and DNS for the worker. | out of scope |
| ci | Ops | CI and Workers Builds | The plugin forbids a workflow file. The release eval checks the tree has none. | wa-release: pass |
| perf | Ops | Performance | Core Web Vitals and a Lighthouse pass. | out of scope |
| ai | Ops | AI in the app | Chat or completions inside a page. | out of scope |
| boundary | Boundary | Other frameworks | TanStack stops this procedure. Next and other hosts are outside it. | out of scope |
<!-- capability-roadmap:end -->

## Last run

The table between the markers is the run record. A prompt that asks for a Worker uses the live Release and Health evidence. A prompt that says not to deploy uses the exit-2 evidence. Evaluate writes When, Result, and the points. It writes an Evals token only for the ids in Rows. The scores stay empty until that write. `wa-release` is the one slow eval. `wa-surface` and `wa-stream` stay local.

<!-- eval-status:start -->

| Id | Prompt | Rows | Expect | When | Result | Create | Absent | Stack | Pages | Data | Streams | Health | Release | Tools | Design | Validated | Usage | Version | URL |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| wa-release | Create a web app at {{dest}} named eval-app with the title Eval App. Create a new Cloudflare Worker for that app, persist that deploy so another computer can clone that version, expose one public MCP healthcheck on the app with no OAuth, and deploy with Void. Do not add a workflow file. Follow the scaffold skill for anything this sentence does not set. No database, no sessions table, and no authentication. Keep the offline page. Do not use Stripe. | shell, create, offline, validate, prepare, deploy, persistence, clone, health, secrets, ci | pass | 2026-10-16T16:32:55Z | pass | 10 | 10 | 10 | 15 | 10 | 10 | 5 | 10 | 5 | 5 | 10 | - | 7ab674ef-d54c-4755-a6d3-b30c28dfc956 | https://eval-app.tyler-jewell.workers.dev |
| wa-surface | Create a web app at {{dest}} named eval-app with the title Eval Surface. Follow the scaffold skill for anything this sentence does not set. No authentication and no live stream. Keep the public healthcheck and the offline page. Do not use Stripe. Do not deploy or spend. Do not add a browser driver. Add a list page and a detail page. The detail page is one route whose states are waiting, ready, and unavailable. Those states are not separate routes. Add two tables. A parent record has a name and a status. A child record belongs to one parent and has a label, a latitude, and a longitude. The list loader reads parents. The detail loader reads one parent and its children. Each page registers one read tool through WebMCP, and that same read is a tool at /mcp beside the healthcheck. Left-align the layout. A waiting state is not an error. The unavailable state shows no made-up values. | pages, tables, page-reads, design, deploy-guard | pass | 2026-10-16T16:32:55Z | pass | 10 | 10 | 10 | 15 | 10 | 10 | 5 | 10 | 5 | 5 | 10 | - |  |  |
| wa-stream | Create a web app at {{dest}} named eval-app with the title Eval Stream. Follow the scaffold skill for anything this sentence does not set. No authentication. Keep the public healthcheck and the offline page. Do not use Stripe. Do not deploy or spend. Do not add a browser driver. Do not open a tunnel. Add a list page, a detail page, and an edit page. The detail page is one route whose states are waiting, ready, and unavailable. Add two tables. A parent record has a name and a status. A child record belongs to one parent and has a label, a latitude, and a longitude. The list loader reads parents. The detail loader reads one parent and its children. Add one live stream of the children of one parent. The detail page subscribes. The edit page replaces one child and publishes on that stream. The /mcp read for that page is the latest snapshot of that stream. Left-align the layout. A waiting state is not an error. The unavailable state shows no made-up values. | streams | pass | 2026-10-16T16:33:55Z | pass | 10 | 10 | 10 | 15 | 10 | 10 | 5 | 10 | 5 | 5 | 10 | - |  |  |
<!-- eval-status:end -->
