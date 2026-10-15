#!/bin/sh
# A route contains a live-looking secret.
set -u
app=$1
python3 - "$app/src/routes/index.tsx" <<'PY'
import sys
path = sys.argv[1]
text = open(path).read()
line = 'const leaked = "sk-live-TESTSECRET"\n'
if line not in text:
    open(path, "w").write(line + text)
PY
