# Joules

Rules for an agent working in this repository. Grok Build loads this file at session start.

This repo is the public marketplace of Grok plugins. The primary host is the Grok Build CLI. grok.com and Grok Bot are the next hosts. A plugin has one procedure, and each host attaches to it the way that host's current docs describe.

## Official marketplace

Use the official xAI marketplace before any Joules plugin and before any new file. Do not recreate a plugin it already lists. Do not copy its catalog into this repo.

The catalog is https://github.com/xai-org/plugin-marketplace `.grok-plugin/marketplace.json`. Fetch it at the start of the session. Names, descriptions, keywords, domains, and categories on that page are the usage record. Read the installed plugin's own `README` and `SKILL.md` for the steps.

### Set up

1. Run `grok plugin marketplace list`.
2. When `https://github.com/xai-org/plugin-marketplace.git` is missing, run `grok plugin marketplace add https://github.com/xai-org/plugin-marketplace.git`.
3. Run `grok plugin marketplace update` so the local cache matches that repo.
4. Fetch the catalog file above. Match the task against each entry's name, keywords, domains, and description.
5. For every match, run `grok plugin install <name> --trust`, then `grok plugin enable <name>` when `grok plugin list` shows it disabled.
6. Open that plugin's `README` and `SKILL.md` from the path `grok plugin list` prints. When it ships an MCP server, run `grok mcp doctor` for that server and finish the sign-in the README describes. Ask the user when a credential is required.

Leave catalog plugins that do not match this task uninstalled.

### When and where

| When | Where |
| --- | --- |
| The task matches a catalog name, keyword, domain, or description | First action, in the repo the task is about. Follow that plugin's skill. Say the plugin name, the field that matched, and the skill or command you ran. |
| The task is authoring, validating, or scoring a plugin in this repo | After the catalog search. Use `create-plugin`, `validate-plugin`, and `score-plugin` only when no official entry does that job. |
| An official plugin does part of the job | That plugin does its part. A Joules change may add only the missing step. |

A Joules plugin has to fit one of these, and you say which:

- **Exclusive.** The catalog search matched nothing.
- **On top.** Name the official plugin and the extra step this repo adds.
- **Without.** That extra step still finishes when the official plugin is not installed.

Grok Build skills that already appear in the session are used the same way. Call them. Do not copy them into `plugins/`.

## Future-proof

This rule covers every plugin, skill, and script in this repo.

xAI changes skill frontmatter, agent frontmatter, hook events, MCP and LSP config, marketplace fields, model ids, tool names, and API parameters. Those contracts live on the current docs, not in this repository.

Before you create, edit, validate, or score a plugin:

1. Fetch https://docs.x.ai/llms.txt
2. Open the pages that index lists for the component you are touching. Request markdown by appending `.md` or sending `Accept: text/markdown`.
3. When a docs MCP server is connected, list its tools and read those pages through them. The endpoint is the MCP server URL on that same index.
4. When the `grok` CLI is installed, `grok plugin validate <plugin-dir>` is the load check for Grok Build.
5. When the public page and the CLI disagree, follow the CLI for files that must load, follow the public page for fields it ignores, and report the split.
6. Link the page you followed. Leave field lists, enums, model ids, and sample config out of skills and out of this file.

A plugin stays valid when those pages change because the next session reads the pages again.

## Hosts

Grok Build installs plugins from this marketplace. The commands are in the README.

Write the skill body so the other hosts can follow it without a fork:

- When to use it, inputs, steps, how to check the result, what to return, and what a person must approve.
- Grok Build wiring follows the Build pages you opened this session.
- grok.com reaches MCP over public HTTPS. Follow the current connectors page. A stdio server does not satisfy that host.
- A Grok Bot follows the same procedure and connects MCP the way the current Bot and connector pages describe. Add a routine only after the skill is reliable.
- Publish, tag, push, and install for other people only when the user asked.

If the current page for a host does not yet say how this marketplace installs there, say that. Leave the skill as one procedure.

## Catalog

- One plugin, one job, at `plugins/<name>/`.
- List it in `.grok-plugin/marketplace.json`. Match the fields already in that file.
- When `.grok-plugin/plugin-index.json` exists, list the components you actually added.
- A plugin that lives in this repo uses a local source path.
- Keywords include the plugin name.
- License is MIT, the same terms as `LICENSE`.
- No secrets, tokens, account names, or customer data.
- Add a skill, command, agent, hook, MCP server, or LSP server only when the job needs it.
- The plugin is exclusive of the official catalog, or it adds one named step on top of an official plugin and still runs without that plugin.
- The docs MCP in these plugins uses the endpoint from https://docs.x.ai/llms.txt. If it fails to connect, update the URL from that index and follow the current MCP page.

## Change this repo

Do the Official marketplace section first. Then use the `create-plugin`, `validate-plugin`, and `score-plugin` skills when they are available. When you are editing those skills, follow this file directly.

Run:

```bash
grok plugin validate plugins/create-plugin
grok plugin validate plugins/validate-plugin
grok plugin validate plugins/score-plugin
```
