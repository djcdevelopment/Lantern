# 0001. Four-layer architecture with a single typed API surface

- **Status:** Accepted
- **Date:** 2026-05-15

## Context

Lantern is the third iteration of this UI. The recurring failure of a
front end like this is coupling: components that fetch their own data
are impossible to test without a live backend, impossible to point at
a different data source, and impossible to ship as a static bundle.

Two hard constraints made coupling unaffordable here:

1. **The real data does not exist yet.** The combat-log parser output
   and the player-first derivation (moments, cohorts) are unfinished.
   The UI must be fully buildable and verifiable *before* real data
   arrives, or the whole project serializes behind the parser.
2. **Two deploy targets.** Lantern ships both as a local read/write
   app and as a static, read-only "chronicle" hosted on the web. The
   same UI code must serve both.

The RaidUI v2 codebase had already proven a layered model that handles
exactly this. Lantern adopts it deliberately rather than rediscovering
it.

## Decision

Structure the app as **four layers**, each with a strict boundary:

```
Layer 4 — UI            src/pages, src/components
Layer 3 — API client    src/api  (the LanternApi surface)
Layer 2 — Local server  server/
Layer 1 — Data source   server/dataSource.mjs
```

The discipline that makes the layers real:

- **Layer 4 never fetches.** Pages and components read data only
  through hooks (`useSession()`, `useWorkbench()`, `useNotebook()`, …).
  A page component takes no props.
- **Layer 3 never knows about React.** `LanternApi` is a plain typed
  client over `fetch`. It could be called from a script.
- **Layer 2 never imports from `src/`.** The server is independent of
  the UI build.
- **Layer 1 is the only place that knows where bytes come from.**

The contract that ties it together is the TypeScript domain model in
`src/api/types/` — `SessionSnapshot` and friends. Every layer agrees on
those shapes; `tsc` enforces it.

## Consequences

**Good**

- The UI is testable and verifiable against *any* data source — a
  bundled dataset today, parser output tomorrow — with no UI changes.
- The cloud/local difference is confined to Layer 3 (see ADR-0003).
- Swapping the data source is a Layer-1 edit (see ADR-0002).
- "Where does this data come from?" always has one answer per layer.

**Costs**

- More indirection than components-fetch-directly. A new datum crosses
  all four layers and the type contract.
- The `SessionSnapshot` contract must be actively maintained; it is the
  single point that, if wrong, breaks everything.
- Boilerplate: each endpoint exists as a route, a client method, and a
  hook.

## Alternatives considered

- **Components fetch their own data.** Rejected — untestable offline,
  couples UI to transport, and cannot produce a static cloud bundle.
- **One large React context holding everything.** Rejected — no seam
  for the data source and no seam for the cloud build; the context
  would itself have to know about HTTP, parsing, and deploy mode.
