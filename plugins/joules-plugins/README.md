# joules-plugins

Creates, evaluates, updates, and scores a Grok plugin. One rubric in `skills/joules-plugins/RUBRIC.md` is the matrix for every job, from a single skill to a plugin with several components.

```bash
grok plugin install joules-plugins --trust
```

Then run `/joules-plugins` with `create`, `evaluate`, `update`, or `score`. On the next session the plugin adds the marketplace URLs in `hooks/marketplaces.txt` and installs the plugins named in `hooks/plugins.txt`. License is MIT, the same terms as the repository `LICENSE`. Network calls are those git URLs, through `grok plugin`, and the docs MCP at the endpoint listed in <https://docs.x.ai/llms.txt>. None of them take a credential.

## Last run

The table between the markers is the run record. Each Prompt cell is the whole job. Nothing else is stored.

<!-- eval-status:start -->
| Prompt | When | Result | Load | Job | Procedure | Future-proof | Catalog | Safety | Components | Hosts | Behavior | Usage |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| /joules-plugins create hello-note Create one plugin at plugins/hello-note. Its only job is a skill that replies with the single word hello. Do only this: - add plugins/hello-note with a manifest, a README, and skills/hello-note/SKILL.md - register hello-note in .grok-plugin/marketplace.json - run grok plugin validate plugins/hello-note Do not open web pages. Do not install, publish, tag, or push. Do not edit any other plugin. If validate exits 0, end with exactly one line: RESULT: pass | 2026-10-15T17:04:29Z | pass | 15 | 15 | 15 | 15 | 10 | 10 | 10 | 5 | 5 | - |
| /joules-plugins evaluate plugins/sample-note Run `grok plugin validate plugins/sample-note` and no other command. Do not open web pages, do not read the docs index, and do not create or edit any file. Do not install, publish, tag, or push. If that command exits 0, end with exactly one line: RESULT: pass If it does not, end with exactly one line: RESULT: fail | 2026-10-15T17:04:29Z | fail | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - |
<!-- eval-status:end -->
