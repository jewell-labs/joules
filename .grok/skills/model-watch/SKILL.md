---
name: model-watch
description: >
  Research the latest open GGUF models for this suite's tasks and recommend a
  download only when a newer file wins a task on the machine the discovery
  script just measured. Use when the user asks what local model to download,
  whether the weights folder is still current, or runs /model-watch. A weekly
  run follows this same procedure and does not download.
---

# Model watch

Recommend changes to the local GGUF suite. The tasks below are the jobs. The host is whatever `scripts/discover_host.py` prints on this run. Do not write a memory size, a CPU name, a disk path, a port, or a model id into this file.

## Tasks

These are the only jobs. SQL belongs to the code job. A story-completion demo is not a job.

| Job | What a winning model has to do |
| --- | --- |
| General | Drafts, explanations, and ordinary questions |
| Code | Write and fix code, and write and explain SQL |
| Screen | Use a screen, a browser, or a computer interface |
| Math | Multi-step reasoning and hard quantitative problems |
| Long context | Read and answer over documents that need a long window |

Replace a file already on disk when a newer model wins its job. One file may win several jobs. Do not recommend a second file for a job the winner already covers.

Cache order is a ranking, not a fixed pair. The file that covers the most jobs ranks first. A screen model ranks next, because it is a different file. How many files can stay loaded is the `models_max` value the discovery script prints for the running server. When that field is empty, rank the files and say the live limit was not found.

## Steps

1. Run `scripts/discover_host.py` in this skill directory with the Python on `PATH`. The JSON is the host. If `memory_bytes` is null, stop and recommend nothing.
2. Treat `weights` as the files already chosen. An empty or tiny stub is not a usable model. A name containing `mmproj` is a projector, not a model. Do not invent a weights directory when `weights_dir` is empty.
3. Search today for GGUF releases for each task. Prefer the publisher's own GGUF repo, then a widely used GGUF build of that same model. Open the model card. A search snippet is not a file URL. Record the quant, the file size on the card, the context length, the license, and any benchmark the card itself prints. Mark a number from a review as a review number.
4. A candidate fits when its weight file, plus a working context, fits in the measured memory with the system still running. Use the byte counts from the script and the card. Do not apply a size cutoff that is not derived from those numbers. Leave the server's own memory-fit switch at its default.
5. Compare each fitting candidate with the files the script listed for that task. Recommend a download only when the candidate is not already in `weights` and it wins the task on the evidence you opened. Name the repo, the filename, the byte size, and the card URL. Leave the download list empty when nothing wins.
6. A file the script listed that wins no remaining task is a remove candidate. Do not delete it.

## Check

Run the discovery script again if this session has not. A recommendation that names a memory size, a path, or a port you did not just read from the script is a failed check. A recommendation that downloads, deletes, or edits config is a failed check.

## Return

| | |
| --- | --- |
| Checked | The date and the card URLs you opened |
| Host | The script's memory, free disk, weights directory, and server lines. No secrets |
| Tasks | Which file covers each job, or that the job is open |
| Download | Repo, filename, byte size, and URL. Empty when nothing wins |
| Remove | Names the script listed that cover no job. Empty when every usable file still covers one |
| Cache order | The ranking, and the live `models_max` when the script printed one |

## Approval

This skill never downloads, deletes, or edits config. A person has to say yes before any of those happen.
