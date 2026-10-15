# Rubric

One matrix for creating, evaluating, updating, and scoring a plugin. Read it before you judge. Score only from a file you opened or a command you ran. Quote the file, or say what is missing.

A plugin is **simple** when it is one skill and nothing else. It is **moderate** when it adds one command, agent, hook, MCP server, or LSP server. It is **complex** when it has more than one of those, or it names grok.com or a Grok Bot.

Use the column that matches. A missing component is full points when that column does not require it. A missing piece of evidence is 0. Points in the cells are the only points. The maximum is 100.

Volatile contracts stay on the pages you opened this session. A row scores 0 when the plugin states a field list, model id, tool-name list, or event list as the contract.

| Row | Simple | Moderate | Complex |
| --- | --- | --- | --- |
| Load (15) | `grok plugin validate` exits 0. A skipped run when `grok` is installed scores 0. | When the plugin is installed, `grok inspect` lists the extra component. | `grok inspect` lists every component the index names. |
| Job (15) | One job. The relationship is exclusive, on top of a named official plugin, or still useful without that plugin. A repeat of an official entry scores 0. | The extra component serves that same job. | Every component serves that one job. |
| Procedure (15) | The description says what it does, when it runs, and the slash name. The body states when, inputs, steps, how to check, what to return, and what a person must approve. | The added command, agent, or hook has the when, steps, and check the page you opened requires. | Every skill and command is one workflow. |
| Future-proof (15) | Contracts that can change are links to the pages you opened. Frontmatter the current page says is ignored is unset. | A remote MCP URL is the public HTTPS endpoint on the current docs index. | No component states a contract the docs own. |
| Catalog (10) | README, manifest, license, and marketplace entry exist. The index matches the files. | Homepage and keywords are the plugin name and product terms. The README names every network endpoint and any credential. | The same is true for every component. |
| Safety (10) | No secrets. Publish, tag, push, delete, send, and spend wait for the user. | The security section you opened would accept the hook or MCP server. | That section would accept every component. |
| Components (10) | A skill is present only when the job needs one. | The extra component is one the current page says delivers the job. | Nothing unused is included. The index lists exactly the components on disk. |
| Hosts (5) | One procedure, and Grok Build can run it. | Same evidence as Simple. | A claimed grok.com or Grok Bot path uses public HTTPS, and you opened the current connector or Bot page. When that page has no install path, the reply says so. |
| Behavior (5) | The behavior test is named. | The test covers the extra component. | After the user asks to install: `grok inspect` and `/<skill>` on a safe input. |

## Pass and score

Evaluating passes only when every applicable cell is full. Any 0 fails.

Scoring reports each row, its points, and the total.

Updating edits only rows that are not full, then fills this matrix again.

Creating fills this matrix after the files exist.

## Test runs

A test run uses these row names. The runner saves the raw log (the transcript of prompts, tool calls, and tool results, plus the diff and stderr), then a second headless Grok session fills every row from that log. Points are the cell in the matching column, or 0 when the log does not show the row was tested. Evidence is required on every row. A missing row, a point value other than 0 or the cell, or empty evidence fails the run.
