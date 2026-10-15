# score-plugin

Scores one Grok plugin from 0 to 100. The points sit in the skill. The facts they measure come from the docs you open in that session.

```bash
grok plugin install score-plugin --trust
```

Then run `/score-plugin` with a plugin path. License is MIT, the same terms as the repository `LICENSE`. The only network call is the docs MCP at the endpoint listed in <https://docs.x.ai/llms.txt>. That server takes no credential.
