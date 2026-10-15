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

Route one job to one command. Evaluate and validate are the same job. Ask once when the user did not say create, evaluate, update, or score.

| Job | Command |
| --- | --- |
| create | `commands/create.md` |
| evaluate or validate | `commands/evaluate.md` |
| update | `commands/update.md` |
| score | `commands/score.md` |

Judge with `RUBRIC.md` beside this file. Do not invent a second rubric.

A child session returns a summary. The parent uses that summary. It does not look for a results file.

Open the pages the create command names: https://docs.x.ai/llms.txt and the skills, plugins, and marketplace pages it lists, the skills and plugins chapters shipped with `grok`, https://github.com/xai-org/plugin-marketplace/blob/main/CONTRIBUTING.md, and https://docs.x.ai/grok-bot/skills-routines-and-automations. Follow the Build a plugin section of Joules `AGENTS.md`. In this repository that file is at the repo root. Otherwise read https://raw.githubusercontent.com/jewell-labs/joules/main/AGENTS.md.

Publish, tag, push, or install for anyone else only when the user asked.
