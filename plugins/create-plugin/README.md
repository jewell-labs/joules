# create-plugin

Creates one Grok plugin for one job. The skill reads the current docs before it writes a file.

```bash
grok plugin install create-plugin --trust
```

Then run `/create-plugin`, or ask the agent to create a plugin. License is MIT, the same terms as the repository `LICENSE`. The only network call is the docs MCP at the endpoint listed in <https://docs.x.ai/llms.txt>. That server takes no credential.
