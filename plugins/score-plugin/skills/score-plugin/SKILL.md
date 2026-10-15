---
name: score-plugin
description: >
  Score a Grok plugin from 0 to 100 against the current docs at docs.x.ai
  and the xAI marketplace contributing guide. Use when the user wants a
  score, a quality review, or a best-practices check of a plugin.
when-to-use: >
  score a plugin, rate a plugin, review plugin quality,
  best practices for a Grok plugin
argument-hint: "[path to the plugin]"
metadata:
  author: Joules
  short-description: Score a plugin from 0 to 100
---

# Score a plugin

Score one plugin from 0 to 100. Follow the Build a plugin section of Joules `AGENTS.md`. In this repository it is at the repo root. Otherwise read `https://raw.githubusercontent.com/jewell-labs/joules/main/AGENTS.md`.

When that file does not load, open https://docs.x.ai/llms.txt, the skills and plugins chapters shipped with `grok`, https://github.com/xai-org/plugin-marketplace/blob/main/CONTRIBUTING.md, and https://docs.x.ai/grok-bot/skills-routines-and-automations. Use the docs MCP when it is connected. When this plugin's `.mcp.json` URL differs from the MCP endpoint on that index, update the file and follow the current MCP page.

Leave the files unchanged unless the user asked you to fix them.

## Steps

1. Use the path the user gave. Otherwise use the nearest directory that contains a plugin manifest or `skills/`.
2. Open the pages Build a plugin names, including the contributing page, before you score Conventions or Safety.
3. When `grok` is on `PATH`, run `grok plugin validate` on the directory and keep the output. When the plugin is installed, read `grok inspect` for its components. When `grok` is absent, say so and score Load from the docs comparison.

## Rubric

Score only from evidence in the files and in the pages you opened. Quote the file, or say what is missing.

| Part | Points | Full points |
| --- | ---: | --- |
| Load | 20 | `grok plugin validate` passed. When the plugin is installed, `grok inspect` shows its components. A skipped validate run when `grok` is installed scores 0. |
| Future-proof | 20 | Contracts that can change are links to the pages you opened. Frontmatter the current page says is ignored is unset. A remote MCP URL is public HTTPS. |
| Exclusive | 15 | The official catalog result is exclusive, on top of a named plugin, or still useful without that plugin. A plugin that repeats an official entry scores 0. |
| Procedure | 20 | One workflow. The description says what it does, when it runs, and the slash name. The body states when, inputs, steps, how to check, what to return, and what a person must approve. The behavior test is named. |
| Conventions | 15 | The contributing conventions section you opened this session: name, homepage, README, manifest, license, brand-scoped keywords, and an index that matches the files. |
| Safety | 10 | The contributing security section you opened this session. Publishing, deleting, sending, and spending wait for the user. |

The Future-proof row scores 0 when the plugin states a field list, model id, tool-name list, or event list as the contract.

## Return

Return the total, each part with its score and the evidence, the doc URLs you used, and the single change that would raise the score the most.

## Approval

Fixing, publishing, tagging, or pushing waits for the user to ask.
