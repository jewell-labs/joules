---
name: revise
description: >
  Raise failed rubric rows on one plugin, then validate again.
  Use when updating a plugin or running /update.
---

# Revise

1. Follow `../judge/SKILL.md` and keep that matrix. You may add roadmap rows and empty run-record rows. Do not copy points into them.
2. Edit only rubric rows that scored 0, and only the files that raise those rows.
3. Run `grok plugin validate` again when `grok` is on `PATH`, and fill the Rubric section of `../judge/SKILL.md` again.

Return the path, the rows you changed, and the new matrix.
