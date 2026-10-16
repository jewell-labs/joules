---
name: check
description: >
  Run pnpm run build for a Void pages app. Use when validating an app or
  running /validate. This skill does not deploy.
---

# Check

Do not deploy.

An app has a `package.json`. When that file is absent, return fail and that path. Do not run a command. Do not create the directory.

1. Run `pnpm run build` in the directory.
2. When the prompt asked for tests and `package.json` has a `test` script, run `pnpm run test`.
3. Return pass or fail, and the check names. Pass means every command here exited 0. The next command is `/deploy` only when the prompt asked to deploy. Otherwise stop and name `pnpm exec void deploy --platform cloudflare`.
