# web-app

Copies `template/` into a directory you choose, and makes a TanStack Start app on Cloudflare Workers pass `tests/check.sh`.

```bash
grok plugin install web-app --trust
```

The `create` command asks for the directory, the package name, and the title, then runs `scripts/create.sh`. That script copies the template. `/web-app` on an existing app runs the check and fixes only the lines it prints. License is MIT, the same terms as the repository `LICENSE`.

This plugin's files do not call a network endpoint and do not take a credential. An app it creates can call GitHub, the Cloudflare API when Wrangler deploys, an HTTPS URL the user puts in `DEPLOY_WEBHOOK_URL`, and Stripe when the app takes money. Those credentials stay with `wrangler` and `stripe`, in a gitignored `.dev.vars`, a Wrangler secret, or the CI provider, and out of the plugin. The template README names the release workflow.

From a checkout:

```bash
plugins/web-app/scripts/create.sh --dest PATH --name NAME --title TITLE
```

## Tests

`tests/run.sh --check` confirms the template prints `ok`, that `scripts/create.sh` fills the name and title, that the copy has the release workflow and an unlisted branch does not deploy, and that each mutation makes the check fail. `tests/run.sh` copies the template, applies one mutation, and runs `/web-app` on that copy. The run passes when `tests/check.sh` prints `ok`. Logs go under `tests/logs/`.
