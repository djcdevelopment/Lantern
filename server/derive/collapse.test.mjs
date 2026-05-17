// Unit tests for q10 collapse detection. Run: node --test server/derive/
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPullEnding } from './collapse.mjs';

// Minimal PullReplay — classifyPullEnding reads only entities[] and events[].
function replay(events, rosterSize = 20) {
  const entities = [{ entityId: 'Creature-Boss', kind: 'Boss' }];
  for (let i = 0; i < rosterSize; i++) {
    entities.push({ entityId: `Player-${i}`, kind: 'Player' });
  }
  return { schemaVersion: 'v1', entities, frames: [], events };
}
const death = (i, t) => ({ eventKind: 'UnitDied', targetEntityId: `Player-${i}`, pullTimeMs: t });
const fall = (i, t) => ({
  eventKind: 'EnvironmentalDamage', targetEntityId: `Player-${i}`, pullTimeMs: t,
  extra: { environmentalType: 'Falling' },
});
// A mass-death cluster of `n` deaths starting at `t0`, 400ms apart.
const wipeCluster = (n, t0) => Array.from({ length: n }, (_, i) => death(i, t0 + i * 400));
// A synchronized jump burst of `n` falls starting at `t0`, 80ms apart.
const jumpBurst = (n, t0) => Array.from({ length: n }, (_, i) => fall(i, t0 + i * 80));

test('a kill / a couple of scattered deaths classify as none', () => {
  assert.equal(classifyPullEnding(replay([death(1, 1000), death(2, 90000)])).kind, 'none');
});

test('deaths spread beyond the 7s window do not form a wipe cluster', () => {
  const evs = Array.from({ length: 10 }, (_, i) => death(i, i * 9000));
  assert.equal(classifyPullEnding(replay(evs)).kind, 'none');
});

test('a mass-death cluster with a jump burst just before it is a called-wipe', () => {
  // 10 deaths from 100000; a 5-fall burst at 95000 (5s before the cluster).
  const res = classifyPullEnding(replay([...wipeCluster(10, 100000), ...jumpBurst(5, 95000)]));
  assert.equal(res.kind, 'called-wipe');
  assert.equal(res.jumpBurst, 5);
});

test('jumps lead deaths by several seconds — still detected as a burst', () => {
  // Real pattern: a tight fall burst, then deaths staggered ~8s later.
  const res = classifyPullEnding(replay([...wipeCluster(10, 58000), ...jumpBurst(8, 50000)]));
  assert.equal(res.kind, 'called-wipe');
  assert.equal(res.jumpBurst, 8);
});

test('a mass-death cluster with no falls is an undetermined wipe', () => {
  const res = classifyPullEnding(replay(wipeCluster(12, 300000)));
  assert.equal(res.kind, 'wipe');
  assert.equal(res.jumpBurst, 0);
});

test('a mid-pull fall burst far from the wipe is mechanic noise, not a jump', () => {
  // Wipe at 200000; a 6-fall burst at 150000 (50s earlier — a survivable
  // boss mechanic). The burst is outside the near-wipe window.
  const res = classifyPullEnding(replay([...wipeCluster(10, 200000), ...jumpBurst(6, 150000)]));
  assert.equal(res.kind, 'wipe');
  assert.equal(res.jumpBurst, 0);
  assert.equal(res.fallEventsTotal, 6, 'the mechanic falls are still counted as context');
});

test('two jumps is below the burst floor — still an undetermined wipe', () => {
  const res = classifyPullEnding(replay([...wipeCluster(9, 400000), ...jumpBurst(2, 396000)]));
  assert.equal(res.kind, 'wipe');
  assert.equal(res.jumpBurst, 2);
});

test('a fall-mechanic boss disables the jump signal — always an undetermined wipe', () => {
  // Same data that scores 'called-wipe' normally, but the boss launches the
  // raid as a fight mechanic, so the fall burst cannot be read as a reset.
  const evs = [...wipeCluster(10, 100000), ...jumpBurst(5, 95000)];
  assert.equal(classifyPullEnding(replay(evs)).kind, 'called-wipe');           // control
  const res = classifyPullEnding(replay(evs), { hasFallMechanic: true });
  assert.equal(res.kind, 'wipe');
  assert.equal(res.jumpBurst, null);
});
