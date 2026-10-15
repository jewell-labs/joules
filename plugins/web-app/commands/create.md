---
description: Copy the web-app template into a directory after its questions are answered.
argument-hint: "[destination]"
---

Create one app by running this plugin's `scripts/create.sh`. The plugin root is the directory that contains `commands/create.md`. From this file, the script is `../scripts/create.sh`.

Read `scripts/create.sh --help`. Ask these three questions, one per line, and then stop:

Where should the app go?
What is the package name?
What is the title?

Do not guess them, do not write the app, and do not run a shell command until each answer is in the conversation. Pass the answers as `--dest`, `--name`, and `--title`. The script copies `template/` and fills those answers in. The copy includes the release workflow and the worker's public HTTP healthcheck. Branch names and Wrangler commands stay in the copy's `README`, not in this command.

Do not install, deploy, push, or spend unless the user asked. Return the destination path the script prints.
