// Ground-truth gate for the spellbook (see docs/research-strategy.md — the
// Type-B "every spell ID is grepped against the real log" rule).
//
// Streams a combat log once and tallies every spell ID -> { name, count }.
// The log is the authority: an ID with count > 0 is confirmed present in
// real data, and the name is whatever the game actually wrote (current to
// that client build). Use the output to verify and name-check every entry
// in server/data/spellbook.json.
//
// Usage: node scripts/scan-spells.mjs <combatlog.txt> [outfile.json]

import { createReadStream, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const logPath = process.argv[2];
const outPath = process.argv[3] || 'scripts/spell-scan.json';
if (!logPath) {
  console.error('usage: node scripts/scan-spells.mjs <combatlog.txt> [outfile.json]');
  process.exit(1);
}

// A spell in a combat-log line is the triplet `<id>,"<name>",<school>`.
// Matching `,<digits>,"<name>",` finds it wherever it sits — cast, damage,
// heal, aura, and both triplets inside SPELL_ABSORBED. A bare integer
// followed by a quoted string is, in practice, always a spell triplet.
const TRIPLET = /,(\d+),"([^"]*)",/g;

const tally = new Map(); // id -> { name, count }
let lines = 0;

const rl = createInterface({
  input: createReadStream(logPath, { encoding: 'utf8' }),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  lines++;
  TRIPLET.lastIndex = 0;
  let m;
  while ((m = TRIPLET.exec(line)) !== null) {
    const id = m[1];
    const name = m[2];
    const e = tally.get(id);
    if (e) { e.count++; if (!e.name && name) e.name = name; }
    else tally.set(id, { name, count: 1 });
  }
}

const sorted = [...tally.entries()].sort((a, b) => b[1].count - a[1].count);
const body = sorted
  .map(([id, e]) => `  ${JSON.stringify(id)}: ${JSON.stringify(e)}`)
  .join(',\n');
writeFileSync(outPath, `{\n${body}\n}\n`);

console.log(`scanned ${lines} lines — ${tally.size} distinct spell IDs`);
console.log(`wrote ${outPath}`);
console.log('top 25 by occurrence count:');
for (const [id, e] of sorted.slice(0, 25)) {
  console.log(`  ${id}\t${e.count}\t${e.name}`);
}
