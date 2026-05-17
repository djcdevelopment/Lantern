# 0003. Local and cloud builds from one build-time flag

- **Status:** Accepted
- **Date:** 2026-05-15

## Context

Lantern has two deploy targets:

- **Local** — a read/write desktop-style app. Full notebook and
  observation authoring; the Workshop bridges a local Ollama model.
- **Cloud** — a static, read-only "chronicle" hosted at
  `app.goatsafterdark.org`. No server, no Ollama, no writes.

These are the same product and must stay the same product. Maintaining
two codebases, or branching on deploy mode throughout the UI, would
guarantee drift.

## Decision

Drive the difference from **one build-time environment variable**,
`VITE_CLOUD_MODE`, set by `.env.cloud` and consumed in exactly one
place: `src/api/http/client.ts` (Layer 3 — see ADR-0001).

In cloud mode:

- GET requests are rewritten to static `/api/*.json` blobs, baked at
  build time by `scripts/prerender.mjs`.
- Writes (POST/PATCH/DELETE) throw `CloudUnavailableError`, which the
  state layer swallows quietly.
- The Workshop is disabled (it needs a local Ollama).
- A persistent `CloudBanner` surfaces the read-only constraint;
  authoring affordances are hidden or no-op.

The cloud build (`npm run build:cloud`) is a fully static bundle —
`index.html` + `assets/` + `api/*.json` — deployable to any static
host. The mode difference never reaches Layer 4.

## Consequences

**Good**

- One codebase, one component tree, one set of pages.
- The cloud artifact is pure static files — host anywhere, no runtime.
- The entire mode difference is auditable in a single file.

**Costs**

- A write in cloud mode fails at *runtime* (`CloudUnavailableError`),
  not at compile time. Mitigated by the smoke test running in cloud
  mode (`SMOKE_CLOUD=1`).
- The GET-to-blob URL convention must stay in sync between
  `scripts/prerender.mjs` and `client.toCloudPath` — two places, one
  rule (`/api/x?b=2&a=1` → `/api/x--a=1--b=2.json`, query keys sorted).
- Cloud data is only as fresh as the last `prerender`.

## Alternatives considered

- **A separate cloud build or repository.** Rejected — two codebases
  drift; the read-only chronicle would fall behind the real app.
- **Runtime feature detection.** Rejected — detecting "is there a
  server?" needs a server to fail against; a build-time flag is
  deterministic and lets the bundler tree-shake.
