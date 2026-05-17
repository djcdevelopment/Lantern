// Throwaway diagnostic — dump a pull's EnvironmentalDamage + UnitDied events.
import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const env = r.events.filter(x => x.eventKind === 'EnvironmentalDamage');
const deaths = r.events.filter(x => x.eventKind === 'UnitDied')
  .map(x => ({ t: x.pullTimeMs, who: x.targetEntityId })).sort((a, b) => a.t - b.t);
console.log(`pull: ${r.bossName} | total events: ${r.events.length} | env: ${env.length} | deaths: ${deaths.length}`);
for (const x of env) {
  console.log(`  ENV  t=${x.pullTimeMs}  ${x.targetEntityId}  extra=${JSON.stringify(x.extra)}  amount=${x.amount}`);
}
console.log('  death (t, who):');
for (const d of deaths) console.log(`    ${d.t}  ${d.who}`);
