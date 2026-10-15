#!/usr/bin/env python3
"""Sample stdio MCP server for the Joules template plugin.

Speaks Content-Length framed JSON-RPC. Exposes one tool, template_status.
It does not read the workspace, the network, or credentials.
"""

import json
import os
import sys

PROTOCOL = "2024-11-05"
VERSION = os.environ.get("JOULES_TEMPLATE_VERSION", "0.1.0")


def send(message):
    body = json.dumps(message).encode()
    sys.stdout.buffer.write(f"Content-Length: {len(body)}\r\n\r\n".encode() + body)
    sys.stdout.buffer.flush()


def read_message():
    headers = {}
    while True:
        line = sys.stdin.buffer.readline()
        if line == b"":
            return None
        if line in (b"\r\n", b"\n"):
            break
        key, value = line.decode().split(":", 1)
        headers[key.strip().lower()] = value.strip()
    length = int(headers.get("content-length", "0"))
    if length <= 0:
        return None
    return json.loads(sys.stdin.buffer.read(length))


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
        result(
            message_id,
            {
                "protocolVersion": PROTOCOL,
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
