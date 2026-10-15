# Joules

Public catalog of Grok plugins. This repository is the source of truth. Add a plugin here, push `main`, and installed copies update on the next Grok session or with `grok plugin update`.

Agents working in this repo follow [AGENTS.md](AGENTS.md). Installing `joules-plugins` adds the marketplace URLs in `hooks/marketplaces.txt` and installs the plugins named in `hooks/plugins.txt`. That list starts with the xAI Official marketplace and the Cloudflare marketplace. Plugin contracts that can change stay on the current docs at <https://docs.x.ai/llms.txt>. Creating, evaluating, updating, and scoring all use one rubric.

## Install

```bash
grok plugin marketplace add https://github.com/jewell-labs/joules.git
grok plugin install joules-plugins --trust
```

## Plugins

| Plugin | What it adds |
| --- | --- |
| [joules-plugins](plugins/joules-plugins) | Creates, evaluates, updates, and scores one plugin. The rubric covers a single skill through a plugin with several components. |
| [web-app](plugins/web-app) | Creates a Void pages app in a directory. The app is Solid on Cloudflare Workers, releases the branches it lists, and serves one public HTTP healthcheck. |
| [local-grok-builder](plugins/local-grok-builder) | Fits a local GGUF suite to this machine and wires the chat Grok can run locally. `/doctor` only reports. |

## Add a plugin

Search the official catalog first. Then `/author` with `create`, `evaluate`, `update`, or `score`. `grok plugin validate plugins/<name>` is the manifest check. After you ask to install, `grok inspect` and `/author` on a safe input are the behavior check. The plugin README table is the run record. The prompt in that table is the whole job. Nothing else is stored.

From this checkout, follow `AGENTS.md`.

## Hosts

Grok Build is the install path today.

grok.com and Grok Bot follow the same skill text. `joules-plugins` connects the docs MCP at the endpoint listed in <https://docs.x.ai/llms.txt>, so a bot or a grok.com custom connector can attach that server over HTTPS. Host-specific steps come from the current connector and Grok Bot pages.

## Layout

```text
AGENTS.md                            rules for agents in this repo
.grok-plugin/marketplace.json        catalog Grok reads
.grok-plugin/plugin-index.json       component list shown before install
plugins/<name>/                      one plugin, the public parent
```

A plugin name is the parent a person installs. A skill or command inside it is named for its job, not for the plugin. The rule is in [AGENTS.md](AGENTS.md).
