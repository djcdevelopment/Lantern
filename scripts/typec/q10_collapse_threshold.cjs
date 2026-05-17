// q10 — Collapse threshold DATA VIEW.
//
// Question: what does a real death-cluster distribution look like, so a
// human can pick a "collapse" threshold? No threshold is decided here.
//
// Derivation:
//   1. For every fresh pull, list player UnitDied pullTimeMs (ascending).
//   2. Inter-death gap = consecutive differences, across all pulls.
//   3. Death-cluster = run of deaths each within a rolling window of the
//      previous death. Reported across a 3000/5000/7000/10000 ms sweep so
//      the human sees how cluster size moves with the window.
//   4. "Collapse" cluster test: a death cluster within CW_CLUSTER_WINDOW_MS
//      holding >= CW_SYNC_ROSTER_RATIO of the roster. We count how many
//      pulls satisfy that purely on the cluster-share arithmetic.
//
// CW_CLUSTER_WINDOW_MS = 7000 — Derek's call; classify.js ships 3000, which
// he judged too short to catch a real cluster. CW_SYNC_ROSTER_RATIO = 0.75
// is the classify.js default, unchanged. NOTE: cluster arithmetic alone
// cannot tell a called wipe from a real collapse — see the called-wipe
// tells (healer disengage, edge-jump fall deaths) in research-questions.md.

const S = require('./_shared.cjs');

const CW_CLUSTER_WINDOW_MS = 7000;   // Derek's call; classify.js ships 3000
const CW_SYNC_ROSTER_RATIO = 0.75;   // from classify.js
const WINDOW_SWEEP = [3000, 5000, 7000, 10000];

// Largest run where each death is within windowMs of the PREVIOUS death
// (chained), i.e. a gap-based cluster. Returns the max run length.
function maxChainedCluster(times, windowMs) {
  if (times.length === 0) return 0;
  let best = 1, run = 1;
  for (let i = 1; i < times.length; i++) {
    if (times[i] - times[i - 1] <= windowMs) run++;
    else run = 1;
    if (run > best) best = run;
  }
  return best;
}

// Largest set of deaths all within windowMs of EACH OTHER (sliding window —
// same algorithm as classify.js findDeathCluster).
function maxSlidingCluster(times, windowMs) {
  if (times.length === 0) return 0;
  let best = 1, lo = 0;
  for (let hi = 0; hi < times.length; hi++) {
    while (times[hi] - times[lo] > windowMs) lo++;
    best = Math.max(best, hi - lo + 1);
  }
  return best;
}

function main() {
  const replays = S.loadAllFresh();
  console.log('=== q10 Collapse threshold — DATA VIEW ===');
  console.log(`fresh pulls: ${replays.length} | from ${S.PULLS_DIR}`);
  console.log(`cluster window=${CW_CLUSTER_WINDOW_MS}ms (Derek's call; classify.js default 3000), roster ratio=${CW_SYNC_ROSTER_RATIO}`);
  console.log('');

  const allGaps = [];                 // every consecutive inter-death gap (ms)
  const clusterSizeBySweep = {};      // windowMs -> [maxSlidingCluster per pull]
  for (const w of WINDOW_SWEEP) clusterSizeBySweep[w] = [];

  let collapseRuleCount = 0;
  const perPull = [];

  for (const r of replays) {
    const players = S.playerInfo(r);
    const roster = players.length;
    const deaths = S.playerDeathTimes(r).map(d => d.t);
    const dur = S.durationMs(r);

    for (let i = 1; i < deaths.length; i++) allGaps.push(deaths[i] - deaths[i - 1]);

    for (const w of WINDOW_SWEEP) {
      clusterSizeBySweep[w].push(maxSlidingCluster(deaths, w));
    }

    const cluster3s = maxSlidingCluster(deaths, CW_CLUSTER_WINDOW_MS);
    const clusterShare = roster > 0 ? cluster3s / roster : 0;
    // Existing-rule collapse test (ADR-008 Pattern B arithmetic): cluster of
    // >= 2 deaths within 3 s holding >= 75% of the roster.
    const qualifies = cluster3s >= 2 && clusterShare >= CW_SYNC_ROSTER_RATIO;
    if (qualifies) collapseRuleCount++;

    perPull.push({
      file: r._file, boss: r.bossName, roster,
      deaths: deaths.length, durSec: (dur / 1000).toFixed(0),
      cluster3s, clusterSharePct: (clusterShare * 100).toFixed(0),
      qualifies,
    });
  }

  console.log('--- per-pull (sorted by 3s-cluster share) ---');
  perPull.sort((a, b) => b.clusterSharePct - a.clusterSharePct);
  for (const p of perPull) {
    console.log(`  ${p.file.slice(0, 8)} ${(p.boss || '?').padEnd(26)} ` +
      `roster=${String(p.roster).padStart(2)} deaths=${String(p.deaths).padStart(2)} ` +
      `dur=${String(p.durSec).padStart(3)}s ${CW_CLUSTER_WINDOW_MS / 1000}s-cluster=${String(p.cluster3s).padStart(2)} ` +
      `share=${String(p.clusterSharePct).padStart(3)}% ${p.qualifies ? 'COLLAPSE-RULE-MATCH' : ''}`);
  }
  console.log('');

  console.log('--- inter-death gap distribution (ms), all pulls pooled ---');
  S.printSummary('inter-death gap ms', allGaps);
  // Bucket histogram of gaps.
  const gapBuckets = {};
  const edges = [250, 500, 1000, 2000, 3000, 5000, 10000, 30000];
  for (const g of allGaps) {
    let label = `>${edges[edges.length - 1]}`;
    for (const e of edges) { if (g <= e) { label = `<=${e}`; break; } }
    gapBuckets[label] = (gapBuckets[label] || 0) + 1;
  }
  console.log('  gap buckets:');
  for (const e of edges) {
    const k = `<=${e}`;
    console.log(`    ${k.padStart(8)} | ${String(gapBuckets[k] || 0).padStart(4)}`);
  }
  console.log(`    ${('>' + edges[edges.length - 1]).padStart(8)} | ${String(gapBuckets['>' + edges[edges.length - 1]] || 0).padStart(4)}`);
  console.log('');

  console.log('--- death-cluster size distribution (max sliding cluster per pull) ---');
  for (const w of WINDOW_SWEEP) {
    const sizes = clusterSizeBySweep[w];
    const counts = {};
    for (const s of sizes) counts[s] = (counts[s] || 0) + 1;
    console.log(`  window=${w}ms:`);
    S.printSummary(`    cluster size`, sizes);
    S.printHistogram(`    cluster-size histogram (pulls per size)`, counts);
  }
  console.log('');

  console.log('--- collapse count under existing 3s / 75%-roster rule ---');
  console.log(`  pulls satisfying (>=2 deaths in 3s cluster AND cluster >= 75% roster): ` +
    `${collapseRuleCount} / ${replays.length}`);
  console.log('');
  console.log('NOTE: this is the cluster-share arithmetic only. classify.js Pattern B');
  console.log('additionally requires "no strong signal inflection in the 10s pre-cluster";');
  console.log('that gate needs ComputedSignals which are not in the replay JSON, so it is');
  console.log('NOT applied here. The count above is an UPPER BOUND on Pattern-B matches.');
}

main();
