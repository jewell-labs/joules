import http from "node:http"
import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { pageHtml } from "./page.mjs"
import {
  LAUNCH_STATE,
  answerLines,
  chatBody,
  chatText,
  cleanState,
  nextSurface,
  systemOneBody,
} from "./shape.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1"])

export function engineUrl(value, fallback) {
  const url = new URL(value || fallback)
  if (!LOOPBACK.has(url.hostname)) {
    throw new Error("An engine URL has to stay on loopback.")
  }
  return url
}

function clefEndpoint(env) {
  const url = engineUrl(env.CLEF_URL, "http://127.0.0.1:8000")
  url.pathname = "/v1/systemone"
  url.search = ""
  return url
}

function grokRoot(env) {
  const url = engineUrl(env.GROK_URL, "http://127.0.0.1:8080")
  const path = url.pathname.replace(/\/$/, "")
  url.pathname = path.endsWith("/v1") ? path : `${path}/v1`
  url.search = ""
  return url
}

async function readJson(response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { error: text.slice(0, 400) }
  }
}

async function postJson(url, body, timeoutMs) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })
  const payload = await readJson(response)
  if (!response.ok) {
    const error = new Error(payload.error || `Engine answered ${response.status}.`)
    error.status = response.status
    error.payload = payload
    throw error
  }
  return payload
}

let grokModel = ""

async function localModel(env) {
  if (env.GROK_MODEL) return env.GROK_MODEL
  if (grokModel) return grokModel
  const url = grokRoot(env)
  url.pathname = `${url.pathname.replace(/\/$/, "")}/models`
  const response = await fetch(url, { signal: AbortSignal.timeout(3000) })
  const payload = await readJson(response)
  const id = payload?.data?.[0]?.id || payload?.models?.[0]?.name
  if (!id) throw new Error("The local chat server did not name a model.")
  grokModel = id
  return id
}

export async function classify(demo, state, env = process.env) {
  const body = systemOneBody(demo, state)
  const payload = await postJson(clefEndpoint(env), body, 120000)
  if (!payload.answers || typeof payload.answers !== "object") {
    throw new Error("The classifier returned no typed answers.")
  }
  return payload
}

export async function complete(state, env = process.env) {
  const body = chatBody(state)
  const model = await localModel(env)
  const root = grokRoot(env)
  root.pathname = `${root.pathname.replace(/\/$/, "")}/chat/completions`
  const payload = await postJson(
    root,
    { model, messages: body.messages, temperature: 0.2, max_tokens: 180 },
    120000,
  )
  const text = chatText(payload)
  if (!text) throw new Error("The chat server returned an empty reply.")
  return { text, payload }
}

export async function show(demo, state, env = process.env) {
  const selected = demo === "many" ? "many" : demo
  const decision = await classify(selected, state, env)
  const manyDecision = selected === "many" ? decision : await classify("many", state, env)
  const chat = await complete(state, env)
  const surface = nextSurface(decision)
  return {
    demo: selected,
    state: cleanState(state),
    decision,
    many: manyDecision,
    chatText: chat.text,
    surface,
    lines: answerLines(decision.answers),
  }
}

function send(res, status, body, type) {
  const payload = Buffer.from(body)
  res.writeHead(status, {
    "content-type": type,
    "content-length": payload.length,
    "cache-control": "no-store",
  })
  res.end(payload)
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks).toString("utf8")
}

function fieldsFrom(req, raw) {
  const type = req.headers["content-type"] || ""
  if (type.includes("application/json")) {
    const parsed = raw ? JSON.parse(raw) : {}
    return { demo: parsed.demo, state: parsed.state, all: parsed.all }
  }
  const params = new URLSearchParams(raw)
  return { demo: params.get("demo"), state: params.get("state"), all: params.get("all") }
}

async function handle(req, res, env) {
  const url = new URL(req.url || "/", "http://127.0.0.1")
  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      send(res, 200, pageHtml(), "text/html; charset=utf-8")
      return
    }
    if (req.method === "GET" && url.pathname === "/health") {
      send(res, 200, JSON.stringify({ ok: true }), "application/json")
      return
    }
    if (req.method === "GET" && (url.pathname === "/client.js" || url.pathname === "/shape.mjs")) {
      const name = url.pathname === "/client.js" ? "client.js" : "shape.mjs"
      const file = await readFile(join(HERE, name), "utf8")
      send(res, 200, file, "text/javascript; charset=utf-8")
      return
    }
    if (req.method === "POST" && (url.pathname === "/api/classify" || url.pathname === "/api/chat" || url.pathname === "/api/show")) {
      const raw = await readBody(req)
      const fields = fieldsFrom(req, raw)
      const demo = fields.all === "1" || fields.all === 1 ? "many" : fields.demo || "triage"
      const wantsJson = (req.headers.accept || "").includes("application/json") || (req.headers["content-type"] || "").includes("application/json")
      if (url.pathname === "/api/classify") {
        const decision = await classify(demo, fields.state, env)
        send(res, 200, JSON.stringify(decision), "application/json")
        return
      }
      if (url.pathname === "/api/chat") {
        const chat = await complete(fields.state, env)
        send(res, 200, JSON.stringify({ reply: chat.text }), "application/json")
        return
      }
      const result = await show(demo, fields.state, env)
      if (wantsJson) {
        send(res, 200, JSON.stringify(result), "application/json")
        return
      }
      send(res, 200, pageHtml(result), "text/html; charset=utf-8")
      return
    }
    send(res, 404, "Not found", "text/plain; charset=utf-8")
  } catch (error) {
    const status = error.status || 502
    const message = error instanceof Error ? error.message : "The request failed."
    const wantsJson = (req.headers.accept || "").includes("application/json") || (req.headers["content-type"] || "").includes("application/json")
    if (wantsJson || url.pathname.startsWith("/api/")) {
      send(res, status, JSON.stringify({ error: message }), "application/json")
      return
    }
    send(res, status, pageHtml({ error: message, state: "" }), "text/html; charset=utf-8")
  }
}

export function start(port = 0, env = process.env) {
  const server = http.createServer((req, res) => {
    handle(req, res, env)
  })
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve(server))
  })
}

export async function runCheck(env = process.env) {
  const server = await start(0, env)
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    const decisionResponse = await fetch(base + "/api/classify", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ demo: "triage", state: LAUNCH_STATE }),
    })
    const decision = await decisionResponse.json()
    const chatResponse = await fetch(base + "/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ state: LAUNCH_STATE }),
    })
    const chat = await chatResponse.json()
    const label = decision?.answers?.department?.choice || ""
    const typed = answerLines(decision?.answers).some(
      (line) => line.type && line.label && (line.confidence != null || line.probabilities),
    )
    if (!decisionResponse.ok || !typed || !label) {
      throw new Error(decision.error || "The decision body had no typed answer.")
    }
    if (!chatResponse.ok || !String(chat.reply || "").trim()) {
      throw new Error(chat.error || "The chat body was empty.")
    }
    return { label, decision, chat }
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

async function main() {
  if (process.argv.includes("--check")) {
    const result = await runCheck()
    process.stdout.write(JSON.stringify(result) + "\n")
    return
  }
  const port = Number(process.env.PORT || 4173)
  const server = await start(port)
  process.stdout.write(`listening http://127.0.0.1:${server.address().port}/\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n")
    process.exit(1)
  })
}
