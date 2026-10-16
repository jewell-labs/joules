---
name: feature
description: >
  Add the tables, routes, crons, and queues a command sheet names by running
  void gen and void db. Use when extending a Void pages app, adding a page or
  a stream, or running /extend. Finish within five minutes.
---

# Feature

Use this after a plan reply. The directory must already be a Void app. When it is not, stop. The next command is `/create` or `/adopt`. Finish in one turn, within five minutes. Do not open a guide.

Inside the app, `pnpm exec void`. Do not run `python` or `python3`. Runnable code is TypeScript, run with `node <file>.ts`.

Add one surface from the sheet, then stop. A table is `pnpm exec void gen model` plus `pnpm exec void db generate`. A cron, a queue, or a route is its one `void gen` line. A second surface stops you. One question: which surface is first? Read a line's `--help` only when the sheet left the arguments blank. Leave the files the command writes. Do not invent a page, a stream, a KV key, auth, or a payment.

`void gen --help` provides `model`, `migration`, `route`, `middleware`, `ssr`, `cron`, and `queue`. A page, a live stream, or a KV key has no command. That piece is the one question. Stop. Do not write it yourself. `component` is listed and does not write a page. Do not run it for a page, a stream, or a KV key.

When `void gen model` asks which validator to use, answer from a directory that is not the app. `pnpm add node-pty` there. When install ignores that build, run `pnpm approve-builds node-pty`. Set `"type": "module"` in that directory's `package.json`. Write `menu.ts` that spawns the sheet's model line through `node-pty` at 120 columns and 40 rows. The package directory is the `pnpm list node-pty --parseable` line that ends in `node_modules/node-pty`. If the helper in that package is not executable, set the executable bit on that file. The highlighted line starts at Valibot. Three Downs and Enter select No validation. A screen that prints one character per line is the wrong width. Stop that process and run this step once more at the wide size. Leave the files the command writes. Delete the menu directory before you finish.

When the sheet names a page read, register one read tool for that page and serve the same read from `routes/mcp.ts` beside the healthcheck. No OAuth. The spec is https://webmachinelearning.github.io/webmcp. Skip this paragraph when the sheet names no page read.

Keep the healthcheck. Do not add a workflow, an account id, or a second framework. Then follow the `check` skill. Return the paths you added and any named piece that is still the one question.

Call the host language server only when a symbol from one of these commands is in doubt. When that server is off, continue. Do not stop the five minutes to enable it.
