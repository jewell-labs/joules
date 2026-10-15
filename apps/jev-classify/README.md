# Jev classification, beside a local chat model

A single-page explanation of Jev-based classification. A person writes a situation (the state) and the page asks fixed choice, score, and noul questions. Local Clef answers them in one pass. Local Grok writes an open reply for the same situation.

License is MIT, the same terms as the repository `LICENSE`.

The page calls only these loopback endpoints, through this app:

- `CLEF_URL` (default `http://127.0.0.1:8000`) `POST /v1/systemone`
- `GROK_URL` (default `http://127.0.0.1:8080`) `POST /v1/chat/completions`

No credential is required. An engine URL that is not loopback is refused. Image, video, and voice are not part of this page.

```bash
npm test
npm start
```

`npm start` listens on `http://127.0.0.1:4173/`. `node src/server.mjs --check` runs one triage situation through both engines and prints the JSON.
