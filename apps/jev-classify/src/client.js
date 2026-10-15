import { answerLines } from "/shape.mjs"

const form = document.querySelector("#ask")
const stateInput = document.querySelector("#state")
const submitButton = document.querySelector("#submit")
const supportsUserInvalid = CSS.supports("selector(:user-invalid)")

function fillList(host, lines) {
  host.querySelectorAll("ul, p").forEach((node) => node.remove())
  const list = document.createElement(lines.length ? "ul" : "p")
  if (!lines.length) {
    list.textContent = "No typed answer yet."
  } else {
    for (const line of lines) {
      const item = document.createElement("li")
      const name = document.createElement("strong")
      name.textContent = line.id
      const label = document.createElement("em")
      label.textContent = `${line.type} ${line.label}`
      item.append(name, document.createTextNode(" "), label)
      if (line.confidence != null) {
        item.append(document.createTextNode(` confidence ${line.confidence}`))
      }
      if (line.probabilities) {
        const probs = document.createElement("span")
        probs.className = "probs"
        probs.textContent = JSON.stringify(line.probabilities)
        item.append(probs)
      }
      list.append(item)
    }
  }
  host.append(list)
}

function paint(payload) {
  const error = document.querySelector("#form-error")
  error.textContent = payload.error || ""
  if (payload.error) error.focus()
  fillList(document.querySelector("#typed"), answerLines(payload.decision?.answers))
  fillList(document.querySelector("#many"), answerLines(payload.many?.answers))
  const spoken = payload.chatText || "The local chat reply appears here."
  for (const reply of document.querySelectorAll("#chat p, #many-chat p")) {
    reply.textContent = spoken
  }
  const surface = payload.surface
  if (!surface) return
  for (const panel of document.querySelectorAll(".panel")) {
    const open = panel.id === "panel-" + surface.panel
    panel.hidden = !open
    panel.className = "panel emphasis-" + (surface.emphasis || "calm")
  }
}

function syncInvalid(event) {
  const input = event.target
  if (!input.matches?.("textarea, input")) return
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

stateInput.addEventListener("blur", () => {
  stateInput.dataset.touched = "1"
  if (!supportsUserInvalid) {
    stateInput.classList.toggle("user-invalid-fallback", !stateInput.checkValidity())
    syncInvalid({ target: stateInput })
  }
})

let timer = 0
stateInput.addEventListener("input", () => {
  window.clearTimeout(timer)
  if (!stateInput.value.trim() || !form.checkValidity()) return
  timer = window.setTimeout(() => send(false, false), 700)
})

form.addEventListener("submit", (event) => {
  event.preventDefault()
  send(true, event.submitter?.id === "ask-all")
})

async function send(fromSubmit, askAll) {
  if (fromSubmit && !form.reportValidity()) return
  const data = new FormData(form)
  const body = {
    demo: askAll ? "many" : String(data.get("demo") || "triage"),
    state: String(data.get("state") || ""),
  }
  if (fromSubmit) submitButton.disabled = true
  try {
    const response = await fetch("/api/show", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    })
    const payload = await response.json()
    if (!response.ok && !payload.error) payload.error = "The engines did not answer."
    paint(payload)
  } catch (error) {
    paint({
      error: error instanceof Error ? error.message : "The page could not reach the app.",
    })
  } finally {
    submitButton.disabled = false
  }
}
