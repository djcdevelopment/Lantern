# Architecture Decision Records

This directory records the **load-bearing decisions** behind Lantern —
the ones that shaped the codebase and would be expensive to reverse.
Each record captures *why* a decision was made, so a future reader (or
a future us) does not have to reverse-engineer the reasoning from the
code, or relitigate a question that was already settled.

## Format

Each ADR follows the classic Michael Nygard structure:

- **Status** — Accepted · Superseded · Deprecated.
- **Context** — the forces in play when the decision was made.
- **Decision** — what we chose, stated plainly.
- **Consequences** — what this makes easy, and what it costs.
- **Alternatives considered** — what we rejected, and why.

An ADR is immutable once Accepted. If a decision changes, write a new
ADR that supersedes the old one — do not edit history. The point of
the record is that it reflects what was true *when the decision was
made*.

Scope note: these records cover decisions that are architecturally
**or methodologically** significant. ADR-0006 is a process decision,
not a code-structure one — it is here because how we source real-world
facts is as load-bearing for Lantern as any layer boundary.

## Index

| # | Title | Status |
| --- | --- | --- |
| [0001](0001-four-layer-architecture.md) | Four-layer architecture with a single typed API surface | Accepted |
| [0002](0002-datasource-seam-bundled-dataset.md) | One data seam (`dataSource.mjs`); ship on a bundled dataset | Accepted |
| [0003](0003-dual-mode-build.md) | Local and cloud builds from one build-time flag | Accepted |
| [0004](0004-raw-http-local-server.md) | Local server on raw Node `http`, no web framework | Accepted |
| [0005](0005-faithful-prototype-port.md) | Build the UI by faithfully porting a throwaway prototype | Accepted |
| [0006](0006-research-question-routing.md) | Route research questions by type; gate every external fact | Accepted |

## Related documents

- [`../../CONTRACTS.md`](../../CONTRACTS.md) — data shapes, wiring, the
  data flow, and the go-live checklist. The *what*; the ADRs are the
  *why*.
- [`../REAL-DATA-PLAN.md`](../REAL-DATA-PLAN.md) — the tiered plan for
  wiring real combat-log data behind the seam (implements ADR-0002).
- [`../research-strategy.md`](../research-strategy.md) — the research
  routing method in full (the doctrine behind ADR-0006).
- [`../../RETROSPECTIVE.md`](../../RETROSPECTIVE.md) — 1-day post-mortem
  of the foundation and research-method phases.
