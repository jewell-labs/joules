import assert from "node:assert/strict"
import { mkdtemp, writeFile } from "node:fs/promises"
import http from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { catalogFromNames, decisionGraph } from "../src/shape.mjs"
import { pageHtml } from "../src/page.mjs"
import { start } from "../src/server.mjs"

function json(res, status, body) {
  const payload = Buffer.from(JSON.stringify(body))
  res.writeHead(status, { "content-type": "application/json", "content-length": payload.length })
  res.end(payload)
}

async function listen(server) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  return server.address().port
}

async function withClassifier(handler, check) {
  const dir = await mkdtemp(join(tmpdir(), "jev-classify-"))
  await writeFile(join(dir, "stories260K.gguf"), "")
  const clef = http.createServer(async (req, res) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    handler(req, res, Buffer.concat(chunks).toString("utf8"))
  })
  const clefPort = await listen(clef)
  const app = await start(0, {
    ...process.env,
    WEIGHTS_DIR: dir,
    GROK_CONFIG: join(dir, "missing.toml"),
    SUITE_STATE: join(dir, "missing.json"),
    CLEF_URL: `http://127.0.0.1:${clefPort}`,
  })
  try {
    const response = await fetch(`http://127.0.0.1:${app.address().port}/api/route`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ prompt: "hello, how are you?" }),
    })
    await check(response, await response.json())
  } finally {
    await new Promise((resolve) => app.close(resolve))
    await new Promise((resolve) => clef.close(resolve))
  }
}

const NAMES = ["Qwen3-14B-UD-Q4_K_XL.gguf", "Devstral-Small-2-24B-Instruct-2512-Q4_K_M.gguf"]

test("the served page is a prompt form and a decision graph", async () => {
  const server = await start(0, { ...process.env, WEIGHTS_DIR: "/tmp/jev-classify-missing-weights" })
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`)
    const html = await response.text()
    assert.equal(response.status, 200)
    assert.match(html, /<form id="ask" action="\/api\/route" method="POST">/)
    assert.match(html, /<label for="prompt">Prompt<\/label>/)
    assert.match(html, /name="prompt"/)
    assert.match(html, /<svg class="graph"/)
    assert.match(html, /<table>/)
    assert.match(html, /Clef picks the model/)
    assert.match(html, /id="steps"/)
    assert.match(html, /type="file"/)
    assert.match(html, /accept="image\/png,image\/jpeg,image\/webp,image\/gif"/)
    assert.match(html, /data-sample="dog"/)
    assert.match(html, />Upload dog</)
    assert.match(html, />Upload cat</)
    assert.match(html, />Upload bird</)
    const client = await fetch(`http://127.0.0.1:${server.address().port}/client.js`).then((item) => item.text())
    assert.match(client, /\/api\/route/)
    assert.doesNotMatch(client, /\/api\/chat/)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test("a result page names the picked model in the graph and the table", () => {
  const models = catalogFromNames(NAMES).map((model) =>
    model.id.startsWith("Devstral") ? { ...model, listening: true, where: "127.0.0.1:9" } : model,
  )
  const picked = models.find((model) => model.id.startsWith("Devstral"))
  const html = pageHtml({
    prompt: "Fix the failing test.",
    graph: decisionGraph("Fix the failing test.", models, {
      answers: {
        job: { type: "choice", choice: "code" },
        care: { type: "score", score: 2 },
        model: { type: "choice", choice: picked.id, confidence: 0.7 },
      },
    }),
  })
  assert.match(html, /Picked/)
  assert.match(html, /Devstral Small 2 24B/)
  assert.match(html, /Fix the failing test/)
  assert.match(html, /<th scope="row">Job<\/th><td>code<\/td>/)
})

test("a classifier error object is shown as its message", async () => {
  let calls = 0
  await withClassifier((_req, res) => {
    calls += 1
    json(res, 500, { error: { message: "RuntimeError: metal command buffer failed" } })
  }, async (response, body) => {
    assert.equal(response.status, 500)
    assert.equal(body.error, "RuntimeError: metal command buffer failed")
    assert.equal(calls, 2)
  })
})

test("one classifier failure is retried", async () => {
  let calls = 0
  await withClassifier((_req, res) => {
    calls += 1
    if (calls === 1) {
      json(res, 500, { error: { message: "RuntimeError: metal command buffer failed" } })
      return
    }
    json(res, 200, { answers: { job: { choice: "writing" }, care: { score: 1 }, model: { choice: "stories260K" } } })
  }, async (response, body) => {
    assert.equal(response.status, 200)
    assert.equal(body.graph.chosen.title, "Tiny story model")
    assert.equal(calls, 2)
  })
})

test("steps stream before the route is finished", { timeout: 3000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), "jev-classify-"))
  await writeFile(join(dir, "stories260K.gguf"), "")
  let releaseCare
  const careGate = new Promise((resolve) => {
    releaseCare = resolve
  })
  const seen = []
  const clef = http.createServer(async (req, res) => {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"))
    const id = Object.keys(body.questions)[0]
    seen.push(id)
    if (id === "care") await careGate
    const answers = {
      job: { job: { type: "choice", choice: "writing", confidence: 0.9 } },
      care: { care: { type: "score", score: 1 } },
      model: { model: { type: "choice", choice: "stories260K", confidence: 0.8 } },
    }
    json(res, 200, { answers: answers[id], usage: { latency_ms: 15 } })
  })
  const clefPort = await listen(clef)
  const app = await start(0, {
    ...process.env,
    WEIGHTS_DIR: dir,
    GROK_CONFIG: join(dir, "missing.toml"),
    SUITE_STATE: join(dir, "missing.json"),
    CLEF_URL: `http://127.0.0.1:${clefPort}`,
  })
  try {
    const response = await fetch(`http://127.0.0.1:${app.address().port}/api/route`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/x-ndjson" },
      body: JSON.stringify({ prompt: "hello, how are you?" }),
    })
    assert.equal(response.status, 200)
    assert.match(response.headers.get("content-type"), /application\/x-ndjson/)
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    const doneIds = []
    let sawJobFirst = false
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.trim()) continue
        const event = JSON.parse(line)
        if (event.state === "done") {
          assert.equal(typeof event.latency_ms, "number")
          doneIds.push(event.id)
        }
        if (event.id === "job" && event.state === "done") {
          assert.equal(doneIds.includes("care"), false)
          assert.equal(event.graph.nodes.find((node) => node.id === "job").badge.endsWith("s") || event.graph.nodes.find((node) => node.id === "job").badge.endsWith("ms"), true)
          sawJobFirst = true
          releaseCare()
        }
        if (event.type === "done") {
          assert.equal(event.graph.chosen.title, "Tiny story model")
          assert.equal(typeof event.latency_ms, "number")
        }
      }
    }
    assert.equal(sawJobFirst, true)
    assert.deepEqual(doneIds, ["models", "job", "care", "model"])
    assert.deepEqual(seen, ["job", "care", "model"])
  } finally {
    releaseCare()
    await new Promise((resolve) => app.close(resolve))
    await new Promise((resolve) => clef.close(resolve))
  }
})

test("an image is sent on every streamed question", { timeout: 3000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), "jev-classify-"))
  await writeFile(join(dir, "stories260K.gguf"), "")
  const picture = "data:image/jpeg;base64,aaaa"
  let releaseCare
  const careGate = new Promise((resolve) => {
    releaseCare = resolve
  })
  const images = []
  const clef = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url.startsWith("/health")) {
      json(res, 200, { status: "ok", model: "local-vision" })
      return
    }
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"))
    const id = Object.keys(body.questions)[0]
    images.push(body.images)
    if (id === "care") await careGate
    const answers = {
      job: { job: { type: "choice", choice: "writing" } },
      care: { care: { type: "score", score: 1 } },
      model: { model: { type: "choice", choice: "local-vision" } },
      animal: {
        animal: {
          type: "choice",
          choice: "dog",
          confidence: 0.8,
          probabilities: { dog: 0.8, cat: 0.2 },
        },
      },
    }
    json(res, 200, { answers: answers[id] })
  })
  const clefPort = await listen(clef)
  const app = await start(0, {
    ...process.env,
    WEIGHTS_DIR: dir,
    GROK_CONFIG: join(dir, "missing.toml"),
    SUITE_STATE: join(dir, "missing.json"),
    CLEF_URL: `http://127.0.0.1:${clefPort}`,
  })
  try {
    const response = await fetch(`http://127.0.0.1:${app.address().port}/api/route`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/x-ndjson" },
      body: JSON.stringify({ prompt: "", image: picture }),
    })
    assert.equal(response.status, 200)
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let sawJob = false
    let chosen = ""
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.trim()) continue
        const event = JSON.parse(line)
        if (event.id === "job" && event.state === "done") {
          sawJob = true
          assert.equal(event.graph.nodes.some((node) => node.id === "model:local-vision"), true)
          releaseCare()
        }
        if (event.type === "done") {
          chosen = event.graph.chosen.title
          assert.equal(event.graph.nodes.find((node) => node.id === "animal:dog").badge, "Picked")
          assert.match(event.graph.nodes.find((node) => node.id === "animal:cat").badge, /%/)
        }
      }
    }
    assert.equal(sawJob, true)
    assert.equal(chosen, "local-vision")
    assert.equal(images.length, 4)
    assert.deepEqual(images, [[picture], [picture], [picture], [picture]])
  } finally {
    releaseCare()
    await new Promise((resolve) => app.close(resolve))
    await new Promise((resolve) => clef.close(resolve))
  }
})

test("a non-image payload is refused with a sentence", async () => {
  const dir = await mkdtemp(join(tmpdir(), "jev-classify-"))
  const app = await start(0, {
    ...process.env,
    WEIGHTS_DIR: dir,
    GROK_CONFIG: join(dir, "missing.toml"),
    SUITE_STATE: join(dir, "missing.json"),
  })
  try {
    const response = await fetch(`http://127.0.0.1:${app.address().port}/api/route`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ prompt: "hello", image: "https://example.com/a.png" }),
    })
    const body = await response.json()
    assert.equal(response.status, 400)
    assert.equal(typeof body.error, "string")
    assert.match(body.error, /PNG, JPEG/)
    assert.doesNotMatch(body.error, /object Object/)
  } finally {
    await new Promise((resolve) => app.close(resolve))
  }
})

test("a classifier rejection is not retried", async () => {
  let calls = 0
  await withClassifier((_req, res) => {
    calls += 1
    json(res, 400, { error: { message: "job: criteria must not be empty" } })
  }, async (response, body) => {
    assert.equal(response.status, 400)
    assert.equal(body.error, "job: criteria must not be empty")
    assert.equal(calls, 1)
  })
})
