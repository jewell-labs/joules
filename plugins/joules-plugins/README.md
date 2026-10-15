# joules-plugins

Creates, evaluates, updates, and scores a Grok plugin. One rubric in `skills/joules-plugins/RUBRIC.md` is the matrix for every job, from a single skill to a plugin with several components.

```bash
grok plugin install joules-plugins --trust
```

Then run `/joules-plugins` with `create`, `evaluate`, `update`, or `score`. On the next session the plugin adds the marketplace URLs in `hooks/marketplaces.txt` and installs the plugins named in `hooks/plugins.txt`. License is MIT, the same terms as the repository `LICENSE`. Network calls are those git URLs, through `grok plugin`, and the docs MCP at the endpoint listed in <https://docs.x.ai/llms.txt>. None of them take a credential.

## Last test run

`tests/run.sh` rewrites the table below after each prompt. A number is the rubric points that prompt proved. `-` means this prompt does not score that row. Usage is uncached input tokens, output tokens, turns, and cost when the headless JSON reported them.

<!-- joules-test-status:start -->
| Prompt | When | Result | Load | Job | Procedure | Future-proof | Catalog | Safety | Components | Hosts | Behavior | Usage |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| evaluating | 2026-10-15T01:37:13Z | pass | 15 | - | - | - | - | 10 | - | - | 5 | 17934 in, 360 out, 2 turns, $0.01660696 |
| negative | 2026-10-15T01:36:42Z | pass | - | 15 | - | - | - | 10 | - | - | 5 | 18012 in, 635 out, 1 turns, $0.01380468 |
<!-- joules-test-status:end -->
