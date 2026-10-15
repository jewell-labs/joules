# __APP_TITLE__

TanStack Start and Solid on Cloudflare Workers. Application records are in D1. Sign-in is passkeys, with phone OTP as the fallback, and sessions are in D1. The service worker caches the offline page. Add `src/pwa/map-cache.ts` only when the app reads the user's location. Poll first. Add a Durable Object only for realtime.

Network calls this app can cause are GitHub, the Cloudflare API when Wrangler deploys, an HTTPS webhook the user supplies, and Stripe when the app takes money. Credentials stay in a gitignored `.dev.vars`, in `wrangler secret`, or in the CI provider's secrets. `.dev.vars.example` names `SESSION_SECRET` and `DEPLOY_WEBHOOK_URL` and has no values. License is MIT, the same terms as the Joules repository `LICENSE`.

`.github/workflows/release.yml` runs on every push and calls `scripts/release.sh`. That script deploys only when the branch is a key in `deploy/branches.json`. The value is the Wrangler environment (`main` is `production`, `staging` is `staging`; add other branches in that file). The same branch names are the ones to connect as Workers Builds triggers. Workers Builds and this workflow must not both deploy one branch. The file is the switch: remove a branch from the file to leave it to Workers Builds, or disconnect Workers Builds for a branch this file deploys.

The script builds with `CLOUDFLARE_ENV` set to that environment, then runs `wrangler deploy`. The Vite plugin selects the environment at build time. Deploy commands stay in the `wrangler` skill. Product choice stays in the `cloudflare` skill. https://developers.cloudflare.com/workers/vite-plugin/reference/cloudflare-environments/ https://developers.cloudflare.com/workers/ci-cd/builds/ https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/

The version for a deploy is the `package.json` version plus the short git sha. It is a deploy tag and message, and an `APP_VERSION` var. The workflow does not commit it.

After a successful deploy, `scripts/notify.sh` POSTs JSON to `DEPLOY_WEBHOOK_URL`: app name, branch, environment, version, and deploy result. The URL is never committed. An empty URL fails the step. No connected Cloudflare MCP tool sends that webhook, so the workflow does not pretend one did. Workers Builds can also notify through event subscriptions when Builds is what deploys the branch: https://developers.cloudflare.com/workers/ci-cd/builds/event-subscriptions/

Connecting the Git repository, creating a live D1 database for each environment, and setting `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `DEPLOY_WEBHOOK_URL` on the CI provider are account steps. The `database_id` in `wrangler.jsonc` is a placeholder, including under `env.production` and `env.staging`. Bindings are not inherited, so each environment has its own copy. A file in this tree is not a live Cloudflare connection.

`npm test` runs the app tests. `scripts/verify.sh` checks the production build, the PWA files, the Solid server entry, and that `src` has no secret-looking strings. `scripts/screenshot.sh` captures `/` and `/offline.html` from `npm run preview`. The workflow uploads those pictures. `npm run build` is the production build. `npm run cf-typegen` writes `worker-configuration.d.ts` for the D1 binding. That file is generated and gitignored.
