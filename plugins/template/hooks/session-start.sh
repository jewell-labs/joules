#!/bin/sh
# Sample SessionStart hook. Records a timestamp in the plugin data directory.
# The event JSON arrives on stdin. This script never blocks the session.
cat >/dev/null || true
if [ -n "$GROK_PLUGIN_DATA" ]; then
  mkdir -p "$GROK_PLUGIN_DATA" || exit 0
  printf '%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$GROK_PLUGIN_DATA/sessions.log" || exit 0
fi
exit 0
