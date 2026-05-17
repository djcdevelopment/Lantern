// q10 — collapse detection.
//
// Classifies how a pull ended:
//   'none'        — no collapse-grade death cluster: a kill, or deaths too
//                   few / too spread to be a mass wipe.
//   'called-wipe' — a mass-death cluster preceded by a burst of players
//                   jumping off the edge. An intentional, disciplined reset
//                   — NOT a failure; must never surface as one.
//   'wipe'        — a mass-death cluster with no usable jump signal. Whether
//                   it was a *called* wipe or a genuine *collapse* cannot be
//                   told from jumping alone — that needs the healer-disengage
//                   tell, which the parser does not yet capture.
//
// THE JUMP SIGNAL IS BOSS-DEPENDENT. It only works where the sole reason a
// player falls is a deliberate wipe-jump. A boss whose fight launches or
// knocks the raid into the air (e.g. Crown of the Cosmos — the entire raid is
// knocked up every intermission phase and takes Falling damage coming down)
// produces fall bursts that are the fight, not a reset. The 15s near-wipe
// gate does NOT rescue this: a wipe that lands during an intermission is
// indistinguishable from a called jump. For such bosses pass
// opts.hasFallMechanic = true (from server/data/encounters.json) — the jump
// signal is disabled and every wipe is reported as undetermined 'wipe'.
//
// On usable bosses: players jump in a tight (~0.3s) synchronized burst but
// then die staggered over 2-12s as they hit the kill-plane — so detect the
// fall *burst*, gated to within JUMP_NEAR_CLUSTER_MS of the death cluster.
//
// Spec is Derek's. It does NOT gate on a roster fraction — immunities and
// Spirit of Redemption leave legitimate survivors.
//
// Requires a parse from the q10-era RaidUI parser or later.

export const CLUSTER_WINDOW_MS    = 7000;   // death-cluster window (Derek's call)
export const MIN_WIPE_CLUSTER     = 5;      // fewer deaths in-window ⇒ 'none'
export const JUMP_BURST_WINDOW_MS = 3000;   // falls within this of each other ⇒ one burst
export const MIN_JUMP_BURST       = 3;      // ≥ this many in a burst ⇒ a coordinated jump
export const JUMP_NEAR_CLUSTER_MS = 15000;  // a burst within this before the wipe counts
export const SOR_SPELL_ID         = 27827;  // Spirit of Redemption

function playerDeaths(events) {
  const out = [];
  for (const ev of events) {
    if (ev.eventKind !== 'UnitDied' || ev.pullTimeMs == null) continue;
    const id = ev.targetEntityId;
    if (typeof id === 'string' && id.startsWith('Player-')) out.push(ev.pullTimeMs);
  }
  return out.sort((a, b) => a - b);
}

function fallingTimes(events) {
  const out = [];
  for (const ev of events) {
    if (ev.eventKind !== 'EnvironmentalDamage' || ev.pullTimeMs == null) continue;
    if (ev.extra?.environmentalType === 'Falling') out.push(ev.pullTimeMs);
  }
  return out.sort((a, b) => a - b);
}

// Most timestamps that fit within windowMs of each other (sliding window).
function largestWindowCount(sorted, windowMs) {
  let best = 0, lo = 0;
  for (let hi = 0; hi < sorted.length; hi++) {
    while (sorted[hi] - sorted[lo] > windowMs) lo++;
    best = Math.max(best, hi - lo + 1);
  }
  return best;
}

// The span of the largest such cluster.
function largestCluster(sorted, windowMs) {
  let bestLo = 0, bestHi = -1, lo = 0;
  for (let hi = 0; hi < sorted.length; hi++) {
    while (sorted[hi] - sorted[lo] > windowMs) lo++;
    if (hi - lo > bestHi - bestLo) { bestLo = lo; bestHi = hi; }
  }
  return bestHi >= bestLo
    ? { size: bestHi - bestLo + 1, start: sorted[bestLo], end: sorted[bestHi] }
    : { size: 0, start: null, end: null };
}

// opts.hasFallMechanic — true when the boss's fight inflicts Falling damage
// (see server/data/encounters.json). Disables the jump signal.
export function classifyPullEnding(replay, opts = {}) {
  const hasFallMechanic = opts.hasFallMechanic === true;
  const events = replay?.events || [];
  const entities = replay?.entities || [];

  const deaths = playerDeaths(events);
  const wipe = largestCluster(deaths, CLUSTER_WINDOW_MS);
  const falls = fallingTimes(events);

  const result = {
    kind: 'none',
    clusterSize: wipe.size,
    rosterSize: entities.filter(e => e.kind === 'Player').length,
    clusterStartMs: wipe.start,
    clusterEndMs: wipe.end,
    jumpBurst: 0,
    fallEventsTotal: falls.length,
    sorSurvivors: 0,
    reason: '',
  };

  if (wipe.size < MIN_WIPE_CLUSTER) {
    result.reason = `${wipe.size} death(s) in the largest ${CLUSTER_WINDOW_MS / 1000}s ` +
      `window — below the ${MIN_WIPE_CLUSTER}-death wipe-cluster floor.`;
    return result;
  }

  // Boss with its own fall mechanic: Falling is the fight, not a wipe-jump.
  // The jump signal is unusable — verdict can only be an undetermined wipe.
  if (hasFallMechanic) {
    result.jumpBurst = null;
    result.kind = 'wipe';
    result.reason = `${wipe.size} deaths within ${CLUSTER_WINDOW_MS / 1000}s; this boss ` +
      `has a fall mechanic, so jumping cannot be told from the fight — ` +
      `called-vs-collapse undetermined (needs the healer-disengage tell).`;
    return result;
  }

  // Falls in the run-up to the wipe. Players jump together then die staggered,
  // so anchor the burst to the death cluster, not to individual deaths.
  const nearFalls = falls.filter(t =>
    t >= wipe.start - JUMP_NEAR_CLUSTER_MS && t <= wipe.end);
  const jumpBurst = largestWindowCount(nearFalls, JUMP_BURST_WINDOW_MS);
  result.jumpBurst = jumpBurst;

  // Spirit of Redemption "soft deaths" near the wipe — reported as context.
  const sor = new Set();
  for (const ev of events) {
    if (ev.eventKind !== 'SpellAuraApplied' || ev.spellId !== SOR_SPELL_ID) continue;
    if (ev.pullTimeMs == null) continue;
    if (ev.pullTimeMs >= wipe.start - CLUSTER_WINDOW_MS && ev.pullTimeMs <= wipe.end) {
      sor.add(ev.targetEntityId);
    }
  }
  result.sorSurvivors = sor.size;

  if (jumpBurst >= MIN_JUMP_BURST) {
    result.kind = 'called-wipe';
    result.reason = `${wipe.size} deaths within ${CLUSTER_WINDOW_MS / 1000}s, preceded ` +
      `by ${jumpBurst} players jumping off the edge in a burst — an intentional reset.`;
  } else {
    result.kind = 'wipe';
    result.reason = `${wipe.size} deaths within ${CLUSTER_WINDOW_MS / 1000}s, no jump ` +
      `burst near the wipe — called-vs-collapse undetermined (needs the healer-disengage tell).`;
  }
  return result;
}
