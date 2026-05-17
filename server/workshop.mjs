/* ============================================================
   workshop — answers a Workshop question.
   ------------------------------------------------------------
   Resolution order:
     1. A pre-authored answer for this exact question (rich,
        with inline citations) — the "designed" answers.
     2. The local Ollama model, if one is installed — a real
        generated answer grounded in a compact raid context.
     3. A generic placeholder, if no model is available.
   ============================================================ */

import { getSnapshot, getCannedAnswers } from "./dataSource.mjs";
import { ollamaHealth, ollamaGenerate, pickModel } from "./ollama.mjs";

export async function ask(query, context) {
  const key = String(query || "").toLowerCase().trim();

  const canned = getCannedAnswers()[key];
  if (canned) return canned;

  const health = await ollamaHealth();
  if (health.reachable && health.models.length > 0) {
    try {
      const model = pickModel(health.models);
      const text = await ollamaGenerate(model, buildPrompt(query, context));
      if (text) return liveAnswer(query, context, model, text);
    } catch {
      /* fall through to the generic answer */
    }
  }
  return genericAnswer(query, context);
}

/* ---------- Prompt assembly ---------- */

function buildPrompt(query, context) {
  const s = getSnapshot();
  const r = s.latestRaid;
  const bosses = r.bosses
    .map((b) => `  B${b.n} ${b.name} — ${b.status} (${b.atts} att)`)
    .join("\n");
  const moments = s.moments
    .map((m) => `  [${m.kind}] ${m.title} — ${m.ctx}`)
    .join("\n");
  const ctxLine = context?.cohortId
    ? `\nThe player is asking about cohort "${context.cohortId}" (members: ${(context.members || []).join(", ")}).`
    : "";

  return [
    "You are the Workshop — a calm, precise raid-review assistant inside a",
    "local-first World of Warcraft tool. Answer the player's question about",
    "their last raid in 2–4 short paragraphs. Be concrete, cite times and",
    "mechanics, never invent numbers you were not given, and keep a measured,",
    "non-hyped tone.",
    "",
    `RAID: ${r.zone} ${r.difficulty} — ${r.date} (${r.duration}, ${r.kills}/8 killed)`,
    `PLAYER: ${s.player.name}, ${s.player.spec} ${s.player.class} (${s.player.role})`,
    "BOSSES:",
    bosses,
    "NOTABLE MOMENTS:",
    moments,
    ctxLine,
    "",
    `QUESTION: ${query}`,
    "",
    "ANSWER:",
  ].join("\n");
}

/* ---------- Answer shaping ---------- */

function liveAnswer(query, context, model, text) {
  return {
    question: query,
    cohortId: context?.cohortId ?? undefined,
    trace: [
      { state: "done", label: "Resolved query", detail: query },
      { state: "done", label: "Built raid context", detail: "Last raid snapshot + moments" },
      { state: "done", label: "Generated answer", detail: `${model} · local model` },
    ],
    body: [text],
    sources: [
      { type: "Model", label: `${model} · local Ollama` },
      { type: "Context", label: "Last raid snapshot" },
    ],
  };
}

function genericAnswer(query, context) {
  const s = getSnapshot();
  return {
    question: query,
    cohortId: context?.cohortId ?? undefined,
    trace: [
      { state: "done", label: "Resolved query", detail: query },
      context?.members && context?.range
        ? {
            state: "done",
            label: "Loaded cohort context",
            detail: `${context.members.length} raiders`,
          }
        : { state: "done", label: "Scoped to last raid", detail: s.latestRaid.date },
      { state: "done", label: "Scanned combat log", detail: "Matching ability + movement events" },
      { state: "done", label: "Cross-referenced replay", detail: "Relevant frame intervals" },
    ],
    body: [
      "I scanned the parsed combat log and cross-referenced replay frames for your question. ",
      "Three pulls match the pattern you described — pulls 6, 7, and 9 of Boss 7 all show similar timing.",
      "br-strong",
      {
        kind: "callout",
        title: "No local model running",
        body: "This is a stand-in answer. Start Ollama (with a chat model installed) and the Workshop will generate a real, grounded answer here.",
      },
    ],
    sources: [
      { type: "Replay", label: "Mug'Zee · Pull 6", t: "any" },
      { type: "Log", label: "Combat log · scoped to last raid" },
    ],
  };
}
