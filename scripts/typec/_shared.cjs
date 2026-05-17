// Shared loader for Type-C data-view derivation scripts.
// Reads the FRESH per-pull replay JSON produced by the RaidUI parser
// (`node src/parser/cli.js ingest ... --out D:/work/raidui/out`).
//
// "Fresh" = replay files whose mtime is within FRESH_WINDOW_MS of the
// newest replay file in out/pulls. The fixture parse writes all 19 pulls
// in one batch, so they share a tight mtime cluster; older stale replays
// from prior sessions are excluded automatically.
//
// No thresholds are decided here. This is plumbing only.

const fs = require('fs');
const path = require('path');

const PULLS_DIR = 'D:/work/raidui/out/pulls';
const FRESH_WINDOW_MS = 30 * 60 * 1000; // 30 min cluster around newest file

function listFreshReplays() {
  const files = fs.readdirSync(PULLS_DIR)
    .filter(f => f.endsWith('.replay.json'))
    .map(f => {
      const full = path.join(PULLS_DIR, f);
      return { file: f, full, mtime: fs.statSync(full).mtimeMs };
    });
  if (files.length === 0) throw new Error('no replay files in ' + PULLS_DIR);
  const newest = Math.max(...files.map(x => x.mtime));
  const fresh = files
    .filter(x => newest - x.mtime <= FRESH_WINDOW_MS)
    .sort((a, b) => a.mtime - b.mtime);
  return fresh;
}

function loadReplay(full) {
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

// All fresh replays, parsed. Each gets a `_file` tag for reporting.
function loadAllFresh() {
  return listFreshReplays().map(x => {
    const r = loadReplay(x.full);
    r._file = x.file;
    return r;
  });
}

// Player entities + index map into frame arrays.
function playerInfo(replay) {
  const players = [];
  for (let i = 0; i < replay.entities.length; i++) {
    const e = replay.entities[i];
    if (e.kind === 'Player') players.push({ idx: i, entity: e });
  }
  return players;
}

// Player UnitDied events with pullTimeMs, ascending.
function playerDeathTimes(replay) {
  const playerIds = new Set(replay.entities.filter(e => e.kind === 'Player').map(e => e.entityId));
  const out = [];
  for (const ev of (replay.events || [])) {
    if (ev.eventKind !== 'UnitDied') continue;
    if (ev.pullTimeMs == null) continue;
    const tid = ev.targetEntityId;
    const isPlayer = (typeof tid === 'string' && tid.startsWith('Player-')) || (tid && playerIds.has(tid));
    if (!isPlayer) continue;
    out.push({ entityId: tid, t: ev.pullTimeMs });
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}

function durationMs(replay) {
  const f = replay.frames;
  return (f && f.length) ? f[f.length - 1].t : 0;
}

// Simple numeric distribution summary.
function summarize(arr) {
  const s = arr.slice().filter(x => Number.isFinite(x)).sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return { n: 0 };
  const q = p => s[Math.min(n - 1, Math.max(0, Math.floor(p * (n - 1))))];
  const mean = s.reduce((a, b) => a + b, 0) / n;
  return {
    n, min: s[0], max: s[n - 1], mean,
    p10: q(0.10), p25: q(0.25), p50: q(0.50), p75: q(0.75), p90: q(0.90), p95: q(0.95),
  };
}

function fmt(x) {
  if (x == null || !Number.isFinite(x)) return String(x);
  return Math.abs(x) >= 100 ? x.toFixed(1) : x.toFixed(3);
}

function printSummary(label, arr) {
  const s = summarize(arr);
  if (s.n === 0) { console.log(`  ${label}: n=0 (no data)`); return s; }
  console.log(`  ${label}: n=${s.n} min=${fmt(s.min)} p10=${fmt(s.p10)} p25=${fmt(s.p25)} ` +
    `p50=${fmt(s.p50)} p75=${fmt(s.p75)} p90=${fmt(s.p90)} p95=${fmt(s.p95)} max=${fmt(s.max)} mean=${fmt(s.mean)}`);
  return s;
}

// Integer histogram printer.
function printHistogram(label, counts) {
  console.log(`  ${label}:`);
  const keys = Object.keys(counts).map(Number).sort((a, b) => a - b);
  const maxCount = Math.max(1, ...keys.map(k => counts[k]));
  for (const k of keys) {
    const bar = '#'.repeat(Math.round((counts[k] / maxCount) * 40));
    console.log(`    ${String(k).padStart(6)} | ${String(counts[k]).padStart(4)} ${bar}`);
  }
}

module.exports = {
  PULLS_DIR, FRESH_WINDOW_MS,
  listFreshReplays, loadReplay, loadAllFresh,
  playerInfo, playerDeathTimes, durationMs,
  summarize, fmt, printSummary, printHistogram,
};
