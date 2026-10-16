---
name: publish
description: >
  Deploy a Void pages app with void deploy, or rewind and preview it.
  Use when deploying, rewinding, previewing, or running /deploy. Deploy only
  when the prompt asked.
---

# Publish

Use this for deploy, and for rewind or preview when the user asks. Do not open a guide. Deploy or spend only when the prompt asked.

Inside the app, `pnpm exec void`. Do not run Wrangler.

## Grants

Skip this heading when the prompt says not to deploy or spend.

Unset `CLOUDFLARE_API_TOKEN`, `CF_API_TOKEN`, `CLOUDFLARE_API_KEY`, `CF_API_KEY`, `CLOUDFLARE_EMAIL`, and `CF_EMAIL` before every command below. Do not set them. Do not read the keychain. Do not print a credential.

1. `void cloudflare status`. When it says to log in, return `void cloudflare login` and stop. The person confirms the link that command prints.
2. `void account whoami`. When it says to log in, the platform host is the URL the user named. Return `void connect <url>` and `void account login`. Do not invent the host. Do not run `void account token`.
3. When status lists one account, leave `CLOUDFLARE_ACCOUNT_ID` unset. When it lists more than one, ask which account owns the Worker.

A missing session stops the spend. Do not create a Worker to learn a grant.

## Deploy

1. When the prompt does not name the platform URL, stop. Ask for that URL. Do not run `void deploy`.
2. Run Grants. A missing session stops you.
3. Follow the `check` skill. Do not deploy when it fails.
4. Run `pnpm exec void deploy --platform cloudflare`. Do not combine `--project`. Do not run the deploy script.
5. Commit `void.lock.json` when that command writes it. Do not write `persistence.json`. Do not gzip source into KV or R2. Do not hand-write `.void/project.json`. Do not write an account id, a subdomain, an email, or a token into source.
6. Read the worker URL the command prints, and read `/mcp`. `pnpm exec void project status` is the version id. Return the URL and that id. Name no secrets.

## Rewind

A person approves it. Run Grants. When `.void/project.json` is missing, stop. The next command is `void connect` with the host the user named. Then `pnpm exec void project rollback` with the version id. Return the version now receiving traffic.

## Preview

Do not deploy. Run `pnpm run dev`. When the user needs a URL on another machine, run `cloudflared tunnel --url` against that localhost URL and return the `https://*.trycloudflare.com` URL. Stop both when the preview is finished, unless the user asked to keep them.
