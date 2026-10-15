#!/bin/sh
# POST the deploy result. An empty URL is a failure, not a successful webhook.
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
exec python3 - <<'PY'
import http.client
import json
import os
import sys
from urllib.parse import urlsplit

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

url = os.environ.get("DEPLOY_WEBHOOK_URL", "")
if not url:
    sys.stderr.write("webhook not sent: DEPLOY_WEBHOOK_URL is empty\n")
    sys.exit(1)
if not url.startswith("https://"):
    sys.stderr.write("webhook not sent: DEPLOY_WEBHOOK_URL must be https\n")
    sys.exit(1)
# urlsplit's ValueError text includes the netloc. Log the type only.
try:
    parts = urlsplit(url)
    has_userinfo = (
        parts.username is not None
        or parts.password is not None
        or "@" in (parts.netloc or "")
    )
    host = parts.hostname
    port = parts.port or 443
    path = parts.path or "/"
    if parts.query:
        path = path + "?" + parts.query
except Exception as exc:
    sys.stderr.write("webhook not sent: " + type(exc).__name__ + "\n")
    sys.exit(1)
if has_userinfo:
    sys.stderr.write("webhook not sent: DEPLOY_WEBHOOK_URL must not contain userinfo\n")
    sys.exit(1)
if not host:
    sys.stderr.write("webhook not sent: DEPLOY_WEBHOOK_URL must be https\n")
    sys.exit(1)

if os.environ.get("NOTIFY_PRINT") == "1":
    json.dump(payload, sys.stdout)
    sys.stdout.write("\n")
    sys.exit(0)

body = json.dumps(payload).encode()
status = 0
conn = None
try:
    # http.client does not follow redirects. urlopen would retry a 302 as a GET, including to http.
    conn = http.client.HTTPSConnection(host, port, timeout=30)
    conn.request(
        "POST",
        path,
        body=body,
        headers={"content-type": "application/json"},
    )
    response = conn.getresponse()
    status = response.status
    response.read()
except Exception as exc:
    sys.stderr.write("webhook not sent: " + type(exc).__name__ + "\n")
    sys.exit(1)
finally:
    if conn is not None:
        try:
            conn.close()
        except Exception:
            pass
if status < 200 or status >= 300:
    sys.stderr.write("webhook not sent: status %s\n" % status)
    sys.exit(1)
sys.stdout.write("webhook sent\n")
PY
