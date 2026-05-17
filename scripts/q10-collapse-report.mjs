// Classifies every pull in a fresh parse with server/derive/collapse.mjs and
// prints the per-pull verdict — for eyeballing against memory of the night.
// Per-boss mechanic data (server/data/encounters.json) supplies hasFallMechanic.
//
// Usage: node scripts/q10-collapse-report.mjs [pullsDir]
//   default pullsDir: D:/work/raidui/out-fresh/pulls

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { classifyPullEnding } from '../server/derive/collapse.mjs';

const pullsDir = process.argv[2] || 'D:/work/raidui/out-fresh/pulls';
const encounters = JSON.parse(
  readFileSync(new URL('../server/data/encounters.json', import.meta.url), 'utf8'));

const files = readdirSync(pullsDir).filter(f => f.endsWith('.replay.json'));
if (files.length === 0) {
  console.error(`no replay files in ${pullsDir}`);
  process.exit(1);
}

const rows = files.map(f => {
  const replay = JSON.parse(readFileSync(join(pullsDir, f), 'utf8'));
  const enc = encounters[replay.bossName] || {};
  const hasFallMechanic = enc.hasFallMechanic === true;
  return {
    f, boss: replay.bossName || '?', hasFallMechanic,
    ...classifyPullEnding(replay, { hasFallMechanic }),
  };
});
const order = { 'called-wipe': 0, wipe: 1, none: 2 };
rows.sort((a, b) => order[a.kind] - order[b.kind] || b.clusterSize - a.clusterSize);

console.log(`=== q10 collapse classification — ${files.length} pulls ===`);
console.log('(server/derive/collapse.mjs + server/data/encounters.json)\n');
const counts = { 'called-wipe': 0, wipe: 0, none: 0 };
for (const r of rows) {
  counts[r.kind]++;
  const jb = r.jumpBurst == null ? ' —' : String(r.jumpBurst).padStart(2);
  console.log(`  ${r.f.slice(0, 8)}  ${r.kind.toUpperCase().padEnd(12)} ` +
    `${r.boss.padEnd(24)} cluster=${String(r.clusterSize).padStart(2)}/${r.rosterSize} ` +
    `jumpBurst=${jb} falls=${String(r.fallEventsTotal).padStart(2)}` +
    `${r.hasFallMechanic ? '  [fall-mechanic boss]' : ''}`);
  console.log(`            ${r.reason}`);
}
console.log(`\n  totals: ${counts['called-wipe']} called-wipe · ` +
  `${counts.wipe} wipe (undetermined) · ${counts.none} none`);
