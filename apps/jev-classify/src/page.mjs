import { graphMarkup } from "./shape.mjs"

export const SAMPLE_ANIMALS = ["dog", "cat", "bird"]

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export function pageHtml(result) {
  const prompt = result?.prompt || ""
  const graph = result?.graph || { nodes: [], edges: [], chosen: null }
  const error = result?.error
    ? `<p id="form-error" role="alert" tabindex="-1">${escapeHtml(result.error)}</p>`
    : `<p id="form-error" role="alert" tabindex="-1"></p>`
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pick a local model</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0 auto; max-width: 64rem; padding: 1.5rem 1rem 4rem; font-family: "Iowan Old Style", Palatino, Georgia, serif; font-size: 1.05rem; line-height: 1.45; color: #1a1a1a; background: #f7f4ef; }
    h1, h2, caption { font-family: "Avenir Next", "Segoe UI", sans-serif; line-height: 1.2; }
    h1 { font-size: 2rem; }
    form, figure, table { background: #fff; border: 1px solid #d7d0c6; }
    form, figure { padding: 1rem; }
    figure { margin: 1.25rem 0 0; }
    .field { margin-block-end: 1.25rem; }
    label { display: block; font-family: "Avenir Next", "Segoe UI", sans-serif; margin-block-end: 0.25rem; }
    textarea { width: 100%; box-sizing: border-box; font-size: 1rem; min-height: 8rem; padding: 0.75rem; border: 2px solid #5c564e; background: #fff; resize: vertical; }
    button { font-size: 1rem; min-height: 48px; padding: 0.75rem 1rem; background: #143d33; color: #fff; border: 0; }
    button:disabled { opacity: 0.55; }
    button:focus-visible, textarea:focus-visible { outline: 3px solid #0b57d0; outline-offset: 2px; }
    textarea:user-invalid, textarea.user-invalid-fallback { border-color: #9b1c1c; }
    #form-error:empty { display: none; }
    #form-error { color: #9b1c1c; }
    #status { font-family: "Avenir Next", "Segoe UI", sans-serif; min-height: 1.5rem; }
    input[type="file"] { font: inherit; }
    #image-preview:not([hidden]) { display: block; max-width: 100%; max-height: 16rem; margin-block-start: 0.75rem; }
    #image-clear, button[data-sample] { margin-block-start: 0.75rem; margin-inline-end: 0.5rem; background: #fff; color: #143d33; border: 2px solid #143d33; }
    .graph { width: 100%; height: auto; }
    #steps { list-style: none; margin: 0; padding: 0; font-family: "Avenir Next", "Segoe UI", sans-serif; }
    #steps li { display: flex; justify-content: space-between; gap: 1rem; padding: 0.4rem 0; border-block-start: 1px solid #d7d0c6; }
    #steps li[data-state="start"] { font-weight: 650; }
    #live { margin-block-start: 1.25rem; }
    .hint { margin-block-start: 0; }
    svg.graph { width: 100%; height: auto; display: block; }
    .edge { stroke: #8a8175; stroke-width: 1.5; fill: none; }
    .edge.strong { stroke: #143d33; stroke-width: 3; }
    .node rect { fill: #fff; stroke: #5c564e; stroke-width: 2; }
    .node.decision rect { fill: #f3efe6; }
    .node.chosen rect { stroke: #143d33; stroke-width: 4; }
    .node.idle rect, .node.pending rect { stroke-dasharray: 5 4; }
    .node .title { font-family: "Avenir Next", "Segoe UI", sans-serif; font-size: 15px; font-weight: 600; }
    .node .detail, .node .badge { font-size: 13px; fill: #3d3832; }
    .node .badge { font-family: "Avenir Next", "Segoe UI", sans-serif; }
    table { width: 100%; border-collapse: collapse; margin-block-start: 1rem; }
    caption { text-align: start; padding: 0.75rem 1rem 0; font-weight: 600; }
    th, td { text-align: start; padding: 0.6rem 1rem; border-block-start: 1px solid #d7d0c6; vertical-align: top; }
    figcaption { margin-block-start: 0.75rem; }
    @media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto; } }
  </style>
</head>
<body>
  <header>
    <p>Local models, chosen by classification</p>
    <h1>One prompt. Clef picks the model.</h1>
  </header>
  <section id="explain">
    <h2>What this is</h2>
    <p>You write a prompt. The page checks which models are listening, then asks Clef for the job, the care score, and the model choice one at a time. Each answer and its time show up when that step returns. An image also asks Clef Flash which of 20 animals is in the picture, and those probabilities appear on the diagram as soon as that step returns. A solid line is the path Clef took. A dashed box is a model that is on disk and not listening, or a step that is still waiting.</p>
  </section>
  <form id="ask" action="/api/route" method="POST">
    <div class="field">
      <label for="prompt">Prompt</label>
      <p class="hint" id="prompt-hint">Write the task in ordinary language. Add an image when the classifier should look at one.</p>
      <textarea id="prompt" name="prompt" required maxlength="8000" aria-describedby="prompt-hint" aria-errormessage="form-error">${escapeHtml(prompt)}</textarea>
    </div>
    <div class="field">
      <label for="image">Image</label>
      <p class="hint" id="image-hint">Optional. One PNG, JPEG, WebP, or GIF.</p>
      <input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-describedby="image-hint">
      <p id="image-file"></p>
      <img id="image-preview" alt="" hidden>
      <button type="button" id="image-clear" hidden>Remove image</button>
      <div>
        ${SAMPLE_ANIMALS.map((name) => `<button type="button" data-sample="${escapeHtml(name)}">Upload ${escapeHtml(name)}</button>`).join("\n        ")}
      </div>
    </div>
    ${error}
    <button type="submit" id="submit">Pick a model</button>
    <p id="status" role="status" aria-live="polite"></p>
  </form>
  <section id="live" hidden>
    <h2>Steps</h2>
    <ol id="steps"></ol>
  </section>
  <div id="result">
    ${graphMarkup(graph)}
  </div>
  <script type="module" src="/client.js"></script>
</body>
</html>`
}
