---
description: Create one plugin from the current docs and the Joules rubric.
argument-hint: "[name]"
---

Create one marketplace plugin. The plugin root is the directory that contains `commands/create.md`. The rubric is `../skills/joules-plugins/RUBRIC.md`.

## Docs

Open https://docs.x.ai/llms.txt and the skills, plugins, and marketplace pages it lists. Open the skills and plugins chapters shipped with `grok` when the CLI is installed. Open https://github.com/xai-org/plugin-marketplace/blob/main/CONTRIBUTING.md and https://docs.x.ai/grok-bot/skills-routines-and-automations. Follow the Build a plugin section of Joules `AGENTS.md`. In this repository that file is at the repo root. Otherwise read https://raw.githubusercontent.com/jewell-labs/joules/main/AGENTS.md.

Run `grok plugin --help` before you invent a flag.

## Inputs

Ask once when the job this plugin does, or its kebab-case name, is missing. A path the user names wins. When the current directory contains `.grok-plugin/marketplace.json` and `plugins/`, create `plugins/<name>/`.

## Steps

1. Follow Official marketplace in `AGENTS.md`. When a listed plugin already does the job, install it, follow its skill, and stop.
2. When the user wants a skill under `.grok/skills/` and not a marketplace plugin, follow the session's `create-skill` and stop.
3. Add a component only when the pages you opened say it delivers this job. A skill is the usual delivery.
4. Keep secrets, tokens, and account names out of the plugin. A public MCP URL can go in `.mcp.json`. The README names that endpoint.
5. In a marketplace repo, register the plugin and update `.grok-plugin/plugin-index.json` so it lists the components you added and no others.
6. Run `grok plugin validate` on the plugin directory when `grok` is on `PATH`, and fix load errors. When it is not, say the CLI check did not run.
7. Fill the rubric in the reply. The behavior test is install, `grok inspect`, `grok mcp doctor` when the plugin has an MCP server, and `/joules-plugins` on a safe input. Run that test only after the user asks to install.

## Return

Return the plugin path, the doc URLs you opened, the relationship (exclusive, on top, or without), and the rubric matrix. Do not write a scratch result, a log, or a session copy.

## Approval

Publish, tag, push, or install for anyone else only when the user asked.
