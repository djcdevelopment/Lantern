# 0006. Route research questions by type; gate every external fact

- **Status:** Accepted
- **Date:** 2026-05-16

## Context

Wiring real combat-log data behind the seam (ADR-0002) needs facts:
spell IDs, log event shapes, the parser's behavior, and judgment calls
like "what death count is a collapse?"

The first attempt gathered 14 such questions into a `research-questions`
doc and handed them to a single "combat-log research agent." It
returned **confident fabrication**:

- a non-existent "Midnight engine bug,"
- a fabricated `WORLD_MARKER_PLACED` event (greps to **zero** in a
  923 MB log),
- "42 GB logs" when the real log is **0.9 GB**,
- one spell ID assigned to two different spells,
- "percolation theory" where a yard threshold belonged.

The real answers came from grepping the actual combat log and reading
the actual parser. `SPELL_HEAL` was not "missing due to an engine bug"
— the fixture holds **407,649** of them; the parser drops them on
purpose. This was not a bad-agent problem. It was a **routing problem**:
14 questions were sent down one pipe when they were three different
*kinds* of question, and only one kind belonged there.

## Decision

Before any research question goes anywhere, **type it** by asking *what
artifact would settle this?*

- **Type A — artifact-settled.** The answer already exists on disk (the
  combat log, the parser source, a schema). Do **not** ask an agent —
  asking invites fabrication where ground truth is one `grep` away.
  Convert the question into a *probe*: a specific grep, script, or
  file-read run by us.
- **Type B — domain-knowledge, gated.** Model knowledge may *propose*
  an answer we do not have (spell IDs, ability mechanics). The ask is
  allowed — but every proposed fact passes the **ground-truth gate**
  before it is trusted: it is grepped against the real log; zero hits
  means `verified: false` (kept, but not trusted, never deleted on a
  single log's absence).
- **Type C — a decision, not a question.** No external answer exists
  ("what death count is a collapse?"). Convert it into a *data view* —
  a small derivation that surfaces the real distribution — then a human
  decides by looking.

Plus a second test: a question informs implementation only if its
answer is shaped like an input to a **named file**. If you cannot name
the destination file and the shape, the question is malformed — rewrite
it. `docs/research-strategy.md` holds the method in full;
`docs/research-questions.md` shows all 14 questions routed.

## Consequences

**Good**

- Concrete catches: the gate found **5 real spell-ID drifts** and **1
  name error** while building `server/data/spellbook.json` — drift that
  unverified agent output would have baked into every derivation.
- "Slop" became *detectable* — named tells (internal contradiction,
  contradicts our artifacts, fabricated specifics, vocabulary where a
  number belongs) make a bad answer rejectable on sight.
- Reusable tooling fell out of it (`scripts/scan-spells.mjs`,
  `scripts/build-spellbook.mjs`) — re-gating against a new log is two
  commands.

**Costs**

- The gate is a real tax: probes, greps, and data views take time that
  "just ask the agent" appears to save.
- Type-C decisions still require a human (Derek) in the loop — the
  method surfaces the distribution but does not make the call.
- A fact can be correct yet sit `verified: false` simply because the
  gate log lacked that class or spec; the unverified set must be
  re-gated whenever a richer log appears, not treated as wrong.

## Alternatives considered

- **Trust the research agent.** Rejected — it demonstrably fabricated,
  and the fabrications were confident and specific enough to survive a
  casual read.
- **Skip research; guess the thresholds and IDs.** Rejected — wrong
  spell IDs and wrong thresholds produce derivations that are silently
  wrong, which is worse than visibly missing (ADR-0002's "not yet
  derived" placeholder).
