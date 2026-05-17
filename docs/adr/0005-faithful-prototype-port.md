# 0005. Build the UI by faithfully porting a throwaway prototype

- **Status:** Accepted
- **Date:** 2026-05-15

## Context

Designing a UI and engineering a UI are different activities with
different failure modes. Doing both at once means every change risks
*both* a design regression and an engineering bug, and it becomes
impossible to tell which kind of risk a given diff carries.

Lantern already had a clickable prototype: `design-mock/*.jsx`. It is
plain React with `window.*` globals, no types, and no router — but it
had already settled the things design settles: layout, copy, the
interaction model, and the exact CSS class names that `src/styles.css`
keys off.

## Decision

Treat `design-mock/` as **frozen design output** and build the real app
by **porting it faithfully** into `src/`, one `.jsx` → `.tsx` at a time.

A faithful port changes only four things:

1. **Module system** — `window.X` globals become imports and hooks.
2. **Types** — TypeScript types added; no `any` unless unavoidable.
3. **Routing** — `setRoute(...)` becomes `react-router` navigation.
4. **Props** — pages take no props; they read from hooks (per
   ADR-0001).

Everything else is preserved exactly: JSX structure, copy and text, CSS
`className` strings, and component logic. **No redesign during the
port. No "improving" the copy.** `docs/PORT_GUIDE.md` is the spec for
this work.

## Consequences

**Good**

- The port is mechanical and reviewable — each `.tsx` can be diffed
  against its `.jsx` source, and a reviewer sees engineering changes
  only, never tangled-in design changes.
- Design decisions are frozen and visible in one place.
- Styling is stable: CSS keys off class names that the port is
  contractually forbidden from renaming.

**Costs**

- `design-mock/` is committed dead weight — reference only, never
  imported. It includes one stale backup, `page-replay-v1.jsx.bak`,
  which `PORT_GUIDE.md` explicitly says to ignore.
- Genuine design improvements are deferred until after the port; the
  app intentionally ships the prototype's design, not a better one.
- Small helpers (`kindLabelShort`, `FilterPill`, …) are duplicated per
  file, matching the mock rather than being hoisted — a deliberate
  faithfulness cost.

## Alternatives considered

- **Redesign while porting.** Rejected — conflates design risk and
  engineering risk; a reviewer could no longer tell them apart.
- **Discard the mock; rebuild from a written spec.** Rejected — the
  mock *is* the most precise spec available. Prose would lose the exact
  copy, spacing, and class names, and re-deciding them is the design
  work this ADR is meant to keep separate.
