# Joules

Rules for an agent working in this repository. Grok Build loads this file at session start.

This repo is the public marketplace of Grok plugins. The primary host is the Grok Build CLI. grok.com and Grok Bot are the next hosts. A plugin has one procedure, and each host attaches to it the way that host's current docs describe.

## Official marketplace

Use the official xAI marketplace before any Joules plugin and before any new file. Do not recreate a plugin it already lists. Do not copy its catalog into this repo.

The catalog is https://github.com/xai-org/plugin-marketplace `.grok-plugin/marketplace.json`. Fetch it at the start of the session. Names, descriptions, keywords, domains, and categories on that page are the usage record. Read the installed plugin's own `README` and `SKILL.md` for the steps.

### Set up

1. `joules-plugins` does this on `SessionStart`. It reads `hooks/marketplaces.txt` and `hooks/plugins.txt` beside its hook, adds each marketplace URL, installs each plugin with `--trust`, and enables it.
2. When that hook has not run, do the same commands yourself. Then run `grok plugin marketplace update`.
3. Fetch the catalog file above. Match the task against each entry's name, keywords, domains, and description.
4. For every match, run `grok plugin install <name> --trust`, then `grok plugin enable <name>` when `grok plugin list` shows it disabled.
5. Open that plugin's `README` and `SKILL.md` from the path `grok plugin list` prints. When it ships an MCP server, run `grok mcp doctor` for that server and finish the sign-in the README describes. Ask the user when a credential is required.

Leave catalog plugins that do not match this task uninstalled.

### When and where

| When | Where |
| --- | --- |
| The task matches a catalog name, keyword, domain, or description | First action, in the repo the task is about. Follow that plugin's skill. Say the plugin name, the field that matched, and the skill or command you ran. |
| The task is creating, evaluating, updating, or scoring a plugin | After the catalog search. Use `joules-plugins` only when no official entry does that job. |
| An official plugin does part of the job | That plugin does its part. A Joules change may add only the missing step. |

A Joules plugin has to fit one of these, and you say which:

- **Exclusive.** The catalog search matched nothing.
- **On top.** Name the official plugin and the extra step this repo adds.
- **Without.** That extra step still finishes when the official plugin is not installed.

Grok Build skills that already appear in the session are used the same way. Call them. Do not copy them into `plugins/`.

An installed guidance skill, such as `modern-web-guidance`, is evidence. When it does not help this job, or it contradicts this file, the plugin procedure, the current docs, or a decision the user already made, do not follow it. Ask the user. A past decision this pass shows is wrong is a question, not a silent rewrite.

## Future-proof

This rule covers every plugin and skill in this repo.

xAI changes skill frontmatter, agent frontmatter, hook events, MCP and LSP config, marketplace fields, model ids, tool names, and API parameters. Those contracts live on the current docs, not in this repository.

Before you create, edit, validate, or score a plugin:

1. Fetch https://docs.x.ai/llms.txt
2. Open the pages that index lists for the component you are touching. Request markdown by appending `.md` or sending `Accept: text/markdown`.
3. When a docs MCP server is connected, list its tools and read those pages through them. The endpoint is the MCP server URL on that same index.
4. When the `grok` CLI is installed, `grok plugin validate <plugin-dir>` is the load check for Grok Build.
5. When the public page and the CLI disagree, follow the CLI for files that must load, follow the public page for fields it ignores, and report the split.
6. Link the page you followed. Leave field lists, enums, model ids, and sample config out of skills and out of this file.

A plugin stays valid when those pages change because the next session reads the pages again.

## Build a plugin

This is the procedure for `joules-plugins`. Follow Official marketplace, Future-proof, Layout, and Catalog. Do not copy those sections into a skill. Judge create, evaluate, update, and score with the Rubric section of `plugins/joules-plugins/skills/author/SKILL.md`. Do not keep a second rubric.

1. Official marketplace first. Stop when an official plugin does the job. When the user wants a skill under `.grok/skills/` and not a marketplace plugin, use the session's `create-skill` and stop.
2. Open these for every component you add. Request markdown from docs pages.
   - https://docs.x.ai/llms.txt and the skills, plugins, and marketplace pages it lists
   - The skills and plugins chapters of the user guide shipped with `grok`, when the CLI is installed
   - https://github.com/xai-org/plugin-marketplace/blob/main/CONTRIBUTING.md
   - https://docs.x.ai/grok-bot/skills-routines-and-automations
   Apply Future-proof when the public page and the CLI disagree.
3. Write each skill as one workflow. The description says what it does, when it runs, and the slash name. The body states when to use it, the inputs, the steps, how to check the result, what to return, and what a person must approve. Name the tools the steps use. A command in the body is an instruction for the agent to run. It is the leaf the Commands section of `plugins/joules-plugins/skills/author/SKILL.md` names. Link a living docs page for any contract that can change. The rubric belongs in the skill that judges. Do not add `RUBRIC.md`.
4. Package the plugin by the Catalog section.
5. Run `grok plugin validate plugins/<name>`. After the user asks to install, run `grok plugin install <name> --trust`, then `grok inspect` and confirm the skill source is `plugin: <name>`. Run `grok mcp doctor` when the plugin has an MCP server. Invoke `/<skill>` on a safe input. Run `grok plugin tag` only when the user asks to publish.
6. Re-read the security section of the contributing page and reject the classes it rejects.

## Hosts

Grok Build installs plugins from this marketplace. The commands are in the README.

Write the skill body so the other hosts can follow it without a fork. A Grok Bot that has this repository uses the same skills, the same commands, and the same connectors. It does not need a second copy of a plugin.

- The skill body follows Build a plugin.
- Grok Build wiring follows the Build pages you opened this session.
- grok.com reaches MCP over public HTTPS. Follow https://docs.x.ai/grok/connectors . A custom MCP server must be a public https URL. A stdio server does not satisfy that host. The docs MCP endpoint is the one https://docs.x.ai/llms.txt lists.
- A Grok Bot follows the same procedure from this checkout. Its skills page is https://docs.x.ai/grok-bot/skills-routines-and-automations . That page describes skills saved in the app. It does not say how this marketplace installs. Say that, and still follow the skill body. The Bot computer can open the same public https links this session opens. Credentials are the environment variables the product docs name. The Bot does not read another machine's keychain or encrypted credential file. Add a routine only after the skill is reliable.
- On this computer, the Cloudflare credential is the browser session from `void cloudflare login`. `void` is the global package. The CLI stores that session. Do not set an API token, key, or email, and do not read one from the keychain. A Grok Bot runs the same login on its own browser. It does not read this computer's keychain.
- One-time sign-in uses a public https link. Do not encode a click path that exists on only one machine.
- One browser client at a time. A public URL is an HTTP read. Open a browser only when the page needs a click, a signed-in session, JavaScript, or a screenshot.
- WebMCP is the app's own tools at `/mcp`. It is not a browser driver. A page read the prompt names is WebMCP.
- The official `browser-use` plugin is the browser. Follow its installed skill. On this Mac it attaches to the person's running Chrome. The person allows remote debugging at `chrome://inspect/#remote-debugging` and clicks Allow. Do not launch a second Chrome, do not pass another profile, and do not type a password or a passkey.
- A Grok Bot computer with no display uses that plugin's cloud browser, one per task, and stops it when the task ends. It does not read this Mac's Chrome profile. The person signs in on that browser when the page requires it.
- `chrome-devtools` is not in this base set. Add it only for a performance trace, the console, or the network log, and stop `browser-use` first so two clients do not attach to the same Chrome.
- Do not install a Safari driver. A person may open the page in Safari. The WebMCP polyfill covers that browser.
- The `grok-web` server belongs to the grok.com skill and its own profile. Do not point it at a Worker or a Cloudflare dashboard, and do not run it while `browser-use` is attached to Chrome.
- Do not install `computer-use`, Playwright, or a second browser MCP for this work.
- Publish, tag, push, and install for other people only when the user asked.

## Layout

The plugin is the public parent. Its directory name is the name a person installs. A skill, command, or agent inside it is one job that parent does. Name that part for the job. Never give it the plugin's name. A part that repeats the parent name is a second name for the whole plugin.

```text
plugins/<plugin>/
  .grok-plugin/plugin.json
  README.md
  skills/<job>/SKILL.md
  commands/<job>.md
  agents/<job>.md
  hooks/hooks.json
  .mcp.json
  .lsp.json
```

`joules-plugins` is the authoring parent. Its skill is `author`. Its commands are `create`, `evaluate`, `update`, and `score`. `web-app` is the app parent. Its skill is `scaffold`. Its commands are `plan`, `create`, `extend`, `validate`, `clone`, `deploy`, and `evaluate`.

A skill and a command in the same plugin do not share a name. The skill is the procedure. The command is the slash entry for one part of that procedure, and it points at that part instead of copying it.

Do not add a `scripts/` directory. The agent follows the skill and writes the result. A hook is the command the current hooks page runs, and it is not a second copy of the skill: https://docs.x.ai/build/features/hooks

This repository has no Node package. Do not add `package.json`, a lockfile, or `node_modules`, and do not run `npm` or `pnpm install` in the repository root. A repeated command inside an app the `web-app` skill creates is that app's `scripts` entry, run with `pnpm run`.

Copy this shape for a new plugin. Do not invent a second parent name for a part.

## Catalog

- One plugin you author does one job, at `plugins/<name>/`. This repo ships `joules-plugins` for authoring and `web-app` for a new or extended app. The joules-plugins run record names `hello-note` and `sample-note`. Those plugins are not in this repo. Do not add them back. The app follows the `scaffold` skill and that plugin's plan, create, extend, validate, clone, and deploy commands.
- List it in `.grok-plugin/marketplace.json`. Match the fields already in that file.
- When `.grok-plugin/plugin-index.json` exists, list the components you actually added.
- A plugin that lives in this repo uses a local source path.
- The marketplace entry has a homepage and a description. Keywords are the plugin name and product terms.
- `README.md` states the license, every network endpoint the plugin calls, and any credential the user must supply.
- License is MIT, the same terms as `LICENSE`.
- No secrets, tokens, account names, or customer data.
- Add a skill, command, agent, hook, MCP server, or LSP server only when the job needs it.
- The plugin is exclusive of the official catalog, or it adds one named step on top of an official plugin and still runs without that plugin.
- The docs MCP in these plugins uses the endpoint from https://docs.x.ai/llms.txt. If it fails to connect, update the URL from that index and follow the current MCP page.

## Change this repo

Do the Official marketplace section first. Then follow Build a plugin. Use `joules-plugins` when it is available. When you are editing that skill, follow this file directly.

Run:

```bash
grok plugin validate plugins/joules-plugins
grok plugin validate plugins/web-app
```
