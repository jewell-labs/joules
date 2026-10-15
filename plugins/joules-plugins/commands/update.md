---
description: Raise failed rubric rows on one plugin, then validate again.
argument-hint: "[plugin path]"
---

1. Follow `commands/evaluate.md` and keep that matrix.
2. Edit only rows that scored 0, and only the files that raise those rows.
3. Run `grok plugin validate` again when `grok` is on `PATH`, and fill the Rubric section of `../skills/author/SKILL.md` in the reply again.

Return the path, the rows you changed, and the new matrix.
