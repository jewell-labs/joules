---
description: Create a Void pages app from an argv the plan command returned.
argument-hint: "[destination]"
---

Create one app by running this plugin's `scripts/create.sh`. The plugin root is the directory that contains `commands/create.md`. From this file, the script is `../scripts/create.sh`.

When the message has no argv yet, follow `commands/plan.md` and stop.

Run `scripts/create.sh` with the argv from the plan return. Do not ask again. Flags on that command are the whole create contract.

Do not install beyond what the script does, and do not deploy, push, or spend unless the user asked. Return the destination path the script prints.
