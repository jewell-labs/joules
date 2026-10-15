---
name: joules-plugins
description: >
  Create, evaluate, update, or score one Grok marketplace plugin from the
  current docs and the Joules rubric. Use when the user wants to add, check,
  change, or rate a plugin, including /joules-plugins.
when-to-use: >
  create a plugin, evaluate a plugin, validate a plugin, update a plugin,
  score a plugin, /joules-plugins
argument-hint: "[create|evaluate|update|score] [name or path]"
metadata:
  author: Joules
  short-description: Create, evaluate, update, or score a plugin
---

# Joules plugins

Do one of four jobs: create, evaluate, update, or score. Evaluate and validate are the same job. Follow the Build a plugin section of Joules `AGENTS.md`. In this repository it is at the repo root. Otherwise read `https://raw.githubusercontent.com/jewell-labs/joules/main/AGENTS.md`.

When that file does not load, open the pages Build a plugin names: https://docs.x.ai/llms.txt, the skills and plugins chapters shipped with `grok`, https://github.com/xai-org/plugin-marketplace/blob/main/CONTRIBUTING.md, and https://docs.x.ai/grok-bot/skills-routines-and-automations. Use the docs MCP when it is connected. When this plugin's `.mcp.json` URL differs from the MCP endpoint on https://docs.x.ai/llms.txt, update the file and follow the current MCP page.

Judge with `RUBRIC.md` beside this file. Do not invent a second rubric.

## Inputs

You need the job. Ask once when the user did not say create, evaluate, update, or score.

Create also needs the job the new plugin does and a kebab-case name. Evaluate, update, and score need a plugin path. Ask once for anything missing.

A path the user names wins. When the current directory contains `.grok-plugin/marketplace.json` and `plugins/`, create uses `plugins/<name>/`.

## Create

1. Follow Official marketplace in `AGENTS.md`. When a listed plugin already does the job, install it, follow its skill, and stop.
2. When the user wants a skill under `.grok/skills/` and not a marketplace plugin, follow the session's `create-skill` and stop.
3. Open the pages in Build a plugin before writing a file.
4. Add a component only when those pages say it delivers this job. A skill is the usual delivery. Package the directory as Catalog describes.
5. Keep secrets, tokens, and account names out of the plugin. A public MCP URL can go in `.mcp.json`. The README names that endpoint.
6. In a marketplace repo, register the plugin and update `.grok-plugin/plugin-index.json` so it lists the components you added and no others.
7. Run `grok plugin validate` on the plugin directory when `grok` is on `PATH`, and fix load errors. When it is not, say the CLI check did not run.
8. Fill `RUBRIC.md`. The behavior test is install, `grok inspect`, `grok mcp doctor` when the plugin has an MCP server, and `/joules-plugins` on a safe input. Run that test only after the user asks to install.

## Evaluate

Leave the files unchanged.

1. Run `grok plugin validate` when `grok` is on `PATH`. When it is missing, record that Load was not run.
2. Read the plugin, its marketplace entry, and `.grok-plugin/plugin-index.json` when the repo has one.
3. Open the pages Build a plugin names, then fill every applicable `RUBRIC.md` row.
4. Pass only when every applicable cell is full. Name the source on every failed row: the validate command, a docs URL, the contributing page, or Build a plugin.

## Update

1. Evaluate first and keep that matrix.
2. Edit only rows that scored 0, and only the files that raise those rows.
3. Run `grok plugin validate` and fill `RUBRIC.md` again.

## Score

Leave the files unchanged. Follow Evaluate, and report points instead of stopping at pass or fail.

## Other hosts

The procedure you write stays one procedure for Grok Build, grok.com, and a Grok Bot. Connect MCP by the public HTTPS URL the pages you opened give. When a page does not yet say how a marketplace plugin loads on that host, say so.

## Return

Return the job, the plugin path, the doc URLs you opened, and the rubric matrix. Create also returns the relationship (exclusive, on top, or without). Score also returns the total and the single change that would raise it the most.

## Approval

Publish, tag, push, or install for anyone else only when the user asked. Installing a matching official marketplace plugin is the setup step in `AGENTS.md`.
