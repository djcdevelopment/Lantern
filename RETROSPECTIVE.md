# Lantern — Retrospective

**A 1-day post-mortem.** Written 2026-05-17, one day after the
foundation-and-research-method phase paused for review. The work it
examines began 2026-05-15.

> **Read this for what it is: a 1-day post-mortem.** It is written
> *close* to the events — memory is fresh, but distance is short, and
> short distance has a cost. The real-data tiers (T1–T4 in
> [`docs/REAL-DATA-PLAN.md`](docs/REAL-DATA-PLAN.md)) have **not** shipped
> against a real raid yet, so any verdict here on whether the
> architecture truly holds is provisional. This retro can honestly
> assess two things: the **foundation phase** (the four-layer wiring)
> and the **research-method phase** (how we sourced real-data facts). It
> *cannot* yet assess the bet those phases were placed on. Revisit this
> document after T1 ships real data — some "what went well" entries are
> really "what looks well so far."

---

## Timeline

| Date | What happened |
| --- | --- |
| **2026-05-15** | Lantern started fresh — the 3rd iteration of this UI. Foundation built: build tooling, the typed `SessionSnapshot` contract, the `LanternApi` client, state providers, the app shell. |
| **2026-05-15 → 16** | The 9 route pages and components ported from the `design-mock/` prototype into the real Vite + React + TS app. Typecheck and headless smoke tests pass in **both** local and cloud modes. |
| **2026-05-16** | Real-data planning. First research pass produced fabrication; corrected with a written routing method. Parser work landed (q13 heals/auras retained, q1 spellbook of 75 entries, q2 feast IDs); q10 collapse detection partial. |
| **2026-05-17** | Discovered the entire project had **never been under version control**. Initialized git, made the first commit (115 files, 35,567 lines), pushed to GitHub. Then: this retrospective, a README, and six ADRs. |

So: roughly two days of building, reviewed on the third. This document
is that review.

---

## What we set out to do

Build the third iteration of the GAD App / Workbench UI to a state
where it is **genuinely finished as a UI** — verifiable, demoable,
deployable — *before* the real combat-log data exists. Then plan the
real-data work so it can land incrementally without breaking anything.

Both halves were attempted. The first is done and verified. The second
is planned and partly underway.

---

## What went well

**1. The seam held — and it is verified, not hoped.**
The four-layer architecture (ADR-0001) plus the single `dataSource.mjs`
seam (ADR-0002) did exactly the job they were chosen for: the UI is
complete and passes typecheck and smoke tests in both local and cloud
modes, running entirely on a bundled dataset. No page fetches. No
component knows where bytes come from. The bet that you can *finish a
UI before you have its data* paid off — at least through the foundation
phase.

**2. Shipping behind a seam, on a bundled dataset.**
Choosing to hand-author a dataset that satisfies the `SessionSnapshot`
contract — instead of blocking on the parser — kept the project off a
single critical path. The UI became a finished, reviewable artifact
weeks before real derivation work needs to start.

**3. A slop incident became a durable method.**
The research-agent fabrication (see below) was caught and turned into
[`docs/research-strategy.md`](docs/research-strategy.md) and ADR-0006: a
written routing method that types every question A/B/C and gates every
external fact against the real log. This was not just damage control —
the gate then earned its keep, catching **5 real spell-ID drifts and 1
name error** while building `spellbook.json`. A failure became
infrastructure.

**4. Honest placeholders.**
The decision that an un-derived field renders "not yet derived" rather
than crashing or fabricating means the tiered real-data rollout (T0–T4)
can ship one tier at a time with the UI never breaking. This is a small
decision with a large payoff in how safely real data can land.

**5. The faithful port kept two kinds of risk separate.**
Freezing design in `design-mock/` and porting it mechanically
(ADR-0005) meant every `.tsx` diff carried engineering risk *only* —
never tangled-in design changes. Reviewable by construction.

---

## What went wrong

**1. The work was untracked for two days. _(This is why this
conversation exists.)_**
The single largest process failure. From 2026-05-15 until 2026-05-17,
the entire project — 115 files, ~35.5k lines — existed only on one
disk, with no version control, no remote, no backup, and no history. A
bad `rm`, a disk fault, or a botched edit would have been
unrecoverable. It was noticed only because the user happened to say
"we never pushed any of this."
*Severity: high. Likelihood it bites: low per day, but the loss is
total.*

**2. A research agent returned confident fabrication.**
The first real-data research pass sent 14 questions to a single
research agent. It invented a "Midnight engine bug," a
`WORLD_MARKER_PLACED` event that greps to zero, "42 GB logs" (the real
log is 0.9 GB), a spell ID shared by two spells, and "percolation
theory" in place of a number. None of it was true. Cost: a full round
of answers that had to be detected as false and discarded. Recovered
well (see "what went well #3"), but the round was wasted.

**3. Personal data went into a public repo before that was decided.**
The bundled dataset under `server/data/` is real personal raid data. It
was committed and pushed to a **public** GitHub repository. The fact
that it is the author's *own* data — and therefore acceptable — was
established at the final pre-push review, *after* the push, not before.
The right answer came up; it came up by luck of timing, not by process.

**4. Cruft rode in on the first commit, invisibly.**
Because there was no incremental git history, the initial commit is one
35.5k-line blob — and dev cruft rode in unexamined: a stale backup
(`design-mock/page-replay-v1.jsx.bak`), two self-labeled "throwaway"
scratch scripts (`scripts/_inspect-pull.mjs`, `_fatal-fall-check.mjs`),
and hardcoded local paths (`D:/work/raidui/...`) in dev scripts. None
of it ships in `dist/`, so none of it is dangerous — but with no
commit-by-commit history, nothing ever forced a "should this be
tracked?" moment.

---

## Root causes

The three process failures — untracked work, public personal data,
unexamined cruft — are not three problems. They are **one** problem
wearing three hats:

> **Process artifacts were treated as "later."**

`git init`, the `.gitignore` review, the repo-visibility decision —
each felt like setup to be done "once the real work settles." So none
of them happened, and the real work accumulated *behind* them. The
build went well precisely because attention went to the build; the
process scaffolding got the attention left over, which was none.

The research-slop incident has a different root: a **routing** failure.
Fourteen questions were treated as one kind of thing (ask an agent)
when they were three kinds (probe / gated-ask / decide). That root is
already fixed and written down (ADR-0006); the process-artifact root is
fixed only as of today.

---

## What we would do differently

1. **`git init` before the first file.** Not after the first feature,
   not "once it settles." Day zero, commit zero. An empty repo costs
   nothing; two days of untracked work costs everything at once.
2. **Decide repo visibility and what data is shippable _before_ the
   first commit** — not at the pre-push review. "Is this data OK to be
   public?" is a question with a deadline, and the deadline is the
   first `git add`.
3. **Keep scratch out of the tree.** Throwaway probes and diagnostics
   belong in a gitignored `scratch/` (or get deleted when the probe is
   answered). A script whose own header says "throwaway" should not be
   a tracked file.
4. **Apply the question-routing test from question one** — not after a
   fabricated answer makes the case for it. The method in ADR-0006 is
   cheap to apply pre-emptively and expensive to learn reactively.

---

## What is now true (carry forward)

- **The seam is real.** ADR-0001/0002's central bet — finish the UI
  before the data — is verified through the foundation phase. Going
  live is still scoped to three function bodies in `dataSource.mjs`.
- **The ground-truth gate is doctrine.** No external fact (spell ID,
  event shape) enters the codebase without being grepped against the
  real log. This is not a one-time cleanup; it is how real-data work
  runs from here.
- **Process artifacts are first-class.** They failed here *because*
  they felt like "later." The repo now exists; the lesson is that
  version control, `.gitignore`, and visibility are part of the work,
  not preamble to it.

---

## Open questions / what this retro cannot yet judge

A 1-day post-mortem has to be honest about its blind spots:

- **Does the seam hold against _real_ data?** The bundled dataset is
  hand-authored — it can only flatter the UI. Real parser output is
  messy, sparse, and oddly distributed. Whether the `SessionSnapshot`
  contract survives contact with T1 is **unproven**. This is the single
  biggest unknown.
- **Are the Type-C thresholds findable?** Collapse detection (q10) is
  already "partial" and the first approach was wrong (fall-burst
  detection found the *mechanic*, not wipe-jumps). Several Type-C
  decisions remain — the method surfaces the distribution, but the
  decisions themselves are still ahead of us.
- **Will templated narrative clear the quality bar?** REAL-DATA-PLAN's
  T3 bets that templated prose gets ~70% of the way and LLM enrichment
  closes it. Untested. There is a review checkpoint planned; honor it.

Revisit this document after T1. Until then, treat the "what went well"
section as *what looks well from one day out* — and the "what went
wrong" section as settled fact, because process failures, unlike
architecture bets, do not need distance to confirm.
