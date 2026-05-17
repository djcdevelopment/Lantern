# 0002. One data seam (`dataSource.mjs`); ship on a bundled dataset

- **Status:** Accepted
- **Date:** 2026-05-15

## Context

Lantern's UI consumes **player-first interpretations** — "your moment,"
"your save," "the group collapsed here." The combat-log parser produces
**facts** — casts, damage, deaths, positions. The gap between the two
is a derivation layer (moments, cohort scenarios, coordination markers,
identity) that does not exist yet.

Parsing itself is solved upstream in RaidUI; it is the *derivation into
player-first shapes* that is unbuilt. If the UI cannot proceed until the
derivation is done, the entire project is one long critical path.

We needed a way to make the UI genuinely *finished* — buildable,
verifiable, demoable — before the real-data work begins.

## Decision

Put **one seam** between the server and "where bytes come from":
`server/dataSource.mjs`, exposing three functions —

```js
getSnapshot()             // → SessionSnapshot  (the bootstrap payload)
getCannedAnswers()        // → pre-authored Workshop answers
getContributePackage(id)  // → { items, consent }
```

Today these read a **bundled dataset** (`server/data/*.json`) that was
hand-authored to satisfy the `SessionSnapshot` contract. Going live
means rewriting *only those three function bodies* to read parser
output and run the derivation. Nothing above the seam — no page, no
component, no state provider, no client method — changes.

A companion rule keeps the seam honest as real data lands incrementally
(see `REAL-DATA-PLAN.md`, tiers T0–T4): a field a tier has not derived
yet renders an **honest "not yet derived" placeholder**, never a crash
and never a fabricated value.

## Consequences

**Good**

- The UI is "done" *now* — typecheck and smoke tests pass in both
  modes against the bundled dataset.
- Real-data work is scoped to one file plus the `server/derive/*`
  modules, and can ship tier by tier without breaking the UI.
- The `SessionSnapshot` type is the contract: `tsc` keeps any new data
  source honest against what the UI expects.

**Costs**

- The bundled dataset is **hand-authored**, so it can flatter the UI —
  it cannot surface the ugliness that real, messy parser output will
  (missing fields, odd distributions, gaps). The UI looks finished;
  whether it *is* finished is unproven until T1 ships real data.
- The dataset can drift from the contract if edited without a
  typecheck.
- The dataset is **real personal raid data** and is committed to the
  repository. It was pushed to a public GitHub repo before that was
  consciously decided — see `RETROSPECTIVE.md`. Acceptable here because
  it is the author's own data; it would not be for anyone else's.

## Alternatives considered

- **Block the UI on the parser.** Rejected — serializes the project on
  its slowest dependency.
- **Mock at the HTTP layer instead of behind the server.** Rejected —
  no single typed seam; HTTP mocks rot, and the cloud build (ADR-0003)
  needs a real server-side place to prerender from.
