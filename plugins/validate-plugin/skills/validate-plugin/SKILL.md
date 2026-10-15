---
name: validate-plugin
description: >
  Validate a Grok plugin against the current docs at docs.x.ai and
  grok plugin validate. Use when the user wants to check, lint, or
  verify a plugin before it is published.
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

## Contract

Follow the Official marketplace, Future-proof, and Catalog sections of Joules `AGENTS.md`. In this repository it is at the repo root. Otherwise read `https://raw.githubusercontent.com/jewell-labs/joules/main/AGENTS.md`.

When that file does not load:

1. Fetch https://docs.x.ai/llms.txt and open the pages for the components this plugin contains.
2. When a docs MCP server is connected, list its tools and read the pages through them.
3. When this plugin's `.mcp.json` URL differs from the MCP endpoint on that index, update the file and follow the current MCP page.
4. Judge with these stand-in rules: one job, no secrets, a link to the docs page where a copied schema would have been, and no repeat of a plugin in https://github.com/xai-org/plugin-marketplace `.grok-plugin/marketplace.json`.

## Steps

1. Use the path the user gave. Otherwise use the nearest directory that contains a plugin manifest or `skills/`.
2. When `grok` is on `PATH`, run `grok plugin validate` on that directory. A non-zero exit is a failure. When the CLI is missing, record that the load check did not run.
3. Read the plugin. Apply the Official marketplace section. Fail when the plugin repeats an official entry. Pass exclusive, on top, or without, and name which one. Apply any other requirement only when a page you opened, or the Catalog section, states it.
4. For each check, write pass or fail and name the source: the validate command, a docs URL, or the Catalog section.

## Return

Return an overall pass or fail, then the checks. A missing CLI load check is a fail only when the plugin is meant for Grok Build and `grok` was available.

## Approval

Fixing, publishing, tagging, or pushing waits for the user to ask.
