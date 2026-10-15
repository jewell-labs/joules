# __APP_TITLE__

TanStack Start and Solid on Cloudflare Workers. Application records are in D1. Sign-in is passkeys, with phone OTP as the fallback, and sessions are in D1. The service worker caches the offline page. Add `src/pwa/map-cache.ts` only when the app reads the user's location. Poll first. Add a Durable Object only for realtime.

Network calls this app can cause are GitHub, Cloudflare Workers, and Stripe when the app takes money. Credentials stay in a gitignored `.dev.vars` or in `wrangler secret`. `.dev.vars.example` names `SESSION_SECRET` and has no value. License is MIT, the same terms as the Joules repository `LICENSE`.

A protected `main` branch, and Workers Builds from `main` with a preview on each pull request, are account steps. They are not files in this tree. Follow `cloudflare-web-apps` for the Workers wiring and `wrangler` for deploy commands.

`npm run build` is the production build. `npm run cf-typegen` writes `worker-configuration.d.ts` for the D1 binding. That file is generated and gitignored.
