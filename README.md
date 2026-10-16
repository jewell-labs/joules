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
| [joules-plugins](plugins/joules-plugins) | Creates, evaluates, updates, and scores one plugin. Each command has its own skill. |
| [web-app](plugins/web-app) | Creates or extends a Void pages app. The app is Solid on Cloudflare Workers, adds a page, a table, or a stream as one change, deploys with Void, and serves one public HTTP healthcheck. |

The joules-plugins run record names `hello-note` and `sample-note`. Those plugins are not in this repository. Do not add them back.

## Add a plugin

Search the official catalog first. Then `/create`, `/evaluate`, `/update`, or `/score`. `grok plugin validate plugins/<name>` is the manifest check. After you ask to install, `grok inspect` and `/judge` on a safe input are the behavior check. Each plugin README has the capability roadmap and the run record from the Records section of `plugins/joules-plugins/skills/judge/SKILL.md`. The prompt in the run record is the whole job. Evaluate writes the scores.

From this checkout, follow `AGENTS.md`.

## Hosts

Grok Build is the install path in the commands above. Every other host follows the Hosts section of [AGENTS.md](AGENTS.md).

## Layout

```text
AGENTS.md                            rules for agents in this repo
.grok-plugin/marketplace.json        catalog Grok reads
.grok-plugin/plugin-index.json       component list shown before install
plugins/<name>/                      one plugin, the public parent
```

A plugin name is the parent a person installs. A skill or command inside it is named for its job, not for the plugin. The rule is in [AGENTS.md](AGENTS.md).
