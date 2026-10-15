---
name: orient
description: >
  Map an unfamiliar repository before changing it. Use when starting work in a
  project, when the user asks what the repo is or how it runs, or when they
  run /orient.
when-to-use: >
  starting work in a repo, "where do I start", "how does this project run",
  "what is this repository", /orient
allowed-tools:
  - read_file
  - list_dir
  - grep
argument-hint: "[question about this repo]"
user-invocable: true
disable-model-invocation: false
model: grok-4.7
effort: medium
license: MIT
compatibility: Any git repository. Reads local files only.
metadata:
  author: Joules
  short-description: Map a repository before editing it
---

# Orient

Map the repository you are in. Report only what its files say.

## Steps

1. List the repository root.
2. Read the root README when one exists, then `AGENTS.md` when one exists.
3. Read the manifest that is present. Check `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pubspec.yaml`, and `wrangler.toml`, and stop at the first that exists.
4. From those files, state what the project is, the command that runs it, and the command that tests it. Quote the script or task name you found.
5. When the user added a question after the command, answer that question from the same files.
6. Do not invent an owner, a product name, or a run command that the files do not state.

## Reply

End with four lines:

- Project: one sentence from the files
- Run: the command, or "not stated"
- Test: the command, or "not stated"
- Touch first: the directory a change for the user's question would start in, or the repository root

The component catalog for this plugin is `references/components.md` in this skill directory. Read it only when the task is to add or edit a Joules plugin.
