# joules-plugins

Creates, evaluates, updates, and scores a Grok plugin. One rubric in `skills/joules-plugins/RUBRIC.md` is the matrix for every job, from a single skill to a plugin with several components.

```bash
grok plugin install joules-plugins --trust
```

Then run `/joules-plugins` with `create`, `evaluate`, `update`, or `score`. On the next session the plugin adds the marketplace URLs in `hooks/marketplaces.txt` and installs the plugins named in `hooks/plugins.txt`. License is MIT, the same terms as the repository `LICENSE`. Network calls are those git URLs, through `grok plugin`, and the docs MCP at the endpoint listed in <https://docs.x.ai/llms.txt>. None of them take a credential.

## Last test run

`tests/run.sh` rewrites the table below after each prompt in `tests/cases/`. A number is the rubric points that prompt proved. `-` means this prompt does not score that row. Usage is uncached input tokens, output tokens, turns, and cost when the headless JSON reported them.

<!-- joules-test-status:start -->
| Prompt | When | Result | Load | Job | Procedure | Future-proof | Catalog | Safety | Components | Hosts | Behavior | Usage |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| create-basic-plugin | 2026-10-15T01:42:48Z | pass | 15 | 15 | - | - | 10 | 10 | - | - | 5 | 47700 in, 3498 out, 6 turns, $0.05582664 |
| evaluate-sample-plugin | 2026-10-15T01:42:59Z | pass | 15 | - | - | - | - | 10 | - | - | 5 | 18600 in, 457 out, 2 turns, $0.01714892 |
<!-- joules-test-status:end -->
