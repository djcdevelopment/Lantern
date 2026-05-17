/* ============================================================
   dataSource — THE SEAM where real data plugs in.
   ------------------------------------------------------------
   Today these functions return the bundled dataset
   (server/data/*.json). To wire the real combat-log parser,
   replace the bodies below: read the parser's output
   (out/sessions/*.json, out/pulls/*.replay.json) and run the
   player-first derivation (moments, cohorts, coordination).

   Nothing else in the server or the app changes — the
   SessionSnapshot shape (src/api/types/domain.ts) is the
   contract both sides hold. See CONTRACTS.md §"Going live".
   ============================================================ */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const DATA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "data");

function readJson(name) {
  return JSON.parse(readFileSync(resolve(DATA_DIR, name), "utf8"));
}

let _snapshot = null;
let _answers = null;

/** The whole read-only archive snapshot (the `bootstrap()` payload). */
export function getSnapshot() {
  if (!_snapshot) _snapshot = readJson("dataset.json");
  return _snapshot;
}

/** Pre-authored Workshop answers, keyed by lowercased question. */
export function getCannedAnswers() {
  if (!_answers) _answers = readJson("workshop-answers.json");
  return _answers;
}

/** The contribution package for a raid. (raidId is accepted for the
    real contract; the sample archive has a single raid.) */
export function getContributePackage(_raidId) {
  const s = getSnapshot();
  return { items: s.packageItems, consent: s.consent };
}
