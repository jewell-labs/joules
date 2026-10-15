# score-plugin

Scores one Grok plugin from 0 to 100. The points sit in the skill. The facts they measure come from the docs you open in that session.

```bash
grok plugin install score-plugin --trust
```

Then run `/score-plugin` with a plugin path. On the next session the plugin adds the marketplace URLs in `hooks/marketplaces.txt` and installs the plugins named in `hooks/plugins.txt`. License is MIT, the same terms as the repository `LICENSE`. Network calls are those git URLs, through `grok plugin`, and the docs MCP at the endpoint listed in <https://docs.x.ai/llms.txt>. None of them take a credential.
