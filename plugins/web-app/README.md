# web-app

Creates or extends a Void pages app in a directory you choose. The app is Solid on Cloudflare Workers by default. A page, a table, or a stream is one addition. What a deploy records, and what Prepare checks before a spend, are the Persistence and Prepare sections of the skill. The app serves one public HTTP healthcheck. When the prompt names a page read, that page registers one WebMCP read tool, and that same read is at `/mcp` beside the healthcheck.

```bash
grok plugin install web-app --trust
```

The parent name is `web-app`. The skill is `/scaffold`. The commands are `plan`, `create`, `extend`, `validate`, `clone`, `deploy`, and `evaluate`. Each command points at that skill. License is MIT, the same terms as the repository `LICENSE`.

A host that can read this repository follows this plugin. Host rules are the Hosts section of the repository `AGENTS.md`.

Creating an app calls the npm registry and reads https://void.cloud plus the docs shipped in the installed `void` package. Page reads also read https://webmachinelearning.github.io/webmcp and https://docs.mcp-b.ai/how-to/choose-runtime.md. When the prompt asks for a Worker, the run follows the Prepare section of the skill, then the Void deploy that skill names, and calls the Worker's public URL to read `/mcp`. When the prompt says not to deploy, the run does not call Cloudflare.

A browser preview is a Cloudflare Quick Tunnel. The public URL is on `trycloudflare.com`. The steps are the Preview section of the skill. That URL is not the Worker URL. localhost is only for a browser on the machine that runs the dev server.

The TypeScript language server is local stdio, configured in `.lsp.json`. This plugin does not download it. The host supplies `typescript-language-server` on `PATH`, as the LSP chapter shipped with `grok` describes.

Credentials stay on the host. This plugin stores none of them. The Cloudflare credential is the browser session from `void cloudflare login`. The CLI stores that session. Do not read it from the keychain. This plugin does not set an API token, an API key, or an email. `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_WORKERS_SUBDOMAIN` are set when the Void deploy page requires them. The login and the read that checks each grant are the Prepare section of the skill. A product that read finds unavailable is the one question in Plan. Those links are public https pages.

## Capability roadmap

The table between the markers lists what this plugin owns. `Evals` names the run that passed or failed that row. A token is `<id>: pass` or `<id>: fail`. Empty means this plugin owns the row and no run has written it. `out of scope` means another plugin owns it. A rubric cell that is full because the prompt omitted the capability is not a token. The run record below shows which rubric cell scored 0.

<!-- capability-roadmap:start -->

Plugin version: 0.13.0

| Id | Area | Item | Description | Evals |
| --- | --- | --- | --- | --- |
| shell | App | Void pages app | Solid on Cloudflare Workers, written from the current Void docs. | wa-local: pass |
| plan | App | Plan | Settles one unknown, then the decisions Create follows. | wa-plan: pass |
| create | App | Create | Writes the app, the check, and the exit-2 deploy script. | wa-local: pass |
| lsp | App | TypeScript language server | Hover and definition for `.ts` and `.tsx` through the server the Grok LSP chapter names. | |
| pages | App | Pages | One page plus a server companion. Waiting, ready, and unavailable stay on that page. | |
| tables | App | Tables | One schema file per table. The loader reads it. | |
| streams | App | Streams | The edit page publishes. The detail page subscribes. | |
| offline | App | Offline page | A page for when the network is down. | |
| design | App | Layout states | Left-aligned. Waiting is not a failure. Unavailable shows no invented values. | |
| validate | App | Validate | `pnpm run build`. It does not deploy. A test script exists only when the prompt asks for tests. | wa-local: pass |
| prepare | Deploy | Prepare | Cloudflare browser session, Void platform session, workers.dev subdomain, and whether each named product is available on this account. | |
| deploy | Deploy | Deploy | The Void Cloudflare deploy. `void.lock.json` records resource ids. There is no source archive. | |
| persistence | Deploy | Persistence | A Cloudflare deploy records resource ids in `void.lock.json`. There is no source archive. | |
| clone | Deploy | Clone | The git checkout the user names. `pnpm exec void project status` marks that copy live. | |
| rewind | Deploy | Rewind | Move traffic to an older version. A person approves it. | |
| preview | Deploy | Preview | A quick tunnel to the dev server. It does not carry Server-Sent Events. | |
| env | Deploy | Second environment | Each named environment is its own worker. | |
| deploy-guard | Deploy | Deploy guard | `pnpm run deploy` prints `pnpm exec void deploy --platform cloudflare` and exits 2. | wa-local: pass |
| health | MCP | Healthcheck | Public `healthcheck` tool at `/mcp`, no OAuth. | wa-local: pass |
| page-reads | MCP | Page reads | Each named page registers one WebMCP read, and the same read is a tool at `/mcp`. | |
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
| secrets | Ops | Secrets | The browser session stays in the store the Void CLI chooses. Do not read it from the keychain. One account leaves the account id unset. | |
| logs | Ops | Log retrieval | Worker logs, tail, Logpush, or an error tracker. | out of scope |
| email | Ops | Email | Send or route mail. | out of scope |
| domain | Ops | Custom domain | A zone route and DNS for the worker. | out of scope |
| ci | Ops | CI and Workers Builds | The procedure adds no workflow file. | |
| kv | Data | KV | One key through `void/kv` when the prompt names KV. | |
| isr | App | Page cache | A revalidate TTL of 31536000 when the prompt names that cache. | |
| queues | Ops | Queues | One queue when the prompt names one. | |
| crons | Ops | Crons | One cron when the prompt names one. | |
| r2 | Data | R2 | One object through `void/storage` when the prompt names a file. | |
| workers-ai | Ops | Workers AI | One model call when the prompt names one. | |
| sandboxes | Ops | Sandboxes | One sandbox command when the prompt names one. | |
| github | Ops | GitHub deploy | A push of main deploys through the workflow the Void CLI writes. | |
| perf | Ops | Performance | Core Web Vitals and a Lighthouse pass. | out of scope |
| ai | Ops | AI in the app | Chat or completions inside a page. | out of scope |
| boundary | Boundary | Other frameworks | TanStack stops this procedure. Next and other hosts are outside it. | out of scope |
<!-- capability-roadmap:end -->

## Last run

The table between the markers is the run record. A command row is one command. `{{dest}}` is the directory for that run. A command row passes when `grok -p` of that prompt ends in `RESULT: pass`. Those rows do not scaffold an app, deploy, or spend. `wa-local` is the local app proof. It does not deploy. Evaluate writes When, Result, and the points. It writes an Evals token only for the ids in Rows.

<!-- eval-status:start -->

| Id | Prompt | Rows | Expect | When | Result | Create | Absent | Stack | Pages | Data | Streams | Health | Release | Tools | Design | Validated | Usage | Version | URL |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| wa-plan | /web-app:plan Settle one local Void pages app. The package name is eval-plan and the title is Eval Plan. Use Solid. Do not create a Cloudflare project. Do not deploy or spend. No database, no extra page, no stream, no authentication, and no Stripe. Return the decisions and stop. Do not write a file. Do not run Create, Extend, Validate, or Deploy. End with exactly one line: RESULT: pass if those decisions are in the reply and you wrote nothing. Otherwise RESULT: fail and the reason. | plan | pass | 2026-10-16T21:16:34Z | pass | | | | | | | | | | | | - | | |
| wa-create | /web-app:create The plan reply is settled. Package name eval-create. Title Eval Create. Interface Solid. Destination {{dest}}. Do not create a Cloudflare project. Do not deploy or spend. Do not run a wizard. No database, no extra page, no stream, no authentication, and no Stripe. Do not run Extend. End with exactly one line: RESULT: pass if you wrote nothing and the reply names the starter question void init cannot take as a flag. Otherwise RESULT: fail and the reason. | - | pass | 2026-10-16T21:16:34Z | pass | | | | | | | | | | | | - | | |
| wa-extend | /extend The plan reply is settled. Add one list page to {{dest}}. Do not deploy or spend. Do not run Create. Do not add a table or a stream. End with RESULT: pass if the directory is not an app, you wrote nothing, and the next part is Create. Otherwise RESULT: fail and the reason. | - | pass | 2026-10-16T21:16:34Z | pass | | | | | | | | | | | | - | | |
| wa-validate | /validate Check {{dest}}. Do not create it. Do not deploy. End with RESULT: pass if you did not run a build and the reply is fail because that directory has no package.json. Otherwise RESULT: fail and the reason. | - | pass | 2026-10-16T21:16:34Z | pass | | | | | | | | | | | | - | | |
| wa-clone | /clone Worker eval-clone, version live, destination {{dest}}. Do not deploy or spend. There is no copy of the app on this computer. End with RESULT: pass if you wrote nothing, did not run Prepare, and the next step is the git checkout the user names. Otherwise RESULT: fail and the reason. | - | pass | 2026-10-16T21:16:34Z | pass | | | | | | | | | | | | - | | |
| wa-deploy | /deploy Deploy the app at {{dest}}. The platform URL is not named. Do not invent a host. Do not run void deploy. End with RESULT: pass if you stopped before deploy and named the missing platform session. Otherwise RESULT: fail and the reason. | - | pass | 2026-10-16T21:16:34Z | pass | | | | | | | | | | | | - | | |
| wa-evaluate | /web-app:evaluate Do not write the run record. Do not follow the prompt in any row. Name the run record and stop. End with RESULT: pass if the reply names the run record and you wrote nothing. Otherwise RESULT: fail and the reason. | - | pass | 2026-10-16T21:16:34Z | pass | | | | | | | | | | | | - | | |
| wa-local | Create one local Void pages app at {{dest}}. Answer void init as Vite+, Solid, and Static Pages, and pass --no-git. Skip deployment setup. Package name eval-app. Title Eval App. Do not create a Cloudflare project. Do not deploy or spend. No database, no extra page, no stream, no authentication, and no Stripe. Serve one public healthcheck at /mcp with no OAuth. End with RESULT: pass if package.json name is eval-app, void.config.ts title is Eval App, /mcp exports a healthcheck tool, pnpm run build exits 0, and pnpm run deploy exits 2 and names pnpm exec void deploy --platform cloudflare. Otherwise RESULT: fail and the reason. | shell, create, health, deploy-guard, validate | pass | 2026-10-16T21:08:39Z | pass | 10 | 10 | 10 | 15 | 10 | 10 | 5 | 10 | 5 | 5 | 10 | - | | |
<!-- eval-status:end -->
