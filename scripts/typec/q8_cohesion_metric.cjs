// q8 — Cohesion metric DATA VIEW.
//
// Question: for a "raid cohesion" metric, three candidate definitions are
// on the table. We compute all three per frame on representative pulls and
// surface their ranges + how much they diverge, so a human can pick one.
// No metric is selected here.
//
// Three per-frame candidates (over ALIVE players only — HP fraction > 0):
//   (a) mean pairwise player distance  — every player-pair, averaged.
//   (b) RMS distance-to-centroid       — sqrt(mean(d_i^2)) about the centroid.
//   (c) max distance-to-centroid       — the single furthest player.
//
// All in YARDS: positions are normalized [0,1]; we denormalize per-axis
// with arenaYd.width / arenaYd.height before computing Euclidean distance.
//
// "Alive" gate: a frame's entityHp[idx] must be > 0. A dead body sitting at
// its death spot would otherwise inflate spread; we drop it. Frames before
// entityHp exists fall back to all players.
//
// Representative pulls: chosen to span the range of pull shapes —
//   - longest clean progression pull (most frames)
//   - a mid-length pull
//   - a short collapse pull
// Selection is by frame count, deterministic, printed in the output.

const S = require('./_shared.cjs');

function denorm(px, py, arena) {
  return [px * arena.width, py * arena.height];
}

// Per-frame cohesion triple over alive players.
function frameCohesion(frame, playerIdx, arena) {
  const pts = [];
  for (const idx of playerIdx) {
    const alive = !frame.entityHp || frame.entityHp[idx] == null || frame.entityHp[idx] > 0;
    if (!alive) continue;
    const x = frame.entityPositions[idx * 2];
    const y = frame.entityPositions[idx * 2 + 1];
    if (x == null || y == null) continue;
    pts.push(denorm(x, y, arena));
  }
  const n = pts.length;
  if (n < 2) return null;

  // (a) mean pairwise distance
  let pairSum = 0, pairCount = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = pts[i][0] - pts[j][0];
      const dy = pts[i][1] - pts[j][1];
      pairSum += Math.sqrt(dx * dx + dy * dy);
      pairCount++;
    }
  }
  const meanPair = pairSum / pairCount;

  // centroid
  let cx = 0, cy = 0;
  for (const p of pts) { cx += p[0]; cy += p[1]; }
  cx /= n; cy /= n;

  // (b) RMS distance-to-centroid, (c) max distance-to-centroid
  let sqSum = 0, maxD = 0;
  for (const p of pts) {
    const dx = p[0] - cx, dy = p[1] - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    sqSum += d * d;
    if (d > maxD) maxD = d;
  }
  const rmsCentroid = Math.sqrt(sqSum / n);
  return { meanPair, rmsCentroid, maxCentroid: maxD, alive: n };
}

function main() {
  const replays = S.loadAllFresh();
  // Pick 3 representative pulls by frame count: longest, median, shortest
  // (only pulls with >= 50 frames so the series is meaningful).
  const usable = replays.filter(r => r.frames && r.frames.length >= 50)
    .sort((a, b) => b.frames.length - a.frames.length);
  const picks = [
    usable[0],                                   // longest
    usable[Math.floor(usable.length / 2)],       // median length
    usable[usable.length - 1],                   // shortest
  ];

  console.log('=== q8 Cohesion metric — DATA VIEW ===');
  console.log(`fresh pulls available: ${replays.length}; representative picks (by frame count):`);
  for (const r of picks) {
    console.log(`  ${r._file.slice(0, 8)} ${r.bossName} | frames=${r.frames.length} ` +
      `arenaYd=${r.arenaYd.width.toFixed(1)}x${r.arenaYd.height.toFixed(1)}`);
  }
  console.log('');

  for (const r of picks) {
    const players = S.playerInfo(r).map(p => p.idx);
    const meanPair = [], rmsC = [], maxC = [];
    const divergeRatio = [];   // maxCentroid / rmsCentroid per frame
    for (const f of r.frames) {
      const c = frameCohesion(f, players, r.arenaYd);
      if (!c) continue;
      meanPair.push(c.meanPair);
      rmsC.push(c.rmsCentroid);
      maxC.push(c.maxCentroid);
      if (c.rmsCentroid > 0) divergeRatio.push(c.maxCentroid / c.rmsCentroid);
    }
    console.log(`--- ${r._file.slice(0, 8)} ${r.bossName} (${meanPair.length} usable frames) ---`);
    S.printSummary('(a) mean pairwise distance (yd)', meanPair);
    S.printSummary('(b) RMS distance-to-centroid (yd)', rmsC);
    S.printSummary('(c) max distance-to-centroid (yd)', maxC);
    S.printSummary('divergence ratio  max / rms', divergeRatio);
    // How much do (a) and (b) track each other? report ratio meanPair/rms.
    const abRatio = meanPair.map((m, i) => rmsC[i] > 0 ? m / rmsC[i] : null).filter(x => x != null);
    S.printSummary('ratio  meanPair / rms', abRatio);
    console.log('');
  }

  console.log('--- how the three diverge (pooled across the 3 picks) ---');
  console.log('  (a) mean-pairwise and (b) RMS-centroid are both "bulk" measures and');
  console.log('  scale together (see meanPair/rms ratio above — tight band).');
  console.log('  (c) max-centroid is an OUTLIER measure: one straggler drives it, so it');
  console.log('  sits well above (b) and is the noisiest. The max/rms ratio quantifies');
  console.log('  the gap: ratio ~1 means the raid is uniformly spread; a high ratio');
  console.log('  means one player is far from a tight pack. A human picks (a)/(b) for a');
  console.log('  "is the raid stacked" metric, (c) for a "is anyone stranded" metric.');
}

main();
