#!/usr/bin/env python3
"""Sample stdio MCP server for the Joules template plugin.

Speaks newline-delimited JSON-RPC, which is what Grok's MCP client writes.
Exposes one tool, template_status. It does not read the workspace, the
network, or credentials.
"""

import json
import os
import sys

VERSION = os.environ.get("JOULES_TEMPLATE_VERSION", "0.1.1")


def send(message):
    sys.stdout.write(json.dumps(message) + "\n")
    sys.stdout.flush()


def read_message():
    line = sys.stdin.readline()
    if line == "":
        return None
    line = line.strip()
    if not line:
        return read_message()
    return json.loads(line)


TOOLS = [
    {
        "name": "template_status",
        "description": "Return the Joules template plugin status card. Takes no arguments.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "additionalProperties": False,
        },
    }
]


def result(message_id, value):
    send({"jsonrpc": "2.0", "id": message_id, "result": value})


def handle(message):
    method = message.get("method")
    message_id = message.get("id")
    if method == "initialize":
        params = message.get("params") or {}
        result(
            message_id,
            {
                "protocolVersion": params.get("protocolVersion") or "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "joules-template", "version": VERSION},
            },
        )
        return
    if method == "notifications/initialized":
        return
    if method == "tools/list":
        result(message_id, {"tools": TOOLS})
        return
    if method == "tools/call":
        result(
            message_id,
            {
                "content": [
                    {
                        "type": "text",
                        "text": f"joules template {VERSION} ok",
                    }
                ]
            },
        )
        return
    if method == "ping":
        result(message_id, {})
        return
    if method in ("resources/list", "prompts/list"):
        key = "resources" if method.startswith("resources") else "prompts"
        result(message_id, {key: []})
        return
    if message_id is not None:
        send(
            {
                "jsonrpc": "2.0",
                "id": message_id,
                "error": {"code": -32601, "message": "method not found"},
            }
        )


def main():
    while True:
        message = read_message()
        if message is None:
            return
        handle(message)


if __name__ == "__main__":
    main()
