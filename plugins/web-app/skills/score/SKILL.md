---
name: score
description: >
  Score one web-app README prompt and write that run-record row. Use when
  evaluating a plugin run or running /evaluate.
---

# Score

The table shape is the Records section of the joules-plugins skill `judge`. Write When, Result, the rubric points, and Usage on the one row the user named, or the first row whose Result is empty. Write Version and URL only when this run created them. Leave Id, Prompt, Rows, and Expect unchanged. On each roadmap id in Rows, drop this run's old token and add `<run id>: pass` when Result equals Expect, or `<run id>: fail` when it does not. Leave every other roadmap cell unchanged.

When the prompt says not to write the row and not to follow it, name the run record and stop. Do not open a page and do not run a command.

A prompt that says not to deploy is scored from the source and from the `check` skill. A prompt that asks for a Worker is scored from the live URL, the live `/mcp` call, and `pnpm exec void project status`. A missing grant leaves the row empty. Do not invent a score.

## Rubric

A row is its points or 0. A row for a destination, table, stream, page read, or layout rule the prompt does not ask for is full when the app omits it too. Pass means every row is full. The maximum is 100. Score only from a file you opened or a command you ran.

| Row | Points | Evidence |
| --- | --- | --- |
| Create | 10 | `package.json` name is `eval-app`. `void.config.ts` title is the title in that prompt. No auth policy file, no `void/auth`, and no `void/db` import unless the prompt asked for a database or auth. No `.joules-answers.json`. |
| Absent | 10 | Tree minus `node_modules` has no `stripe`, `Stripe`, `passkey`, or `phone-otp` unless that prompt names one, and has no workflow file. |
| Stack | 10 | The Worker name is the package name. Nothing attaches this Worker to another project. No account id is committed. No `src/server.ts` and no `@tanstack/solid-start`. A mention of that package only inside a lockfile does not fail this row. A generated Cloudflare file the Void docs say to gitignore does not fail this row when it is gitignored. |
| Pages | 15 | Every destination the prompt names is one page plus a server companion. Every state the prompt names is rendered by that page and is not its own route. The offline page exists when the prompt keeps it. |
| Data | 10 | Every table the prompt names is one schema file re-exported from the schema entry. The named loader reads that table. No table in the prompt means no `db` directory. |
| Streams | 10 | Every stream the prompt names has the publisher action and the subscribing page that prompt names. No stream in the prompt means no live-stream module. |
| Health | 5 | A `healthcheck` tool at `/mcp`. No OAuth. When the prompt asked for a Worker, a live call to the deployed `/mcp` returns that tool and any page read the prompt named, and no other tool. |
| Release | 10 | When the prompt asks for a Worker: the worker URL answers. `pnpm exec void project status` lists the deployed version. The tree has no workflow file and no source archive. When the prompt says not to deploy: `pnpm run deploy` exits 2, does not deploy, and names `pnpm exec void deploy --platform cloudflare` as the next command. The check has no Cloudflare token or account id. A gitignored `void.lock.json` does not fail this row. A committed copy fails when it contains an account id. |
| Tools | 5 | No Playwright, Puppeteer, or Selenium dependency. When the prompt names a page read, each such page registers one read tool the way the current WebMCP spec says, and that same read is a tool at `/mcp`. |
| Design | 5 | Each layout rule in the prompt is visible in the page source. A waiting state the prompt names is not styled as a failure. An unavailable state the prompt names does not invent values. A prompt with no layout rule is full when Pages is full. |
| Validated | 10 | The check skill exited 0 and did not deploy. |
