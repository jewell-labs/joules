import assert from "node:assert/strict"
import test from "node:test"

import {
  chatBody,
  nextSurface,
  systemOneBody,
} from "../src/shape.mjs"

const SITUATION = "A customer wrote that checkout failed and they want the charge reversed."

test("triage, guardrail, and route bodies match the community shapes", () => {
  const triage = systemOneBody("triage", SITUATION)
  const triageTypes = Object.values(triage.questions).map((question) => question.type).sort()
  assert.deepEqual(triageTypes, ["choice", "noul", "score"])

  const guardrail = systemOneBody("guardrail", SITUATION)
  const rules = Object.values(guardrail.questions)
  assert.ok(rules.length >= 2)
  assert.ok(rules.every((question) => question.type === "noul"))

  const route = systemOneBody("route", SITUATION)
  const routeTypes = Object.values(route.questions).map((question) => question.type)
  assert.ok(routeTypes.includes("score"))
  assert.ok(routeTypes.includes("choice"))

  const many = systemOneBody("many", SITUATION)
  assert.ok(Object.keys(many.questions).length > Object.keys(triage.questions).length)
  assert.equal(many.state, SITUATION)
})

test("a fixture decision selects the refund desk, and chat is not a System One body", () => {
  const surface = nextSurface({
    answers: {
      department: { type: "choice", choice: "billing", confidence: 0.91 },
      urgency: { type: "score", score: 2.8, confidence: 0.8 },
    },
  })
  assert.equal(surface.panel, "refund-desk")
  assert.equal(surface.control, "refund-amount")

  const chat = chatBody(SITUATION)
  assert.ok(Array.isArray(chat.messages))
  assert.equal(chat.questions, undefined)
  assert.equal(chat.state, undefined)
  assert.equal(chat.model, undefined)
  assert.match(chat.messages.at(-1).content, /checkout failed/)
})
