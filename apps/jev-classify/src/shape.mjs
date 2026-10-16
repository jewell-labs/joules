/** Model routing questions and the node graph. No network, no machine paths. */

const MAX_STATE = 8000

const KNOWN = [
  {
    match: "Devstral",
    title: "Devstral Small 2 24B",
    criterion: "The prompt asks to write, read, or fix code.",
  },
  {
    match: "Holo-3.1-9B",
    title: "Holo 3.1 9B",
    criterion:
      "The prompt is about a screen, a browser, or using a computer, and it needs the larger Holo model.",
  },
  {
    match: "Holo-3.1-4B",
    title: "Holo 3.1 4B",
    criterion:
      "The prompt is about a screen, a browser, or using a computer, and the smaller Holo model is enough.",
  },
  {
    match: "Qwen3-14B-Q5",
    title: "Qwen3 14B Q5",
    criterion:
      "The prompt is a general question or a piece of writing, and it needs the higher-quality Qwen file.",
  },
  {
    match: "Qwen3-14B-UD",
    title: "Qwen3 14B",
    criterion:
      "The prompt is a general question or a piece of writing, and the lighter Qwen server is enough.",
  },
  {
    match: "stories",
    title: "Tiny story model",
    criterion: "The prompt asks only for a tiny story-completion demo, not a real assistant.",
  },
]

const CARE = [
  "A quick short answer is enough.",
  "A normal answer is enough.",
  "The answer should be careful.",
  "The answer should be as careful as the larger file allows.",
]

const JOBS = {
  code: "The prompt asks to write or fix code.",
  computer: "The prompt asks to use a screen, a browser, or a computer interface.",
  writing: "The prompt asks for an explanation, a draft, or a general answer.",
  story: "The prompt asks only for a tiny story demo.",
}

export const ANIMALS = {
  dog: "The picture shows a dog.",
  cat: "The picture shows a cat.",
  bird: "The picture shows a bird.",
  horse: "The picture shows a horse.",
  cow: "The picture shows a cow.",
  sheep: "The picture shows a sheep.",
  goat: "The picture shows a goat.",
  pig: "The picture shows a pig.",
  rabbit: "The picture shows a rabbit.",
  deer: "The picture shows a deer.",
  bear: "The picture shows a bear.",
  wolf: "The picture shows a wolf.",
  lion: "The picture shows a lion.",
  tiger: "The picture shows a tiger.",
  elephant: "The picture shows an elephant.",
  monkey: "The picture shows a monkey.",
  fish: "The picture shows a fish.",
  frog: "The picture shows a frog.",
  snake: "The picture shows a snake.",
  duck: "The picture shows a duck.",
}

export function animalLabel(id) {
  const text = String(id || "")
  if (!text) return ""
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const IMAGE_STATE = "Classify the attached image."
const MAX_IMAGE = 2 * 1024 * 1024

function reject(message) {
  const error = new Error(message)
  error.status = 400
  throw error
}

export function cleanState(state) {
  const text = String(state ?? "").trim()
  if (!text) reject("A prompt is required.")
  if (text.length > MAX_STATE) reject("The prompt is too long.")
  return text
}

export function cleanImage(image) {
  if (image == null || image === "") return ""
  let value = image
  if (Array.isArray(value)) {
    if (value.length > 1) reject("Attach one image.")
    value = value[0] || ""
  }
  if (typeof value !== "string" || !value) return ""
  if (!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    reject("Attach one PNG, JPEG, WebP, or GIF.")
  }
  if (value.length > MAX_IMAGE) reject("The image is too large.")
  return value
}

export function cleanRequest(prompt, image) {
  const picture = cleanImage(image)
  if (!picture) return { state: cleanState(prompt), image: "" }
  const text = String(prompt ?? "").trim()
  if (text.length > MAX_STATE) reject("The prompt is too long.")
  return { state: text || IMAGE_STATE, image: picture }
}

export function clefChoice(report = {}) {
  const id = String(report.id || "clef-flash-4bit")
  return {
    id,
    title: id.includes("clef-flash") ? "Clef Flash" : id,
    criterion: "An image is attached. This image-capable Clef model classifies the image, rather than a text file.",
    file: "",
    listening: Boolean(report.listening),
    where: report.where || "",
    image: true,
  }
}

export function modelsForRequest(models, image, clef) {
  if (!image) return models.filter((model) => !model.image)
  const choice = clefChoice(clef)
  const rest = models.filter((model) => model.id !== choice.id && !model.image)
  return [...rest, choice].sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id))
}

export function catalogFromNames(names) {
  const models = []
  for (const name of names) {
    if (!name.endsWith(".gguf") || name.includes("mmproj")) continue
    const id = name.slice(0, -".gguf".length)
    const known = KNOWN.find((item) => id.includes(item.match))
    models.push({
      id,
      title: known?.title || id,
      criterion: known?.criterion || "The prompt fits this model better than the others.",
      file: name,
      listening: false,
      where: "",
    })
  }
  models.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id))
  return models
}

export function loopbackModelsFromConfig(text) {
  const models = []
  const lines = String(text || "").split(/\r?\n/)
  let current = null
  for (const line of lines) {
    const section = line.match(/^\[model\.(?:"([^"]+)"|([^\]]+))\]\s*$/)
    if (section) {
      current = { id: section[1] || section[2], baseUrl: "" }
      models.push(current)
      continue
    }
    if (line.trim().startsWith("[")) current = null
    if (!current) continue
    const url = line.match(/^\s*base_url\s*=\s*"([^"]+)"/)
    if (url) current.baseUrl = url[1]
  }
  return models.flatMap((model) => {
    if (!model.baseUrl) return []
    let parsed
    try {
      parsed = new URL(model.baseUrl)
    } catch {
      return []
    }
    if (!["127.0.0.1", "localhost", "::1"].includes(parsed.hostname)) return []
    return [{ id: model.id, host: parsed.hostname, port: parsed.port, where: `${parsed.hostname}:${parsed.port}` }]
  })
}

export function assignListening(models, listeners) {
  const sorted = [...listeners].sort((a, b) => b.id.length - a.id.length)
  return models.map((model) => {
    const hit = sorted.find((item) => model.id === item.id || model.id.startsWith(item.id + "."))
    if (!hit) return { ...model, listening: false, where: "" }
    return { ...model, listening: Boolean(hit.open), where: hit.where || "" }
  })
}

export function questionIds(image = "") {
  const ids = ["job", "care", "model"]
  if (image) ids.push("animal")
  return ids
}

export function routerQuestions(models, image = "") {
  if (!models.length) {
    const error = new Error("No local models are available.")
    error.status = 503
    throw error
  }
  const criteria = {}
  for (const model of models) criteria[model.id] = model.criterion
  const byId = {
    job: { type: "choice", criteria: JOBS },
    care: { type: "score", criteria: CARE },
    model: { type: "choice", criteria },
    animal: {
      type: "choice",
      instructions: "Which animal is shown in the picture?",
      criteria: ANIMALS,
    },
  }
  const questions = {}
  for (const id of questionIds(image)) questions[id] = byId[id]
  return questions
}

function listedModels(models, image) {
  return image ? models : models.filter((model) => !model.image)
}

function requestBody(prompt, image, questions) {
  const cleaned = cleanRequest(prompt, image)
  const body = { model: "local", state: cleaned.state, questions }
  if (cleaned.image) body.images = [cleaned.image]
  return body
}

export function routerBody(prompt, models, image = "") {
  return requestBody(prompt, image, routerQuestions(listedModels(models, image), image))
}

export function stepBody(prompt, models, stepId, image = "") {
  const questions = routerQuestions(listedModels(models, image), image)
  const question = questions[stepId]
  if (!question) {
    const error = new Error("That step is not a classifier question.")
    error.status = 500
    throw error
  }
  return requestBody(prompt, image, { [stepId]: question })
}

export function formatLatency(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return ""
  const rounded = Math.round(ms)
  if (rounded < 1000) return `${rounded} ms`
  return `${(rounded / 1000).toFixed(1)} s`
}

function clip(text, max = 96) {
  const value = String(text || "").replace(/\s+/g, " ").trim()
  if (value.length <= max) return value
  return value.slice(0, max - 1) + "…"
}

function careDetail(answer) {
  if (!answer || answer.type !== "score" || typeof answer.score !== "number") return "Not scored"
  const index = Math.max(0, Math.min(CARE.length - 1, Math.round(answer.score)))
  return CARE[index]
}

function percent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return ""
  return `${Math.round(value * 100)}%`
}

function stepDetail(answerText, timing, idleText) {
  if (timing?.state === "start") return "Asking Clef"
  if (answerText) return answerText
  if (timing) return "Waiting"
  return idleText
}

function stepBadge(timing, fallback) {
  if (timing?.state === "done" && Number.isFinite(timing.latency_ms)) return formatLatency(timing.latency_ms)
  return fallback
}

function decisionNode({ id, row, title, text, timing, idle, badge }) {
  return {
    id,
    column: 1,
    row,
    kind: "decision",
    title,
    detail: stepDetail(text, timing, idle),
    badge: stepBadge(timing, badge),
    chosen: false,
    pending: Boolean(timing && timing.state !== "done"),
  }
}

export function decisionGraph(prompt, models, decision, timings = null) {
  const answers = decision?.answers || {}
  const choice = String(answers.model?.choice || "")
  const probabilities = answers.model?.probabilities || {}
  const nodes = [
    {
      id: "prompt",
      column: 0,
      row: 0,
      kind: "prompt",
      title: "Prompt",
      detail: decision ? clip(prompt) : "Waiting for a prompt",
      badge: "",
      chosen: false,
      pending: false,
    },
  ]
  const edges = []
  if (decision) {
    const jobText = answers.job?.choice || ""
    const careText = answers.care ? careDetail(answers.care) : ""
    const pickText = choice
    nodes.push(
      decisionNode({
        id: "job",
        row: 0,
        title: "Job",
        text: jobText,
        timing: timings?.job,
        idle: "No job answer",
        badge: jobText ? "choice" : "",
      }),
      decisionNode({
        id: "care",
        row: 1,
        title: "Care",
        text: careText,
        timing: timings?.care,
        idle: "Not scored",
        badge: careText ? "score" : "",
      }),
      decisionNode({
        id: "pick",
        row: 2,
        title: "Model pick",
        text: pickText,
        timing: timings?.model,
        idle: "No model answer",
        badge: pickText ? percent(answers.model?.confidence) || "choice" : "",
      }),
    )
    edges.push(
      { from: "prompt", to: "job", strong: Boolean(jobText) },
      { from: "prompt", to: "care", strong: Boolean(careText) },
      { from: "prompt", to: "pick", strong: Boolean(pickText) },
    )
    const animalAnswer = answers.animal
    const animalTiming = timings?.animal
    if (animalAnswer || animalTiming) {
      const animalChoice = String(animalAnswer?.choice || "")
      const animalConfidence = percent(animalAnswer?.confidence)
      const animalText = animalChoice ? `${animalLabel(animalChoice)}${animalConfidence ? ` · ${animalConfidence}` : ""}` : ""
      nodes.push(
        decisionNode({
          id: "animal",
          row: 3,
          title: "Animal",
          text: animalText,
          timing: animalTiming,
          idle: "No animal answer",
          badge: animalChoice ? animalConfidence || "choice" : "",
        }),
      )
      edges.push({ from: "prompt", to: "animal", strong: Boolean(animalChoice) })
      const ranked = Object.entries(animalAnswer?.probabilities || {}).sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      )
      const ready = animalTiming?.state === "done" || (!animalTiming && ranked.length > 0)
      if (ready) {
        ranked.forEach(([id, value], index) => {
          const pickedAnimal = id === animalChoice
          nodes.push({
            id: "animal:" + id,
            column: 3,
            row: index,
            kind: "animal",
            title: animalLabel(id),
            detail: ANIMALS[id] || "",
            badge: pickedAnimal ? "Picked" : percent(value),
            chosen: pickedAnimal,
            pending: false,
          })
        })
        if (animalChoice) edges.push({ from: "animal", to: "animal:" + animalChoice, strong: true })
      }
    }
  }
  const modelKnown = Boolean(choice)
  models.forEach((model, index) => {
    const chosen = modelKnown && model.id === choice
    nodes.push({
      id: "model:" + model.id,
      column: 2,
      row: index,
      kind: "model",
      title: model.title,
      detail: model.listening ? `Listening ${model.where}` : model.where ? `Not listening ${model.where}` : "On disk",
      badge: chosen ? "Picked" : percent(probabilities[model.id]),
      chosen,
      pending: false,
      listening: Boolean(model.listening),
    })
    if (modelKnown) edges.push({ from: "pick", to: "model:" + model.id, strong: chosen })
  })
  const chosen = models.find((model) => model.id === choice) || null
  return { nodes, edges, chosen, pending: nodes.some((node) => node.pending) }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

const NODE_W = 220
const NODE_H = 72
const GAP_X = 72
const GAP_Y = 24

export function graphMarkup(graph) {
  const nodes = graph?.nodes || []
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const columns = Math.max(1, ...nodes.map((node) => node.column + 1))
  const rows = Math.max(1, ...nodes.map((node) => node.row + 1))
  const width = columns * NODE_W + (columns - 1) * GAP_X + 32
  const height = rows * NODE_H + (rows - 1) * GAP_Y + 32
  const place = (node) => ({
    x: 16 + node.column * (NODE_W + GAP_X),
    y: 16 + node.row * (NODE_H + GAP_Y),
  })
  const lines = (graph?.edges || [])
    .map((edge) => {
      const from = byId.get(edge.from)
      const to = byId.get(edge.to)
      if (!from || !to) return ""
      const a = place(from)
      const b = place(to)
      return `<line x1="${a.x + NODE_W}" y1="${a.y + NODE_H / 2}" x2="${b.x}" y2="${b.y + NODE_H / 2}" class="${edge.strong ? "edge strong" : "edge"}" />`
    })
    .join("")
  const boxes = nodes
    .map((node) => {
      const at = place(node)
      const classes = [
        "node",
        node.kind,
        node.chosen ? "chosen" : "",
        node.pending ? "pending" : "",
        node.listening === false && node.kind === "model" ? "idle" : "",
      ]
        .filter(Boolean)
        .join(" ")
      return `<g class="${classes}">
        <title>${escapeHtml(node.title)}. ${escapeHtml(node.detail)} ${escapeHtml(node.badge)}</title>
        <rect x="${at.x}" y="${at.y}" width="${NODE_W}" height="${NODE_H}" rx="${node.kind === "model" ? 8 : 28}" />
        <text x="${at.x + 14}" y="${at.y + 24}" class="title">${escapeHtml(clip(node.title, 28))}</text>
        <text x="${at.x + 14}" y="${at.y + 44}" class="detail">${escapeHtml(clip(node.detail, 32))}</text>
        <text x="${at.x + NODE_W - 14}" y="${at.y + 62}" class="badge" text-anchor="end">${escapeHtml(node.badge)}</text>
      </g>`
    })
    .join("")
  const rowsHtml = nodes
    .map(
      (node) =>
        `<tr><th scope="row">${escapeHtml(node.title)}</th><td>${escapeHtml(node.detail)}</td><td>${escapeHtml(node.badge || (node.chosen ? "Picked" : ""))}</td></tr>`,
    )
    .join("")
  const picked = graph?.chosen
  const animal = nodes.find((node) => node.kind === "animal" && node.chosen)
  const caption = graph?.pending
    ? "Clef is still answering."
    : picked
      ? `Clef picked ${picked.title}. ${picked.listening ? "That server is listening." : "That file is not listening."}${animal ? ` The picture is a ${animal.title}.` : ""}`
      : animal
        ? `The picture is a ${animal.title}.`
        : "Submit a prompt. Clef will pick one of these models."
  return `<figure>
    <svg class="graph" viewBox="0 0 ${width} ${height}" aria-hidden="true">
      <title>${escapeHtml(caption)}</title>
      ${lines}
      ${boxes}
    </svg>
    <figcaption>${escapeHtml(caption)}</figcaption>
  </figure>
  <table>
    <caption>Decisions</caption>
    <thead><tr><th scope="col">Node</th><th scope="col">What it says</th><th scope="col">Mark</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>`
}
