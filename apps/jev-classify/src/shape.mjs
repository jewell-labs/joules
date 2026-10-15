/** Request bodies and the screen a decision selects. No network, no machine paths. */

export const LAUNCH_STATE =
  "Our checkout started returning errors and orders are blocked."

const TRIAGE = {
  department: {
    type: "choice",
    criteria: {
      billing: "The issue is a charge, an invoice, or a refund.",
      technical: "The issue is a bug, an outage, or a broken product.",
      account: "The issue is login, access, or the person's account.",
    },
  },
  urgency: {
    type: "score",
    criteria: [
      "It can wait days.",
      "It should be handled this week.",
      "It should be handled today.",
      "It is blocking people right now.",
    ],
  },
  outage: {
    type: "noul",
    criteria: {
      true: "A product outage is happening.",
      false: "This is not a product outage.",
    },
  },
}

const GUARDRAIL = {
  refund_outside_policy: {
    type: "noul",
    criteria: {
      true: "The message asks for a refund the stated policy does not allow.",
      false: "The message does not ask for a refund outside policy.",
    },
  },
  payment_card: {
    type: "noul",
    criteria: {
      true: "The message includes a payment card number.",
      false: "The message does not include a payment card number.",
    },
  },
  medical_advice: {
    type: "noul",
    criteria: {
      true: "The message asks for a medical diagnosis or treatment.",
      false: "The message does not ask for medical advice.",
    },
  },
}

const ROUTE = {
  queue: {
    type: "choice",
    criteria: {
      sales: "A new lead asking about buying.",
      support: "An existing customer who needs help.",
      security: "A report of abuse, fraud, or a vulnerability.",
    },
  },
  lead_quality: {
    type: "score",
    criteria: [
      "No real interest.",
      "Mild curiosity.",
      "A plausible lead.",
      "Ready for a person to follow up.",
    ],
  },
}

export const DEMOS = {
  triage: {
    title: "Support triage",
    lead: "A department choice, an urgency score, and a yes or no for an outage.",
    questions: TRIAGE,
  },
  guardrail: {
    title: "Policy guardrail",
    lead: "One yes or no for each rule, on the same situation.",
    questions: GUARDRAIL,
  },
  route: {
    title: "Score or route",
    lead: "Which queue should take it, and how strong the lead is.",
    questions: ROUTE,
  },
}

const MAX_STATE = 8000

export function cleanState(state) {
  const text = String(state ?? "").trim()
  if (!text) {
    const error = new Error("State is required.")
    error.status = 400
    throw error
  }
  if (text.length > MAX_STATE) {
    const error = new Error("State is too long.")
    error.status = 400
    throw error
  }
  return text
}

export function questionsFor(demo) {
  if (demo === "many") {
    return { ...TRIAGE, ...GUARDRAIL, ...ROUTE }
  }
  const found = DEMOS[demo]
  if (!found) {
    const error = new Error("Unknown example.")
    error.status = 400
    throw error
  }
  return found.questions
}

export function systemOneBody(demo, state) {
  return {
    model: "local",
    state: cleanState(state),
    questions: questionsFor(demo),
  }
}

export function chatBody(state) {
  return {
    messages: [
      {
        role: "system",
        content:
          "Answer in a short paragraph a person can read aloud. Stay with the situation you are given.",
      },
      { role: "user", content: cleanState(state) },
    ],
  }
}

export function emphasisFor(answers) {
  const score = answers?.urgency?.score
  if (typeof score === "number" && score >= 2.5) return "now"
  if (typeof score === "number" && score >= 1.5) return "today"
  return "calm"
}

export function nextSurface(decision) {
  const answers = decision?.answers || {}
  const emphasis = emphasisFor(answers)
  const department = answers.department?.choice
  if (department === "billing") {
    return { panel: "refund-desk", control: "refund-amount", emphasis }
  }
  if (department === "technical") {
    return { panel: "outage-board", control: "status-banner", emphasis }
  }
  if (department === "account") {
    return { panel: "access-desk", control: "reset-link", emphasis }
  }
  const queue = answers.queue?.choice
  if (queue === "sales" || queue === "support" || queue === "security") {
    return { panel: "queue-" + queue, control: "queue-owner", emphasis }
  }
  const flagged = Object.entries(answers).find(
    ([, answer]) => answer?.type === "noul" && Number(answer.noul) >= 0.5,
  )
  if (flagged) {
    return { panel: "hold", control: "rule-" + flagged[0], emphasis: "stop" }
  }
  return { panel: "general-note", control: "follow-up", emphasis }
}

export function answerLines(answers) {
  if (!answers || typeof answers !== "object") return []
  return Object.entries(answers).map(([id, answer]) => {
    if (answer?.type === "choice") {
      return {
        id,
        type: "choice",
        label: String(answer.choice),
        confidence: answer.confidence,
        probabilities: answer.probabilities || null,
      }
    }
    if (answer?.type === "score") {
      return {
        id,
        type: "score",
        label: String(answer.score),
        confidence: answer.confidence,
        probabilities: answer.probabilities || null,
        legend: answer.legend || null,
      }
    }
    if (answer?.type === "noul") {
      const value = Number(answer.noul)
      return {
        id,
        type: "noul",
        label: value >= 0.5 ? "yes" : "no",
        confidence: value,
        probabilities: null,
      }
    }
    return { id, type: "", label: "", confidence: null, probabilities: null }
  })
}

export function chatText(payload) {
  const message = payload?.choices?.[0]?.message
  const text = message?.content || message?.reasoning_content || ""
  return String(text).trim()
}
