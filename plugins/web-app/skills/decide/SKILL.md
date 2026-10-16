---
name: decide
description: >
  Return the command sheet for a Void pages app, or ask one question.
  Use when planning a web app, settling the package, title, and interface,
  or running /plan. This skill writes nothing.
---

# Decide

Return a command sheet, or ask one question. Do not write a file. Do not open a page. Do not scaffold.

When the prompt names the package, the title, the interface, and the destination, those are the decisions. Return the sheet and stop.

A person who asks to keep TanStack stops here and follows `cloudflare-web-apps`.

When the prompt names auth, a passkey, a phone code, or Stripe, stop. The next step is the official plugin that owns that product. When the prompt names more than one addition, stop. One question: which surface is first?

The cycle is `starter` when the destination is empty or new. It is `adopt` when the destination already has files and no `void.config.ts`. It is `feature` when `void.config.ts` is already there. A prompt that says to clone uses `/clone`. A prompt that says to deploy uses `/deploy` after `/validate`.

The sheet is the reply:

- Cycle
- Destination, package name, title, interface
- `void init` flag: `--git` when the prompt asks for a repository, otherwise `--no-git`. Never `--github` or `--tsconfig`
- Wizard answers, in order: Vite+ unless the prompt names Vite. The named interface. Static Pages unless the prompt names D1, PostgreSQL, or MySQL. Skip deployment setup when the prompt does not deploy
- `pnpm exec void gen` and `pnpm exec void db` lines, only for a table, route, middleware, cron, or queue the prompt names. `void gen --help` has no page, stream, or KV command. That piece is the one question instead of a line
- Edits: `package.json` name, `head.title`, `routes/mcp.ts` with one read-only `healthcheck` and no OAuth
- Deploy script: `deploy-stop.ts` run by `node deploy-stop.ts`. It prints `pnpm exec void deploy --platform cloudflare` and exits 2. Do not use `python` or `node -e`
- Check: `pnpm install`, `pnpm exec void prepare`, `pnpm run build`
- Next command: `/create`, `/adopt`, or `/extend`

One unknown stops the sheet. One question, then stop. A printed default is not a question. A product Void has no command for is the question. Do not browse docs to answer it.

`void migrate` appears only when the destination is already a legacy Void app whose settings are not in `void.config.ts`. It does not convert another language.
