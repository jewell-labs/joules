# Web app example

This is the compliant TanStack Start + Solid app. `plugins/web-app/tests/check.sh` is the list of failures. A test copies this tree, runs one script in `plugins/web-app/tests/mutations/`, and asks `/web-app` to make the copy compliant again.

Solid UI, D1 for application records, passkeys with phone OTP as the fallback, and a service worker that caches the offline page. Maps are added only when the app reads the user's location, and then with `src/pwa/map-cache.ts`. Poll first. Add a Durable Object only for realtime.

The network calls this app can cause are GitHub, Cloudflare Workers, and Stripe when the app takes money. Credentials stay in a gitignored `.dev.vars` or in `wrangler secret`. `.dev.vars.example` names `SESSION_SECRET` and has no value. License is MIT, the same terms as the repository `LICENSE`.

Account steps sit outside this tree: a protected `main` branch, and Workers Builds from `main` with a preview on each pull request. Follow `cloudflare-web-apps` for the scaffold and `wrangler` for deploy commands.

`npm run build` is the production build. `npm run cf-typegen` writes `worker-configuration.d.ts` for the D1 binding. That file is generated and gitignored.
