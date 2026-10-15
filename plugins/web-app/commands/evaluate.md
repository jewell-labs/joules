---
description: Score the README prompt by planning, creating, and validating, then write the table.
argument-hint: "[destination to keep]"
---

Evaluate the Prompt cell in this plugin's `README.md`, between `<!-- eval-status:start -->` and `<!-- eval-status:end -->`.

1. Read that cell. Keep `{{dest}}` in the file. When the user did not name a directory, substitute a temporary directory for `{{dest}}` in the prompt you hand on.
2. Follow `commands/plan.md`, then `commands/create.md`, then `commands/validate.md`.
3. Run `scripts/evaluate.sh` with that destination, the branch statuses from the validate return, and the usage from this turn's summary when you can see it. The script rewrites only the marker block. It does not call `grok`, does not write a log, and does not create the app.
4. Return the row the script prints.

When the user did not name a directory to keep, delete the destination after the row is written. Do not deploy, push, or spend.
