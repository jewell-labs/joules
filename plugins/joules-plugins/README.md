# joules-plugins

Creates, evaluates, updates, and scores a Grok plugin. One rubric in `skills/joules-plugins/RUBRIC.md` is the matrix for every job, from a single skill to a plugin with several components.

```bash
grok plugin install joules-plugins --trust
```

Then run `/joules-plugins` with `create`, `evaluate`, `update`, or `score`. On the next session the plugin adds the marketplace URLs in `hooks/marketplaces.txt` and installs the plugins named in `hooks/plugins.txt`. License is MIT, the same terms as the repository `LICENSE`. Network calls are those git URLs, through `grok plugin`, and the docs MCP at the endpoint listed in <https://docs.x.ai/llms.txt>. None of them take a credential.

## Last test run

`tests/run.sh` runs each prompt in `tests/cases/`, saves the raw log under `tests/logs/`, and asks Grok to fill every rubric row from that log. A number is those points. Usage is uncached input tokens, output tokens, turns, and cost when the headless JSON reported them.

<!-- joules-test-status:start -->
| Prompt | When | Result | Load | Job | Procedure | Future-proof | Catalog | Safety | Components | Hosts | Behavior | Usage |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| create-basic-plugin | 2026-10-15T02:04:07Z | pass | 15 | 15 | 15 | 15 | 10 | 10 | 10 | 5 | 5 | 90953 in, 6765 out, 14 turns, $0.13383488 |
| evaluate-sample-plugin | 2026-10-15T02:01:24Z | pass | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 18547 in, 440 out, 2 turns, $0.0170782 |
<!-- joules-test-status:end -->
