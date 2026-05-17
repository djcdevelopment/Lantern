// q9 — Reaction-time jitter noise floor DATA VIEW.
//
// Question: a real-movement velocity threshold must clear the positional
// NOISE FLOOR of a player who is actually standing still. We measure that
// floor from real data. No threshold is decided here.
//
// Method:
//   1. For each alive player, slide a window of WINDOW_FRAMES frames.
//   2. A window is "demonstrably stationary" if the NET displacement
//      (start point -> end point) over the window is <= STILL_NET_YD yards.
//      A player walking steadily has large net displacement and is excluded;
//      a player parked in place has ~0 net displacement but still shows
//      sample-to-sample jitter (server-tick rounding, 5Hz resampling).
//   3. For every stationary window, the JITTER is the per-step speed:
//      |pos[i] - pos[i-1]| / frameStepMs, denormalized to yards.
//      We also report per-window path length / window duration.
//   4. The reported distribution = the noise floor a velocity threshold
//      must exceed to avoid classifying jitter as "movement".
//
// Constants here are MEASUREMENT PARAMETERS, not answer thresholds:
//   WINDOW_FRAMES (window length), STILL_NET_YD (what counts as "parked").
//   They are reported so the human can see the gate that produced the floor.

const S = require('./_shared.cjs');

const WINDOW_FRAMES = 10;     // 10 frames @ 200ms = 2.0 s window
const STILL_NET_YD = 1.0;     // net start->end displacement <= 1 yd => "parked"

function denorm(px, py, arena) {
  return [px * arena.width, py * arena.height];
}

function main() {
  const replays = S.loadAllFresh();
  console.log('=== q9 Reaction-time jitter noise floor — DATA VIEW ===');
  console.log(`fresh pulls: ${replays.length}`);
  console.log(`measurement params: WINDOW_FRAMES=${WINDOW_FRAMES} (=${WINDOW_FRAMES * 200}ms), ` +
    `STILL_NET_YD=${STILL_NET_YD} (net displacement to count window as "parked")`);
  console.log('');

  const stepSpeeds = [];        // per-frame jitter speed (yd/s) inside stationary windows
  const windowPathSpeed = [];   // per-window mean path-length speed (yd/s)
  const windowMaxStep = [];     // per-window max single-step speed (yd/s)
  let stationaryWindows = 0, totalWindows = 0;

  // STRICT variant: a window is "truly still" only if the net displacement
  // gate passes AND total path length over the window <= STILL_PATH_YD.
  // The plain net-displacement gate admits there-and-back motion (a player
  // sidesteps and returns) whose mid-window steps are real movement, not
  // sensor noise. The strict gate isolates the genuine sample noise floor.
  const STILL_PATH_YD = 1.5;
  const strictStepSpeeds = [];
  let strictWindows = 0;

  for (const r of replays) {
    const stepMs = r.frameStepMs || 200;
    const players = S.playerInfo(r).map(p => p.idx);
    const frames = r.frames;
    if (!frames || frames.length < WINDOW_FRAMES + 1) continue;

    for (const idx of players) {
      // Non-overlapping windows for independence.
      for (let start = 0; start + WINDOW_FRAMES < frames.length; start += WINDOW_FRAMES) {
        const end = start + WINDOW_FRAMES;
        // alive across the whole window
        let alive = true;
        for (let f = start; f <= end; f++) {
          const hp = frames[f].entityHp;
          if (hp && hp[idx] != null && hp[idx] <= 0) { alive = false; break; }
        }
        if (!alive) continue;
        totalWindows++;

        const p0 = denorm(frames[start].entityPositions[idx * 2],
          frames[start].entityPositions[idx * 2 + 1], r.arenaYd);
        const pN = denorm(frames[end].entityPositions[idx * 2],
          frames[end].entityPositions[idx * 2 + 1], r.arenaYd);
        const netDisp = Math.hypot(pN[0] - p0[0], pN[1] - p0[1]);
        if (netDisp > STILL_NET_YD) continue;   // player actually moved
        stationaryWindows++;

        // jitter: per-step speeds inside this parked window
        let pathLen = 0, maxStep = 0;
        const winSteps = [];
        for (let f = start + 1; f <= end; f++) {
          const a = denorm(frames[f - 1].entityPositions[idx * 2],
            frames[f - 1].entityPositions[idx * 2 + 1], r.arenaYd);
          const b = denorm(frames[f].entityPositions[idx * 2],
            frames[f].entityPositions[idx * 2 + 1], r.arenaYd);
          const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const speed = d / (stepMs / 1000);  // yd/s
          stepSpeeds.push(speed);
          winSteps.push(speed);
          pathLen += d;
          if (speed > maxStep) maxStep = speed;
        }
        const windowSec = (WINDOW_FRAMES * stepMs) / 1000;
        windowPathSpeed.push(pathLen / windowSec);
        windowMaxStep.push(maxStep);

        // strict gate: also require small total path length
        if (pathLen <= STILL_PATH_YD) {
          strictWindows++;
          for (const s of winSteps) strictStepSpeeds.push(s);
        }
      }
    }
  }

  console.log(`stationary windows (net-disp gate): ${stationaryWindows} / ${totalWindows} ` +
    `(${(100 * stationaryWindows / Math.max(1, totalWindows)).toFixed(1)}%)`);
  console.log(`strictly-still windows (net-disp + path<=${STILL_PATH_YD}yd): ${strictWindows} / ${totalWindows} ` +
    `(${(100 * strictWindows / Math.max(1, totalWindows)).toFixed(1)}%)`);
  console.log('');
  console.log('--- jitter noise floor: NET-DISP gate (per-step speed, yd/s) ---');
  console.log('    (admits there-and-back motion: max-step tail is real movement, see note)');
  S.printSummary('per-step jitter speed yd/s', stepSpeeds);
  console.log('');
  console.log('--- jitter noise floor: STRICT gate (per-step speed, yd/s) ---');
  console.log('    (net-disp AND total path small: this is the genuine sample noise floor)');
  S.printSummary('per-step jitter speed yd/s', strictStepSpeeds);
  console.log('');
  console.log('--- per-window aggregate jitter (yd/s) ---');
  S.printSummary('mean path-length speed yd/s', windowPathSpeed);
  S.printSummary('max single-step speed yd/s', windowMaxStep);
  console.log('');

  // Histograms of per-step jitter speeds, both gates.
  const edges = [0.1, 0.25, 0.5, 1, 2, 3, 5, 8];
  function hist(label, arr) {
    const buckets = {};
    for (const v of arr) {
      let l = `>${edges[edges.length - 1]}`;
      for (const e of edges) { if (v <= e) { l = `<=${e}`; break; } }
      buckets[l] = (buckets[l] || 0) + 1;
    }
    console.log(`--- per-step jitter speed histogram (yd/s) — ${label} ---`);
    for (const e of edges) {
      const k = `<=${e}`;
      console.log(`    ${k.padStart(8)} | ${String(buckets[k] || 0).padStart(6)}`);
    }
    console.log(`    ${('>' + edges[edges.length - 1]).padStart(8)} | ${String(buckets['>' + edges[edges.length - 1]] || 0).padStart(6)}`);
  }
  hist('NET-DISP gate', stepSpeeds);
  console.log('');
  hist('STRICT gate', strictStepSpeeds);
  console.log('');
  console.log('INTERPRETATION: a velocity threshold meant to detect REAL movement must');
  console.log('sit above this floor. The STRICT-gate distribution is the true sample');
  console.log('noise floor (a player who genuinely never moved). The NET-DISP gate is');
  console.log('looser — its high-speed tail (max ~30 yd/s) is REAL there-and-back motion');
  console.log('that nets to zero, NOT noise; it is reported so the divergence is visible.');
  console.log('Numbers above are computed, not chosen — the human picks where above the');
  console.log('STRICT floor to set the line.');
}

main();
