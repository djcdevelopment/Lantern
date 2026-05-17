# Lantern — GAD App / Workbench

A player-first, local-first raid review and exploration tool. Open the
app and the first question it answers is **"what happened to me last
night?"** — your moments, your saves, your role swap — with the
advanced replay surface, the local-AI Workshop, and the contribution
flow all one step deeper.

## Architecture

A four-layer wiring (modelled on RaidUI v2):

```
UI (React)  →  LanternApi (HTTP client)  →  local server  →  dataSource seam
```

- The UI only ever talks to a typed `LanternApi`.
- A small **local server** (`server/`) serves that API, persists the
  notebook/observations, and bridges the Workshop to a local Ollama.
- Behind the server, `server/dataSource.mjs` is the **seam** where the
  real combat-log parser plugs in. Today it serves a bundled dataset.
- A **cloud build** bakes every GET to static JSON, so the app is
  deployable to `app.goatsafterdark.org` as a read-only chronicle.

Full detail — shapes, data flow, how to go live — is in
[`CONTRACTS.md`](CONTRACTS.md).

## Stack

- **Vite 6** + **React 18** + **TypeScript** (strict)
- **react-router** v6 — real URLs
- Local server: raw Node `http` (no framework), ESM
- Plain CSS — three themes: dark / light / GAD

## Getting started

```bash
npm install
npm run dev        # server (:5181) + app (:5180), together
```

Open **http://localhost:5180**. The Workshop uses a local
[Ollama](https://ollama.com) on `:11434` if one is running; without
it, answers fall back to pre-authored/placeholder responses.

### Scripts

```bash
npm run dev         # local server + Vite dev server (one command)
npm run server      # just the local server
npm run dev:web     # just Vite
npm run build       # local production build → dist/
npm run build:cloud # static, read-only cloud build → dist/ (+ api/*.json)
npm run prerender   # bake the GET endpoints to public/api/*.json
npm run typecheck   # type-check
npm run smoke       # headless-browser smoke test (needs `npm run dev` up)
```

Cloud smoke test:
`npm run build:cloud && npx vite preview --port 4180`, then
`SMOKE_BASE=http://localhost:4180 SMOKE_CLOUD=1 npm run smoke`.

## Routes

`/` Home · `/raids` · `/raids/:date` review · `/replay` ·
`/ask` Workshop · `/contribute` · `/notebook` · `/observations` ·
`/settings`. Plus `⌘K` palette, `N` quick-note, `1`–`8` route jumps.

## Project structure

```
src/
  api/
    types/        domain.ts + services.ts — THE DATA CONTRACT
    http/         client.ts (local/cloud) + httpApi.ts
    persistence/  localStorage adapter (UI prefs)
    index.ts      the swap point
  state/          SessionProvider · MemoryProvider · WorkbenchProvider
  components/     shell, modals, cohort cards, tweaks, primitives
  pages/          the 9 route pages
server/
  server.mjs      the local HTTP server
  dataSource.mjs  THE SEAM — where the parser plugs in
  store.mjs       file-backed notebook/observations persistence
  ollama.mjs      local-LLM bridge
  workshop.mjs    Workshop answer assembly
  data/*.json     the bundled dataset + seeds
scripts/          dev runner · prerender · smoke test
docs/             PORT_GUIDE.md
CONTRACTS.md      data shapes + wiring + how to go live
design-mock/      the original clickable prototype (reference only)
```

## Going live

Wire the real combat-log parser into `server/dataSource.mjs`, then
`npm run build:cloud` and deploy `dist/`. No UI changes — see
[`CONTRACTS.md`](CONTRACTS.md) §8.
