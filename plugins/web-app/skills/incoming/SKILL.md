---
name: incoming
description: >
  Move an existing app onto Void pages by running void init beside the files
  already there. Use when adopting a web app written in another language, or
  running /adopt. Finish within five minutes. Do not rewrite the foreign tree.
---

# Incoming

Use this after a plan reply. The destination already has an app, in any language. Finish in one turn, within five minutes. Do not open that app's framework docs. Do not open a Void or Cloudflare guide. Do not call the language server.

When the message has no plan reply, follow the `decide` skill and stop.

When the sheet says the directory is a legacy Void app, run `void migrate` and stop after it rewrites `void.config.ts`. Do not run it for any other language.

Otherwise move every existing file aside, run the `starter` skill in the now-empty destination, then move those files back. Do not run `python` or `python3`. The menu is the TypeScript program that skill names. `void init` in a non-empty directory asks an existing-project wizard and does not scaffold the starter. Do not answer that wizard. Do not delete a file the command did not write. A request to convert the whole foreign tree in this turn is the one question: which surface is first? The next command is then `/extend` for that surface.

Return the destination and the foreign files you left in place. Do not deploy.
