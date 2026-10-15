# Joules

Public catalog of Grok plugins for agents working in any repository. The plugins describe jobs. They do not name a person, a company, or a product.

This repository is the source of truth. Add a plugin here, push `main`, and installed copies update on the next Grok session or with `grok plugin update`.

## Install

```bash
grok plugin marketplace add https://github.com/jewell-labs/joules.git
grok plugin install template --trust
```

The marketplace URL is the link. Nothing is copied from a local checkout.

## Plugins

| Plugin | What it adds |
| --- | --- |
| [template](plugins/template) | One of every component, with the manifest fields filled in. Also maps the current repository. |

## Add a plugin

1. Copy `plugins/template` to `plugins/<name>`.
2. Replace the sample behavior with one job an agent can do in any repository.
3. Add an entry to `.grok-plugin/marketplace.json` with `"source": { "type": "local", "path": "./plugins/<name>" }`.
4. Add the same plugin to `.grok-plugin/plugin-index.json`.
5. Run `grok plugin validate plugins/<name>`.

Keep keywords specific to the plugin name. Leave tokens and account names out of `.mcp.json`.

## Layout

```text
.grok-plugin/marketplace.json    catalog Grok reads
.grok-plugin/plugin-index.json   component list shown before install
plugins/<name>/                  one plugin
```
