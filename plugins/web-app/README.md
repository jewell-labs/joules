# web-app

Creates a Void pages app in a directory you choose. The app is Solid on Cloudflare Workers by default. It checks pull requests, deploys the branches it lists, and serves one public HTTP healthcheck.

```bash
grok plugin install web-app --trust
```

`/web-app` routes to the plan, create, validate, and evaluate commands. Plan reads `scripts/create.sh --help` and returns an argv, or one question. Create runs that argv. Validate runs `npm test` and `sh scripts/check.sh` for each mapped branch. Evaluate reads the prompt below and writes this table. License is MIT, the same terms as the repository `LICENSE`.

Creating an app calls the npm registry and reads Void's package docs from the installed `void` package. This plugin does not call Cloudflare or GitHub. An app it creates can call the npm registry, Void's docs, Cloudflare when someone deploys, and GitHub when someone connects a repository. Credentials stay with those products. The created app's README names the release workflow. Deploy credentials stay out of this plugin.

The table between the markers is the run record.

From a checkout:

```bash
plugins/web-app/scripts/create.sh --dest PATH --name NAME --title TITLE
```

## Last run

<!-- eval-status:start -->

| Prompt | When | Result | Create | Absent | Stack | Health | Release | Validated | Usage |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Create a web app at {{dest}} named eval-app with the title Eval App. Follow create.sh --help for anything this sentence does not set. No database, no sessions table, and no authentication. Keep the public healthcheck and the offline page. Do not use Stripe. Do not deploy, push, or spend. | 2026-10-15T17:09:14Z | pass | 20 | 15 | 20 | 15 | 15 | 15 | - |
<!-- eval-status:end -->
