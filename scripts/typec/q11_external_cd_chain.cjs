// q11 — External-CD chain DATA VIEW.
//
// Question: how do external defensive cooldowns chain across a pull? Before
// designing a "coverage chain" metric we surface the raw overlap/gap stats
// between consecutive external casts. No threshold is decided here.
//
// External spells = spellbook.json entries with isExternal:true:
//   1022 Blessing of Protection, 6940 Blessing of Sacrifice,
//   33206 Pain Suppression, 47788 Guardian Spirit,
//   102342 Ironbark, 116849 Life Cocoon.
//
// For each pull we build a timeline of external "applications" from
// SpellAuraApplied (the moment the external lands on a target). Each gets a
// window [applyMs, removeMs] from the matching SpellAuraRemoved; unclosed
// auras run to pull end. We also report SpellCastSuccess counts for the same
// spell ids as a cross-check (cast != landed-aura when target was immune,
// but for externals they should track closely).
//
// Then, ordering applications by start time, we compute the GAP or OVERLAP
// between each consecutive pair:
//   - overlap  : next external starts before the previous one ended.
//   - gap      : next external starts after the previous one ended (uncovered).
// Reported as a distribution, per-pull and pooled.

const S = require('./_shared.cjs');
const fs = require('fs');

function loadExternalSpells() {
  const sb = JSON.parse(fs.readFileSync('D:/work/lantern/server/data/spellbook.json', 'utf8'));
  const map = new Map();
  for (const [k, v] of Object.entries(sb.spells)) {
    if (v && v.isExternal === true) map.set(Number(k), v.name || k);
  }
  return map;
}

// External aura applications with [t0,t1] windows.
function externalApplications(replay, extMap) {
  const open = new Map();    // target|spell -> {t0, name, source}
  const apps = [];
  const dur = S.durationMs(replay);
  for (const ev of (replay.events || [])) {
    if (ev.pullTimeMs == null) continue;
    if (ev.eventKind === 'SpellAuraApplied' && extMap.has(ev.spellId)) {
      open.set(ev.targetEntityId + '|' + ev.spellId, {
        t0: ev.pullTimeMs, name: extMap.get(ev.spellId),
        source: ev.sourceEntityId, spellId: ev.spellId, target: ev.targetEntityId,
      });
    } else if (ev.eventKind === 'SpellAuraRemoved' && extMap.has(ev.spellId)) {
      const key = ev.targetEntityId + '|' + ev.spellId;
      const o = open.get(key);
      if (o) {
        apps.push({ ...o, t1: ev.pullTimeMs });
        open.delete(key);
      }
    }
  }
  for (const [, o] of open) apps.push({ ...o, t1: dur });
  apps.sort((a, b) => a.t0 - b.t0);
  return apps;
}

function main() {
  const extMap = loadExternalSpells();
  const replays = S.loadAllFresh();
  console.log('=== q11 External-CD chain — DATA VIEW ===');
  console.log(`fresh pulls: ${replays.length}`);
  console.log(`external spells (isExternal:true): ` +
    [...extMap.entries()].map(([id, n]) => `${id} ${n}`).join(', '));
  console.log('');

  const allGaps = [];        // consecutive gaps (ms) — positive = uncovered
  const allOverlaps = [];    // consecutive overlaps (ms) — positive = stacked
  const perPull = [];
  let totalCasts = 0, totalApps = 0;

  for (const r of replays) {
    // SpellCastSuccess cross-check
    let casts = 0;
    for (const ev of (r.events || [])) {
      if (ev.eventKind === 'SpellCastSuccess' && extMap.has(ev.spellId)) casts++;
    }
    const apps = externalApplications(r, extMap);
    totalCasts += casts; totalApps += apps.length;

    // consecutive deltas, ordered by start
    const gaps = [], overlaps = [];
    for (let i = 1; i < apps.length; i++) {
      const prevEnd = apps[i - 1].t1;
      const curStart = apps[i].t0;
      const delta = curStart - prevEnd;   // >0 gap, <0 overlap
      if (delta >= 0) { gaps.push(delta); allGaps.push(delta); }
      else { overlaps.push(-delta); allOverlaps.push(-delta); }
    }
    perPull.push({
      file: r._file.slice(0, 8), boss: r.bossName,
      durSec: (S.durationMs(r) / 1000).toFixed(0),
      casts, apps: apps.length,
      overlaps: overlaps.length, gaps: gaps.length,
      timeline: apps,
    });
  }

  console.log('--- per-pull external timeline summary ---');
  for (const p of perPull) {
    console.log(`  ${p.file} ${(p.boss || '?').padEnd(26)} dur=${String(p.durSec).padStart(3)}s ` +
      `casts=${String(p.casts).padStart(2)} auraApps=${String(p.apps).padStart(2)} ` +
      `consecutive: overlaps=${p.overlaps} gaps=${p.gaps}`);
  }
  console.log('');
  console.log(`pooled: external SpellCastSuccess=${totalCasts}, ` +
    `external SpellAuraApplied(landed)=${totalApps}`);
  console.log('');

  console.log('--- gap between consecutive externals (ms) — uncovered interval ---');
  S.printSummary('gap ms', allGaps);
  const gapBuckets = bucketize(allGaps, [0, 1000, 3000, 5000, 10000, 20000, 40000]);
  printBuckets('gap', gapBuckets);
  console.log('');
  console.log('--- overlap between consecutive externals (ms) — stacked interval ---');
  S.printSummary('overlap ms', allOverlaps);
  const ovBuckets = bucketize(allOverlaps, [0, 1000, 2000, 4000, 6000, 10000]);
  printBuckets('overlap', ovBuckets);
  console.log('');

  // Show a couple of full timelines so the chain is visible.
  console.log('--- example timelines (3 pulls with the most externals) ---');
  const byApps = perPull.slice().sort((a, b) => b.apps - a.apps).slice(0, 3);
  for (const p of byApps) {
    console.log(`  ${p.file} ${p.boss} (${p.apps} external applications):`);
    for (const a of p.timeline) {
      console.log(`    ${(a.t0 / 1000).toFixed(1).padStart(7)}s -> ${(a.t1 / 1000).toFixed(1).padStart(7)}s ` +
        `[${((a.t1 - a.t0) / 1000).toFixed(1)}s]  ${a.name}`);
    }
  }
  console.log('');
  console.log('NOTE: "consecutive" pairs externals by START order regardless of who');
  console.log('cast/received them — this is the raw pull-wide chain. A per-target or');
  console.log('per-caster chain would partition differently; not done here. The gap/');
  console.log('overlap numbers are observed, not chosen.');

  function bucketize(arr, edges) {
    const b = {};
    for (const v of arr) {
      let l = `>${edges[edges.length - 1]}`;
      for (let i = 0; i < edges.length; i++) {
        if (i === 0 && v <= edges[0]) { l = `<=${edges[0]}`; break; }
        if (v > edges[i - 1] && v <= edges[i]) { l = `${edges[i - 1]}-${edges[i]}`; break; }
      }
      b[l] = (b[l] || 0) + 1;
    }
    return { b, edges };
  }
  function printBuckets(label, { b, edges }) {
    console.log(`  ${label} buckets (ms):`);
    const order = [`<=${edges[0]}`];
    for (let i = 1; i < edges.length; i++) order.push(`${edges[i - 1]}-${edges[i]}`);
    order.push(`>${edges[edges.length - 1]}`);
    for (const k of order) console.log(`    ${k.padStart(14)} | ${String(b[k] || 0).padStart(4)}`);
  }
}

main();
