---
name: score-plugin
description: >
  Score a Grok plugin from 0 to 100 against the current docs at docs.x.ai.
  Use when the user wants a score, a quality review, or a best-practices
  check of a plugin.
when-to-use: >
  score a plugin, rate a plugin, review plugin quality,
  best practices for a Grok plugin
argument-hint: "[path to the plugin]"
metadata:
  author: Joules
  short-description: Score a plugin from 0 to 100
---

# Score a plugin

Score one plugin from 0 to 100. Read the current docs in this session and score against those pages. Leave the files unchanged unless the user asked you to fix them.

## Contract

Follow the Official marketplace and Future-proof sections of Joules `AGENTS.md`. In this repository it is at the repo root. Otherwise read `https://raw.githubusercontent.com/jewell-labs/joules/main/AGENTS.md`.

When that file does not load, fetch https://docs.x.ai/llms.txt, open the pages for the components in the plugin, and use the docs MCP when it is connected. When this plugin's `.mcp.json` URL differs from the MCP endpoint on that index, update the file and follow the current MCP page. Also search https://github.com/xai-org/plugin-marketplace `.grok-plugin/marketplace.json` before scoring One job.

## Steps

1. Use the path the user gave. Otherwise use the nearest directory that contains a plugin manifest or `skills/`.
2. Open the current pages for the components that plugin contains, including the skills page and the Grok Bot skills page.
3. When `grok` is on `PATH`, run `grok plugin validate` on the directory and keep the output. When it is not, the Current row below uses the docs comparison and you say the CLI was absent.

## Rubric

Score only from evidence in the files and in the pages you opened. Quote the file, or say what is missing.

| Part | Points | Full points |
| --- | ---: | --- |
| Current | 25 | Validate passed, or the CLI was absent and the files match the pages you opened. A skipped validate run when `grok` is installed scores 0. |
| Future-proof | 25 | Contracts that can change are links to the pages you opened, or reads through the docs MCP. A remote MCP URL is public HTTPS. The procedure still makes sense on grok.com and in a Grok Bot. |
| One job | 15 | The description, the skills, and the other files all serve one job. Full points also need the Official marketplace result: exclusive, on top of a named official plugin, or still useful without that plugin. A plugin that repeats an official entry scores 0. |
| Procedure | 20 | Each skill states when to use it, the inputs, the steps, how to check the result, what to return, and what a person must approve. Score this row against the skills pages you opened, including the Grok Bot page. |
| Safety | 15 | No secrets. Publishing, deleting, sending, and spending are gated on a person asking for that action. |

The Future-proof row scores 0 when the plugin states a field list, model id, tool-name list, or event list as the contract.

## Return

Return the total, each part with its score and the evidence, the doc URLs you used, and the single change that would raise the score the most.

## Approval

Fixing, publishing, tagging, or pushing waits for the user to ask.
