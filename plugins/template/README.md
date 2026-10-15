# template

Sample Joules plugin. It has one of every Grok plugin component, and each manifest field is filled in. Copy this directory when you add a plugin.

The behavior is repository orientation. `/orient` and `/brief` read the repo you have open. The `reader` subagent does the same without editing files. Nothing in the procedure names a person, a company, or a product.

## Components

| Piece | Path |
| --- | --- |
| Manifest | `.grok-plugin/plugin.json` |
| Skill | `skills/orient/SKILL.md` |
| Command | `commands/brief.md` |
| Subagent | `agents/reader.md` |
| Hook | `hooks/hooks.json` |
| MCP server | `.mcp.json` plus `scripts/mcp_server.py` |
| LSP server | `.lsp.json` plus `scripts/lsp_server.py` |

The field list for each file is `skills/orient/references/components.md`.

## What each piece does

- `orient` lists the root, reads the README and the project manifest, and returns a four-line brief.
- `brief` is the slash command for the same brief.
- `reader` is the read-only subagent, spawned as `template:reader`. It may use the `joules-template` MCP server.
- `SessionStart` appends a timestamp to the plugin data directory. It does not block the session.
- `template_status` on the `joules-template` MCP server returns `joules template 0.1.1 ok`.
- The language server owns the `.joules` extension only, so it stays out of the way of real languages.

## Check

```bash
grok plugin validate plugins/template
```
