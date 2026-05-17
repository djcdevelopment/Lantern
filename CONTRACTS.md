# Lantern — Data Contracts, Wiring & Data Flow

This document defines the data shapes, the wiring, and the data flow,
and shows exactly where the real **identity**, **parser**, and
**persistence** plug in.

The architecture follows the proven RaidUI v2 model: the UI talks to
one typed surface (`LanternApi`); behind it a small local server reads
data through a single swappable `dataSource`; and a cloud build serves
the same data as static blobs.

---

## 1. Architecture — four layers

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 4 — UI            src/pages · src/components            │
│   reads data only through hooks; never fetches directly       │
│      useSession() · useWorkbench() · useNotebook() · …        │
├──────────────────────────────────────────────────────────────┤
│ Layer 3 — API client    src/api                               │
│   LanternApi  ── httpApi over fetch (src/api/http)             │
│   local mode → the server   ·   cloud mode → static blobs     │
├──────────────────────────────────────────────────────────────┤
│            HTTP / JSON          (CORS, port 5181)             │
├──────────────────────────────────────────────────────────────┤
│ Layer 2 — Local server  server/                               │
│   raw-http server · LanternApi endpoints · Ollama bridge      │
│   file-backed notebook/observations store                     │
├──────────────────────────────────────────────────────────────┤
│ Layer 1 — Data source   server/dataSource.mjs   ◀── THE SEAM  │
│   today: server/data/*.json (the bundled dataset)             │
│   tomorrow: combat-log parser output + derivation             │
└──────────────────────────────────────────────────────────────┘
```

Discipline: layer 4 never fetches; layer 3 never knows about React;
layer 2 never imports from `src/`; layer 1 is the only place that
knows where bytes come from.

---

## 2. Local vs cloud

| | **Local** (default) | **Cloud** (`build:cloud`) |
| --- | --- | --- |
| Built by | `npm run dev` / `npm run build` | `npm run build:cloud` |
| API base | `http://127.0.0.1:5181` (the server) | same origin, static |
| GET requests | hit the server | rewritten to `/api/*.json` blobs |
| Writes (POST/PATCH/DELETE) | work | throw `CloudUnavailableError` |
| Workshop (Ollama) | live | disabled (local-app only) |
| Notebook / Observations | read + write | read-only |

Cloud is for `app.goatsafterdark.org`: a fully static bundle
(`dist/` = `index.html` + `assets/` + `api/*.json`), deployable to any
static host. The read-only constraint is surfaced by a persistent
`CloudBanner`; authoring affordances are hidden or no-op.

The mode switch is one build-time env var (`VITE_CLOUD_MODE`, set by
`.env.cloud`) consumed in `src/api/http/client.ts`.

---

## 3. The seam — `server/dataSource.mjs`

**This is the one file to change to go from sample data to real data.**

```js
export function getSnapshot()            // → SessionSnapshot
export function getCannedAnswers()       // → pre-authored Workshop answers
export function getContributePackage(id) // → { items, consent }
```

Today these read `server/data/*.json`. To wire the real combat-log
parser, replace the bodies: read the parser's output (sessions, pulls,
replay frames) and run the player-first derivation that turns raw
events into Lantern's `Moment` / `CohortScenario` / `CoordMarker`
shapes. The `SessionSnapshot` type (`src/api/types/domain.ts`) is the
contract — satisfy it and nothing else in the server or app changes.

`server/store.mjs` is the persistence seam — file-backed today; a
hosted multi-user build swaps it for a database keyed by member id.

---

## 4. The three external systems

### Identity — *who is signed in*
Delivered by `bootstrap()` as `snapshot.player` + `snapshot.roster`.
A real build resolves the signed-in character there. To make it a
first-class service, add `IdentityService` to `LanternApi` — the UI
only reads `useSession().player`, so nothing downstream changes.

### Parser — *the raid data*
The combat-log parser is the source behind `dataSource.getSnapshot()`
and `getCannedAnswers()`. See §3.

### Persistence — *what the player authors*
`server/store.mjs` (notebook + observations) and the client-side
`PersistenceAdapter` (UI tweaks, localStorage). Notebook is local;
observations are guild-shared (a hosted build routes them to a guild
service).

### Local model — *the Workshop*
`server/ollama.mjs` bridges a local Ollama (`:11434`). Health is
checked for real (drives the live topbar status); `workshop.ask`
generates a grounded answer when a model is installed, and falls back
to a pre-authored or placeholder answer otherwise.

---

## 5. HTTP endpoints

| Method | Path | LanternApi method | Cloud blob |
| --- | --- | --- | --- |
| GET | `/api/health` | `getHealth()` | `health.json` |
| GET | `/api/bootstrap` | `bootstrap()` | `bootstrap.json` |
| POST | `/api/workshop/ask` | `workshop.ask()` | — (write) |
| GET | `/api/notebook` | `notebook.list()` | `notebook.json` |
| POST | `/api/notebook` | `notebook.add()` | — |
| PATCH | `/api/notebook/:id` | `notebook.update()` | — |
| DELETE | `/api/notebook/:id` | `notebook.remove()` | — |
| GET | `/api/observations` | `observations.list()` | `observations.json` |
| POST | `/api/observations` | `observations.share()` | — |
| POST | `/api/observations/:id/withdraw` | `observations.withdraw()` | — |
| GET | `/api/contribute/package?raidId=` | `contribute.getPackage()` | `contribute/package--raidId=*.json` |
| POST | `/api/contribute/submit` | `contribute.submit()` | — |

Cloud GET-URL convention (`scripts/prerender.mjs` ↔ `client.toCloudPath`):
`/api/x?b=2&a=1` → `/api/x--a=1--b=2.json` (query keys sorted).

---

## 6. Data flow

**Startup** — `SessionProvider` calls `api.bootstrap()` once; shows a
boot splash while pending, a clear error splash if the server is
unreachable, then holds the snapshot for the app's lifetime.

**A read** — pages read the snapshot synchronously via `useSession()`.
No fetching in components.

**A mutation** — `useNotebook().addNote(draft)` → `POST /api/notebook`
→ server's `store.mjs` persists → `MemoryProvider` re-reads the list →
sidebar badge + lists update. In cloud the write rejects with
`CloudUnavailableError`, which `MemoryProvider` swallows quietly.

**A Workshop question** — `api.workshop.ask(query, ctx)` →
`POST /api/workshop/ask` → `server/workshop.mjs` (canned → Ollama →
placeholder) → `WorkshopAnswer` with a query-plan trace, cited body,
and sources.

---

## 7. Domain shapes — the contract

Commented definitions: [`src/api/types/domain.ts`](src/api/types/domain.ts)
and [`services.ts`](src/api/types/services.ts). Load-bearing shapes:

- **Identity:** `Player`, `RosterMember`
- **Raids:** `Raid`, `Boss`, `RaidSummary`, `Pull`, `PullEvent`
- **Moments:** `Moment`
- **Cohorts:** `CohortScenario`, `CohortCardSet`, `CohortPreset`,
  `CoordMarker`, `CoordinationHighlight`
- **Workshop:** `WorkshopAnswer`, `AnswerBodyNode`
- **Memory:** `Note`, `Observation`, `NoteBinding`
- **Health:** `HealthStatus`
- **Aggregate:** `SessionSnapshot` — the whole `bootstrap()` payload.

---

## 8. Going live — checklist

1. **Real data:** rewrite the three functions in
   `server/dataSource.mjs` to read parser output. `tsc`/the schema
   keep you honest against `SessionSnapshot`.
2. **Real persistence:** if multi-user, swap `server/store.mjs` for a
   DB keyed by member identity.
3. **Identity:** resolve the signed-in player in `bootstrap()` (or add
   an `IdentityService`).
4. **Deploy cloud:** `npm run build:cloud` → upload `dist/` to
   `app.goatsafterdark.org` (static host).
5. **Verify:** `npm run typecheck`, then `npm run smoke` (local) and
   `SMOKE_CLOUD=1 SMOKE_BASE=… npm run smoke` (cloud).

No code in `src/pages`, `src/components`, or `src/state` needs to
change for any of the above.

### If the archive grows too large to bootstrap at once

Split `bootstrap()` into an index load plus `raids.getRaid(id)`; give
`RaidReviewPage`/`ReplayPage` a small loading state. The domain shapes
do not change — only how they are delivered.
