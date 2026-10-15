# local-grok-builder

Fits a local GGUF suite to the machine in front of you and points Grok at it for the text the local server can serve. The parent name is `local-grok-builder`. The skill is `/fit`. The command is `doctor`.

```bash
grok plugin install local-grok-builder --trust
```

`/fit` measures memory and the weights directory, reads today's docs, and returns keep, download, remove, and wire. `/doctor` runs only the check. It does not download, delete, edit config, or restart a server. License is MIT, the same terms as the repository `LICENSE`.

Network endpoints this plugin tells the agent to open:

- The docs index at <https://docs.x.ai/llms.txt>, then the custom-models chapter shipped with `grok`.
- The llama.cpp server README at <https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md>.
- Model cards and file URLs on <https://huggingface.co>.

No credential belongs in this plugin. A gated Hugging Face file stops for the person to sign in with their own Hugging Face client. A local server stays on `127.0.0.1`. Do not send a Grok token, an API key, or an environment secret to that server.
