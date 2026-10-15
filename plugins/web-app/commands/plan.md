---
description: Map a web app request onto create.sh flags, or ask one unknown.
argument-hint: "[what to create]"
---

Plan one app. The plugin root is the directory that contains `commands/plan.md`. From this file, the script is `../scripts/create.sh`.

1. Run `scripts/create.sh --help`.
2. Map the user prompt onto flags that help lists. Use a printed default when the user did not override it.
3. An unknown is only one of these, taken from that help output: a required flag that is still empty, a companion help requires for a value already chosen, or a phrase that fits two listed values. One companion set is one question. A default is not a question. A bare "create a web app" asks only required flags that have no default, one per turn.
4. When one unknown remains, ask that question and stop.
5. When none remain, return one argv line that `commands/create.md` can run.

Return the argv, or the one question. Do not write a file. Do not create the app.
