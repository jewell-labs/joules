# Joules

Public catalog of Grok plugins. This repository is the source of truth. Add a plugin here, push `main`, and installed copies update on the next Grok session or with `grok plugin update`.

Agents working in this repo follow [AGENTS.md](AGENTS.md). That file makes the official marketplace, <https://github.com/xai-org/plugin-marketplace>, the first place to look. Install and use a plugin from that catalog when it already does the job. Plugin contracts that can change stay on the current docs at <https://docs.x.ai/llms.txt>.

## Install

```bash
grok plugin marketplace add https://github.com/jewell-labs/joules.git
grok plugin install create-plugin --trust
grok plugin install validate-plugin --trust
grok plugin install score-plugin --trust
```

## Plugins

| Plugin | What it adds |
| --- | --- |
| [create-plugin](plugins/create-plugin) | Creates one plugin for one job from the current docs. |
| [validate-plugin](plugins/validate-plugin) | Checks a plugin against those docs and `grok plugin validate`. |
| [score-plugin](plugins/score-plugin) | Scores a plugin from 0 to 100. |

## Add a plugin

Search the official catalog first. Then `/create-plugin`, `/validate-plugin`, and `/score-plugin`. `grok plugin validate plugins/<name>` is the manifest check. After you ask to install, `grok inspect` and `/<skill>` on a safe input are the behavior check.

From this checkout, follow `AGENTS.md`.

## Hosts

Grok Build is the install path today.

grok.com and Grok Bot follow the same skill text. Each plugin connects the docs MCP at the endpoint listed in <https://docs.x.ai/llms.txt>, so a bot or a grok.com custom connector can attach that server over HTTPS. Host-specific steps come from the current connector and Grok Bot pages.

## Layout

```text
AGENTS.md                            rules for agents in this repo
.grok-plugin/marketplace.json        catalog Grok reads
.grok-plugin/plugin-index.json       component list shown before install
plugins/<name>/                      one plugin
```
