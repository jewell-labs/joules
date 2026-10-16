# joules-plugins

Creates, evaluates, updates, and scores a Grok plugin. The Rubric section of `skills/judge/SKILL.md` is the matrix. Each command has its own skill.

```bash
grok plugin install joules-plugins --trust
```

The parent name is `joules-plugins`. The skills are `draft`, `judge`, `revise`, and `rate`. The commands are `create`, `evaluate`, `update`, and `score`. Each command points at one skill. On the next session the plugin adds the marketplace URLs in `hooks/marketplaces.txt` and installs the plugins named in `hooks/plugins.txt`. License is MIT, the same terms as the repository `LICENSE`. Network calls are those git URLs, through `grok plugin`, and the docs MCP at the endpoint listed in <https://docs.x.ai/llms.txt>. None of them take a credential.

## Capability roadmap

The table between the markers lists what this plugin owns. `Evals` names the run that passed or failed that row. A token is `<id>: pass` or `<id>: fail`. Empty means no run has written it. `out of scope` means another plugin owns it. The Records section of `skills/judge/SKILL.md` is the procedure every plugin uses. A full rubric cell for work the prompt omitted is not a token.

<!-- capability-roadmap:start -->

Plugin version: 0.7.0

| Id | Area | Item | Description | Evals |
| --- | --- | --- | --- | --- |
| load | Judge | Load | `grok plugin validate` exits 0. | jp-create: fail |
| job | Judge | Job | One job. Exclusive, on top of a named official plugin, or still useful without it. | jp-create: fail |
| procedure | Judge | Procedure | The description says what it does, when it runs, and the slash name. The body has the steps, the check, the return, and the approval. Each command is the leaf the Commands section names. A Node command runs with pnpm. | jp-create: fail |
| future-proof | Judge | Future-proof | A contract that can change is a link to the page opened for that run. | jp-create: fail |
| catalog | Judge | Catalog | README, manifest, license, and marketplace entry exist, and the index matches the files. | jp-create: fail |
| safety | Judge | Safety | No secrets. Publish, tag, push, and spend wait for the user. | jp-create: fail |
| components | Judge | Components | A component is present only when the job needs it. | jp-create: fail |
| hosts | Judge | Hosts | One procedure. An MCP URL is public https. | jp-create: fail |
| behavior | Judge | Behavior | The behavior test is named. Install runs only after the user asks. | jp-create: fail |
| eval-fail | Record | Fail closed | A prompt that withholds the plugin and the docs scores 0 past Load, and Result is fail. | jp-eval-fail: pass |
| records | Record | Shared record | The roadmap and the run record. Evaluate writes one row. Release runs the empty rows on publish. | |
| release | Record | Version publish | Asking to publish runs the empty rows before tag. One live deploy per release. | |
<!-- capability-roadmap:end -->

## Last run

The table between the markers is the run record. Each Prompt cell is the whole job for that past run. Evaluate writes When, Result, and the points. It writes an Evals token only for the ids in Rows. Expect `fail` records `pass` on those ids when Result is fail. `hello-note` and `sample-note` are not plugins in this repository. Do not create them again.

<!-- eval-status:start -->
| Id | Prompt | Rows | Expect | When | Result | Load | Job | Procedure | Future-proof | Catalog | Safety | Components | Hosts | Behavior | Usage |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| jp-create | /joules-plugins create hello-note Create one plugin at plugins/hello-note. Its only job is a skill that replies with the single word hello. Do only this: - add plugins/hello-note with a manifest, a README, and skills/hello-note/SKILL.md - register hello-note in .grok-plugin/marketplace.json - run grok plugin validate plugins/hello-note Do not open web pages. Do not install, publish, tag, or push. Do not edit any other plugin. If validate exits 0, end with exactly one line: RESULT: pass | load, job, procedure, future-proof, catalog, safety, components, hosts, behavior | pass | 2026-10-16T16:25:27Z | fail | 15 | 15 | 15 | 0 | 0 | 10 | 10 | 0 | 5 | - |
| jp-eval-fail | /joules-plugins evaluate plugins/sample-note Run `grok plugin validate plugins/sample-note` and no other command. Do not open web pages, do not read the docs index, and do not create or edit any file. Do not install, publish, tag, or push. If that command exits 0, end with exactly one line: RESULT: pass If it does not, end with exactly one line: RESULT: fail | eval-fail | fail | 2026-10-16T16:25:27Z | fail | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - |
<!-- eval-status:end -->
