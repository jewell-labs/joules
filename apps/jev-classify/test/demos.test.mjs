import assert from "node:assert/strict"
import test from "node:test"

import {
  assignListening,
  catalogFromNames,
  cleanRequest,
  decisionGraph,
  fileCoversId,
  formatLatency,
  graphMarkup,
  loopbackModelsFromConfig,
  modelsForRequest,
  routerBody,
  stepBody,
} from "../src/shape.mjs"

const NAMES = [
  "Devstral-Small-2-24B-Instruct-2512-Q4_K_M.gguf",
  "Holo-3.1-4B.Q4_K_M.gguf",
  "Holo-3.1-4B.mmproj-Q8_0.gguf",
  "Holo-3.1-9B.Q4_K_M.gguf",
  "Qwen3-14B-Q5_K_M.gguf",
  "Qwen3-14B-UD-Q4_K_XL.gguf",
  "stories260K.gguf",
]

test("the catalog is every local model file, and a projector is not a model", () => {
  const models = catalogFromNames(NAMES)
  assert.deepEqual(
    models.map((model) => model.title),
    [
      "Devstral Small 2 24B Instruct 2512 Q4 K M",
      "Holo 3.1 4B.Q4 K M",
      "Holo 3.1 9B.Q4 K M",
      "Qwen3 14B Q5 K M",
      "Qwen3 14B UD Q4 K XL",
      "stories260K",
    ],
  )
  assert.equal(models.some((model) => model.file.includes("mmproj")), false)
  assert.equal(fileCoversId("Qwen3-14B-Q5_K_M.gguf", "Qwen3-14B"), false)
  assert.equal(fileCoversId("nested/Qwen3.8-27B-UD-Q4_K_M.gguf", "Qwen3.8-27B-UD-Q4_K_M"), true)
  assert.equal(catalogFromNames(["nested/Qwen3.8-27B-UD-Q4_K_M.gguf"])[0].id, "Qwen3.8-27B-UD-Q4_K_M")
})

test("config entries stay on loopback and drop the key", () => {
  const found = loopbackModelsFromConfig(`
[model."Holo-3.1-4B"]
base_url = "http://127.0.0.1:8081/v1"
api_key = "secret-value"

[model.remote]
base_url = "https://api.example.com/v1"
api_key = "other-secret"
`)
  assert.deepEqual(found, [{ id: "Holo-3.1-4B", host: "127.0.0.1", port: "8081", where: "127.0.0.1:8081" }])
  assert.equal(JSON.stringify(found).includes("secret"), false)
})

test("the longest listening id wins, and the choice question lists every model", () => {
  const models = assignListening(catalogFromNames(NAMES), [
    { id: "Qwen3-14B", host: "127.0.0.1", port: "1", where: "127.0.0.1:1", open: false },
    { id: "Qwen3-14B-UD-Q4_K_XL", host: "127.0.0.1", port: "8080", where: "127.0.0.1:8080", open: true },
    { id: "Holo-3.1-4B", host: "127.0.0.1", port: "8081", where: "127.0.0.1:8081", open: true },
  ])
  const qwen = models.find((model) => model.id.startsWith("Qwen3-14B-UD"))
  const q5 = models.find((model) => model.id.includes("Q5"))
  assert.equal(qwen.listening, true)
  assert.equal(qwen.where, "127.0.0.1:8080")
  assert.equal(q5.listening, false)
  assert.equal(q5.where, "")

  const body = routerBody("Fix the failing test.", models)
  assert.deepEqual(Object.keys(body.questions.model.criteria).sort(), models.map((model) => model.id).sort())
  assert.equal(body.questions.model.type, "choice")
  assert.equal(body.state, "Fix the failing test.")
  assert.equal(Object.hasOwn(body, "images"), false)
  assert.deepEqual(Object.keys(body.questions), ["job", "care", "model"])
  assert.equal(Object.keys(body.questions.model.criteria).some((id) => id.includes("clef")), false)
})

test("an attached image is classified by the image-capable Clef", () => {
  const picture = "data:image/jpeg;base64,aaaa"
  const models = modelsForRequest(catalogFromNames(["stories260K.gguf"]), picture, {
    id: "local-vision",
    listening: true,
    where: "127.0.0.1:8000",
  })
  const body = routerBody("", models, picture)
  assert.equal(body.state, "Classify the attached image.")
  assert.deepEqual(body.images, [picture])
  assert.match(body.questions.model.criteria["local-vision"], /image-capable Clef/)
  assert.deepEqual(Object.keys(body.questions), ["job", "care", "model", "animal"])
  assert.equal(body.questions.animal.instructions, "Which animal is shown in the picture?")
  assert.equal(Object.keys(body.questions.animal.criteria).length, 20)
  assert.match(body.questions.animal.criteria.dog, /dog/)
  assert.match(body.questions.animal.criteria.duck, /duck/)
  const step = stepBody("", models, "job", picture)
  assert.deepEqual(step.images, [picture])
  assert.equal(Object.hasOwn(step.questions, "model"), false)
  assert.throws(() => cleanRequest("hello", "https://example.com/a.png"), /PNG, JPEG/)
  assert.throws(() => cleanRequest("hello", ["data:image/png;base64,aa", "data:image/png;base64,bb"]), /Attach one image/)
})

test("the graph marks the model Clef picked and draws that edge", () => {
  const models = catalogFromNames(NAMES)
  const picked = models[0]
  const graph = decisionGraph("Fix the failing test.", models, {
    answers: {
      job: { type: "choice", choice: "code", confidence: 0.9 },
      care: { type: "score", score: 2 },
      model: { type: "choice", choice: picked.id, confidence: 0.8, probabilities: { [picked.id]: 0.8 } },
    },
  })
  assert.equal(graph.chosen.id, picked.id)
  const node = graph.nodes.find((item) => item.id === "model:" + picked.id)
  assert.equal(node.chosen, true)
  assert.equal(node.badge, "Picked")
  assert.equal(graph.edges.some((edge) => edge.to === node.id && edge.strong), true)
  assert.equal(graph.nodes.filter((item) => item.kind === "model").length, models.length)
})

test("a step shows its answer and latency as soon as that step is done", () => {
  const models = catalogFromNames(["stories260K.gguf"])
  const graph = decisionGraph("Hello", models, { answers: { job: { type: "choice", choice: "writing" } } }, {
    models: { state: "done", latency_ms: 12 },
    job: { state: "done", latency_ms: 32100 },
    care: { state: "start" },
    model: { state: "wait" },
  })
  const job = graph.nodes.find((node) => node.id === "job")
  const care = graph.nodes.find((node) => node.id === "care")
  const pick = graph.nodes.find((node) => node.id === "pick")
  assert.equal(formatLatency(12), "12 ms")
  assert.equal(formatLatency(32100), "32.1 s")
  assert.equal(job.detail, "writing")
  assert.equal(job.badge, "32.1 s")
  assert.equal(job.pending, false)
  assert.equal(care.detail, "Asking Clef")
  assert.equal(care.pending, true)
  assert.equal(pick.detail, "Waiting")
  assert.equal(graph.chosen, null)
  assert.equal(graph.pending, true)
  assert.match(graphMarkup(graph), /Clef is still answering/)
})

test("animal probabilities appear on the diagram when that step is done", () => {
  const models = catalogFromNames(["stories260K.gguf"])
  const answers = {
    job: { type: "choice", choice: "writing" },
    care: { type: "score", score: 1 },
    model: { type: "choice", choice: models[0].id, confidence: 0.9 },
    animal: {
      type: "choice",
      choice: "dog",
      confidence: 0.8,
      probabilities: { dog: 0.8, cat: 0.15, bird: 0.05 },
    },
  }
  const waiting = decisionGraph("Classify the attached image.", models, { answers: {} }, {
    animal: { state: "start" },
  })
  assert.equal(waiting.nodes.some((node) => node.id === "animal"), true)
  assert.equal(waiting.nodes.some((node) => node.kind === "animal"), false)
  assert.equal(waiting.pending, true)
  assert.match(graphMarkup(waiting), /Clef is still answering/)

  const graph = decisionGraph("Classify the attached image.", models, { answers }, {
    animal: { state: "done", latency_ms: 900 },
  })
  const dog = graph.nodes.find((node) => node.id === "animal:dog")
  const cat = graph.nodes.find((node) => node.id === "animal:cat")
  assert.equal(dog.chosen, true)
  assert.equal(dog.badge, "Picked")
  assert.equal(cat.badge, "15%")
  assert.equal(graph.nodes.filter((node) => node.kind === "animal").length, 3)
  assert.equal(graph.pending, false)
  assert.match(graphMarkup(graph), /The picture is a Dog/)

  const shot = decisionGraph("Classify the attached image.", models, { answers })
  assert.equal(shot.nodes.filter((node) => node.kind === "animal").length, 3)
})
