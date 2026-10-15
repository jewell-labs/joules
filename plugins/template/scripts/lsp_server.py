#!/usr/bin/env python3
"""Sample stdio language server for the Joules template plugin.

Handles initialize, shutdown, and exit. Other requests get an empty result.
It registers no real language. The plugin maps only the .joules extension to it.
"""

import json
import sys


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


def result(message_id, value):
    send({"jsonrpc": "2.0", "id": message_id, "result": value})


def handle(message):
    method = message.get("method")
    message_id = message.get("id")
    if method == "initialize":
        result(
            message_id,
            {
                "capabilities": {},
                "serverInfo": {"name": "joules-template", "version": "0.1.0"},
            },
        )
        return
    if method == "shutdown":
        result(message_id, None)
        return
    if method == "exit":
        raise SystemExit(0)
    if message_id is not None:
        result(message_id, None)


def main():
    while True:
        message = read_message()
        if message is None:
            return
        handle(message)


if __name__ == "__main__":
    main()
