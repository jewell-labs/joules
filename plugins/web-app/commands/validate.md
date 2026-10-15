---
description: Run the app checks for each mapped branch. Does not deploy.
argument-hint: "[app directory]"
---

Validate one app. The directory is the path `commands/create.md` printed, or the directory the user named.

1. Run `npm test` in that directory.
2. Read `deploy/branches.json`. For each branch name, run `BRANCH=<branch> sh scripts/check.sh` once. Do not deploy.
3. Return pass or fail, and the check names. Pass means `npm test` and every branch check exited 0.

When the user did not name a directory to keep, and no later command still needs the directory, delete it. When `commands/evaluate.md` called you, leave the directory until that command has written the README row.
