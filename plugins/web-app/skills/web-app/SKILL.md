---
name: web-app
description: >
  Create a Void pages app on Cloudflare Workers. The app releases the
  branches it lists and serves one public HTTP healthcheck. Use when
  the user wants a new web app or runs /web-app.
when-to-use: >
  create a web app, Void pages on Cloudflare Workers, /web-app
argument-hint: "[app directory]"
metadata:
  author: Joules
  short-description: Create a Void pages app
---

# Web app

Route the request. Do not restate a command's steps.

The plugin root is the directory that contains `skills/web-app/SKILL.md`.

| Request | Command |
| --- | --- |
| A new app, or flags that are not settled | `commands/plan.md` |
| An argv from plan | `commands/create.md` |
| Check the app | `commands/validate.md` |
| Score the README prompt | `commands/evaluate.md` |

When the user wants TanStack routing, stop this native path. Follow Void's TanStack guide and `cloudflare-web-apps`.

Deploy, push, or spend only when the user asked. A file in the tree is not a Cloudflare login.
