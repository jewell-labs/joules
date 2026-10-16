# Pick a local model

A single page that routes a prompt to one local model. The person types a prompt and can attach one image, or load a dog, cat, or bird sample. The page checks which models are listening, then asks local Clef three questions in order: the job, the care score, and the choice across every GGUF model in the weights directory. An attached image is sent with those same questions, and the image-capable Clef checkpoint is added to the choice. That image also asks Clef Flash which of 20 animals is in the picture, and the diagram draws every returned probability when that step finishes. Each answer is drawn as it returns, with the time that step took. The picked node is marked in words, not only in color.

License is MIT, the same terms as the repository `LICENSE`.

The page streams those steps from this app as newline-delimited JSON. A client that accepts JSON still gets one combined answer. The classifier is:

- `CLEF_URL` (default `http://127.0.0.1:8000`) `POST /v1/systemone`

It reads the weights directory from `WEIGHTS_DIR` or `~/.grok/local-suite.json`, and loopback model entries from `~/.grok/config.toml`. It does not send those entries' keys anywhere. A model that is not listening can still be picked. The page does not start it.

No credential is required. An engine URL that is not loopback is refused. One PNG, JPEG, WebP, or GIF can be attached. The page scales it and sends it only to loopback Clef. Video and voice are not part of this page.

```bash
npm test
npm start
```

`npm start` listens on `http://127.0.0.1:4173/`. `node src/server.mjs --check` asks Clef to route one code prompt and prints the model it picked.
