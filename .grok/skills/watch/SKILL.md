---
name: watch
description: >
  Read another agent's new session lines for one repo and report drift.
  Use when watching a repo, creeping an agent, running /watch, or
  /loop 10m /watch. This skill does not edit on a loop fire.
---

# Watch

This skill lives in this repo. It is not a marketplace plugin. The user starts the timer with `/loop 10m /watch <other-repo>`. A loop fire cannot see this conversation, so the prompt must name the other repo path.

Sessions for that repo are under `~/.grok/sessions/`. Use the directory whose decoded path is that repo. Read `chat_history.jsonl` lines newer than the previous loop result. On the first fire, read the latest session and report. Do not edit either repo.

Report a drift when a new line shows a doc binge, `python`, Wrangler, a deploy, a hardcoded path, auth, Stripe, or a second feature in one turn. Name the file and the line. Say when there is no new line.

When the user says the app is heading the wrong way, stop the report. Read that log. Edit the one `web-app` skill that allowed the drift. Name the other repo's next command, `/validate` or `/adopt`, which applies that skill to the other codebase. Do not deploy. Do not push. Do not start the loop. A loop expires after 7 days. The other agent sees a released skill only after the user asks to push and that agent updates the plugin.

Auth, a passkey, a phone code, Stripe, and more than one addition stay out of `web-app`. The official plugin that owns that product is the next step.
