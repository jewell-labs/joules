#!/usr/bin/env python3
"""Measure this host and the local GGUF suite. Prints JSON. No hardcoded sizes or paths."""

from __future__ import annotations

import json
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path


def run(args):
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=8)
    except (OSError, subprocess.TimeoutExpired):
        return ""
    if result.returncode != 0:
        return ""
    return result.stdout.strip()


def memory_bytes():
    system = platform.system()
    if system == "Darwin":
        text = run(["sysctl", "-n", "hw.memsize"])
        return int(text) if text.isdigit() else None
    if system == "Linux":
        meminfo = Path("/proc/meminfo")
        if not meminfo.is_file():
            return None
        for line in meminfo.read_text().splitlines():
            if line.startswith("MemTotal:"):
                parts = line.split()
                if len(parts) >= 2 and parts[1].isdigit():
                    return int(parts[1]) * 1024
    return None


def cpu():
    system = platform.system()
    count = os.cpu_count()
    brand = ""
    if system == "Darwin":
        brand = run(["sysctl", "-n", "machdep.cpu.brand_string"])
    elif system == "Linux":
        cpuinfo = Path("/proc/cpuinfo")
        if cpuinfo.is_file():
            for line in cpuinfo.read_text().splitlines():
                if line.lower().startswith("model name"):
                    brand = line.split(":", 1)[-1].strip()
                    break
    return {"brand": brand, "count": count}


def read_json(path):
    try:
        return json.loads(Path(path).read_text())
    except (OSError, json.JSONDecodeError):
        return {}


def suite_state_path():
    home = os.environ.get("GROK_HOME") or str(Path.home() / ".grok")
    return Path(home) / "local-suite.json"


def argv_value(argv, flags):
    for index, item in enumerate(argv):
        for flag in flags:
            if item == flag and index + 1 < len(argv):
                return argv[index + 1]
            prefix = flag + "="
            if item.startswith(prefix):
                return item[len(prefix) :]
    return ""


def llama_processes():
    text = run(["ps", "-ax", "-o", "pid=,command="])
    found = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or "llama-server" not in stripped:
            continue
        pid_text, _, command = stripped.partition(" ")
        if not pid_text.isdigit():
            continue
        try:
            argv = split_command(command)
        except ValueError:
            continue
        if not argv or Path(argv[0]).name != "llama-server":
            continue
        found.append(
            {
                "pid": int(pid_text),
                "models_dir": argv_value(argv, ["--models-dir"]),
                "model_path": argv_value(argv, ["-m", "--model"]),
                "alias": argv_value(argv, ["--alias"]),
                "host": argv_value(argv, ["--host"]),
                "port": argv_value(argv, ["--port"]),
                "models_max": argv_value(argv, ["--models-max"]),
            }
        )
    return found


def split_command(command):
    import shlex

    return shlex.split(command)


def weights_dir(servers):
    env = os.environ.get("WEIGHTS_DIR", "").strip()
    if env:
        return env
    state = read_json(suite_state_path())
    recorded = str(state.get("weights_dir") or "").strip()
    if recorded:
        return recorded
    for server in servers:
        models_dir = server.get("models_dir") or ""
        if models_dir and Path(models_dir).is_dir():
            return models_dir
        model_path = server.get("model_path") or ""
        if model_path and Path(model_path).is_file():
            return str(Path(model_path).parent)
    return ""


def list_weights(directory):
    root = Path(directory)
    if not directory or not root.is_dir():
        return []
    files = []
    for path in sorted(root.rglob("*.gguf")):
        if not path.is_file():
            continue
        relative = path.relative_to(root)
        if any(part.startswith(".") for part in relative.parts):
            continue
        files.append({"name": relative.as_posix(), "bytes": path.stat().st_size})
    return files


def disk_free(directory):
    target = directory if directory and Path(directory).exists() else os.getcwd()
    try:
        usage = shutil.disk_usage(target)
    except OSError:
        return None
    return {"path": target, "free_bytes": usage.free, "total_bytes": usage.total}


def main():
    servers = llama_processes()
    directory = weights_dir(servers)
    payload = {
        "system": platform.system(),
        "memory_bytes": memory_bytes(),
        "cpu": cpu(),
        "disk": disk_free(directory),
        "weights_dir": directory,
        "weights": list_weights(directory),
        "servers": servers,
    }
    json.dump(payload, sys.stdout, indent=2)
    sys.stdout.write("\n")
    if payload["memory_bytes"] is None:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
