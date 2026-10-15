import assert from "node:assert/strict"
import test from "node:test"

import { start } from "../src/server.mjs"

test("the served page explains classification in everyday language", async () => {
  const server = await start(0, process.env)
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`)
    const html = await response.text()
    assert.equal(response.status, 200)
    const explain = html.slice(html.indexOf('id="explain"'), html.indexOf("<form"))
    for (const phrase of [
      "state",
      "choice",
      "score",
      "noul",
      "one pass",
      "probability",
      "open-ended text",
      "one token at a time",
      "fixed answer set",
    ]) {
      assert.match(explain, new RegExp(phrase, "i"))
    }
    for (const phrase of [
      "Support triage",
      "Policy guardrail",
      "Score or route",
      "One call, many questions",
      "Same situation, chat model",
      "The next screen comes from the decision",
      "panel-refund-desk",
    ]) {
      assert.ok(html.includes(phrase), phrase)
    }
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
