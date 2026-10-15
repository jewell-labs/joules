---
description: Copy the web-app template into a directory after its questions are answered.
argument-hint: "[destination]"
---

Create one app by running this plugin's `scripts/create.sh`. The plugin root is the directory that contains `commands/create.md`. From this file, the script is `../scripts/create.sh`.

Read `scripts/create.sh --help`. Ask the user for every answer that is still missing. Do not guess a destination, a name, or a title. Pass the answers as flags. The script copies `template/` and fills those answers in.

Do not install, deploy, push, or spend unless the user asked. Return the destination path the script prints.
