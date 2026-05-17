/* ============================================================
   prerender — bake the GET endpoints into static JSON blobs.
   ------------------------------------------------------------
   Runs as part of `npm run build:cloud`. Writes public/api/*.json
   so the cloud bundle (read-only, no server) can satisfy every
   GET. The path convention MUST match toCloudPath() in
   src/api/http/client.ts.

   Cloud is read-only: writes (POST/PATCH/DELETE) are not baked —
   the client throws CloudUnavailableError for those.
   ============================================================ */

import { writeFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { getSnapshot, getContributePackage } from "../server/dataSource.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const API_DIR = resolve(ROOT, "public/api");
const DATA_DIR = resolve(ROOT, "server/data");

rmSync(API_DIR, { recursive: true, force: true });
mkdirSync(resolve(API_DIR, "contribute"), { recursive: true });

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const write = (rel, value) => {
  writeFileSync(resolve(API_DIR, rel), JSON.stringify(value));
  console.log("  public/api/" + rel);
};

const snapshot = getSnapshot();

// GET /api/health — cloud has no local services; report them offline.
write("health.json", {
  ok: true,
  ollama: { reachable: false, endpoint: "", models: [] },
  parser: { state: "archived", lastParse: snapshot.latestRaid.parsed },
  replayCache: { sizeMb: 412, encounters: 18 },
});

// GET /api/bootstrap
write("bootstrap.json", snapshot);

// GET /api/notebook — read-only showcase of the seed notes.
write("notebook.json", readJson(resolve(DATA_DIR, "notebook.seed.json")));

// GET /api/observations
write("observations.json", readJson(resolve(DATA_DIR, "observations.seed.json")));

// GET /api/contribute/package?raidId=<id>
const raidId = snapshot.latestRaid.id;
write(`contribute/package--raidId=${raidId}.json`, getContributePackage(raidId));

console.log("prerendered → public/api/  (read-only cloud blobs)");
