// Builds server/data/spellbook.json from a curated metadata table joined
// against the spell scan (scripts/spell-scan.json — produced by
// scan-spells.mjs). The scan is the ground-truth gate: logHits + logName
// come from real combat-log data, and `verified` is logHits > 0.
//
// Re-run after scanning a new log to re-gate every entry:
//   node scripts/scan-spells.mjs <newlog.txt> scripts/spell-scan.json
//   node scripts/build-spellbook.mjs
//
// See docs/research-strategy.md (the Type-B ground-truth gate) and
// docs/research-questions.md q1.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SCAN = join(here, 'spell-scan.json');
const OUT = join(here, '..', 'server', 'data', 'spellbook.json');

// Curated metadata. cat ∈ defensive-self | defensive-external | raid-cd |
// combat-rez | consumable | channel.  mit ∈ absorb | dr-pct | heal |
// immunity | redirect | reflect | utility | rez.  cd/dur in seconds —
// knowledge-sourced and APPROXIMATE (see meta.tuningCaveat).  ext = cast
// on another player.  related = sibling IDs of one ability (q5).
const CURATED = [
  // ── Death Knight ──────────────────────────────────────────────────
  { id: 48707, name: 'Anti-Magic Shell', cls: 'DeathKnight', cat: 'defensive-self', cd: 60, dur: 5, mit: 'absorb' },
  { id: 48792, name: 'Icebound Fortitude', cls: 'DeathKnight', cat: 'defensive-self', cd: 180, dur: 8, mit: 'dr-pct' },
  { id: 49039, name: 'Lichborne', cls: 'DeathKnight', cat: 'defensive-self', cd: 120, dur: 10, mit: 'immunity' },
  { id: 194679, name: 'Rune Tap', cls: 'DeathKnight', cat: 'defensive-self', cd: 25, dur: 3, mit: 'dr-pct' },
  { id: 219809, name: 'Tombstone', cls: 'DeathKnight', cat: 'defensive-self', cd: 60, dur: 8, mit: 'absorb' },
  { id: 55233, name: 'Vampiric Blood', cls: 'DeathKnight', cat: 'defensive-self', cd: 90, dur: 10, mit: 'heal' },
  { id: 51052, name: 'Anti-Magic Zone', cls: 'DeathKnight', cat: 'raid-cd', cd: 120, dur: 8, mit: 'absorb', related: [145629] },

  // ── Demon Hunter ──────────────────────────────────────────────────
  { id: 198589, name: 'Blur', cls: 'DemonHunter', cat: 'defensive-self', cd: 60, dur: 10, mit: 'dr-pct', related: [212800] },
  { id: 212800, name: 'Blur', cls: 'DemonHunter', cat: 'defensive-self', cd: 60, dur: 10, mit: 'dr-pct', related: [198589] },
  { id: 196555, name: 'Netherwalk', cls: 'DemonHunter', cat: 'defensive-self', cd: 180, dur: 5, mit: 'immunity' },
  { id: 209426, name: 'Darkness', cls: 'DemonHunter', cat: 'defensive-self', cd: 300, dur: 8, mit: 'dr-pct', related: [196718] },
  { id: 196718, name: 'Darkness', cls: 'DemonHunter', cat: 'raid-cd', cd: 300, dur: 8, mit: 'dr-pct', related: [209426] },

  // ── Druid ─────────────────────────────────────────────────────────
  { id: 22812, name: 'Barkskin', cls: 'Druid', cat: 'defensive-self', cd: 60, dur: 8, mit: 'dr-pct' },
  { id: 61336, name: 'Survival Instincts', cls: 'Druid', cat: 'defensive-self', cd: 180, dur: 6, mit: 'dr-pct' },
  { id: 102342, name: 'Ironbark', cls: 'Druid', cat: 'defensive-external', ext: true, cd: 90, dur: 12, mit: 'dr-pct' },
  { id: 108238, name: 'Renewal', cls: 'Druid', cat: 'defensive-self', cd: 90, dur: 0, mit: 'heal' },
  { id: 740, name: 'Tranquility', cls: 'Druid', cat: 'raid-cd', cd: 180, dur: 8, mit: 'heal', related: [1264659, 157982, 1264623],
    note: 'channelled raid heal; q5 channel-cancellation = self-aura window vs durationSec' },

  // ── Evoker ────────────────────────────────────────────────────────
  { id: 363916, name: 'Obsidian Scales', cls: 'Evoker', cat: 'defensive-self', cd: 90, dur: 12, mit: 'dr-pct' },
  { id: 374349, name: 'Renewing Blaze', cls: 'Evoker', cat: 'defensive-self', cd: 90, dur: 8, mit: 'heal',
    note: 'TWW id 374348 not in gate log; 374349 is the form present (drift)' },
  { id: 374227, name: 'Zephyr', cls: 'Evoker', cat: 'raid-cd', cd: 120, dur: 8, mit: 'dr-pct',
    note: 'TWW ids 370960 / 373254 not in gate log; 374227 is the form present (drift)' },

  // ── Hunter ────────────────────────────────────────────────────────
  { id: 186265, name: 'Aspect of the Turtle', cls: 'Hunter', cat: 'defensive-self', cd: 180, dur: 8, mit: 'immunity' },
  { id: 5384, name: 'Feign Death', cls: 'Hunter', cat: 'defensive-self', cd: 30, dur: 0, mit: 'utility' },
  { id: 264735, name: 'Survival of the Fittest', cls: 'Hunter', cat: 'defensive-self', cd: 180, dur: 6, mit: 'dr-pct' },

  // ── Mage ──────────────────────────────────────────────────────────
  { id: 45438, name: 'Ice Block', cls: 'Mage', cat: 'defensive-self', cd: 240, dur: 10, mit: 'immunity' },
  { id: 414658, name: 'Ice Cold', cls: 'Mage', cat: 'defensive-self', cd: 240, dur: 10, mit: 'immunity', related: [45438],
    note: 'Frost talent variant of Ice Block (45438) — the form present in the gate log' },
  { id: 342246, name: 'Alter Time', cls: 'Mage', cat: 'defensive-self', cd: 60, dur: 0, mit: 'utility' },
  { id: 110959, name: 'Greater Invisibility', cls: 'Mage', cat: 'defensive-self', cd: 120, dur: 20, mit: 'dr-pct' },
  { id: 80353, name: 'Time Warp', cls: 'Mage', cat: 'raid-cd', cd: 300, dur: 40, mit: 'utility' },

  // ── Monk ──────────────────────────────────────────────────────────
  { id: 122783, name: 'Diffuse Magic', cls: 'Monk', cat: 'defensive-self', cd: 90, dur: 6, mit: 'dr-pct' },
  { id: 122278, name: 'Dampen Harm', cls: 'Monk', cat: 'defensive-self', cd: 120, dur: 10, mit: 'dr-pct' },
  { id: 115203, name: 'Fortifying Brew', cls: 'Monk', cat: 'defensive-self', cd: 360, dur: 15, mit: 'dr-pct' },
  { id: 116849, name: 'Life Cocoon', cls: 'Monk', cat: 'defensive-external', ext: true, cd: 120, dur: 12, mit: 'absorb' },

  // ── Paladin ───────────────────────────────────────────────────────
  { id: 642, name: 'Divine Shield', cls: 'Paladin', cat: 'defensive-self', cd: 300, dur: 8, mit: 'immunity' },
  { id: 403876, name: 'Divine Protection', cls: 'Paladin', cat: 'defensive-self', cd: 60, dur: 8, mit: 'dr-pct',
    note: 'TWW id 498 not in gate log; 403876 is the form present (drift)' },
  { id: 31850, name: 'Ardent Defender', cls: 'Paladin', cat: 'defensive-self', cd: 120, dur: 8, mit: 'dr-pct' },
  { id: 86659, name: 'Guardian of Ancient Kings', cls: 'Paladin', cat: 'defensive-self', cd: 300, dur: 8, mit: 'dr-pct' },
  { id: 1022, name: 'Blessing of Protection', cls: 'Paladin', cat: 'defensive-external', ext: true, cd: 300, dur: 10, mit: 'immunity' },
  { id: 6940, name: 'Blessing of Sacrifice', cls: 'Paladin', cat: 'defensive-external', ext: true, cd: 120, dur: 12, mit: 'redirect' },
  { id: 31821, name: 'Aura Mastery', cls: 'Paladin', cat: 'raid-cd', cd: 180, dur: 8, mit: 'dr-pct' },

  // ── Priest ────────────────────────────────────────────────────────
  { id: 47585, name: 'Dispersion', cls: 'Priest', cat: 'defensive-self', cd: 90, dur: 6, mit: 'dr-pct' },
  { id: 586, name: 'Fade', cls: 'Priest', cat: 'defensive-self', cd: 30, dur: 10, mit: 'utility' },
  { id: 19236, name: 'Desperate Prayer', cls: 'Priest', cat: 'defensive-self', cd: 90, dur: 0, mit: 'heal' },
  { id: 47788, name: 'Guardian Spirit', cls: 'Priest', cat: 'defensive-external', ext: true, cd: 180, dur: 10, mit: 'heal',
    note: 'external-only — prevents one lethal hit; corrected from a personal+external double-tag in defensive-spell-list.js' },
  { id: 33206, name: 'Pain Suppression', cls: 'Priest', cat: 'defensive-external', ext: true, cd: 180, dur: 8, mit: 'dr-pct' },
  { id: 47540, name: 'Penance', cls: 'Priest', cat: 'channel', cd: 9, dur: 2, mit: 'heal', related: [270501, 281469, 47750, 47666, 1232567, 1232571],
    note: 'channelled; bolt sub-IDs in relatedIds — tracked for q5 channel-cancellation, not a defensive' },
  { id: 64843, name: 'Divine Hymn', cls: 'Priest', cat: 'raid-cd', cd: 180, dur: 8, mit: 'heal', related: [64844] },

  // ── Rogue ─────────────────────────────────────────────────────────
  { id: 31224, name: 'Cloak of Shadows', cls: 'Rogue', cat: 'defensive-self', cd: 120, dur: 5, mit: 'immunity' },
  { id: 5277, name: 'Evasion', cls: 'Rogue', cat: 'defensive-self', cd: 120, dur: 10, mit: 'dr-pct' },
  { id: 1966, name: 'Feint', cls: 'Rogue', cat: 'defensive-self', cd: 15, dur: 6, mit: 'dr-pct' },
  { id: 185311, name: 'Crimson Vial', cls: 'Rogue', cat: 'defensive-self', cd: 25, dur: 0, mit: 'heal' },

  // ── Shaman ────────────────────────────────────────────────────────
  { id: 108271, name: 'Astral Shift', cls: 'Shaman', cat: 'defensive-self', cd: 90, dur: 8, mit: 'dr-pct' },
  { id: 30823, name: 'Shamanistic Rage', cls: 'Shaman', cat: 'defensive-self', cd: 60, dur: 15, mit: 'dr-pct' },
  { id: 378987, name: 'Ancestral Protection', cls: 'Shaman', cat: 'defensive-self', cd: 120, dur: 0, mit: 'heal',
    note: 'curated ID unconfirmed by gate — revalidate against a log with a Shaman' },
  { id: 98008, name: 'Spirit Link Totem', cls: 'Shaman', cat: 'raid-cd', cd: 180, dur: 6, mit: 'redirect', related: [325174] },
  { id: 108280, name: 'Healing Tide Totem', cls: 'Shaman', cat: 'raid-cd', cd: 180, dur: 10, mit: 'heal' },

  // ── Warlock ───────────────────────────────────────────────────────
  { id: 104773, name: 'Unending Resolve', cls: 'Warlock', cat: 'defensive-self', cd: 180, dur: 8, mit: 'dr-pct' },
  { id: 108416, name: 'Dark Pact', cls: 'Warlock', cat: 'defensive-self', cd: 60, dur: 20, mit: 'absorb' },
  { id: 6229, name: 'Shadow Ward', cls: 'Warlock', cat: 'defensive-self', cd: 30, dur: 30, mit: 'absorb' },
  { id: 212295, name: 'Nether Ward', cls: 'Warlock', cat: 'defensive-self', cd: 45, dur: 3, mit: 'reflect' },

  // ── Warrior ───────────────────────────────────────────────────────
  { id: 118038, name: 'Die by the Sword', cls: 'Warrior', cat: 'defensive-self', cd: 120, dur: 8, mit: 'dr-pct' },
  { id: 871, name: 'Shield Wall', cls: 'Warrior', cat: 'defensive-self', cd: 210, dur: 8, mit: 'dr-pct' },
  { id: 23920, name: 'Spell Reflection', cls: 'Warrior', cat: 'defensive-self', cd: 25, dur: 5, mit: 'reflect' },
  { id: 12975, name: 'Last Stand', cls: 'Warrior', cat: 'defensive-self', cd: 180, dur: 15, mit: 'heal' },
  { id: 184364, name: 'Enraged Regeneration', cls: 'Warrior', cat: 'defensive-self', cd: 120, dur: 8, mit: 'heal' },
  { id: 97462, name: 'Rallying Cry', cls: 'Warrior', cat: 'raid-cd', cd: 180, dur: 10, mit: 'heal', related: [97463],
    note: 'raid max-health buff; 97463 is the applied aura' },

  // ── Combat resurrections ──────────────────────────────────────────
  { id: 20484, name: 'Rebirth', cls: 'Druid', cat: 'combat-rez', cd: 600, dur: null, mit: 'rez' },
  { id: 20707, name: 'Soulstone', cls: 'Warlock', cat: 'combat-rez', cd: null, dur: null, mit: 'rez' },
  { id: 61999, name: 'Raise Ally', cls: 'DeathKnight', cat: 'combat-rez', cd: 600, dur: null, mit: 'rez' },
  { id: 159916, name: 'Reawaken', cls: 'Evoker', cat: 'combat-rez', cd: 600, dur: null, mit: 'rez' },

  // ── Death-state marker (q10 — collapse detection) ─────────────────
  { id: 27827, name: 'Spirit of Redemption', cls: 'Priest', cat: 'death-marker', cd: null, dur: 15, mit: null,
    note: 'Holy Priest ghost form entered on death — a "soft death" / legitimate wipe survivor. Retained so q10 collapse detection tells it apart from a real death.' },

  // ── Consumables ───────────────────────────────────────────────────
  { id: 6262, name: 'Healthstone', cls: null, cat: 'consumable', cd: null, dur: 0, mit: 'heal',
    note: 'TWW id 5512 is Create Healthstone; 6262 is the consumed effect that appears in logs (drift)' },
  { id: 432021, name: 'Flask of Alchemical Chaos', cls: null, cat: 'consumable', cd: null, dur: null, mit: 'utility',
    note: 'curated in defensive-spell-list.js as "Potion of Unwavering Focus" — log name corrected by gate' },
  { id: 431932, name: 'Tempered Potion', cls: null, cat: 'consumable', cd: null, dur: 0, mit: 'utility' },
  { id: 432055, name: 'Aerated Mana Potion', cls: null, cat: 'consumable', cd: null, dur: 0, mit: 'utility' },
  { id: 442115, name: 'Algari Healing Potion', cls: null, cat: 'consumable', cd: null, dur: 0, mit: 'heal' },
  { id: 442116, name: 'Algari Mana Potion', cls: null, cat: 'consumable', cd: null, dur: 0, mit: 'utility' },

  // ── Feast — support actions (q2) ──────────────────────────────────
  { id: 1232247, name: 'Hearty Feast', cls: null, cat: 'feast', cd: null, dur: null, mit: 'utility',
    note: 'PROVIDE signal — SPELL_CAST_SUCCESS source = the player who dropped the feast (dest is nil, ground-placed; ~3s cast). support.mjs credits the source as a support action. NOTE: not in the parser retain-whitelist yet — see q2 in research-questions.md.' },
  { id: 1232310, name: 'Feast of Souls', cls: null, cat: 'feast', cd: null, dur: 6, mit: 'utility',
    note: 'CONSUME signal — SPELL_AURA_APPLIED source=dest=self ≈ a player ate (~6s). The lasting stat buff is "Well Fed" (many variant IDs, not enumerated). No cauldron or current-tier Vantus Rune appeared in the gate log.' },
];

const scan = JSON.parse(readFileSync(SCAN, 'utf8'));

const spells = {};
let verified = 0;
const unverified = [];
const mismatches = [];

for (const s of CURATED) {
  const hit = scan[String(s.id)];
  const logHits = hit ? hit.count : 0;
  const logName = hit ? hit.name : null;
  const ok = logHits > 0;
  if (ok) verified++; else unverified.push(`${s.id} ${s.name} (${s.cls ?? 'item'})`);
  if (logName && logName !== s.name) {
    mismatches.push(`${s.id}: curated "${s.name}" vs log "${logName}"`);
  }
  spells[String(s.id)] = {
    name: s.name,
    class: s.cls ?? null,
    category: s.cat,
    isExternal: !!s.ext,
    baseCooldownSec: s.cd ?? null,
    durationSec: s.dur ?? null,
    mitigation: s.mit ?? null,
    ...(s.related ? { relatedIds: s.related } : {}),
    logHits,
    logName,
    verified: ok,
    ...(s.note ? { note: s.note } : {}),
  };
}

const doc = {
  meta: {
    description:
      'Curated WoW defensive / external / raid-cooldown / consumable / feast ' +
      'spell lookup for Lantern T2 classification. Keyed by spellId (string).',
    schema:
      'spellId -> { name, class, category, isExternal, baseCooldownSec, ' +
      'durationSec, mitigation, relatedIds?, logHits, logName, verified, note? }',
    groundTruth: {
      tool: 'scripts/scan-spells.mjs + scripts/build-spellbook.mjs',
      gateLog:
        'raidui/fixtures/real/WoWCombatLog.txt — build 12.0.1, 2026-04-18, ' +
        'one 20-player raid night',
      rule:
        'verified=true iff the ID occurs in the gate log (logHits>0). ' +
        'verified=false means the ID was NOT seen — it may be wrong or ' +
        'drifted, OR the class/spec was simply absent that night. A 0-hit ' +
        'withholds confirmation; it cannot condemn an ID. Re-gate against ' +
        'more logs to retire false negatives.',
    },
    tuningCaveat:
      'baseCooldownSec / durationSec are knowledge-sourced and APPROXIMATE ' +
      '— they drift with balance patches. A domain pass should confirm them.',
    drift:
      'Several TWW 11.x IDs from raidui/src/parser/defensive-spell-list.js ' +
      'did not appear in a Midnight 12.0.1 log. Where the gate found the ' +
      'spell under a new ID, the entry uses the new ID and carries a note.',
  },
  generatedAt: new Date().toISOString(),
  spells,
};

writeFileSync(OUT, JSON.stringify(doc, null, 2) + '\n');

console.log(`spellbook: ${CURATED.length} entries → ${OUT}`);
console.log(`  verified (logHits>0): ${verified}`);
console.log(`  unverified (0 hits) : ${unverified.length}`);
for (const u of unverified) console.log(`    - ${u}`);
if (mismatches.length) {
  console.log(`  NAME MISMATCHES (gate caught — fix curated table):`);
  for (const m of mismatches) console.log(`    ! ${m}`);
} else {
  console.log(`  name mismatches: none`);
}
