---
name: fit
description: >
  Fit a local GGUF suite to this machine and wire the part Grok can run
  locally. Use when choosing weights for a gguf folder, pointing Grok at a
  local server, removing weights that no longer fit, or checking the suite
  against today's sources. Slash name /fit. The check-only entry is /doctor.
---

# Fit

## When

Use this when the user wants local GGUF weights, a Grok model entry for a machine on the desk, a smaller or newer suite, or a doctor pass. The weights directory is an input. When they name a folder, that folder is the directory. A host file that lists byte sizes is the set of files someone already chose. It is not the proof those files are still the best fit.

## Inputs

- The weights directory.
- Whether this run may only report (`/doctor`) or may also propose changes (`/fit`).

## Steps

1. Measure the machine. Read physical memory, free disk on the volume that holds the weights, and the byte size of each file in the weights directory. Read the command line of any `llama-server` already running, including its port and model path. Read `~/.grok/config.toml` only to find `[model.*]` entries whose `base_url` is a loopback address. Do not print keys, tokens, or header values.
2. Open <https://docs.x.ai/llms.txt> and the custom-models chapter shipped with this `grok` (the user guide beside the CLI). Follow the section for a local OpenAI-compatible server. Open the models page that index lists. Open <https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md> and the multimodal page it links. The flag list, default port, and route names on those pages are the contract. Do not copy an example model id out of an old snippet and treat it as the model to download.
3. Search today for GGUF releases that fit the memory you measured. Prefer the publisher's own GGUF repo, then a widely used GGUF build of that same model. Read the model card for the quant, the context length, and whether a multimodal projector ships beside it. Write the date of the search into the return.
4. Pick one text model whose file and a working context fit in memory with room left for the system. Add one vision model and its projector only when both resident sizes fit at the same time, or when the user accepts running one server at a time. Leave llama.cpp's own memory-fit switch at the default the server README documents. Do not turn on the server's built-in tools or its agent mode.
5. Compare that pair with the files on disk and with the model each running server loaded. A file that is not in the pair, and not loaded by a server the user still wants, is a remove candidate. A missing file is a download candidate. The download URL is the file URL on the model card you just opened.
6. Wire only the chat the local server implements. Add a `[model.*]` entry whose `base_url` is the loopback origin the server README uses for its OpenAI-compatible routes. Keep the hosted Grok model as the default. Image generation, video, and voice stay on the hosted API. The custom-models chapter says those are separate from the inference call. Do not set the config key that replaces the whole model catalog with one base URL. That fetch still expects a hosted key, and it drops the hosted catalog.

## Check

Re-read the pages in step 2 if this session has not opened them. Then produce the return below and stop. When a server is already listening, send one short chat completion to the route the server README names and record the status. Do not print the prompt secrets or the config file.

## Return

| | |
|---|---|
| Checked | The date you opened the pages and the model cards |
| Machine | Memory, free disk, and what is loaded now |
| Keep | Files and servers that match the suite |
| Download | Repo, filename, byte size, and URL. Empty when nothing is missing |
| Remove | Paths that are not in the suite. Empty when nothing is extra |
| Wire | The loopback model entry to add, with the field names taken from the page you opened. No key values |
| Stays hosted | The harness parts the pages say a local chat server does not serve |

## Approval

Wait for a yes before a download, a delete, a config edit, or a server restart. Download with the file URL from the model card into the weights directory and check the byte size. Do not pipe a remote script into a shell. Do not write a token into the repo or into `config.toml`. A gated file stops until the person signs in with their own Hugging Face client. Restart a server only when the user names that job.
