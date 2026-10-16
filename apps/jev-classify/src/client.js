import { animalLabel, formatLatency, graphMarkup, questionIds } from "/shape.mjs"

const form = document.querySelector("#ask")
const promptInput = document.querySelector("#prompt")
const imageInput = document.querySelector("#image")
const imageFile = document.querySelector("#image-file")
const imagePreview = document.querySelector("#image-preview")
const imageClear = document.querySelector("#image-clear")
const submitButton = document.querySelector("#submit")
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
let prepared = null
let preparing = null
const supportsUserInvalid = CSS.supports("selector(:user-invalid)")
let inflight = null
let ticking = null
const steps = new Map()

function paint(payload) {
  const error = document.querySelector("#form-error")
  if ("error" in payload) {
    error.textContent = payload.error || ""
    if (payload.error) error.focus()
  }
  if (payload.graph) {
    document.querySelector("#result").innerHTML = graphMarkup(payload.graph)
  }
}

function setStatus(text) {
  document.querySelector("#status").textContent = text
}

function stopTick() {
  clearInterval(ticking)
  ticking = null
}

function renderSteps() {
  const list = document.querySelector("#steps")
  const section = document.querySelector("#live")
  list.replaceChildren()
  for (const step of steps.values()) {
    const item = document.createElement("li")
    item.dataset.state = step.state
    const name = document.createElement("span")
    name.textContent = animalLabel(step.id)
    const time = document.createElement("span")
    if (step.state === "done") time.textContent = formatLatency(step.latency_ms)
    else if (step.state === "start") time.textContent = formatLatency(performance.now() - step.started)
    else time.textContent = "Waiting"
    item.append(name, time)
    list.append(item)
  }
  section.hidden = steps.size === 0
  const running = [...steps.values()].some((step) => step.state === "start")
  if (running && !ticking) ticking = setInterval(renderSteps, 200)
  if (!running) stopTick()
}

function noteStep(event) {
  const prior = steps.get(event.id) || { id: event.id, state: "wait" }
  if (event.state === "start") {
    steps.set(event.id, { ...prior, state: "start", started: performance.now() })
    setStatus(`${animalLabel(event.id)} is running.`)
  } else if (event.state === "done") {
    steps.set(event.id, { ...prior, state: "done", latency_ms: event.latency_ms })
    setStatus(`${animalLabel(event.id)} finished in ${formatLatency(event.latency_ms)}.`)
  }
  renderSteps()
}

function syncInvalid(event) {
  const input = event.target
  if (!input.matches?.("textarea")) return
  const invalid = supportsUserInvalid
    ? input.matches(":user-invalid")
    : input.classList.contains("user-invalid-fallback")
  if (invalid) input.setAttribute("aria-invalid", "true")
  else input.removeAttribute("aria-invalid")
}

document.addEventListener("blur", syncInvalid, true)
document.addEventListener(
  "input",
  (event) => {
    const input = event.target
    if (!input.matches?.("textarea")) return
    if (!supportsUserInvalid && input.dataset.touched === "1") {
      input.classList.toggle("user-invalid-fallback", !input.checkValidity())
    }
    if (input.getAttribute("aria-invalid") === "true") syncInvalid(event)
  },
  true,
)

promptInput.addEventListener("blur", () => {
  promptInput.dataset.touched = "1"
  if (!supportsUserInvalid) {
    promptInput.classList.toggle("user-invalid-fallback", !promptInput.checkValidity())
    syncInvalid({ target: promptInput })
  }
})

function clearImage() {
  prepared = null
  preparing = null
  imageInput.value = ""
  imageFile.textContent = ""
  imagePreview.removeAttribute("src")
  imagePreview.hidden = true
  imageClear.hidden = true
  submitButton.textContent = "Pick a model"
  promptInput.required = true
}

function showImage(file, url) {
  prepared = { file, url }
  imageFile.textContent = file.name
  imagePreview.src = url
  imagePreview.hidden = false
  imageClear.hidden = false
  submitButton.textContent = `Upload ${file.name}`
  promptInput.required = false
  promptInput.removeAttribute("aria-invalid")
  promptInput.classList.remove("user-invalid-fallback")
}

async function scaledImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Attach one PNG, JPEG, WebP, or GIF.")
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 768 / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height)
    const url = canvas.toDataURL("image/jpeg", 0.85)
    if (url.length > 2 * 1024 * 1024) throw new Error("The image is too large.")
    return url
  } finally {
    bitmap.close?.()
  }
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0]
  if (!file) {
    clearImage()
    return
  }
  promptInput.required = false
  const task = scaledImage(file)
  preparing = task
  task
    .then((url) => {
      if (preparing !== task) return
      showImage(file, url)
      paint({ error: "" })
    })
    .catch((error) => {
      if (preparing !== task) return
      clearImage()
      paint({ error: error instanceof Error ? error.message : "Attach one PNG, JPEG, WebP, or GIF." })
    })
})

imageClear.addEventListener("click", () => {
  clearImage()
})

for (const button of document.querySelectorAll("[data-sample]")) {
  button.addEventListener("click", async () => {
    const name = button.dataset.sample
    button.disabled = true
    try {
      const response = await fetch(`/samples/${name}.jpg`)
      if (!response.ok) throw new Error("That sample picture is not available.")
      const blob = await response.blob()
      const file = new File([blob], `${name}.jpg`, { type: "image/jpeg" })
      const transfer = new DataTransfer()
      transfer.items.add(file)
      imageInput.files = transfer.files
      imageInput.dispatchEvent(new Event("change"))
    } catch (error) {
      paint({ error: error instanceof Error ? error.message : "That sample picture is not available." })
    } finally {
      button.disabled = false
    }
  })
}

form.addEventListener("submit", (event) => {
  event.preventDefault()
  if (!form.reportValidity()) return
  send()
})

async function readEvents(response, onEvent, signal) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  while (true) {
    if (signal.aborted) {
      await reader.cancel()
      return
    }
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop()
    for (const line of lines) {
      if (line.trim()) onEvent(JSON.parse(line))
    }
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer))
}

async function send() {
  inflight?.abort()
  const controller = new AbortController()
  inflight = controller
  const prompt = String(new FormData(form).get("prompt") || "")
  const file = imageInput.files?.[0] || null
  if (!prompt.trim() && !file) {
    inflight = null
    paint({ error: "A prompt is required." })
    document.querySelector("#form-error").focus()
    return
  }
  submitButton.disabled = true
  steps.clear()
  for (const id of ["models", ...questionIds(file)]) {
    steps.set(id, { id, state: "wait" })
  }
  stopTick()
  renderSteps()
  setStatus("")
  paint({ error: "" })
  let scrolled = false
  try {
    let image = ""
    if (file) {
      image = prepared?.file === file ? prepared.url : await (preparing || scaledImage(file))
      if (controller.signal.aborted) return
      if (prepared?.file !== file && image) showImage(file, image)
    }
    const response = await fetch("/api/route", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/x-ndjson" },
      body: JSON.stringify(image ? { prompt, image } : { prompt }),
      signal: controller.signal,
    })
    const type = response.headers.get("content-type") || ""
    if (!type.includes("application/x-ndjson")) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload.error || "The classifier did not answer.")
    }
    await readEvents(response, (event) => {
      if (event.type === "error") throw new Error(event.error || "The classifier did not answer.")
      if (event.type === "step") noteStep(event)
      if (event.graph) {
        paint({ graph: event.graph, error: "" })
        if (!scrolled) {
          scrolled = true
          const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
          document.querySelector("#live").scrollIntoView({ behavior: motion ? "auto" : "smooth", block: "start" })
        }
      }
      if (event.type === "done") {
        const picked = event.graph?.chosen
        const animal = event.graph?.nodes?.find((node) => node.kind === "animal" && node.chosen)
        const total = formatLatency(event.latency_ms)
        const picture = animal ? ` The picture is a ${animal.title}.` : ""
        setStatus(picked ? `Picked ${picked.title} in ${total}.${picture}` : `Finished in ${total}. Clef did not pick a model.${picture}`)
      }
    }, controller.signal)
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return
    setStatus("")
    paint({
      error: error instanceof Error ? error.message : "The page could not reach the app.",
    })
  } finally {
    if (inflight === controller) {
      stopTick()
      submitButton.disabled = false
      inflight = null
    }
  }
}
