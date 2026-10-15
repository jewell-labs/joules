---
name: create-plugin
description: >
  Create one Grok marketplace plugin for one job from the current docs at
  docs.x.ai. Use when the user wants to add, scaffold, or author a plugin
  in a marketplace, including its skill, command, agent, hook, or MCP server.
when-to-use: >
  create a plugin, new marketplace plugin, scaffold a plugin, add a
  marketplace entry, author a Grok plugin
argument-hint: "[plugin name or the job it does]"
metadata:
  author: Joules
  short-description: Create a marketplace plugin from the current docs
---

# Create a plugin

Create one marketplace plugin that does one job. Follow the Build a plugin section of Joules `AGENTS.md`. In this repository it is at the repo root. Otherwise read `https://raw.githubusercontent.com/jewell-labs/joules/main/AGENTS.md`.

When that file does not load, open the pages Build a plugin names: https://docs.x.ai/llms.txt, the skills and plugins chapters shipped with `grok`, https://github.com/xai-org/plugin-marketplace/blob/main/CONTRIBUTING.md, and https://docs.x.ai/grok-bot/skills-routines-and-automations. Use the docs MCP when it is connected. When this plugin's `.mcp.json` URL differs from the MCP endpoint on https://docs.x.ai/llms.txt, update the file and follow the current MCP page.

## Inputs

You need the job and a kebab-case name. Ask once if either is missing.

A path the user names wins. When the current directory contains `.grok-plugin/marketplace.json` and `plugins/`, the default path is `plugins/<name>/`.

## Steps

1. Follow Official marketplace in `AGENTS.md`. When a listed plugin already does the job, install it, follow its skill, and stop.
2. When the user wants a skill under `.grok/skills/` and not a marketplace plugin, follow the session's `create-skill` and stop. The tools for that stop are the ones that skill names.
3. Open the pages in Build a plugin before writing a file.
4. Add a component only when those pages say it is how this job is delivered. A skill is the usual delivery. Write that skill as Build a plugin describes. Package the directory as Catalog describes.
5. Keep secrets, tokens, and account names out of the plugin. A public MCP URL can go in `.mcp.json`. The README names that endpoint.
6. In a marketplace repo, register the plugin and update `.grok-plugin/plugin-index.json` so it lists the components you added and no others.
7. Run `grok plugin validate` on the plugin directory when `grok` is on `PATH`, and fix load errors. When it is not, say the CLI check did not run.
8. When the score-plugin skill is available, score the new plugin. Otherwise say it is not scored yet.
9. The behavior test is install, `grok inspect`, `grok mcp doctor` when the plugin has an MCP server, and `/<skill>` on a safe input. Run it only after the user asks to install.

## Other hosts

The procedure you write has to stay usable in Grok Build, grok.com, and a Grok Bot. When the user wants another host, follow the connector and Grok Bot pages you already opened. Connect MCP by the public HTTPS URL those pages give. When a page does not yet say how a marketplace plugin loads on that host, say so and leave one procedure.

## Return

Return the plugin path, the doc URLs you opened, the relationship (exclusive, on top, or without), the validate result, and the score when you ran one.

## Approval

Publish, tag, push, or install the new plugin for anyone else only when the user asked. Installing a matching official marketplace plugin is the setup step in `AGENTS.md`.
