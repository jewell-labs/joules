#!/bin/sh
# A route imports the database schema. Server-only code must stay behind a server function.
set -u
app=$1
python3 - "$app/src/routes/index.tsx" <<'PY'
import sys
path = sys.argv[1]
text = open(path).read()
line = "import { sessions } from '~/server/db/schema'\n"
if line not in text:
    open(path, "w").write(line + text)
PY
