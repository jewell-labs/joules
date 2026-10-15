# web-app

Creates a Void pages app in a directory you choose. The app is Solid on Cloudflare Workers by default. It checks pull requests, deploys the branches it lists, and serves one public HTTP healthcheck.

```bash
grok plugin install web-app --trust
```

The parent name is `web-app`. The skill is `/scaffold`. The commands are `plan`, `create`, `validate`, and `evaluate`. Plan reads the current Void `--help` and returns the decisions, or one question. Create writes the app from that reply. Validate runs the app's tests and its branch checks. Evaluate reads the prompt below, scores it with the Rubric section of the skill, and writes this table. License is MIT, the same terms as the repository `LICENSE`.

Creating an app calls the npm registry and reads Void's package docs from the installed `void` package. This plugin does not call Cloudflare or GitHub. An app it creates can call the npm registry, Void's docs, Cloudflare when someone deploys, and GitHub when someone connects a repository. Credentials stay with those products. The created app's README names the release workflow. Deploy credentials stay out of this plugin.

The table between the markers is the run record. The scores stay empty until evaluate writes them.

## Last run

<!-- eval-status:start -->

| Prompt | When | Result | Create | Absent | Stack | Health | Release | Validated | Usage |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Create a web app at {{dest}} named eval-app with the title Eval App. Follow the scaffold skill for anything this sentence does not set. No database, no sessions table, and no authentication. Keep the public healthcheck and the offline page. Do not use Stripe. Do not deploy, push, or spend. | | | | | | | | | |
<!-- eval-status:end -->
