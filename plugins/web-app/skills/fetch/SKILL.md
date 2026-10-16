---
name: fetch
description: >
  Put one worker version on this computer. Use when cloning a worker version
  or running /clone. This skill does not deploy.
---

# Fetch

The inputs are the worker name, a version id, and a destination. `live` means the version receiving traffic. Do not deploy.

Inside the app, `pnpm exec void`.

When no copy of the app is on this computer, stop. The next step is the git checkout the user names. Do not run the grant commands when the prompt says not to deploy or spend.

When the app is already here, `pnpm exec void project status` marks it `live`. Do not hand-write `.void/project.json`. When that file is missing, the next command is `void connect` with the host the user named. Do not invent the host.

Return the destination and the version id.
