"""Roles for a local model entry, read from the custom-models chapter.

Headings in that chapter are the anchors. Field names are whatever the chapter
assigns under those headings. This module does not keep a second copy of them.
"""

from __future__ import annotations

import re
from urllib.parse import urlparse


LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}
CHAPTER_ANCHOR = "### Local OpenAI-Compatible Server"


def is_loopback(host):
    """True only for a loopback name. An all-interfaces bind is not loopback."""
    return (host or "").strip("[]") in LOOPBACK_HOSTS


def endpoint_host(host):
    host = (host or "").strip("[]")
    if ":" in host:
        return "[%s]" % host
    return host


def fence_after(text, heading):
    at = text.find(heading)
    if at < 0:
        raise LookupError(heading)
    rest = text[at:]
    start = rest.find("```")
    if start < 0:
        raise LookupError(heading + " fence")
    newline = rest.find("\n", start)
    end = rest.find("```", newline + 1)
    if newline < 0 or end < 0:
        raise LookupError(heading + " fence")
    return rest[newline + 1 : end]


def section_after(text, heading, stop_level=2):
    at = text.find(heading)
    if at < 0:
        raise LookupError(heading)
    rest = text[at + len(heading) :]
    marker = "\n" + ("#" * stop_level) + " "
    nxt = rest.find(marker)
    if nxt < 0:
        return rest
    return rest[:nxt]


def assignments(block):
    rows = []
    for line in block.splitlines():
        raw, _, comment = line.partition("#")
        raw = raw.strip()
        if not raw or raw.startswith("[") or "=" not in raw:
            continue
        key, value = raw.split("=", 1)
        rows.append((key.strip(), value.strip().strip("\"'"), comment.strip().lower()))
    return rows


def parse_contract(text):
    """Roles for the config write, taken from the chapter text."""
    configuring = section_after(text, "## Configuring Custom Models")
    local = fence_after(text, CHAPTER_ANCHOR)
    credential = section_after(text, "### Credential Resolution", stop_level=3)
    context = section_after(text, "### Context Window", stop_level=3)
    configured = assignments(fence_after(text, "## Configuring Custom Models"))
    local_rows = assignments(local)

    section_match = re.search(r"\[([A-Za-z0-9_]+)\.<name>\]", configuring)
    if not section_match:
        raise LookupError("model section prefix")
    prefix = section_match.group(1)

    def key_with_comment(rows, needle):
        for key, _value, comment in rows:
            if needle in comment:
                return key
        return None

    id_key = key_with_comment(configured, "model identifier")
    endpoint_key = key_with_comment(configured, "endpoint")
    name_key = key_with_comment(configured, "model picker")
    if not endpoint_key:
        for key, value, _comment in local_rows:
            if value.startswith("http://") or value.startswith("https://"):
                endpoint_key = key
                break
    if not id_key or not endpoint_key or not name_key:
        raise LookupError("model entry fields")

    context_names = re.findall(r"`([A-Za-z0-9_]+)`", context)
    config_keys = {key for key, _value, _comment in configured}
    context_key = next((name for name in context_names if name in config_keys), None)
    if not context_key:
        raise LookupError("context field")

    credential_names = re.findall(r"`([A-Za-z0-9_]+)`", credential)
    credential_key = next((name for name in credential_names if name in config_keys), None)
    if not credential_key:
        raise LookupError("credential field")

    sample_url = ""
    sample_ids = []
    for key, value, _comment in local_rows:
        if key == endpoint_key and value.startswith("http"):
            sample_url = value
        if key == id_key and value:
            sample_ids.append(value)
    path = urlparse(sample_url).path if sample_url else ""
    if not path:
        for _key, value, _comment in configured:
            if value.startswith("http"):
                path = urlparse(value).path
                break
    path = path.rstrip("/") or ""

    forbidden = []
    try:
        endpoint_fence = fence_after(text, "## Custom Models Endpoint")
    except LookupError:
        endpoint_fence = ""
    catalog_table = ""
    for line in endpoint_fence.splitlines():
        stripped = line.strip()
        if stripped.startswith("[") and stripped.endswith("]"):
            if catalog_table:
                break
            catalog_table = stripped.strip("[]").strip()
            continue
        if catalog_table and "=" in stripped and not stripped.startswith("#"):
            forbidden.append(stripped.split("=", 1)[0].strip())

    return {
        "prefix": prefix,
        "id_key": id_key,
        "endpoint_key": endpoint_key,
        "name_key": name_key,
        "context_key": context_key,
        "credential_key": credential_key,
        "endpoint_path": path,
        "forbidden": forbidden,
        "catalog_table": catalog_table,
        "sample_ids": sample_ids,
    }


def parse_sections(text):
    sections = []
    name = ""
    fields = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("[") and stripped.endswith("]") and not stripped.startswith("[["):
            if name or fields:
                sections.append((name, fields))
            name = stripped[1:-1].strip()
            fields = []
            continue
        raw = line.split("#", 1)[0].strip()
        if not raw or "=" not in raw:
            continue
        key, value = raw.split("=", 1)
        fields.append((key.strip(), value.strip()))
    if name or fields:
        sections.append((name, fields))
    return sections


def unquote(value):
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def loopback_from_config(text, context_key, prefix, id_key):
    found = []
    for name, fields in parse_sections(text):
        if not (name.startswith(prefix + ".") or name.startswith(prefix + '."')):
            continue
        endpoint = ""
        context = None
        model_id = ""
        for key, raw in fields:
            value = unquote(raw)
            if value.startswith("http://") or value.startswith("https://"):
                parsed = urlparse(value)
                if parsed.hostname and is_loopback(parsed.hostname):
                    endpoint = value
            if context_key and key == context_key:
                try:
                    context = int(unquote(raw))
                except ValueError:
                    context = None
            if id_key and key == id_key:
                model_id = unquote(raw)
        if not endpoint:
            continue
        parsed = urlparse(endpoint)
        key_name = name.split(".", 1)[1].strip().strip('"')
        found.append(
            {
                "section": name,
                "key": key_name,
                "endpoint": endpoint,
                "host": parsed.hostname,
                "port": parsed.port,
                "context": context,
                "model_id": model_id,
                "fields": fields,
            }
        )
    return found


def quote_toml(value):
    if isinstance(value, int):
        return str(value)
    text = str(value).replace("\\", "\\\\").replace('"', '\\"')
    return '"%s"' % text


def section_header(prefix, key):
    if re.fullmatch(r"[A-Za-z0-9_-]+", key):
        return "%s.%s" % (prefix, key)
    escaped = key.replace("\\", "\\\\").replace('"', '\\"')
    return '%s."%s"' % (prefix, escaped)


def split_section(text, header):
    """Return (before, body_lines, after) for a [header] table, or None."""
    lines = text.splitlines(keepends=True)
    start = None
    for index, line in enumerate(lines):
        if line.strip() == "[%s]" % header:
            start = index
            break
    if start is None:
        return None
    end = len(lines)
    for index in range(start + 1, len(lines)):
        stripped = lines[index].strip()
        if stripped.startswith("[") and stripped.endswith("]"):
            end = index
            break
    return lines[:start], lines[start + 1 : end], lines[end:]


def upsert_model(text, header, fields):
    """fields is a list of (key, value). Other keys in an existing table stay."""
    existing = split_section(text, header)
    if existing is None:
        block = ["[%s]\n" % header]
        for key, value in fields:
            block.append("%s = %s\n" % (key, quote_toml(value)))
        base = text
        if base and not base.endswith("\n"):
            base += "\n"
        if base and not base.endswith("\n\n"):
            base += "\n"
        return base + "".join(block)
    before, body, after = existing
    kept = []
    replaced = set()
    wanted = {key: value for key, value in fields}
    for line in body:
        raw = line.split("#", 1)[0].strip()
        if not raw or "=" not in raw:
            kept.append(line if line.endswith("\n") else line + "\n")
            continue
        key = raw.split("=", 1)[0].strip()
        if key in wanted:
            kept.append("%s = %s\n" % (key, quote_toml(wanted[key])))
            replaced.add(key)
        else:
            kept.append(line if line.endswith("\n") else line + "\n")
    for key, value in fields:
        if key not in replaced:
            kept.append("%s = %s\n" % (key, quote_toml(value)))
    return "".join(before) + ("[%s]\n" % header) + "".join(kept) + "".join(after)


def hosted_default(text):
    """The catalog default. Only the key `default`, not a longer name beside it."""
    for name, fields in parse_sections(text):
        if name != "models":
            continue
        for key, raw in fields:
            if key == "default":
                return unquote(raw)
    return ""


def apply_config(text, contract, server, context):
    for forbidden in contract["forbidden"]:
        if forbidden in (contract["id_key"], contract["endpoint_key"], contract["context_key"]):
            raise SystemExit("chapter field collides with the catalog endpoint")
    if not is_loopback(server.get("host")):
        raise SystemExit("refusing a server that is not on loopback")
    alias = server["alias"]
    header = section_header(contract["prefix"], alias)
    path = contract["endpoint_path"]
    endpoint = "http://%s:%s%s" % (endpoint_host(server["host"]), server["port"], path)
    fields = [
        (contract["id_key"], alias),
        (contract["endpoint_key"], endpoint),
        (contract["name_key"], alias),
        (contract["context_key"], int(context)),
        (contract["credential_key"], ""),
    ]
    for key, _value in fields:
        if key in contract["forbidden"]:
            raise SystemExit("refusing to write catalog endpoint field")
    updated = upsert_model(text, header, fields)

    def tables(blob):
        return {
            name
            for name, _fields in parse_sections(blob)
            if contract["catalog_table"] and name == contract["catalog_table"]
        }

    if tables(updated) - tables(text):
        raise SystemExit("refusing to add a catalog-wide endpoint table")
    for forbidden in contract["forbidden"]:
        old_count = text.count("\n" + forbidden + " ") + text.count("\n" + forbidden + "=")
        new_count = updated.count("\n" + forbidden + " ") + updated.count("\n" + forbidden + "=")
        if new_count > old_count:
            raise SystemExit("refusing to write %s" % forbidden)
    return updated
