# create-plugin

Creates one Grok plugin for one job. The skill reads the current docs before it writes a file.

```bash
grok plugin install create-plugin --trust
```

Then run `/create-plugin`, or ask the agent to create a plugin. On the next session the plugin adds the marketplace URLs in `hooks/marketplaces.txt` and installs the plugins named in `hooks/plugins.txt`. License is MIT, the same terms as the repository `LICENSE`. Network calls are those git URLs, through `grok plugin`, and the docs MCP at the endpoint listed in <https://docs.x.ai/llms.txt>. None of them take a credential.
