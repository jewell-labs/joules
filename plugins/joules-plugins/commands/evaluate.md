---
description: Score one plugin against the Joules rubric without editing its files.
argument-hint: "[plugin path]"
---

Evaluate and validate are the same job. Leave the plugin files unchanged. The rubric is `../skills/joules-plugins/RUBRIC.md`.

1. Run `grok plugin validate` on the plugin path when `grok` is on `PATH`. When it is missing, record that Load was not run.
2. Read the plugin, its marketplace entry, and `.grok-plugin/plugin-index.json` when the repo has one.
3. Open the pages `commands/create.md` names, then fill every applicable rubric row in the reply. A missing row is a fail. State the evidence in the reply: the validate output, and a file you opened during the turn. Do not save that evidence beside the plugin.
4. Pass only when every applicable cell is full.

When the prompt came from this plugin's README table, write only that table. Keep the Prompt cell text. Put the points you just scored in the row.

Return the matrix, or the row you wrote.
