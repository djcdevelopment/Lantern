# Lantern — Real-Data Plan

How we wire `server/dataSource.mjs` to real combat-log parser output.

## The gap

The parser produces **facts**; Lantern's UI consumes **player-first
interpretations**. Wiring real data is the work of deriving the second
from the first.

What the parser gives (confirmed from `raidui/contracts/session/*` +
real parsed files):

- **Session** — `participants[]` (name, class, spec, role, ilvl),
  `encounters[]`, zone, runKind.
- **Encounter** — boss name, difficulty, `pulls[]`, kills/wipes.
- **Pull** — num, durationMs, outcome (Kill/Wipe), bossEndPctHp,
  deaths, isProgress, `pullParticipantIds[]`.
- **Replay** (`out/pulls/{id}.replay.json`) — 200ms `frames[]` with
  normalized positions + `entityHp[]`, `arenaYd` to denormalize, and
  `events[]` (casts, damage, deaths, interrupts, auras).

What the parser does NOT give — and Lantern needs:
moments, cohort scenarios, coordination markers, support actions,
narrative prose, retro excerpts, identity ("which character is *me*").

## Three decisions (with the defaults I'll use unless you say otherwise)

1. **Identity — "who is me?"** → Default: a configured character name
   (`LANTERN_CHARACTER`). The hosted build adds real member login
   later. Low-risk, local-first.
2. **Parser data path.** → Default: `dataSource` reads a configured
   directory of parser output in the documented schema
   (`LANTERN_DATA_DIR`). Lantern does **not** re-implement parsing —
   that's solved upstream. For dev we point it at an existing `out/`.
3. **Moment / cohort narrative.** → Default: rule-based *detection*
   always (deterministic, inspectable); narrative starts *templated*
   (ships fast, plain), with optional *LLM enrichment* as a later pass
   through the Ollama bridge we already built. The mock's hand-written
   prose is the quality bar; templates get ~70% of the way, LLM closes
   it. We review templated output before committing to LLM.

A `LANTERN_DATA_MODE` env flag (`dataset` | `parser`) lets us flip
between the bundled dataset and real derivation during the build.

## The five tiers

Each tier ships independently. Fields a tier hasn't reached yet render
with an honest "not yet derived" placeholder (the RaidUI pattern) — the
UI never breaks, and contracts auto-fill as tiers land.

### T0 · Static config split — *small, derisks everything*
Move the genuinely-static data out of the dataset: `glossary`,
`observationKinds`, `noteTags`, `askSuggestions`, `cohortSuggestions`,
`consent`, cohort-preset definitions. → `server/config/*.json` +
loader.
**Testable slice:** snapshot still serves; static config no longer
pretends to be parser output.

### T1 · Mechanical mapping — *the real-raid spine*
A parser adapter: read `out/sessions.json` + `out/sessions/{id}.json`,
map to `roster`, `latestRaid`, `raidHistory`, `pulls`,
`settingsGroups`, `packageItems`; resolve `player` from config.
Files: `server/parser/read.mjs`, `server/derive/raid.mjs`,
`server/derive/identity.mjs`.
**Testable slice:** open Lantern → Raids list, Raid Review header +
timeline, and the Replay roster show **your real raid night**.
Moments/cohorts show placeholders. Risk: low — direct field mapping.

### T2 · Computed analysis — *the replay & cohort substrate*
Deterministic algorithms over frames + events:
- `pullEvents` — classify your casts/saves/deaths.
- `cohesion` — mean pairwise distance over a window (denormalize via
  `arenaYd`).
- `cdChoreography` — defensive/external casts on a timeline.
- `coordination` / `deaths` / `recoveries` within a cohort.
- `supportActions` — feast/cauldron/spec-swap heuristics.
Needs a curated `spellbook.json` (defensive/external spell IDs →
metadata) — derivation quality depends on it + Advanced Combat Logging.
Files: `server/derive/{replay,cohesion,choreography,coordination,
support}.mjs`, `server/data/spellbook.json`.
**Testable slice:** select players on the Replay surface → real cohort
cards (cohesion graph, choreography, events) compute live. Pull detail
shows real defensives. Risk: medium — real analysis, but deterministic
and inspectable.

### T3 · Interpretive layer — *moments, scenarios, markers*
Two parts:
- **Detection** (rule-based): a death worth surfacing, a clutch save,
  N deaths within M seconds = a collapse, a clean cooldown chain, a
  role swap, a feast. Produces `Moment`, `CohortScenario`,
  `CoordMarker`, `CoordinationHighlight`. `questions[]` templated by
  kind.
- **Narrative**: templated lead-up/aftermath/prose first; optional LLM
  enrichment second.
Files: `server/derive/{moments,scenarios,markers}.mjs`,
`server/derive/narrative.mjs`.
**Testable slice:** Home + Raid Review surface real moments from your
night; the Replay scenario chips are auto-detected. Risk: highest —
this is product judgment (what's "worth surfacing", weighting, tone).
We review output together here.

### T4 · External integrations — *alongside, small*
`retroExcerpt` + `raidLeads` from Hearth (goatsafterdark.org);
`askHistory` as a local transcript store. Stubbed/configured until the
Hearth API is pointed at.

## Sequencing

`T0 + T1` ship together as the first milestone — a real raid night,
end to end, with placeholders below the fold. Then `T2`, then `T3`
(with a review checkpoint), `T4` folded in opportunistically. Each
tier is its own verified step: `npm run typecheck`, `npm run smoke`,
and a screenshot pass against the real `out/` data.

## What I need from you

- **A parsed raid to develop against** — an `out/`-format directory
  (the existing `raidui/out/` works, though it's sparse; a fresh raid
  parse is better for T2/T3 quality).
- **The "me" character name** for the dev data (decision 1).
- A look at **T3 output together** before we invest in LLM narrative.

## Verification per tier

Point `dataSource` at the real `out/`, flip `LANTERN_DATA_MODE=parser`,
run the smoke test + screenshots, confirm the app renders a real raid.
The `SessionSnapshot` contract stays fixed throughout — only how it's
filled changes.
