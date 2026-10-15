import { DEMOS, answerLines } from "./shape.mjs"

const PANELS = [
  {
    id: "refund-desk",
    title: "Refund desk",
    control: "refund-amount",
    controlLabel: "Refund amount",
    copy: "Billing was the strongest label, so the refund desk is the next screen.",
  },
  {
    id: "outage-board",
    title: "Outage board",
    control: "status-banner",
    controlLabel: "Status banner",
    copy: "Technical was the strongest label, so the outage board is the next screen.",
  },
  {
    id: "access-desk",
    title: "Access desk",
    control: "reset-link",
    controlLabel: "Send a reset link",
    copy: "Account was the strongest label, so the access desk is the next screen.",
  },
  {
    id: "queue-sales",
    title: "Sales queue",
    control: "queue-owner",
    controlLabel: "Queue owner",
    copy: "The route is sales.",
  },
  {
    id: "queue-support",
    title: "Support queue",
    control: "queue-owner",
    controlLabel: "Queue owner",
    copy: "The route is support.",
  },
  {
    id: "queue-security",
    title: "Security queue",
    control: "queue-owner",
    controlLabel: "Queue owner",
    copy: "The route is security.",
  },
  {
    id: "hold",
    title: "Hold for a person",
    control: "rule-note",
    controlLabel: "Which rule fired",
    copy: "A yes/no rule fired, so the message waits instead of going through.",
  },
  {
    id: "general-note",
    title: "General note",
    control: "follow-up",
    controlLabel: "Follow-up note",
    copy: "Nothing in the decision picked a specialist desk.",
  },
]

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function linesHtml(lines) {
  if (!lines.length) return "<p>No typed answer yet.</p>"
  return (
    "<ul>" +
    lines
      .map((line) => {
        const confidence =
          line.confidence == null ? "" : ` <span>confidence ${escapeHtml(line.confidence)}</span>`
        const probs = line.probabilities
          ? `<span class="probs">${escapeHtml(JSON.stringify(line.probabilities))}</span>`
          : ""
        return `<li><strong>${escapeHtml(line.id)}</strong> ${escapeHtml(line.type)} <em>${escapeHtml(line.label)}</em>${confidence} ${probs}</li>`
      })
      .join("") +
    "</ul>"
  )
}

export function pageHtml(result) {
  const surface = result?.surface || null
  const demo = result?.demo || "triage"
  const state = result?.state || ""
  const radios = Object.entries(DEMOS)
    .map(([id, item]) => {
      const checked = id === demo ? " checked" : ""
      return `<label class="choice"><input type="radio" name="demo" value="${id}"${checked} required> <span><strong>${escapeHtml(item.title)}</strong> ${escapeHtml(item.lead)}</span></label>`
    })
    .join("")
  const panels = PANELS.map((panel) => {
    const open = surface?.panel === panel.id
    const controlId = open ? panel.control : panel.id + "-idle"
    return `<section id="panel-${panel.id}" class="panel emphasis-${escapeHtml(surface?.emphasis || "calm")}" ${open ? "" : "hidden"}>
      <h3>${escapeHtml(panel.title)}</h3>
      <p>${escapeHtml(panel.copy)}</p>
      <label for="${controlId}">${escapeHtml(panel.controlLabel)}</label>
      <input id="${controlId}" name="${escapeHtml(panel.control)}" type="text">
    </section>`
  }).join("")
  const typed = result ? linesHtml(answerLines(result.decision?.answers)) : "<p>Submit a situation to see the typed answer.</p>"
  const many = result ? linesHtml(answerLines(result.many?.answers)) : "<p>The same submit also asks every question in one call.</p>"
  const reply = result?.chatText
    ? `<p>${escapeHtml(result.chatText)}</p>`
    : "<p>The local chat reply appears here.</p>"
  const error = result?.error ? `<p id="form-error" role="alert" tabindex="-1">${escapeHtml(result.error)}</p>` : `<p id="form-error" role="alert" tabindex="-1"></p>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>What classification does that a chat model does not</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0 auto; max-width: 46rem; padding: 1.5rem 1rem 4rem; font-family: "Iowan Old Style", Palatino, Georgia, serif; font-size: 1.05rem; line-height: 1.45; color: #1a1a1a; background: #f7f4ef; }
    h1, h2, h3 { font-family: "Avenir Next", "Segoe UI", sans-serif; line-height: 1.2; }
    h1 { font-size: 2rem; }
    .grid { display: grid; gap: 1rem; }
    @media (min-width: 48rem) { .pair { grid-template-columns: 1fr 1fr; } }
    form, .card, .panel { background: #fff; border: 1px solid #d7d0c6; padding: 1rem; }
    .field { margin-block-end: 1.25rem; }
    label { display: block; font-family: "Avenir Next", "Segoe UI", sans-serif; margin-block-end: 0.25rem; }
    .choice { display: flex; gap: 0.6rem; align-items: flex-start; min-height: 48px; margin-block-end: 0.5rem; }
    textarea, input[type="text"] { width: 100%; box-sizing: border-box; font-size: 1rem; min-height: 48px; padding: 0.75rem; border: 2px solid #5c564e; background: #fff; }
    textarea { min-height: 8rem; resize: vertical; }
    button { font-size: 1rem; min-height: 48px; padding: 0.75rem 1rem; background: #143d33; color: #fff; border: 0; }
    button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 3px solid #0b57d0; outline-offset: 2px; }
    textarea:user-invalid, textarea.user-invalid-fallback { border-color: #9b1c1c; }
    #form-error:empty { display: none; }
    #form-error { color: #9b1c1c; }
    .probs { display: block; font-family: ui-monospace, monospace; font-size: 0.85rem; }
    .emphasis-now { box-shadow: inset 6px 0 0 #9b1c1c; }
    .emphasis-today { box-shadow: inset 6px 0 0 #8a5a00; }
    .emphasis-stop { box-shadow: inset 6px 0 0 #9b1c1c; }
    .emphasis-calm { box-shadow: inset 6px 0 0 #1f6b4a; }
  </style>
</head>
<body>
  <header>
    <p>Jev-based classification, live on this machine</p>
    <h1>A situation goes in. Allowed answers come out.</h1>
  </header>
  <section id="explain">
    <h2>What this is</h2>
    <p>You give a situation. That situation is the state. You also give fixed questions. The three question kinds are choice, score, and noul. A choice asks which label fits. A score asks where the situation sits on a scale. A noul asks yes or no.</p>
    <p>The model returns a probability for each allowed answer in one pass, plus a confidence, and does not write an essay. The live engine on this page is local Clef, because that server speaks the same System One contract.</p>
    <p>An LLM is a different job. It writes open-ended text one token at a time, and it is not limited to a fixed answer set. The chat column is local Grok, a normal completion on the same situation.</p>
  </section>
  <form id="ask" action="/api/show" method="POST">
    <fieldset>
      <legend>Which community example</legend>
      ${radios}
    </fieldset>
    <div class="field">
      <label for="state">Situation</label>
      <textarea id="state" name="state" required maxlength="8000" aria-errormessage="form-error">${escapeHtml(state)}</textarea>
    </div>
    ${error}
    <button type="submit" id="submit">Compare the two answers</button>
    <button type="submit" id="ask-all" name="all" value="1">Ask every question in one call</button>
  </form>
  <div class="grid pair">
    <section class="card" id="typed" aria-live="polite">
      <h2>Classifier</h2>
      ${typed}
    </section>
    <section class="card" id="chat" aria-live="polite">
      <h2>Chat model</h2>
      ${reply}
    </section>
  </div>
  <section id="many-wow">
    <h2>One call, many questions</h2>
    <p>Every triage, guardrail, and route question is sent with the same state. The chat reply beside it is still one open paragraph.</p>
    <div class="grid pair">
      <div id="many" aria-live="polite">${many}</div>
      <div id="many-chat" aria-live="polite">
        <h3>Same situation, chat model</h3>
        ${reply}
      </div>
    </div>
  </section>
  <section id="surface" aria-live="polite">
    <h2>The next screen comes from the decision</h2>
    <p>The panel and the control below are chosen by the typed answer in this response. Nothing else on the page picks them.</p>
    ${panels}
  </section>
  <script type="module" src="/client.js"></script>
</body>
</html>`
}
