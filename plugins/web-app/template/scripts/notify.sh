#!/bin/sh
# POST the deploy result. An empty URL is a failure, not a successful webhook.
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
exec python3 - <<'PY'
import json, os, sys, urllib.request

required = ("APP_NAME", "BRANCH", "ENVIRONMENT", "APP_VERSION")
missing = [name for name in required if not os.environ.get(name)]
if missing:
    sys.stderr.write("webhook not sent: missing " + ", ".join(missing) + "\n")
    sys.exit(1)

payload = {
    "app": os.environ["APP_NAME"],
    "branch": os.environ["BRANCH"],
    "environment": os.environ["ENVIRONMENT"],
    "version": os.environ["APP_VERSION"],
    "result": os.environ.get("DEPLOY_RESULT") or "deployed",
}
# The URL is a credential. Keep it out of the body and out of logs.
for value in payload.values():
    if not isinstance(value, str) or not value or value != value.strip():
        sys.stderr.write("webhook not sent: payload has an empty field\n")
        sys.exit(1)

if os.environ.get("NOTIFY_PRINT") == "1":
    json.dump(payload, sys.stdout)
    sys.stdout.write("\n")
    sys.exit(0)

url = os.environ.get("DEPLOY_WEBHOOK_URL", "")
if not url:
    sys.stderr.write("webhook not sent: DEPLOY_WEBHOOK_URL is empty\n")
    sys.exit(1)
if not url.startswith("https://"):
    sys.stderr.write("webhook not sent: DEPLOY_WEBHOOK_URL must be https\n")
    sys.exit(1)

request = urllib.request.Request(
    url,
    data=json.dumps(payload).encode(),
    headers={"content-type": "application/json"},
    method="POST",
)
try:
    with urllib.request.urlopen(request, timeout=30) as response:
        status = response.status
except Exception as exc:
    sys.stderr.write(f"webhook not sent: {exc}\n")
    sys.exit(1)
if status < 200 or status >= 300:
    sys.stderr.write(f"webhook not sent: status {status}\n")
    sys.exit(1)
sys.stdout.write("webhook sent\n")
PY
