# web-app

Makes one TanStack Start app on Cloudflare Workers pass `tests/check.sh`. The passing tree is `examples/compliant`. A test copies that tree, runs one script in `tests/mutations/`, and asks `/web-app` to make the copy pass again.

```bash
grok plugin install web-app --trust
```

Then run `/web-app` on the app directory. License is MIT, the same terms as the repository `LICENSE`.

This plugin's files do not call a network endpoint and do not take a credential. An app it checks can call GitHub, Cloudflare Workers, and Stripe when the app takes money. Those credentials stay with `wrangler` and `stripe`, in a gitignored `.dev.vars` or a Wrangler secret, and out of the plugin.

## Tests

`tests/run.sh --check` confirms the example prints `ok` and that each mutation makes the check fail. `tests/run.sh` copies the example, applies one mutation, and runs `/web-app` on that copy. The run passes when `tests/check.sh` prints `ok`. Logs go under `tests/logs/`.
