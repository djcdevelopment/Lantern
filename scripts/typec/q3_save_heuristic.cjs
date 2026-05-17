// q3 — Save-heuristic DATA VIEW.
//
// Question: a "save" is when a player was about to die and a defensive /
// external pulled them back. Before designing that heuristic we surface
// how often the raw ingredients co-occur near deaths and near recoveries.
// No heuristic is finalized here.
//
// For EVERY player UnitDied we look back LOOKBACK_MS (~6s) at that entity's:
//   - entityHp track  -> was there a near-death dip BEFORE the fatal one?
//   - incoming SpellDamage -> burst leading into the death
//   - active defensive auras (SpellAuraApplied without a matching Removed,
//     spellId in the spellbook defensive set) overlapping the window.
//
// We also scan for the "save" SHAPE on the HP track of survivors: a frame
// where HP fell <= NEARDEATH_HP_FRAC then rose back >= RECOVER_HP_FRAC
// within RECOVER_MS, with a defensive aura active during the dip. These are
// surfaced as CANDIDATE save events — not a finalized rule.
//
// Constants here are MEASUREMENT KNOBS (lookback window, what HP fraction
// counts as "near death"); they are reported, not presented as the answer.

const S = require('./_shared.cjs');
const fs = require('fs');

const LOOKBACK_MS = 6000;
const NEARDEATH_HP_FRAC = 0.20;   // HP at/below this = "near death" dip
const RECOVER_HP_FRAC = 0.50;     // HP back at/above this = "recovered"
const RECOVER_MS = 4000;          // dip -> recovery must happen within this

// Defensive spell ids from the lantern spellbook (all defensive-* categories
// + raid-cd). Loaded live so the set is not hand-copied.
function loadDefensiveSpellIds() {
  const sb = JSON.parse(fs.readFileSync('D:/work/lantern/server/data/spellbook.json', 'utf8'));
  const ids = new Set();
  for (const [k, v] of Object.entries(sb.spells)) {
    if (v && /defensive/.test(v.category || '')) ids.add(Number(k));
    if (v && v.category === 'raid-cd') ids.add(Number(k));
  }
  return ids;
}

// Build per-entity intervals when a defensive aura is active.
// SpellAuraApplied .. matching SpellAuraRemoved (same target+spellId).
function defensiveAuraIntervals(replay, defIds) {
  const open = new Map();   // key target|spell -> applyMs
  const intervals = [];     // {target, spellId, spellName, t0, t1}
  for (const ev of (replay.events || [])) {
    if (ev.pullTimeMs == null) continue;
    if (ev.eventKind === 'SpellAuraApplied') {
      if (!defIds.has(ev.spellId)) continue;
      open.set(ev.targetEntityId + '|' + ev.spellId,
        { t0: ev.pullTimeMs, spellName: ev.spellName });
    } else if (ev.eventKind === 'SpellAuraRemoved') {
      const key = ev.targetEntityId + '|' + ev.spellId;
      const o = open.get(key);
      if (o) {
        intervals.push({ target: ev.targetEntityId, spellId: ev.spellId,
          spellName: o.spellName, t0: o.t0, t1: ev.pullTimeMs });
        open.delete(key);
      }
    }
  }
  // Unclosed auras: treat as lasting to end of pull.
  const dur = S.durationMs(replay);
  for (const [key, o] of open) {
    const [target, spellId] = key.split('|');
    intervals.push({ target, spellId: Number(spellId), spellName: o.spellName,
      t0: o.t0, t1: dur });
  }
  return intervals;
}

function frameIdxForMs(replay, t) {
  const step = replay.frameStepMs || 200;
  let fi = Math.round(t / step);
  if (fi < 0) fi = 0;
  if (fi > replay.frames.length - 1) fi = replay.frames.length - 1;
  return fi;
}

function main() {
  const defIds = loadDefensiveSpellIds();
  const replays = S.loadAllFresh();
  console.log('=== q3 Save heuristic — DATA VIEW ===');
  console.log(`fresh pulls: ${replays.length} | defensive spell ids in scope: ${defIds.size}`);
  console.log(`measurement knobs: LOOKBACK_MS=${LOOKBACK_MS}, NEARDEATH_HP_FRAC=${NEARDEATH_HP_FRAC}, ` +
    `RECOVER_HP_FRAC=${RECOVER_HP_FRAC}, RECOVER_MS=${RECOVER_MS}`);
  console.log('');

  let totalDeaths = 0;
  let deathsWithPriorDip = 0;        // a separate near-death dip earlier in the window that recovered
  let deathsWithDefActive = 0;       // a defensive aura active at/within window of the death
  let deathsWithIncomingBurst = 0;   // >=1 incoming SpellDamage in last 2s
  const incomingDmgCounts = [];      // # incoming damage events in lookback per death
  const candidateSaves = [];         // recovery shapes on survivors

  for (const r of replays) {
    const entByIdx = {};
    const idxByEnt = {};
    for (let i = 0; i < r.entities.length; i++) {
      entByIdx[i] = r.entities[i];
      idxByEnt[r.entities[i].entityId] = i;
    }
    const auraIv = defensiveAuraIntervals(r, defIds);
    const deaths = S.playerDeathTimes(r);

    // incoming damage index: targetEntityId -> sorted [{t,amount}]
    const dmgByTarget = {};
    for (const ev of (r.events || [])) {
      if (ev.eventKind !== 'SpellDamage') continue;
      if (ev.pullTimeMs == null) continue;
      (dmgByTarget[ev.targetEntityId] || (dmgByTarget[ev.targetEntityId] = []))
        .push({ t: ev.pullTimeMs, amount: ev.amount || 0 });
    }

    for (const d of deaths) {
      totalDeaths++;
      const winLo = d.t - LOOKBACK_MS;
      const idx = idxByEnt[d.entityId];

      // incoming damage in window
      const dmg = (dmgByTarget[d.entityId] || []).filter(x => x.t >= winLo && x.t <= d.t);
      incomingDmgCounts.push(dmg.length);
      if (dmg.some(x => x.t >= d.t - 2000)) deathsWithIncomingBurst++;

      // defensive aura active anywhere in window
      const defActive = auraIv.some(iv => iv.target === d.entityId &&
        iv.t1 >= winLo && iv.t0 <= d.t);
      if (defActive) deathsWithDefActive++;

      // prior near-death dip that recovered, BEFORE the fatal blow
      if (idx != null && r.frames[0].entityHp) {
        const fLo = frameIdxForMs(r, winLo);
        const fHi = frameIdxForMs(r, d.t);
        let sawDip = false, recovered = false;
        for (let f = fLo; f <= fHi; f++) {
          const hp = r.frames[f].entityHp ? r.frames[f].entityHp[idx] : null;
          if (hp == null) continue;
          if (!sawDip && hp > 0 && hp <= NEARDEATH_HP_FRAC) sawDip = true;
          else if (sawDip && !recovered && hp >= RECOVER_HP_FRAC) recovered = true;
        }
        if (sawDip && recovered) deathsWithPriorDip++;
      }
    }

    // CANDIDATE saves on SURVIVORS: HP dip <= NEARDEATH then >= RECOVER within
    // RECOVER_MS, with a defensive aura active during the dip frame.
    if (r.frames[0] && r.frames[0].entityHp) {
      const players = S.playerInfo(r);
      const diedSet = new Set(deaths.map(x => x.entityId));
      const step = r.frameStepMs || 200;
      for (const p of players) {
        const idx = p.idx;
        for (let f = 1; f < r.frames.length; f++) {
          const hp = r.frames[f].entityHp ? r.frames[f].entityHp[idx] : null;
          const prev = r.frames[f - 1].entityHp ? r.frames[f - 1].entityHp[idx] : null;
          if (hp == null || prev == null) continue;
          // entering a near-death dip this frame
          if (prev > NEARDEATH_HP_FRAC && hp <= NEARDEATH_HP_FRAC && hp > 0) {
            const dipMs = r.frames[f].t;
            // recovery within RECOVER_MS
            const fEnd = frameIdxForMs(r, dipMs + RECOVER_MS);
            let recMs = null;
            for (let g = f + 1; g <= fEnd; g++) {
              const h = r.frames[g].entityHp ? r.frames[g].entityHp[idx] : null;
              if (h != null && h >= RECOVER_HP_FRAC) { recMs = r.frames[g].t; break; }
              if (h != null && h <= 0) break; // died instead
            }
            if (recMs != null) {
              const defActive = defensiveAuraIntervals(r, defIds)
                .some(iv => iv.target === p.entity.entityId &&
                  iv.t0 <= dipMs + 1000 && iv.t1 >= dipMs - 1000);
              candidateSaves.push({
                pull: r._file.slice(0, 8), boss: r.bossName,
                player: (p.entity.displayName || '').split('-')[0],
                role: p.entity.role, dipMs, recMs, recoverSec: ((recMs - dipMs) / 1000).toFixed(1),
                defensiveActive: defActive,
              });
            }
          }
        }
      }
    }
  }

  console.log('--- co-occurrence near deaths (pooled, all fresh pulls) ---');
  console.log(`  total player deaths: ${totalDeaths}`);
  pct('deaths with a prior near-death dip THEN recovery in the 6s window', deathsWithPriorDip, totalDeaths);
  pct('deaths with a defensive aura active in/near the 6s window', deathsWithDefActive, totalDeaths);
  pct('deaths with an incoming damage burst in the last 2s', deathsWithIncomingBurst, totalDeaths);
  console.log('');
  S.printSummary('incoming SpellDamage events per death (6s lookback)', incomingDmgCounts);
  console.log('');

  console.log(`--- candidate SAVE events on survivors (HP dip<=${NEARDEATH_HP_FRAC} -> ` +
    `recover>=${RECOVER_HP_FRAC} within ${RECOVER_MS}ms) ---`);
  console.log(`  total candidates: ${candidateSaves.length}`);
  const withDef = candidateSaves.filter(c => c.defensiveActive).length;
  pct('  ...with a defensive aura active during the dip', withDef, candidateSaves.length);
  S.printSummary('recovery time dip->recover (sec)', candidateSaves.map(c => Number(c.recoverSec)));
  console.log('  first 20 candidates:');
  for (const c of candidateSaves.slice(0, 20)) {
    console.log(`    ${c.pull} ${(c.boss || '?').slice(0, 20).padEnd(20)} ${(c.player || '?').padEnd(14)} ` +
      `${(c.role || '?').padEnd(10)} dip@${(c.dipMs / 1000).toFixed(1)}s recover=${c.recoverSec}s ` +
      `${c.defensiveActive ? 'DEFENSIVE-ACTIVE' : ''}`);
  }
  console.log('');
  console.log('NOTE: "candidate save" here is the recovery SHAPE only. Whether a given');
  console.log('recovery was caused by a defensive vs. raw healing is not resolved — the');
  console.log('defensiveActive flag is co-occurrence, not causation. No heuristic is');
  console.log('finalized; this is the raw distribution for a human to design against.');

  function pct(label, num, den) {
    const p = den > 0 ? (100 * num / den).toFixed(1) : '0.0';
    console.log(`  ${label}: ${num} / ${den} (${p}%)`);
  }
}

main();
