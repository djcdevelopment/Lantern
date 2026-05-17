/* ============================================================
   ollama — the local LLM bridge for the Workshop.
   ------------------------------------------------------------
   Talks to a local Ollama install (default http://127.0.0.1:11434).
   Health is checked for real so the topbar/Settings show live
   status; generation is used by workshop.mjs when a model is up.
   ============================================================ */

const ENDPOINT = (process.env.OLLAMA_ENDPOINT || "http://127.0.0.1:11434").replace(
  /\/$/,
  "",
);

/** Is Ollama reachable, and which models are installed? */
export async function ollamaHealth() {
  try {
    const res = await fetch(ENDPOINT + "/api/tags", {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return { reachable: false, endpoint: ENDPOINT, models: [] };
    const data = await res.json();
    const models = Array.isArray(data.models)
      ? data.models.map((m) => m.name).filter(Boolean)
      : [];
    return { reachable: true, endpoint: ENDPOINT, models };
  } catch {
    return { reachable: false, endpoint: ENDPOINT, models: [] };
  }
}

/** Non-streaming completion. Throws if Ollama is unreachable or errors. */
export async function ollamaGenerate(model, prompt) {
  const res = await fetch(ENDPOINT + "/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!res.ok) {
    throw new Error(`ollama /api/generate failed: ${res.status}`);
  }
  const data = await res.json();
  return String(data.response ?? "").trim();
}

/** Prefer an instruct-grade chat model when several are installed. */
export function pickModel(models) {
  const preferred = ["llama3.1", "llama3", "qwen", "mistral", "gemma"];
  for (const p of preferred) {
    const hit = models.find((m) => m.toLowerCase().includes(p));
    if (hit) return hit;
  }
  return models[0];
}
