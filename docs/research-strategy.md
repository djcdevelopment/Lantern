# Lantern — Research-Question Strategy

How to turn a question into something that informs implementation —
instead of something that produces confident slop.

## Why this exists

The first pass of `research-questions.md` was 14 questions handed to a
"combat-log research agent." The agent returned confident fabrication:
a non-existent "Midnight engine bug," a fabricated `WORLD_MARKER_PLACED`
event, "42 GB logs" (our real log is 0.9 GB), one spell ID assigned to
two different spells, and academic vocabulary ("percolation theory")
where a yard threshold belonged.

The real answers came from somewhere else: grepping the actual combat
log and reading the actual parser. `SPELL_HEAL` is not missing because
of an engine bug — the log has **407,649** of them; the parser drops
them on purpose.

That is not a bad-agent problem. It is a routing problem. The questions
doc sent 14 questions down one pipe when they were three different
*kinds* of question, and only one kind belonged in that pipe.

## The test that types every question

> **What artifact would settle this?**

The answer routes the question.

### Type A — Artifact-settled
The answer already exists, complete, in a file on disk: the combat log,
the RaidUI parser, a schema. **Do not ask an agent.** Asking invites
fabrication where ground truth is one `grep` away. Convert the question
into a *probe* — a specific grep, script, or file-read you run yourself.

### Type B — Domain-knowledge, gated
Model/research knowledge can *propose* an answer you don't have (spell
IDs, ability mechanics). Keep the ask — but every proposed fact passes
the **ground-truth gate** (below) before it is trusted.

### Type C — Decision, not a question
"What death-count defines a collapse?" has no external answer. It is a
judgment call. No research will settle it — the agent proved this by
answering with theory names and zero numbers. Convert the question into
a **data view**: a small derivation that surfaces the real distribution,
then a human decides by looking.

## The second test: does the answer have a destination?

A question informs implementation only if its answer is shaped like an
input to a named file.

> **What file does the answer get pasted into, and in what shape?**

- q1's answer → rows of `server/data/spellbook.json`.
- q8's answer → a metric choice + two constants in `server/derive/cohesion.mjs`.
- q10's answer → a `(count, windowMs)` pair in `server/derive/scenarios.mjs`.

If you cannot name the destination file and the shape, the question is
malformed. Rewrite it until you can. A well-formed question reads:

> *[probe | ask | decide] X — settled by [artifact], answer is
> [shape], lands in [file].*

## The ground-truth gate (Type B only)

No fact from an agent enters the codebase unverified.

- **Every spell ID is grepped against the real log before it enters
  `spellbook.json`.** An ID with zero hits is wrong, renamed, or
  irrelevant — drop it or flag it `unverified`.
- **Expect name collisions and multi-ID abilities.** Penance is `47540`
  (cast) plus `47750 / 281469 / 270501` (bolts). "Tranquility" is `740`
  (player) *and* `1264659` (a summoned Dryad's version, same name). One
  name is not one ID.

### Slop tells — reject any answer showing one of these
- **Internal contradiction** — one ID used for two spells.
- **Contradicts our own artifacts** — "42 GB logs" vs the manifest's 0.9 GB.
- **Fabricated specifics** — a named event/field that greps to zero
  (`WORLD_MARKER_PLACED`).
- **Vocabulary where a number belongs** — "critical group threshold"
  when the question asked for yards.

## Intake procedure

For each question, before it goes anywhere:

1. Ask "what artifact would settle this?" → assign Type A / B / C.
2. Ask "what file does the answer feed, in what shape?" → if you can't
   answer, rewrite the question.
3. Route it: **A** → write the probe and run it. **B** → ask, then gate.
   **C** → build the data view, then decide.
4. Record the answer in `research-questions.md` beside the question,
   with the evidence (the grep, the line, the `file:line`).

Slop is cheap and fast. This procedure is the tax that keeps it out.
