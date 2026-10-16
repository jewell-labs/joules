---
name: judge
description: >
  Score one plugin against the rubric and write that run-record row.
  Use when evaluating a plugin, validating a plugin, or running /evaluate.
---

# Judge

Evaluate and validate are the same job. Leave the plugin files unchanged except the cells Records allows. The rubric is the Rubric section below.

1. Run `grok plugin validate` on the plugin path when `grok` is on `PATH`. When it is missing, record that Load was not run.
2. Read the plugin, its marketplace entry, and `.grok-plugin/plugin-index.json` when the repo has one.
3. Open the pages `draft` names, then fill every applicable rubric row in the reply. A missing row is a fail. State the evidence in the reply: the validate output, and a file you opened during the turn. Do not save that evidence beside the plugin.
4. Pass only when every applicable cell is full.

When the prompt came from this plugin's README run record, write that row and its Evals tokens the way Records describes. Keep the Prompt cell text. Put the points you just scored in the row.

Return the matrix, or the row you wrote.

A child session returns a summary. The parent uses that summary. It does not look for a results file.

## Commands

A command in a skill is the leaf that returns that step's fact. Run that leaf's `--help` before you add a flag. A group command with no leaf prints the wrong help.

A machine-wide tool is a global package. Install it with `pnpm add -g <name>@<version>`. The pages are https://pnpm.io/cli/add and https://pnpm.io/global-packages . Run the bin. Inside a project that depends on the package, `pnpm exec <bin>` runs that copy: https://pnpm.io/cli/exec . A command the agent repeats is one `scripts` entry, and the agent runs `pnpm run <name>`: https://pnpm.io/cli/run . The script body is the program pnpm puts on `PATH`. It does not call `npm`, `npx`, or `pnpm`. When install ignores a build script that command needs, approve the names it printed with `pnpm approve-builds`: https://pnpm.io/cli/approve-builds .

Open a file by the relative path that package's own skill or docs index names. In a project, the package is `node_modules/<name>` when that directory's `package.json` name matches. For the global package, `pnpm list -g <name> --parseable` prints the directory, and the line that ends in `node_modules/<name>` is the package. Do not search the tree, do not list it and truncate the list, and do not hardcode a path.

Runnable code is TypeScript. A one-off file runs with `node <file>.ts`. Node strips the types: https://nodejs.org/api/typescript.html . A repeated command stays `pnpm run <name>`. Do not run `python`, `python3`, or a `.py` file. Do not use `node -e`. Procedure scores 0 for a tree search, a truncated listing, a hardcoded path, `python`, `python3`, `npm`, `npx`, `node -e`, or a repeated project command that is not `pnpm run <name>`. A hook stays the command the current hooks page runs.

## Records

Every plugin README has two tables. Create writes both, with no scores. The roadmap ids are the capabilities this plugin owns. A prohibition is not an id. `out of scope` means another plugin owns that row.

The capability roadmap sits between `<!-- capability-roadmap:start -->` and `<!-- capability-roadmap:end -->`, after the credential prose and before Last run. The line `Plugin version:` inside that block is the manifest version the scores belong to.

| Id | Area | Item | Description | Evals |

The run record sits between `<!-- eval-status:start -->` and `<!-- eval-status:end -->`.

| Id | Prompt | Rows | Expect | When | Result | rubric columns of the skill that judges, in that order | Usage |

A plugin that deploys an app adds `Version` and `URL` after `Usage`. Expect is `pass` or `fail`. Rows names the roadmap ids that prompt requires the product to perform. The next id is unique in that file. Its prefix is a short prefix of the plugin name.

Evaluate writes one run-record row per turn. It does not change Id, Prompt, Rows, or Expect. It writes When, Result, the rubric points, and Usage. It writes Version and URL only when this run created them. It then rewrites the Evals cell of each id in Rows: drop this run's old token, then add `<run id>: pass` when Result equals Expect, or `<run id>: fail` when it does not. A prompt that expects fail records `pass` on those ids when Result is fail. It does not add an id Rows omits. A full rubric cell for a capability the prompt omitted is not coverage. It does not change `out of scope`. An empty Result leaves the Evals tokens as they are.

The one file that run may write is that README, and only those cells. A prompt that forbids edits still allows that write. It forbids every other file. A missing grant leaves the row empty. Do not invent a score, and do not mark the row `out of scope`.

Score does not write the README. Update may add roadmap rows and empty run-record rows. It does not copy points.

### Release

When the user asks to publish one plugin version, do not tag yet. Read `version` in that plugin's `.grok-plugin/plugin.json`. When it differs from `Plugin version:`, clear When, Result, the rubric points, Usage, Version, and URL on every run-record row, and clear every pass and fail token. Keep Id, Prompt, Rows, Expect, and `out of scope`. Set `Plugin version:` to the manifest version.

Follow that plugin's evaluate command for each run-record row whose Result is empty and whose prompt does not ask for a live deploy. Run at most one row whose prompt asks for a live deploy. When a grant is missing, leave that row empty. The README write Records allows still applies when the prompt forbids other edits.

Ready to tag means every run-record row has a Result and no Evals token is `fail`. An empty roadmap cell has no eval yet. It stays visible and does not block the tag. Report that. Run `grok plugin tag` only when the user asked to publish and the record is ready. The tag command is the one the plugins chapter shipped with `grok` documents. Push only when the user asked to push. Do not add a workflow or a script for this loop.

Follow the Build a plugin section of Joules `AGENTS.md`. In this repository that file is at the repo root. Otherwise read https://raw.githubusercontent.com/jewell-labs/joules/main/AGENTS.md. The `draft` skill names the docs pages to open.

Publish, tag, push, or install for anyone else only when the user asked.

## Rubric

One matrix for creating, evaluating, updating, and scoring a plugin. Read it before you judge. Score only from a file you opened or a command you ran. Quote the file, or say what is missing.

A plugin is **simple** when it is one skill and nothing else. It is **moderate** when it adds one command, agent, hook, MCP server, or LSP server. It is **complex** when it has more than one of those, or it names grok.com or a Grok Bot. Several skills that each match one command do not by themselves fail a row.

Use the column that matches. A missing component is full points when that column does not require it. A missing piece of evidence is 0. Points in the cells are the only points. The maximum is 100.

Volatile contracts stay on the pages you opened this session. A row scores 0 when the plugin states a field list, model id, tool-name list, or event list as the contract.

| Row | Simple | Moderate | Complex |
| --- | --- | --- | --- |
| Load (15) | `grok plugin validate` exits 0. A skipped run when `grok` is installed scores 0. | When the plugin is installed, `grok inspect` lists the extra component. | `grok inspect` lists every component the index names. |
| Job (15) | One job. The relationship is exclusive, on top of a named official plugin, or still useful without that plugin. A repeat of an official entry scores 0. | The extra component serves that same job. | Every component serves that one job. |
| Procedure (15) | The description says what it does, when it runs, and the slash name. The body states when, inputs, steps, how to check, what to return, and what a person must approve. Each command is the leaf the Commands section names. A tree search, a truncated listing, a hardcoded path, `python`, `python3`, `npm`, `npx`, `node -e`, or a repeated project command that is not `pnpm run` scores 0. | The added command, agent, or hook has the when, steps, and check the page you opened requires, and its commands follow Commands. | Every skill and command is one workflow, and its commands follow Commands. The same 0 list as Simple applies. |
| Future-proof (15) | Contracts that can change are links to the pages you opened. Frontmatter the current page says is ignored is unset. | A remote MCP URL is the public HTTPS endpoint on the current docs index. | No component states a contract the docs own. |
| Catalog (10) | README, manifest, license, and marketplace entry exist. The index matches the files. | Homepage and keywords are the plugin name and product terms. The README names every network endpoint and any credential. | The same is true for every component. |
| Safety (10) | No secrets. Publish, tag, push, delete, send, and spend wait for the user. | The security section you opened would accept the hook or MCP server. | That section would accept every component. |
| Components (10) | A skill is present only when the job needs one. One command keeps one skill. Two commands that share one skill score 0. | The extra component is one the current page says delivers the job. A second command has its own skill. Two commands that share one skill score 0. | Nothing unused is included. The index lists exactly the components on disk. Every command has its own skill. Two commands that share one skill score 0. |
| Hosts (5) | One procedure in the repo, and Grok Build can run it. No host-local credential store. Any MCP URL is public HTTPS. You opened the current Bot skills page. When it has no install path for this marketplace, the reply says so. | Same evidence as Simple. | Same evidence as Simple. |
| Behavior (5) | The behavior test is named. When this turn did not ask to install, that name is the evidence. | The test covers the extra component. When this turn did not ask to install, the named test is the evidence. | When this turn did not ask to install, the behavior test named in the README is the evidence. After the user asks to install: `grok inspect` and `/<skill>` on a safe input. |

### Pass and score

Evaluating passes only when every applicable cell is full. Any 0 fails.

Scoring reports each row, its points, and the total.

Updating edits only rows that are not full, then fills this matrix again.

Creating fills this matrix after the files exist.

### Test runs

A run is the reply in this turn. Fill every row. A missing row is a fail. Points are the cell in the matching column, or 0. Evidence is the `grok plugin validate` output and a file opened during the turn. State that evidence in the reply. When the prompt is a run-record row, write that row the way Records describes. Do not save a transcript, a log, or a score file beside the plugin.
