# local-grok-builder

Fits a local GGUF chat suite to the machine in front of you and points Grok at it for the text the local server can serve. First beta: `0.2.0-beta.2`. The parent name is `local-grok-builder`. The skill is `/fit`. The command is `doctor`. Nothing in this plugin names a person, a home directory, or a model id.

```bash
grok plugin install local-grok-builder --trust
```

`/fit` measures the machine, discovers weights, a running server, and loopback model entries that are already there, and reads today's docs. The weights directory is the catalog, including a `.gguf` in a subdirectory. A filename containing `mmproj` is a projector, not a model. When you ask for local models, it can download a new file you name, writes the loopback entry, and drops a loopback entry whose file is gone. It does not download a saved name that is not a file, and it does not relaunch a saved `-m` whose file is gone. A `--models-dir` router with no `-m` is the server. `grok-local`, from any directory, execs the `grok` CLI on that local model. `/doctor` only reports. License is MIT, the same terms as the repository `LICENSE`.

Network endpoints this plugin tells the agent to open:

- The docs index at <https://docs.x.ai/llms.txt>, then the custom-models chapter shipped with `grok`.
- The llama.cpp server README at <https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md>.
- Model cards and file URLs on <https://huggingface.co>.

No credential belongs in this plugin. A gated Hugging Face file stops for the person to sign in with their own Hugging Face client. A server this plugin starts stays on loopback. An all-interfaces bind is not loopback, and a server another machine can reach is outside this suite. Do not send a Grok token, an API key, or an environment secret to that server.
