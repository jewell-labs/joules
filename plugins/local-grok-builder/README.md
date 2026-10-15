# local-grok-builder

Fits a local GGUF suite to the machine in front of you and points Grok at it for the text the local server can serve. First beta: `0.2.0-beta.1`. The parent name is `local-grok-builder`. The skill is `/fit`. The command is `doctor`. Nothing in this plugin names a person, a home directory, or a model id.

```bash
grok plugin install local-grok-builder --trust
```

`/fit` measures the machine, discovers weights, a running server, and loopback model entries that are already there, and reads today's docs. When you ask for local models, it downloads a missing weight, writes the loopback entry, and starts the server. `grok-local`, from any directory, execs the `grok` CLI on that local model. `/doctor` only reports. License is MIT, the same terms as the repository `LICENSE`.

Network endpoints this plugin tells the agent to open:

- The docs index at <https://docs.x.ai/llms.txt>, then the custom-models chapter shipped with `grok`.
- The llama.cpp server README at <https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md>.
- Model cards and file URLs on <https://huggingface.co>.

No credential belongs in this plugin. A gated Hugging Face file stops for the person to sign in with their own Hugging Face client. A local server stays on `127.0.0.1`. Do not send a Grok token, an API key, or an environment secret to that server.
