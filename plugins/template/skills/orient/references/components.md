# Template plugin components

Copy `plugins/template` when adding a plugin to this marketplace. Keep the new plugin free of a person, company, or product name. Describe the job an agent does in any repository.

| Component | Path | Required |
| --- | --- | --- |
| Manifest | `.grok-plugin/plugin.json` | For a published plugin |
| Skill | `skills/<name>/SKILL.md` | One skill per workflow |
| Command | `commands/<name>.md` | Optional slash command |
| Subagent | `agents/<name>.md` | Optional child session |
| Hooks | `hooks/hooks.json` | Optional |
| MCP | `.mcp.json` | Optional |
| LSP | `.lsp.json` | Optional |

Grok discovers these directories without path overrides in `plugin.json`.

## Skill frontmatter

`name`, `description`, `when-to-use`, `allowed-tools`, `argument-hint`, `user-invocable`, `disable-model-invocation`, `model`, `effort`, `license`, `compatibility`, and `metadata` (`author`, `short-description`). `description` is what triggers the skill. Keep the body a procedure. Put long reference material in a sibling file.

## Command frontmatter

`description`, `argument-hint`, `allowed-tools`. The file name is the command name. Point the body at a skill instead of copying the procedure.

## Agent frontmatter

`name`, `description`, `tools`, `disallowedTools`, `mcpInheritance` (`all`, `none`, `named`, or `except`), `model`, `effort`, `maxTurns`. A plugin agent cannot declare `mcpServers` or hooks, and cannot set `permissionMode` to `bypassPermissions`. The parent spawns it as `<plugin>:<agent>`.

## Hook entry

`matcher`, `type` (`command` or `http`), `command`, `timeout`. Ship a script beside `hooks.json` and call it by its file name. `SessionStart` matchers are `new` and `load`. Write state only under `GROK_PLUGIN_DATA`.

## MCP server

`.mcp.json` key `mcpServers`. Stdio fields: `command`, `args`, `env`. Use `${GROK_PLUGIN_ROOT}` when the command must find a file inside the plugin. Do not put tokens in this file.

## LSP server

`.lsp.json` server name, then `command`, `args`, `extensionToLanguage`, `transport`, `env`, `initializationOptions`, `settings`, `workspaceFolder`, `workspaceOpen`, `startupTimeout`, `shutdownTimeout`, `restartOnCrash`, `maxRestarts`. Map only extensions this server should own.

## Marketplace entry

In `.grok-plugin/marketplace.json`: `name`, `description`, `category`, `version`, `author`, `homepage`, `keywords`, `domains`, `tags`, and `source`. A plugin that lives in this repo uses `{ "type": "local", "path": "./plugins/<name>" }`. After editing the catalog, update `.grok-plugin/plugin-index.json` to match.
