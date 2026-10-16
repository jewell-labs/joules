import http from "node:http"
import { readFile, readdir } from "node:fs/promises"
import { createConnection } from "node:net"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { SAMPLE_ANIMALS, pageHtml } from "./page.mjs"
import {
  assignListening,
  catalogFromNames,
  cleanRequest,
  decisionGraph,
  loopbackModelsFromConfig,
  modelsForRequest,
  questionIds,
  routerBody,
  stepBody,
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

function suitePath(env) {
  return env.SUITE_STATE || join(homedir(), ".grok", "local-suite.json")
}

function configPath(env) {
  return env.GROK_CONFIG || join(homedir(), ".grok", "config.toml")
}

async function readText(path) {
  try {
    return await readFile(path, "utf8")
  } catch {
    return ""
  }
}

function portOpen(host, port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port: Number(port), timeout: 400 })
    const done = (open) => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(open)
    }
    socket.once("connect", () => done(true))
    socket.once("timeout", () => done(false))
    socket.once("error", () => done(false))
  })
}

export async function discoverModels(env = process.env) {
  const stateText = await readText(suitePath(env))
  let weightsDir = env.WEIGHTS_DIR || ""
  if (!weightsDir && stateText) {
    try {
      weightsDir = JSON.parse(stateText).weights_dir || ""
    } catch {
      weightsDir = ""
    }
  }
  let names = []
  if (weightsDir) {
    try {
      names = await readdir(weightsDir)
    } catch {
      names = []
    }
  }
  const configured = loopbackModelsFromConfig(await readText(configPath(env)))
  for (const item of configured) {
    if (!names.some((name) => name.startsWith(item.id) && name.endsWith(".gguf"))) {
      names.push(item.id + ".gguf")
    }
  }
  const listeners = []
  for (const item of configured) {
    listeners.push({ ...item, open: await portOpen(item.host, item.port) })
  }
  return assignListening(catalogFromNames(names), listeners)
}

async function readJson(response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { error: text.slice(0, 400) }
  }
}

export function classifierError(decision, status) {
  const raw = decision?.error
  const message = typeof raw === "string" ? raw : typeof raw?.message === "string" ? raw.message : ""
  return message.trim() || `The classifier answered ${status}.`
}

async function clefStatus(env) {
  const url = engineUrl(env.CLEF_URL, "http://127.0.0.1:8000")
  const where = `${url.hostname}:${url.port || "80"}`
  url.pathname = "/health"
  url.search = ""
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1000) })
    const body = await readJson(response)
    if (!response.ok || typeof body.model !== "string" || !body.model) {
      return { id: "clef-flash-4bit", listening: false, where }
    }
    return { id: body.model, listening: true, where }
  } catch {
    return { id: "clef-flash-4bit", listening: false, where }
  }
}

async function askClef(env, body, signal) {
  const timeout = AbortSignal.timeout(120000)
  let response
  try {
    response = await fetch(clefEndpoint(env), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
  } catch (error) {
    if (error?.name === "AbortError" || error?.name === "TimeoutError") throw error
    const wrapped = new Error("The classifier is not listening.")
    wrapped.status = 502
    throw wrapped
  }
  return { response, decision: await readJson(response) }
}

async function classify(env, body, signal) {
  let { response, decision } = await askClef(env, body, signal)
  if (response.status === 500 && !signal?.aborted) {
    ;({ response, decision } = await askClef(env, body, signal))
  }
  if (!response.ok) {
    const error = new Error(classifierError(decision, response.status))
    error.status = response.status
    throw error
  }
  if (!decision.answers || typeof decision.answers !== "object") {
    throw new Error("The classifier returned no typed answers.")
  }
  return decision
}

async function modelsFor(env, image) {
  const found = await discoverModels(env)
  if (!image) return found
  return modelsForRequest(found, image, await clefStatus(env))
}

export async function route(prompt, env = process.env, image = "") {
  const cleaned = cleanRequest(prompt, image)
  const models = await modelsFor(env, cleaned.image)
  const body = routerBody(prompt, models, cleaned.image)
  const decision = await classify(env, body)
  const graph = decisionGraph(body.state, models, decision)
  return { prompt: body.state, models, decision, graph }
}

function elapsed(started) {
  return Math.round(performance.now() - started)
}

export async function routeLive(prompt, env, emit, signal, image = "") {
  const totalStarted = performance.now()
  emit({ type: "step", id: "models", state: "start" })
  const modelsStarted = performance.now()
  const cleaned = cleanRequest(prompt, image)
  const models = await modelsFor(env, cleaned.image)
  const state = cleaned.state
  const picture = cleaned.image
  const answers = {}
  const liveSteps = questionIds(picture)
  const timings = { models: { state: "done", latency_ms: elapsed(modelsStarted) } }
  for (const id of liveSteps) timings[id] = { state: "wait" }
  const snapshot = () => decisionGraph(state, models, { answers }, timings)
  emit({ type: "step", id: "models", state: "done", latency_ms: timings.models.latency_ms, graph: snapshot() })
  for (const id of liveSteps) {
    if (signal?.aborted) return
    timings[id] = { state: "start" }
    emit({ type: "step", id, state: "start", graph: snapshot() })
    const stepStarted = performance.now()
    const decision = await classify(env, stepBody(prompt, models, id, picture), signal)
    const answer = decision.answers[id]
    if (!answer) throw new Error(`The classifier returned no ${id} answer.`)
    answers[id] = answer
    timings[id] = { state: "done", latency_ms: elapsed(stepStarted) }
    emit({
      type: "step",
      id,
      state: "done",
      latency_ms: timings[id].latency_ms,
      answer,
      graph: snapshot(),
    })
  }
  emit({ type: "done", latency_ms: elapsed(totalStarted), graph: snapshot(), steps: timings })
}

async function streamRoute(req, res, env, prompt, image) {
  res.writeHead(200, {
    "content-type": "application/x-ndjson; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  })
  res.socket?.setNoDelay(true)
  const ac = new AbortController()
  const stop = () => {
    if (!res.writableEnded) ac.abort()
  }
  res.on("close", stop)
  const emit = (event) => {
    if (!res.writableEnded) res.write(`${JSON.stringify(event)}\n`)
  }
  try {
    await routeLive(prompt, env, emit, ac.signal, image)
  } catch (error) {
    if (!ac.signal.aborted) {
      emit({ type: "error", error: error instanceof Error ? error.message : "The request failed." })
    }
  } finally {
    res.off("close", stop)
    if (!res.writableEnded) res.end()
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
    let parsed = {}
    if (raw) {
      try {
        parsed = JSON.parse(raw)
      } catch {
        const error = new Error("The request was not valid JSON.")
        error.status = 400
        throw error
      }
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      const error = new Error("The request was not valid JSON.")
      error.status = 400
      throw error
    }
    return { prompt: parsed.prompt, image: parsed.image }
  }
  const params = new URLSearchParams(raw)
  return { prompt: params.get("prompt"), image: params.get("image") }
}

async function handle(req, res, env) {
  const url = new URL(req.url || "/", "http://127.0.0.1")
  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      const models = await discoverModels(env)
      send(res, 200, pageHtml({ models, graph: decisionGraph("", models, null) }), "text/html; charset=utf-8")
      return
    }
    if (req.method === "GET" && url.pathname.startsWith("/samples/")) {
      const name = url.pathname.slice("/samples/".length)
      if (!SAMPLE_ANIMALS.some((animal) => `${animal}.jpg` === name)) {
        send(res, 404, "Not found", "text/plain; charset=utf-8")
        return
      }
      send(res, 200, await readFile(join(HERE, "..", "samples", name)), "image/jpeg")
      return
    }
    if (req.method === "GET" && url.pathname === "/health") {
      send(res, 200, JSON.stringify({ ok: true }), "application/json")
      return
    }
    if (req.method === "GET" && url.pathname === "/api/models") {
      send(res, 200, JSON.stringify({ models: await discoverModels(env) }), "application/json")
      return
    }
    if (req.method === "GET" && (url.pathname === "/client.js" || url.pathname === "/shape.mjs")) {
      const name = url.pathname === "/client.js" ? "client.js" : "shape.mjs"
      send(res, 200, await readFile(join(HERE, name), "utf8"), "text/javascript; charset=utf-8")
      return
    }
    if (req.method === "POST" && url.pathname === "/api/route") {
      const raw = await readBody(req)
      const accept = req.headers.accept || ""
      const wantsStream = accept.includes("application/x-ndjson")
      const wantsJson = wantsStream || accept.includes("application/json") || (req.headers["content-type"] || "").includes("application/json")
      let prompt = ""
      let image = ""
      try {
        const fields = fieldsFrom(req, raw)
        const cleaned = cleanRequest(fields.prompt, fields.image)
        prompt = fields.prompt
        image = cleaned.image
      } catch (error) {
        const message = error instanceof Error ? error.message : "A prompt is required."
        if (wantsJson) {
          send(res, error.status || 400, JSON.stringify({ error: message }), "application/json")
          return
        }
        const models = await discoverModels(env)
        send(res, error.status || 400, pageHtml({ error: message, graph: decisionGraph("", models, null) }), "text/html; charset=utf-8")
        return
      }
      if (wantsStream) {
        await streamRoute(req, res, env, prompt, image)
        return
      }
      const result = await route(prompt, env, image)
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
    const wantsJson =
      (req.headers.accept || "").includes("application/json") ||
      (req.headers["content-type"] || "").includes("application/json")
    if (wantsJson || url.pathname.startsWith("/api/")) {
      send(res, status, JSON.stringify({ error: message }), "application/json")
      return
    }
    send(res, status, pageHtml({ error: message }), "text/html; charset=utf-8")
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
  const result = await route("Write a function that reverses a list.", env)
  if (!result.graph?.chosen) throw new Error("The classifier did not pick a model.")
  return result
}

async function main() {
  if (process.argv.includes("--check")) {
    const result = await runCheck()
    process.stdout.write(JSON.stringify({ chosen: result.graph.chosen.title }) + "\n")
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
