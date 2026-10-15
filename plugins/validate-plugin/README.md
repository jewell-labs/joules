# validate-plugin

Checks a Grok plugin against the current docs and `grok plugin validate`. It reports failures and leaves the plugin unchanged unless you ask for fixes.

```bash
grok plugin install validate-plugin --trust
```

Then run `/validate-plugin` with a plugin path. On the next session the plugin adds the marketplace URLs in `hooks/marketplaces.txt` and installs the plugins named in `hooks/plugins.txt`. License is MIT, the same terms as the repository `LICENSE`. Network calls are those git URLs, through `grok plugin`, and the docs MCP at the endpoint listed in <https://docs.x.ai/llms.txt>. None of them take a credential.
