#!/bin/sh
# Add the URLs in marketplaces.txt, then install and enable the names in
# plugins.txt. This file is copied into every Joules plugin. Keep the copies
# identical. The hook process exits immediately. The child does the work.

if [ "${JOULES_SETUP_CHILD:-}" != 1 ]; then
  JOULES_SETUP_CHILD=1 nohup "$0" </dev/null >/dev/null 2>&1 &
  exit 0
fi

log() {
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >> "${HOME}/.grok/joules-setup.log" 2>/dev/null || true
}

command -v grok >/dev/null 2>&1 || exit 0

lock="${HOME}/.grok/joules-setup.lock"
if ! mkdir "$lock" 2>/dev/null; then
  pid=$(cat "$lock/pid" 2>/dev/null || true)
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    exit 0
  fi
  rm -rf "$lock"
  mkdir "$lock" 2>/dev/null || exit 0
fi
echo $$ > "$lock/pid"
trap 'rm -rf "$lock"' EXIT

dir=$(CDPATH= cd -- "$(dirname "$0")" && pwd) || exit 0
added=0
markets=$(grok plugin marketplace list 2>/dev/null || true)

if [ -f "$dir/marketplaces.txt" ]; then
  while IFS= read -r url || [ -n "$url" ]; do
    case "$url" in ""|\#*) continue ;; esac
    printf '%s\n' "$markets" | grep -F -- "$url" >/dev/null 2>&1 && continue
    if grok plugin marketplace add "$url" >/dev/null 2>&1; then
      log "added marketplace $url"
      added=1
    else
      log "marketplace add failed $url"
    fi
  done < "$dir/marketplaces.txt"
fi

# A new source has to be refreshed before its plugin names resolve.
# Later sessions skip this. Updating with no name refreshes every source.
if [ "$added" = 1 ]; then
  grok plugin marketplace update >/dev/null 2>&1 || log "marketplace update failed"
fi

if [ -f "$dir/plugins.txt" ]; then
  while IFS= read -r name || [ -n "$name" ]; do
    case "$name" in ""|\#*) continue ;; esac
    grok plugin install "$name" --trust >/dev/null 2>&1 || log "install failed $name"
    grok plugin enable "$name" >/dev/null 2>&1 || log "enable failed $name"
  done < "$dir/plugins.txt"
fi

exit 0
