#!/usr/bin/env python3
"""Drive bin/grok-local. The assertions read the process output and the files it writes."""

from __future__ import annotations

import importlib.machinery
import json
import os
import signal
import socket
import subprocess
import tempfile
import textwrap
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
LAUNCHER = ROOT / "bin" / "grok-local"


def load_launcher():
    loader = importlib.machinery.SourceFileLoader("grok_local_suite", str(LAUNCHER))
    return loader.load_module()


def blocks(report):
    found = {}
    current = None
    for line in report.splitlines():
        if line.startswith("- "):
            found.setdefault(current, []).append(line[2:])
            continue
        if line.endswith(":") and not line.startswith("Checked") and not line.startswith("Chapter"):
            current = line[:-1]
            found.setdefault(current, [])
    return found


class Handler(BaseHTTPRequestHandler):
    payload = b""

    def do_GET(self):
        body = self.payload
        self.send_response(200)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Content-Type", "application/octet-stream")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        return


class LocalSuiteTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mod = load_launcher()
        cls.chapter = cls.mod.chapter_path().read_text()
        cls.contract = cls.mod.parse_contract(cls.chapter)
        help_text = cls.mod.server_help_text(cls.mod.llama_binary([]))
        cls.defaults = cls.mod.server_defaults(help_text)
        cls.help_text = help_text

    def test_contract_comes_from_the_chapter(self):
        for role in (
            "prefix",
            "id_key",
            "endpoint_key",
            "name_key",
            "context_key",
            "credential_key",
            "endpoint_path",
        ):
            value = self.contract[role]
            self.assertTrue(value, role)
            self.assertIn(str(value).strip("/"), self.chapter)
        for sample in self.contract["sample_ids"]:
            self.assertIn(sample, self.chapter)
        for forbidden in self.contract["forbidden"]:
            self.assertIn(forbidden, self.chapter)
        host, port = self.defaults
        self.assertIn(str(port), self.help_text)
        self.assertIn(host, self.help_text)

    def test_discover_names_a_planted_setup_and_does_not_call_it_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp)
            weights = tmp / "weights"
            weights.mkdir()
            planted = weights / "planted.gguf"
            planted.write_bytes(b"GGUF-planted-weight")
            port = self._listen(tmp)
            alias = "planted-local"
            config = tmp / "config.toml"
            config.write_text(
                textwrap.dedent(
                    """\
                    [models]
                    default = "kept-hosted"

                    [%s.%s]
                    %s = "%s"
                    %s = "http://127.0.0.1:%s%s"
                    %s = "%s"
                    %s = 4321
                    %s = ""
                    """
                    % (
                        self.contract["prefix"],
                        alias,
                        self.contract["id_key"],
                        alias,
                        self.contract["endpoint_key"],
                        port,
                        self.contract["endpoint_path"],
                        self.contract["name_key"],
                        alias,
                        self.contract["context_key"],
                        self.contract["credential_key"],
                    )
                )
            )
            state = tmp / "state.json"
            state.write_text(
                json.dumps(
                    {
                        "weights_dir": str(weights),
                        "wanted": [],
                        "servers": [
                            {
                                "argv": [
                                    self.mod.llama_binary([]),
                                    "--model",
                                    str(planted),
                                    "--host",
                                    "127.0.0.1",
                                    "--port",
                                    str(port),
                                    "--alias",
                                    alias,
                                    "-c",
                                    "4321",
                                ]
                            }
                        ],
                    }
                )
            )
            report = self._run(
                [
                    "discover",
                    "--no-live",
                    "--weights",
                    str(weights),
                    "--config",
                    str(config),
                    "--state",
                    str(state),
                ]
            )
            parsed = blocks(report)
            present = "\n".join(parsed["PRESENT weights"] + parsed["PRESENT server"] + parsed["PRESENT loopback"])
            missing = "\n".join(
                parsed["MISSING weights"] + parsed["MISSING server"] + parsed["MISSING loopback"]
            )
            self.assertIn(planted.name, present)
            self.assertIn(alias, present)
            self.assertIn(str(port), present)
            self.assertNotIn(planted.name, missing)
            self.assertNotIn(alias, missing)
            self.assertNotIn(str(port), missing)
            self.assertEqual(planted.read_bytes(), b"GGUF-planted-weight")

    def test_discover_does_not_guess_a_home_folder_or_call_a_note_a_weight(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp)
            weights = tmp / "weights"
            weights.mkdir()
            (weights / "planted.gguf").write_bytes(b"GGUF-planted")
            (weights / "notes.txt").write_bytes(b"not a weight")
            config = tmp / "config.toml"
            config.write_text('[models]\ndefault = "kept-hosted"\ndefault_reasoning_effort = "medium"\n')
            state = tmp / "absent-state.json"
            named = self._run(
                [
                    "discover",
                    "--no-live",
                    "--weights",
                    str(weights),
                    "--config",
                    str(config),
                    "--state",
                    str(state),
                ]
            )
            self.assertIn("planted.gguf", named)
            self.assertNotIn("notes.txt", named)
            guessed = self._run(
                [
                    "discover",
                    "--no-live",
                    "--config",
                    str(config),
                    "--state",
                    str(tmp / "also-absent.json"),
                ]
            )
            self.assertIn("Weights directory: \n", guessed)
            self.assertNotIn("Weights directory: %s" % (Path.home() / "gguf"), guessed)
            self.assertEqual(self.mod.hosted_default(config.read_text()), "kept-hosted")

    def test_setup_downloads_configures_and_reuses(self):
        payload = b"GGUF" + os.urandom(2048)
        httpd, url = self._serve(payload)
        try:
            with tempfile.TemporaryDirectory() as tmp:
                tmp = Path(tmp)
                weights = tmp / "weights"
                weights.mkdir()
                name = "fetched.gguf"
                port = self._listen(tmp)
                alias = "planted-local"
                dest = weights / name
                config = tmp / "config.toml"
                before = '[models]\ndefault = "kept-hosted"\n'
                config.write_text(before)
                state = tmp / "state.json"
                argv = [
                    self.mod.llama_binary([]),
                    "--model",
                    str(dest),
                    "--host",
                    "127.0.0.1",
                    "--port",
                    str(port),
                    "--alias",
                    alias,
                    "-c",
                    "4321",
                ]
                state.write_text(json.dumps({"weights_dir": str(weights), "wanted": [], "servers": [{"argv": argv}]}))
                report = self._run(
                    [
                        "setup",
                        "--no-live",
                        "--weights",
                        str(weights),
                        "--config",
                        str(config),
                        "--state",
                        str(state),
                        "--fetch",
                        url,
                        "--name",
                        name,
                        "--log",
                        str(tmp / "server.log"),
                    ]
                )
                self.assertEqual(dest.read_bytes(), payload)
                self.assertIn("source-bytes=%s" % len(payload), report)
                written = config.read_text()
                self.assertIn('default = "kept-hosted"', written)
                self.assertIn(alias, written)
                self.assertIn("127.0.0.1:%s" % port, written)
                self.assertIn("4321", written)
                self.assertIn('%s = ""' % self.contract["credential_key"], written)
                for sample in self.contract["sample_ids"]:
                    self.assertNotIn(sample, written)
                for forbidden in self.contract["forbidden"]:
                    self.assertNotIn(forbidden, written)
                self.assertNotIn("[%s]" % self.contract["catalog_table"], written)
                again = self._run(
                    [
                        "setup",
                        "--no-live",
                        "--weights",
                        str(weights),
                        "--config",
                        str(config),
                        "--state",
                        str(state),
                        "--fetch",
                        url,
                        "--name",
                        name,
                        "--log",
                        str(tmp / "server.log"),
                    ]
                )
                parsed = blocks(again)
                self.assertEqual(parsed["FETCHED"], [])
                self.assertEqual(dest.read_bytes(), payload)
                self.assertEqual(written.count("[%s.%s]" % (self.contract["prefix"], alias)), 1)
                self.assertEqual(config.read_text().count("[%s.%s]" % (self.contract["prefix"], alias)), 1)
                discovered = blocks(
                    self._run(
                        [
                            "discover",
                            "--no-live",
                            "--weights",
                            str(weights),
                            "--config",
                            str(config),
                            "--state",
                            str(state),
                        ]
                    )
                )
                present = "\n".join(
                    discovered["PRESENT weights"]
                    + discovered["PRESENT server"]
                    + discovered["PRESENT loopback"]
                )
                missing = "\n".join(
                    discovered["MISSING weights"]
                    + discovered["MISSING server"]
                    + discovered["MISSING loopback"]
                )
                self.assertIn(name, present)
                self.assertIn(alias, present)
                self.assertNotIn(name, missing)
                self.assertNotIn(alias, missing)
        finally:
            httpd.shutdown()

    def test_launch_execs_grok_with_the_local_model(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp)
            weights = tmp / "weights"
            weights.mkdir()
            planted = weights / "planted.gguf"
            planted.write_bytes(b"GGUF-launch")
            port = self._listen(tmp)
            alias = "planted-local"
            config = tmp / "config.toml"
            config.write_text(
                '[models]\ndefault = "kept-hosted"\n\n[%s.%s]\n%s = "%s"\n%s = "http://127.0.0.1:%s%s"\n%s = "%s"\n%s = 4321\n%s = ""\n'
                % (
                    self.contract["prefix"],
                    alias,
                    self.contract["id_key"],
                    alias,
                    self.contract["endpoint_key"],
                    port,
                    self.contract["endpoint_path"],
                    self.contract["name_key"],
                    alias,
                    self.contract["context_key"],
                    self.contract["credential_key"],
                )
            )
            state = tmp / "state.json"
            state.write_text(
                json.dumps(
                    {
                        "weights_dir": str(weights),
                        "servers": [
                            {
                                "argv": [
                                    self.mod.llama_binary([]),
                                    "--model",
                                    str(planted),
                                    "--host",
                                    "127.0.0.1",
                                    "--port",
                                    str(port),
                                    "--alias",
                                    alias,
                                    "-c",
                                    "4321",
                                ]
                            }
                        ],
                    }
                )
            )
            recorded = tmp / "exec.txt"
            fake = tmp / "fake-grok"
            fake.write_text(
                "#!/bin/sh\nprintf '%%s\\n' \"$0\" \"$@\" > %s\n" % sh_quote(recorded)
            )
            fake.chmod(0o755)
            self._run(
                [
                    "--no-live",
                    "--grok-bin",
                    str(fake),
                    "--weights",
                    str(weights),
                    "--config",
                    str(config),
                    "--state",
                    str(state),
                    "--log",
                    str(tmp / "server.log"),
                    "-p",
                    "ping",
                ]
            )
            lines = recorded.read_text().splitlines()
            self.assertEqual(lines[0], str(fake))
            self.assertIn("-m", lines)
            self.assertIn(alias, lines)
            self.assertIn("ping", lines)
            self.assertNotIn("kept-hosted", lines)
            real = self.mod.grok_binary()
            self.assertTrue(Path(real).exists())
            self.assertEqual(os.path.basename(real), "grok")

    def test_launch_starts_a_server_for_weights_already_on_disk(self):
        """On-disk text GGUF, no recorded server, no --fetch. The launcher must bind and exec."""
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp)
            weights = tmp / "weights"
            weights.mkdir()
            text_weight = weights / "desk-text.gguf"
            text_weight.write_bytes(b"GGUF" + b"t" * 32)
            (weights / "vision.mmproj.gguf").write_bytes(b"GGUF" + b"m" * 4000)
            config = tmp / "config.toml"
            config.write_text('[models]\ndefault = "kept-hosted"\n')
            state = tmp / "state.json"
            self.assertFalse(state.exists())
            bind_dir = tmp / "bin"
            bind_dir.mkdir()
            record = tmp / "llama-argv.jsonl"
            pid_path = tmp / "llama.pid"
            fake_server = bind_dir / "llama-server"
            fake_server.write_text(FAKE_LLAMA)
            fake_server.chmod(0o755)
            recorded = tmp / "exec.txt"
            fake_grok = tmp / "fake-grok"
            fake_grok.write_text(
                "#!/bin/sh\nprintf '%%s\\n' \"$0\" \"$@\" > %s\n" % sh_quote(recorded)
            )
            fake_grok.chmod(0o755)
            env = os.environ.copy()
            env["PATH"] = str(bind_dir) + os.pathsep + env.get("PATH", "")
            env["FAKE_LLAMA_RECORD"] = str(record)
            env["FAKE_LLAMA_PID"] = str(pid_path)
            try:
                proc = subprocess.run(
                    [
                        str(LAUNCHER),
                        "--no-live",
                        "--grok-bin",
                        str(fake_grok),
                        "--weights",
                        str(weights),
                        "--config",
                        str(config),
                        "--state",
                        str(state),
                        "--log",
                        str(tmp / "server.log"),
                        "-p",
                        "ping",
                    ],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    check=False,
                    env=env,
                )
                if proc.returncode != 0:
                    self.fail(
                        "grok-local -> %s\n%s\n%s" % (proc.returncode, proc.stdout, proc.stderr)
                    )
                self.assertTrue(record.is_file(), "llama-server was not started")
                argv = json.loads(record.read_text().splitlines()[-1])
                self.assertEqual(Path(argv[0]).resolve(), fake_server.resolve())
                self.assertEqual(argv[argv.index("--model") + 1], str(text_weight))
                host = argv[argv.index("--host") + 1]
                port = int(argv[argv.index("--port") + 1])
                self.assertTrue(self._port_open(host, port), "server is not listening on the bound port")
                written = config.read_text()
                entries = self.mod.loopback_from_config(
                    written,
                    self.contract["context_key"],
                    self.contract["prefix"],
                    self.contract["id_key"],
                )
                self.assertEqual(len(entries), 1)
                self.assertEqual(entries[0]["port"], port)
                self.assertEqual(entries[0]["context"], 2048)
                self.assertEqual(entries[0]["key"], "desk-text")
                credential = [
                    self.mod.unquote(value)
                    for key, value in entries[0]["fields"]
                    if key == self.contract["credential_key"]
                ]
                self.assertEqual(credential, [""])
                self.assertEqual(self.mod.hosted_default(written), "kept-hosted")
                section_names = [name for name, _fields in self.mod.parse_sections(written)]
                self.assertNotIn(self.contract["catalog_table"], section_names)
                saved = json.loads(state.read_text())
                self.assertEqual(saved.get("wanted") or [], [])
                self.assertIn(str(text_weight), saved["servers"][0]["argv"])
                lines = recorded.read_text().splitlines()
                self.assertEqual(lines[0], str(fake_grok))
                self.assertEqual(lines[lines.index("-m") + 1], "desk-text")
                self.assertIn("ping", lines)
                self.assertNotIn("kept-hosted", lines)
            finally:
                if pid_path.is_file():
                    try:
                        os.kill(int(pid_path.read_text().strip()), signal.SIGTERM)
                    except (OSError, ValueError):
                        pass

    def _port_open(self, host, port):
        try:
            sock = socket.create_connection((host, int(port)), 0.4)
        except OSError:
            return False
        sock.close()
        return True

    def _listen(self, tmp):
        sock = socket.socket()
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind(("127.0.0.1", 0))
        sock.listen(8)
        port = sock.getsockname()[1]
        self.addCleanup(sock.close)
        return port

    def _serve(self, payload):
        Handler.payload = payload
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(httpd.server_close)
        url = "http://127.0.0.1:%s/weight.gguf" % httpd.server_address[1]
        return httpd, url

    def _run(self, args):
        proc = subprocess.run(
            [str(LAUNCHER), *args],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
        if proc.returncode != 0:
            self.fail("grok-local %s -> %s\n%s\n%s" % (args, proc.returncode, proc.stdout, proc.stderr))
        return proc.stdout


def sh_quote(path):
    return "'" + str(path).replace("'", "'\\''") + "'"


FAKE_LLAMA = """#!/usr/bin/env python3
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

if "--help" in sys.argv:
    sys.stdout.write("--host HOST (default: 127.0.0.1)\\n--port PORT (default: 8080)\\n")
    raise SystemExit(0)

def flag(name):
    if name in sys.argv:
        return sys.argv[sys.argv.index(name) + 1]
    return ""

record = os.environ.get("FAKE_LLAMA_RECORD", "")
if record:
    with open(record, "a") as handle:
        handle.write(json.dumps(sys.argv) + "\\n")
pid_path = os.environ.get("FAKE_LLAMA_PID", "")
if pid_path:
    with open(pid_path, "w") as handle:
        handle.write(str(os.getpid()))

host = flag("--host") or "127.0.0.1"
port = int(flag("--port"))

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.rstrip("/").endswith("/models"):
            body = json.dumps({"data": [{"n_ctx": 2048}]}).encode()
        else:
            body = b"{}"
        self.send_response(200)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        return

ThreadingHTTPServer((host, port), Handler).serve_forever()
"""


if __name__ == "__main__":
    unittest.main()
