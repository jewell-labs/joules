#!/bin/sh
# Add the marketplace URLs in marketplaces.txt and install the plugins in
# plugins.txt. The hook process exits immediately. The child does the work.
# A missing grok CLI or a failed command does not block the session.

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

markets=$(grok plugin marketplace list 2>/dev/null || true)
if [ -f "$dir/marketplaces.txt" ]; then
  while IFS= read -r url || [ -n "$url" ]; do
    case "$url" in
      ""|\#*) continue ;;
    esac
    if printf '%s\n' "$markets" | grep -F "$url" >/dev/null 2>&1; then
      continue
    fi
    if grok plugin marketplace add "$url" >/dev/null 2>&1; then
      log "added marketplace $url"
      markets=$(grok plugin marketplace list 2>/dev/null || true)
    else
      log "marketplace add failed $url"
    fi
  done < "$dir/marketplaces.txt"
fi

grok plugin marketplace update >/dev/null 2>&1 || log "marketplace update failed"

installed=$(grok plugin list 2>/dev/null || true)
if [ -f "$dir/plugins.txt" ]; then
  while IFS= read -r name || [ -n "$name" ]; do
    case "$name" in
      ""|\#*) continue ;;
    esac
    if ! printf '%s\n' "$installed" | grep -E "(^|[[:space:]])${name}([[:space:]]|$)" >/dev/null 2>&1; then
      if grok plugin install "$name" --trust >/dev/null 2>&1; then
        log "installed $name"
        installed=$(grok plugin list 2>/dev/null || true)
      else
        log "install failed $name"
      fi
    fi
    if grok plugin enable "$name" >/dev/null 2>&1; then
      log "enabled $name"
    else
      log "enable failed $name"
    fi
  done < "$dir/plugins.txt"
fi

exit 0
