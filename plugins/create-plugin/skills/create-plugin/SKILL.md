---
name: create-plugin
description: >
  Create one Grok plugin for one job from the current docs at docs.x.ai.
  Use when the user wants to add, scaffold, or author a plugin, skill,
  command, agent, hook, or MCP server.
when-to-use: >
  create a plugin, new plugin, scaffold a skill, add a marketplace entry,
  author a Grok plugin
argument-hint: "[plugin name or the job it does]"
metadata:
  author: Joules
  short-description: Create a plugin from the current docs
---

# Create a plugin

Create one plugin that does one job. Write files that match the docs you open in this session.

## Contract

Follow the Official marketplace and Future-proof sections of Joules `AGENTS.md`. In this repository it is at the repo root. Otherwise read `https://raw.githubusercontent.com/jewell-labs/joules/main/AGENTS.md`.

When that file does not load:

1. Fetch https://docs.x.ai/llms.txt and open the pages for every component you will add.
2. When a docs MCP server is connected, list its tools and read the pages through them.
3. When this plugin's `.mcp.json` URL differs from the MCP endpoint on that index, update the file and follow the current MCP page.
4. Search https://github.com/xai-org/plugin-marketplace `.grok-plugin/marketplace.json`. When an entry already does the job, install that plugin and stop.

When the destination is the Joules marketplace, also follow the Catalog section of that file.

## Inputs

You need the job and a kebab-case name. Ask once if either is missing.

A path the user names wins. When the current directory contains `.grok-plugin/marketplace.json` and `plugins/`, the default path is `plugins/<name>/`.

## Steps

1. Apply the Official marketplace section. When a listed plugin already does the job, install it, follow its skill, and stop.
2. Read the destination marketplace index when one exists, and match its entry shape.
3. Add a component only when the pages you opened say it is how this job is delivered. A skill is the usual delivery. Put the manifest where those pages accept it.
4. Write the skill as a procedure: when to use it, inputs, steps, how to check the result, what to return, and what a person must approve. Link the living docs page for any contract that can change.
5. Keep secrets, tokens, and account names out of the plugin. A public MCP URL can go in `.mcp.json`.
6. In a marketplace repo, register the plugin and update the component index so it lists what you added.
7. When `grok` is on `PATH`, run `grok plugin validate` on the plugin directory and fix load errors. When it is not, say the CLI check did not run.
8. When the score-plugin skill is available, score the new plugin. Otherwise say it is not scored yet.

## Other hosts

The procedure you write has to stay usable in Grok Build, grok.com, and a Grok Bot.

When the user wants it on grok.com or a Grok Bot, open the connector and Grok Bot pages from the same docs index and follow them. Connect MCP by the public HTTPS URL those pages give. If a page does not yet say how a marketplace plugin loads on that host, say so and leave the procedure as one copy.

## Return

Return the plugin path, the doc pages you followed, the validate result, and the score when you ran one.

## Approval

Publish, tag, push, or install the plugin for anyone else only when the user asked.
