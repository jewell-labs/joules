---
name: fit
description: >
  Fit a local GGUF suite to this machine and wire the part Grok can run
  locally. Use when choosing weights for a gguf folder, pointing Grok at a
  local server, removing weights that no longer fit, checking the suite
  against today's sources, or starting grok-local. Slash name /fit. The
  check-only entry is /doctor.
---

# Fit

## When

Use this when the user wants local GGUF weights, a Grok model entry for a machine on the desk, a smaller or newer suite, or a doctor pass. The weights directory is an input. When they name a folder, that folder is the directory. Otherwise it is the directory recorded for this suite, or the directory of a model a server on this machine already loaded. Do not guess a folder in the home directory. A host file that lists byte sizes is the set of files someone already chose. It is not the proof those files are still the best fit.

## Inputs

- The weights directory.
- Whether this run may only report (`/doctor`) or should make the suite runnable (`/fit` or `grok-local`).

## Steps

The launcher is `bin/grok-local` in this plugin. Run it for discovery, setup, and the session. Link that file into the directory that contains the `grok` executable so `grok-local` resolves from any working directory.

Use the shell for memory, disk, and the running server. Use the file reader for `~/.grok/config.toml`. Use web search for today's GGUF releases, then open the model card. Use the docs fetch for the pages in step 2. When a docs MCP server is connected, read those pages through it. The launcher reads the custom-models chapter and `llama-server --help` itself. Do not pass it a model id, a port, or a config field name.

1. Measure the machine. Read physical memory, free disk on the volume that holds the weights, and the byte size of each file in the weights directory. If physical memory cannot be read, stop and say so. Do not pick a model. Run `grok-local discover` with the weights directory. A weight, a server, or a loopback entry on a PRESENT line is already there. Do not describe that machine as empty, and do not put those names on a MISSING line. Do not print keys, tokens, or header values.
2. Open <https://docs.x.ai/llms.txt> and the custom-models chapter shipped with this `grok` (the user guide beside the CLI; the launcher finds that file by its headings). Follow the section for a local OpenAI-compatible server, the credential-resolution section, the context-window section, and the fleet-allowlist section. Open the models page that index lists. Open <https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md> and the multimodal page it links. The flag list, default port, and route names on those pages are the contract. If a page does not open, name that URL in the return and leave Download and Wire empty. Do not invent a model id, a port, or a field name.
3. Search today for GGUF releases that fit the memory you measured. Prefer the publisher's own GGUF repo, then a widely used GGUF build of that same model. Read the model card for the quant, the context length, and whether a multimodal projector ships beside it. A search snippet is not the file URL. Write the date of the search into the return.
4. Pick one text model whose file and a working context fit in memory with room left for the system. Add one vision model and its projector only when both resident sizes fit at the same time, or when the user accepts running one server at a time. Leave llama.cpp's own memory-fit switch at the default the server README documents. When that default shrinks context, the context you record is the one the running server is using. Do not turn on the server's built-in tools or its agent mode.
5. Compare that pair with the files on disk and with the model each running server loaded. A file that is not in the pair, and not loaded by a server the user still wants, is a remove candidate. A missing file is a download candidate. The download URL is the file URL on the model card you just opened.
6. When the user asked for local models, run `grok-local setup`. Pass the model-card file URL and the file name only for a weight that discover listed as missing. Setup downloads that file, checks the byte size against the source, writes the loopback entry from the custom-models chapter, and starts a server for an on-disk text weight when nothing is listening. A download in this run is not required for that start. A PRESENT weight, server, and loopback entry are reused. Keep the hosted Grok model as the default. Image generation, video, and voice stay on the hosted API. Do not set the catalog-wide endpoint the chapter says still expects a hosted key.
7. `grok-local` with no subcommand ensures that server is up and execs the `grok` binary on the SELECTED local model. The session is that CLI.

## Check

Re-read the pages in step 2 if this session has not opened them. A page that did not open stays the failed check from that step.

Behavior test, `/doctor`: the input is a weights directory. Run `grok-local discover`, then this check. Return the table. Do not download, delete, edit config, restart a server, or print a secret.

Behavior test, `/fit`: the same discovery. When the user asked for local models, run `grok-local setup`, then return the table.

Behavior test, `grok-local`: from more than one working directory, the process is the `grok` executable and the model is the SELECTED local model. Repeat runs from the same directory select the same model.

## Return

| | |
|---|---|
| Checked | The date you opened the pages and the model cards |
| Machine | Memory, free disk, and what is loaded now |
| Keep | Files and servers that match the suite |
| Download | Repo, filename, byte size, and URL. Empty when nothing is missing |
| Remove | Paths that are not in the suite. Empty when nothing is extra |
| Wire | The loopback entry setup wrote, or the PRESENT loopback line when one was already there. No key values. Empty when a required page did not open |
| Stays hosted | The harness parts the pages say a local chat server does not serve |

## Approval

Invoking `/fit` or `grok-local` approves the download, the loopback config write, and the server start for that suite. `/doctor` does not. A delete still waits for a separate yes. Download with the file URL from the model card into the weights directory and check the byte size. Do not pipe a remote script into a shell. Do not write a token into the repo or into `config.toml`. A gated file stops until the person signs in with their own Hugging Face client.
