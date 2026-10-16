---
name: starter
description: >
  Write one Void pages app from a command sheet by running void init and the
  three edits no Void command writes. Use when creating a web app in an empty
  directory, or running /create. Finish within five minutes.
---

# Starter

Use this after a plan reply. Finish in one turn, within five minutes. Do not open a page. Do not read a Cloudflare skill. Do not call the language server.

Inside the app, `pnpm exec void`. A repeated command is `pnpm run <name>`. Do not run `python` or `python3`. Runnable code is TypeScript, run with `node <file>.ts`.

When the message has no plan reply, follow the `decide` skill and stop.

When the prompt forbids a wizard, do not run `void init`. Its `--help` has no flag for the toolchain, the interface, or the starter. Return that question, write nothing, and stop.

Otherwise execute the sheet.

1. Run `pnpm exec void init` with the sheet's flag, `--git` or `--no-git`, in the destination. Do not pass `--github` or `--tsconfig`. Do not run `void init --help`. The flag is already on the sheet. When the sheet's answers are Vite+, Solid, Static Pages, and Skip deployment setup, answer the menu from a directory that is not the destination. `pnpm add node-pty` there. When install ignores that build, run `pnpm approve-builds node-pty`. Set `"type": "module"` in that directory's `package.json`. Write `menu.ts` that spawns that init through `node-pty` at 120 columns and 40 rows. The package directory is the `pnpm list node-pty --parseable` line that ends in `node_modules/node-pty`. If the helper in that package is not executable, set the executable bit on that file. Send Enter for Vite+. Send three Downs and Enter for Solid. Send three Downs and Enter for Static Pages. Send two Downs and Enter for Skip deployment setup. A screen that prints one character per line is the wrong width. Stop that process and run this step once more at the wide size. Leave every file the command writes. Delete the menu directory before you finish. When init has installed dependencies, do not run `pnpm install` again.
2. Set `name` in `package.json` to the package name. Set `head.title` in `void.config.ts` to the title. Do not rewrite the rest of that file. When the sheet asks for a Cloudflare project, set `cloudflare.name` to the package name in that same file.
3. Write `routes/mcp.ts`:

```ts
import { defineHandler } from "void";

const tools = [{ name: "healthcheck", annotations: { readOnlyHint: true } }];

export const GET = defineHandler(() => {
  return { tools };
});
```

4. Write `deploy-stop.ts`. It prints `Stopped. The next part is Deploy. Command: pnpm exec void deploy --platform cloudflare` and exits 2. It does not call that command. The `deploy` script is `node deploy-stop.ts`.
5. When `node_modules/void` is missing, run `pnpm install`. Then `pnpm exec void prepare`, then `pnpm run build`. Then run `pnpm run deploy` and expect exit 2. Do not deploy.

Do not follow `/deploy`. Return the destination, that `/validate` is next, and that deploy waits until the prompt says to deploy. Name no secrets and no worker URL.

A table, route, middleware, cron, or queue on the sheet is one `pnpm exec void gen` or `pnpm exec void db` line, run as the `feature` skill says, in this same turn. A page, stream, or KV key is the one question. Stop before inventing that file.
