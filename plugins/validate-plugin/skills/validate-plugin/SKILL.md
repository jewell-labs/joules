---
name: validate-plugin
description: >
  Validate a Grok plugin against the current docs at docs.x.ai, grok plugin
  validate, and the xAI marketplace contributing guide. Use when the user
  wants to check, lint, or verify a plugin before it is published.
when-to-use: >
  validate a plugin, lint a plugin, check a plugin manifest,
  verify a marketplace plugin
argument-hint: "[path to the plugin]"
metadata:
  author: Joules
  short-description: Validate a plugin against the current docs
---

# Validate a plugin

Check one plugin. Report each check. Leave the files unchanged unless the user asked you to fix them.

Follow the Build a plugin section of Joules `AGENTS.md`. In this repository it is at the repo root. Otherwise read `https://raw.githubusercontent.com/jewell-labs/joules/main/AGENTS.md`.

When that file does not load, open https://docs.x.ai/llms.txt, the skills and plugins chapters shipped with `grok`, https://github.com/xai-org/plugin-marketplace/blob/main/CONTRIBUTING.md, and https://docs.x.ai/grok-bot/skills-routines-and-automations. Use the docs MCP when it is connected. When this plugin's `.mcp.json` URL differs from the MCP endpoint on that index, update the file and follow the current MCP page.

## Steps

1. Use the path the user gave. Otherwise use the nearest directory that contains a plugin manifest or `skills/`.
2. When `grok` is on `PATH`, run `grok plugin validate` on that directory. When the CLI is missing, record that the load check did not run.
3. Read the plugin files, the marketplace entry, and `.grok-plugin/plugin-index.json` when this repo has one. Open the pages Build a plugin names before you judge.

Fail the plugin when any of these is true. Name the source on every line: the validate command, a docs URL, the contributing page, or Build a plugin.

- `grok plugin validate` exits non-zero, or `grok` is installed and the command was skipped.
- The plugin repeats an official catalog entry, or it is not exclusive, on top of a named official plugin, or still useful without that plugin.
- For a plugin in this repo: README, manifest, license, or marketplace entry is missing.
- `plugin-index.json` lists a component the directory does not have, or omits one it has.
- A skill is missing when, inputs, steps, how to check, what to return, or what a person must approve, or its description does not say what it does and when it runs.
- A skill pastes a contract the docs own, or sets frontmatter the current page says is ignored.
- The contributing security section, as read this session, would reject it.
- Keywords are generic terms that contributing page tells authors not to use.

## Return

Return an overall pass or fail, then the checks. A missing CLI load check fails the plugin when it is meant for Grok Build and `grok` was available.

## Approval

Fixing, publishing, tagging, or pushing waits for the user to ask.
