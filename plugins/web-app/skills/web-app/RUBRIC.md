# Rubric

Score the app at `DEST` from its source and from the validate return. A row is its points or 0. Pass means every row is full. The maximum is 100.

Do not open an answers file or a session log. The README table is the record.

| Row | Points | Evidence |
| --- | --- | --- |
| Create | 20 | `package.json` name is `eval-app`. `void.config.ts` title is `Eval App`. No auth policy file, no `void/auth`, no `void/db` import, no `.joules-answers.json`. |
| Absent | 15 | Tree minus `node_modules` has no `stripe`, `Stripe`, `passkey`, or `phone-otp`. |
| Stack | 20 | Cloudflare target through `workerName`. No `account_id`, `wrangler.jsonc`, `src/server.ts`, or `@tanstack/solid-start`. Vite calls `voidPlugin()` and `voidSolid()`. |
| Health | 15 | One `healthcheck` tool at `/mcp`. No OAuth. |
| Release | 15 | Deploy job runs `npx void deploy --platform cloudflare`. Check job has no Cloudflare token or account id. `npm run deploy` prints that line and exits 2. `void.lock.json` is absent, or it only names the worker and a compatibility date. |
| Validated | 15 | Both branch checks from the validate return exited 0 and did not deploy. |
