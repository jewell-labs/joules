# validate-plugin

Checks a Grok plugin against the current docs and `grok plugin validate`. It reports failures and leaves the plugin unchanged unless you ask for fixes.

```bash
grok plugin install validate-plugin --trust
```

Then run `/validate-plugin` with a plugin path. License is MIT, the same terms as the repository `LICENSE`. The only network call is the docs MCP at the endpoint listed in <https://docs.x.ai/llms.txt>. That server takes no credential.
