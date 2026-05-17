# Lantern — Research Questions (routed)

Context: Lantern derives player-first raid views from parsed combat
logs. Parser output schema: `raidui/contracts/session/*`. Tiers: see
`REAL-DATA-PLAN.md`. **Method: see `research-strategy.md`.**

Every question is typed **A / B / C** (per the strategy doc) and carries:
what settles it, the destination file, and status.

**Routing result:** of 14 questions, **7 are Type-A probes** (settled
below from the real artifacts — no agent), **2 are gated asks**, **5 are
decisions** needing a data view. The original doc mis-routed ~85% of
itself to a research agent.

Reference artifacts:
- Real log: `D:\work\raidui\fixtures\real\WoWCombatLog.txt` — 0.9 GB,
  `COMBAT_LOG_VERSION 22`, `BUILD_VERSION 12.0.1`, ACL on.
- RaidUI parser: `D:\work\raidui\src\parser\*`.

---

## Section 1 — Probes (Type A) · no agent, settle from artifacts

### q13 · Does the parser drop heals/auras? — *Type A · T2 · ✅ IMPLEMENTED*
**Was:** dropped by design — `eventClassifier.js` `classify()` returned
`null` for all `SPELL_AURA_*`; `replayBuilder.js` never emitted heals or
absorbs. Not a sparse sample, not an engine bug — the fixture holds
407,649 `SPELL_HEAL`, 205,388 `SPELL_AURA_APPLIED`, 63,767 `SPELL_ABSORBED`.
**Done — RaidUI parser, 6 files, 59/59 parser tests green:**
- `eventClassifier.js` — classifies `SPELL_AURA_APPLIED/REMOVED` and
  `SPELL_ABSORBED` (the latter parsed end-relative, to handle the
  melee-vs-spell variable field count).
- `replayBuilder.js` — emits `SpellAuraApplied/Removed` and `SpellAbsorbed`
  into `events[]`, **whitelist-gated** by `DEFENSIVE_SPELL_IDS`, player
  targets only — the same pattern the existing `SpellCastSuccess` gate uses.
- `eventKinds.js` + `contracts/session/event.schema.json` — added
  `SpellAbsorbed` (and `SpellDispel`, which was emitted but missing from
  the enum — pre-existing drift, fixed in passing).
**Deferred (scope decision):** raw `SpellHeal` events are NOT retained.
Per-frame `entityHp` already carries the HP trajectory; retaining 407k
heals would blow the parser's explicit per-pull size budget for no
current consumer. Revisit only if a derivation needs per-tick heal
amounts (e.g. Penance bolt-counting for q5).
**Unblocks:** q1 / q3 / q5 / q11 can now proceed.

### q14 · Is Advanced Combat Logging on? — *Type A · T2 · ANSWERED*
**Settled by:** read line 1 of the log.
**Answer:** Don't heuristically detect it — the log declares it. Line 1:
`COMBAT_LOG_VERSION,22,ADVANCED_LOG_ENABLED,1,BUILD_VERSION,12.0.1,PROJECT_ID,1`.
Read the token after `ADVANCED_LOG_ENABLED`. If `0`: no positions, no HP
— the parser should **fail loud**, because Lantern's replay degrades to
nothing, not gracefully. "How reliably on across many guilds" is a real
future question — deferred until multiple guilds' logs exist (then it's
Type C).
**Destination:** a guard at parser ingest.

### q7 · Event vs frame coordinate space — *Type A · T2 · ANSWERED*
**Settled by:** read `raidui/src/parser/{replayBuilder,coordNormalizer}.js`.
**Answer:** In the emitted replay they are **not** the same space. Frame
`entityPositions` are normalized `[0,1]` over the pull bbox; event
`position` is left as **raw world yards**. They share a source space
(both raw yards pre-transform) but only frames get normalized. To place
an event on the frame plane, apply the same `makeNormalizer(bbox)`
transform — but the replay exports only `arenaYd {width,height}`, **not**
the bbox origin (`xMin/yMin`), so a consumer currently *cannot*
re-normalize an event. Fix upstream: export the bbox origin, or
normalize event positions at build time.
**Destination:** RaidUI `replayBuilder.js` + `arenaYd`/event contract;
consumed by `server/derive/replay.mjs`.

### q12 · Log signals for raid mechanics — *Type A · T3 · ANSWERED*
**Settled by:** grep candidate event names.
**Answer:** None generic. `MARKER` → **0 matches** in 923 MB;
`WORLD_MARKER_PLACED` does not exist. Raid target icons and world
markers are never written to the combat log. Spread/stack mechanics
leave no dedicated event — infer them from `SPELL_DAMAGE` /
`SPELL_AURA_APPLIED` on specific *boss* spell IDs. That mapping is
hand-curated per boss.
**Destination:** new `server/data/encounters/{bossId}.json` —
`{spellId → mechanic}` maps (T3).

### q4 · How absorb shields appear — *Type A · T2 · ANSWERED*
**Settled by:** read real `SPELL_ABSORBED` lines.
**Answer:** `SPELL_ABSORBED` is its own event — 63,767 in the fixture.
Two forms:
- *spell* hit absorbed: `…attacker×4, target×4, damageSpellId,
  damageSpellName, damageSchool, absorbCaster×4, absorbSpellId,
  absorbSpellName, absorbSchool, absorbedAmount, totalAmount, critical`
- *melee* swing absorbed: identical **minus the damage-spell triplet**
  (a swing has no spell).

The shield provider is `absorbCasterGUID` → that is the external-CD
credit hook. `absorbSpellId` identifies the shield (real fixture:
Brambles `203953`, Ice Barrier `11426`). `absorbedAmount` is the
credited mitigation. Absorbs also appear as a trailing field on
`SPELL_DAMAGE`; the parser currently reads neither.
**Destination:** `server/derive/replay.mjs` (`pullEvents`) +
`choreography.mjs` (external-CD credit).

### q6 · Spec / role swap mid-raid — *Type A · T2 · ANSWERED*
**Settled by:** count + diff `COMBATANT_INFO`.
**Answer:** `COMBATANT_INFO` fires once per player at each
`ENCOUNTER_START` — 349 in the log across 19 encounters (~18/encounter).
It carries the player's current spec + talent string. A spec swap can't
happen mid-pull (no spec change in combat); it surfaces as a *changed*
spec field in a player's next-encounter `COMBATANT_INFO`. Detect by
diffing consecutive encounters per player.
**Destination:** `server/derive/identity.mjs` + `support.mjs` (swap as a
support action).

### q5 · Cancelled-channel detection — *Type A (shape) + C (threshold) · T2 · ANSWERED*
**Settled by:** grep real Tranquility + Penance sequences.
**Answer:**
- *True channel* (Tranquility `740`): bracketed by the caster's own
  `SPELL_AURA_APPLIED` → `SPELL_AURA_REMOVED` of the channel buff. Real
  fixture: Yserra `17:31:14.928 → 17:31:18.525` = **3.60 s**; Vermadruid
  = **4.77 s**. Cancelled-early = aura window shorter than the spellbook
  `durationSec`.
- *Multi-bolt* (Penance `47540`): `SPELL_CAST_SUCCESS` then 3 bolts as
  `SPELL_HEAL`/`SPELL_DAMAGE` under related IDs `47750 / 281469 /
  270501`. Cancelled = fewer than 3 bolts before the next cast.
- **Spellbook consequence:** one ability → many IDs. The schema needs
  `relatedIds[]`, and the gate must expect name collisions (see q1).

**Destination:** `server/derive/replay.mjs`. The "shorter than expected"
threshold is the Type-C residue — set it once `spellbook.json` carries
`durationSec`.

---

## Section 2 — Asks with a ground-truth gate (Type B)

### q1 · The spellbook table — *Type B · T2 · ✅ IMPLEMENTED*
**Done:** `server/data/spellbook.json` — 75 entries, each with `name,
class, category, isExternal, baseCooldownSec, durationSec, mitigation,
relatedIds?` plus gate fields `logHits / logName / verified`.
**Two reusable tools built:**
- `scripts/scan-spells.mjs` — streams a combat log, tallies every
  `spellId → {name, count}` (the log is the authority for current
  names/IDs). Ran over the 2.9M-line fixture: 2,357 distinct spell IDs.
- `scripts/build-spellbook.mjs` — joins a curated metadata table against
  that scan; `verified = logHits > 0`, by construction. Re-gating a new
  log is two commands.
**Gate result — 49 verified, 26 held `verified:false`.** The gate earned
its keep: of ~75 TWW-11.x IDs from `defensive-spell-list.js`, ~half had
**zero hits** in the Midnight 12.0.1 log. It caught 5 real ID drifts
(`498→403876`, `374348→374349`, Zephyr `370960/373254→374227`,
Healthstone `5512→6262`, Ice Block→`414658` Ice Cold) and 1 name error
(`432021` was curated "Potion of Unwavering Focus"; the log says "Flask
of Alchemical Chaos"). Healer raid CDs added with log-confirmed IDs +
`relatedIds` (Penance `47540` + 6 bolt IDs, Tranquility `740` + 3,
Divine Hymn, Spirit Link, Healing Tide, AMZ, Time Warp, Rallying Cry).
**The 26 unverified are kept, not deleted** — per the gate rule, a 0-hit
withholds confirmation but cannot condemn (the cluster — tank CDs, Holy
Paladin, Monk — reads as roster absence that night, not wrong IDs).
**Known gap:** healer CDs for classes absent from the gate log (Holy
Word: Salvation, Power Word: Barrier, Revival, Rewind, Flourish, Mana
Tide) are *not* added — their IDs would be unverified guesses. Add them
when a log containing those specs is scanned.

### q2 · Feast / cauldron / rune IDs — *Type B (IDs) + A (log shape) · T2 · ✅ IMPLEMENTED*
**Done — 2 gate-verified entries added to `spellbook.json` (`category: feast`):**
- **Provide:** `1232247` "Hearty Feast" — `SPELL_CAST_SUCCESS`, source = the
  player who dropped it, dest = nil (ground-placed, ~3 s cast). 2 placements
  in the gate log. This is the support-action signal — credit the source.
- **Consume:** `1232310` "Feast of Souls" — `SPELL_AURA_APPLIED`
  source=dest=self ≈ a player ate (~6 s). 2,873 in the gate log. The lasting
  result is a "Well Fed" buff (many variant IDs — the result, not the
  action; not enumerated).

**Not in the gate log:** no cauldron (none placed that night), no
current-tier Vantus Rune (only a stale "Vantus Rune: Vault of the
Incarnates"). Add when a log containing them is scanned — the rune pattern
is an aura named `Vantus Rune: <RaidName>`.
**Parser follow-up (blocks support.mjs):** the parser retains
`SpellCastSuccess` / `SpellAuraApplied` only for IDs in
`defensive-spell-list.js`. `1232247` / `1232310` are not in it, so feast
events are dropped before reaching the replay. Add them to the parser
retain-whitelist (2 lines, same pattern as q13) for support.mjs to see feasts.
**Destination:** `spellbook.json` (`category: feast`) + `server/derive/support.mjs`.

---

## Section 3 — Decisions needing a data view (Type C)

No external answer exists. Build the small derivation that surfaces the
real distribution, then Derek decides by looking.

### q3 · "Save" heuristic — *Type C · T2*
**Decision:** what counts as "a defensive prevented a death."
**Data view:** for every `UnitDied`, walk back ~6 s of `entityHp` (5 Hz)
+ incoming `SpellDamage` + active defensive auras; emit a ranked list of
*near-deaths* (survived a hit exceeding pre-hit HP) and *saves*
(near-death with a defensive active). Eyeball false positives against
the fixture's deaths.
**Decide:** the heuristic variant + HP-margin / window thresholds.
**Feeds:** `server/derive/replay.mjs`. Blocked on q13.

### q8 · Cohesion metric — *Type C · T2*
**Decision:** which "is the group stacked?" metric + yard thresholds.
**Data view:** compute mean-pairwise distance, RMS distance-to-centroid,
and max-spread for every frame of a few real pulls (denormalize via
`arenaYd`); plot all three over one pull.
**Decide:** the metric (recommended: RMS distance-to-centroid as the
scalar; max distance-to-centroid as a *separate* outlier signal) +
"stacked" (<~8 yd) / "spread" thresholds.
**Feeds:** `server/derive/cohesion.mjs`.

### q9 · Reaction time / first movement — *Type C · T2*
**Decision:** velocity threshold + smoothing window for "first real
lateral movement."
**Data view:** measure the position jitter of demonstrably-still players
in the real 5 Hz frames — that noise floor (inflated by the parser's
`resampleLerp` interpolation) sets the floor the threshold must clear.
**Decide:** velocity threshold > jitter floor, sustained ≥2–3 frames.
**Feeds:** movement math in `cohesion.mjs` / `replay.mjs`.

### q10 · Collapse detection — *Type C · T3 · ⚠️ PARTIAL (`server/derive/collapse.mjs`)*
**What works:** `classifyPullEnding()` reliably detects the *wipe* — a 7 s
death-cluster ≥ 5 deaths → `wipe`, else `none`. On the 19-pull fixture:
14 wipes, 5 kills.
**Called-vs-collapse is NOT solved — and the jump approach was wrong.** It
keyed on fall *bursts*; verified on the fixture, all **304 Falling events
are the survivable intermission knock-up mechanic** — 0 fatal (nearest
fall-to-death 1.9 s, median minutes). A real wipe-jump is a *fatal* fall
("you just die") and needs a reachable edge — Crown has none, so there are
**0 edge-jumps in the whole fixture**. Fall-burst detection therefore
detects the mechanic, not jumps; it is being removed (so are the 2 false
`called-wipe` verdicts and the per-boss `hasFallMechanic` flag).
**Real path:** the edge-independent **healer-disengage** tell — healers with
mana who suddenly stop casting — needs parser mana / heal-cadence capture.
Until then every mass death is honestly `wipe` (undetermined). A fatal-fall
jump detector is also viable but needs a log that actually contains
edge-jumps to build against; this fixture has none.
**Feeds:** `server/derive/scenarios.mjs`.

### q11 · External-CD-chain math — *Type C · T3*
**Decision:** what makes a cooldown chain "clean" — overlap, handoff gap
tolerance, what counts as a gap.
**Data view:** lay every defensive/external cast on one timeline per
pull (needs q1's spellbook + q13's retained casts); eyeball overlaps and
gaps.
**Decide:** handoff gap tolerance, the "clean" definition.
**Feeds:** `server/derive/choreography.mjs`.

---

**If only one thing:** q1, the spellbook — but gated. It is inert until
**q13** (the parser must retain heals/auras/absorbs first), so q13 is
the true first move. Order: q13 → run remaining probes → q1 (gated) →
build the Type-C data views.
