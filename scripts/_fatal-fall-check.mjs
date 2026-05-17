// Throwaway: across all fresh pulls, how close does a Falling event sit to
// the faller's OWN death? Derek's rule — a real edge-jump kills you outright,
// so an edge-jump shows as a near-zero gap; the survivable knock-up mechanic
// shows as a large gap (or no death at all).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] || 'D:/work/raidui/out-fresh/pulls';
const gaps = [];
let fallTotal = 0, fatal = 0, noDeath = 0;

for (const f of readdirSync(dir).filter(x => x.endsWith('.replay.json'))) {
  const r = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const deathsBy = new Map();
  for (const ev of r.events || []) {
    if (ev.eventKind === 'UnitDied' && ev.pullTimeMs != null) {
      const a = deathsBy.get(ev.targetEntityId) || [];
      a.push(ev.pullTimeMs);
      deathsBy.set(ev.targetEntityId, a);
    }
  }
  for (const ev of r.events || []) {
    if (ev.eventKind !== 'EnvironmentalDamage') continue;
    if (ev.extra?.environmentalType !== 'Falling') continue;
    fallTotal++;
    const after = (deathsBy.get(ev.targetEntityId) || [])
      .filter(t => t >= ev.pullTimeMs).sort((a, b) => a - b);
    if (after.length === 0) { noDeath++; continue; }
    const gap = after[0] - ev.pullTimeMs;
    gaps.push(gap);
    if (gap <= 1000) fatal++;
  }
}

gaps.sort((a, b) => a - b);
const q = p => (gaps.length ? gaps[Math.floor(p * (gaps.length - 1))] : null);
console.log(`Falling events: ${fallTotal}`);
console.log(`  the faller never dies afterward (survived): ${noDeath}`);
console.log(`  the faller dies later: ${gaps.length}`);
console.log(`  gap fall -> that player's next death (ms): ` +
  `min=${gaps[0]} p10=${q(0.1)} p50=${q(0.5)} p90=${q(0.9)} max=${gaps[gaps.length - 1]}`);
console.log(`  FATAL falls (faller dies within 1000ms — an edge-jump): ${fatal}`);
