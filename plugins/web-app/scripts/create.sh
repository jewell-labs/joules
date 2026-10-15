#!/bin/sh
# Copy template/ into a directory after every question has an answer.
set -u

here=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
plugin_dir=$(dirname "$here")
template="$plugin_dir/template"

usage() {
  cat <<'EOF'
Usage: create.sh --dest PATH --name NAME --title TITLE

Copy the web-app template into PATH. The copy waits until every question
below has an answer.

  --dest   Directory to create. It must not already contain files.
  --name   Package, Worker, and D1 database name. Lowercase letters, digits,
           and single hyphens. Example: acme-app
  --title  Name shown in the app and the manifest.

In a terminal, omitted flags are asked in that order. Enter accepts the
suggested title.
EOF
}

valid_name() {
  printf '%s\n' "$1" | grep -Eq '^[a-z0-9]+(-[a-z0-9]+)*$'
}

valid_title() {
  printf '%s\n' "$1" | grep -Eq '[[:graph:]]' || return 1
  printf '%s\n' "$1" | grep -q '__APP_' && return 1
  return 0
}

suggest_title() {
  printf '%s\n' "$1" | awk -F- '{
    for (i = 1; i <= NF; i++) {
      $i = toupper(substr($i, 1, 1)) substr($i, 2)
    }
    OFS = " "
    print
  }'
}

dest=
name=
title=
while [ $# -gt 0 ]; do
  case $1 in
    --dest)
      [ $# -ge 2 ] || { echo "missing value for --dest" >&2; exit 2; }
      dest=$2
      shift 2
      ;;
    --name)
      [ $# -ge 2 ] || { echo "missing value for --name" >&2; exit 2; }
      name=$2
      shift 2
      ;;
    --title)
      [ $# -ge 2 ] || { echo "missing value for --title" >&2; exit 2; }
      title=$2
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ -z "$dest" ] || [ -z "$name" ] || [ -z "$title" ]; then
  if [ ! -t 0 ]; then
    echo "every question needs an answer" >&2
    usage >&2
    exit 2
  fi
  while [ -z "$dest" ]; do
    printf 'Directory to create: ' >&2
    read -r dest || exit 2
  done
  while ! valid_name "$name"; do
    printf 'Package name (lowercase, digits, hyphens): ' >&2
    read -r name || exit 2
  done
  suggested=$(suggest_title "$name")
  while ! valid_title "$title"; do
    printf 'Title [%s]: ' "$suggested" >&2
    read -r title || exit 2
    [ -n "$title" ] || title=$suggested
  done
fi

valid_name "$name" || { echo "name must be lowercase letters, digits, and hyphens" >&2; exit 2; }
valid_title "$title" || { echo "title is empty or contains a template token" >&2; exit 2; }
[ -n "$dest" ] || { echo "destination is empty" >&2; exit 2; }
[ -d "$template" ] || { echo "missing template at $template" >&2; exit 1; }

template_abs=$(CDPATH= cd -- "$template" && pwd)
dest_abs=$(python3 -c 'import os, sys; print(os.path.abspath(sys.argv[1]))' "$dest")
case "$dest_abs" in
  "$template_abs"|"$template_abs"/*)
    echo "destination is inside the template" >&2
    exit 1
    ;;
esac
if [ -e "$dest_abs" ] && [ ! -d "$dest_abs" ]; then
  echo "destination exists and is not a directory: $dest_abs" >&2
  exit 1
fi
if [ -d "$dest_abs" ] && [ -n "$(find "$dest_abs" -mindepth 1 -print -quit)" ]; then
  echo "destination is not empty: $dest_abs" >&2
  exit 1
fi
mkdir -p -- "$dest_abs"

tar -C "$template_abs" -cf - \
  --exclude node_modules \
  --exclude .wrangler \
  --exclude dist \
  --exclude .output \
  --exclude .tanstack \
  --exclude worker-configuration.d.ts \
  --exclude .DS_Store \
  . | tar -C "$dest_abs" -xf -

python3 - "$dest_abs" "$name" "$title" <<'PY'
import os, sys
root, name, title = sys.argv[1:]
skip = {"node_modules", ".wrangler", "dist", ".output"}
for dirpath, dirnames, filenames in os.walk(root):
    dirnames[:] = [item for item in dirnames if item not in skip]
    for filename in filenames:
        path = os.path.join(dirpath, filename)
        try:
            text = open(path, encoding="utf-8").read()
        except UnicodeDecodeError:
            continue
        if "__APP_NAME__" not in text and "__APP_TITLE__" not in text:
            continue
        open(path, "w", encoding="utf-8").write(
            text.replace("__APP_NAME__", name).replace("__APP_TITLE__", title)
        )
PY

printf '%s\n' "$dest_abs"
