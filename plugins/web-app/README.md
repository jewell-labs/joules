# web-app

Copies `template/` into a directory you choose. The copy is TanStack Start and Solid on Cloudflare Workers. It releases the branches it lists, and it serves one public HTTP healthcheck.

```bash
grok plugin install web-app --trust
```

The `create` command asks for the directory, the package name, and the title, then runs `scripts/create.sh`. That script copies the template. On an existing copy, `/web-app` runs that app's `npm test` and `scripts/verify.sh` and fixes only the lines they print. License is MIT, the same terms as the repository `LICENSE`.

This plugin's files do not call a network endpoint and do not take a credential. An app it creates can call GitHub, the Cloudflare API when Wrangler deploys, and an HTTPS URL the user puts in `DEPLOY_WEBHOOK_URL`. Any external bot can call the worker's `/mcp` healthcheck. That tool reads no secret, session, or database, and the repo stores no credential for it. Deploy credentials stay with `wrangler`, in a gitignored `.dev.vars`, a Wrangler secret, or the CI provider, and out of the plugin. The template README names the release workflow and the account steps.

From a checkout:

```bash
plugins/web-app/scripts/create.sh --dest PATH --name NAME --title TITLE
```

## Tests

`tests/run.sh` sends the prompt `create a web app`. The run fails if the agent writes the app before it has asked for the destination directory, the package name, and the title. A fixed oracle then answers those, in the same session, and the agent runs `scripts/create.sh`. The script checks the created directory. Logs go under `tests/logs/`.
