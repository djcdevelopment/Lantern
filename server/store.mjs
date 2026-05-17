/* ============================================================
   store — file-backed persistence for the player's authored
   memory (notebook + observations).
   ------------------------------------------------------------
   Live state lives in server/data/{notebook,observations}.json,
   seeded from the *.seed.json files on first run. This is the
   persistence layer; a hosted multi-user build would swap these
   functions for a database keyed by member identity.
   ============================================================ */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { getSnapshot } from "./dataSource.mjs";

const DATA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "data");

function load(liveName, seedName) {
  const livePath = resolve(DATA_DIR, liveName);
  if (existsSync(livePath)) {
    return JSON.parse(readFileSync(livePath, "utf8"));
  }
  const seed = JSON.parse(readFileSync(resolve(DATA_DIR, seedName), "utf8"));
  writeFileSync(livePath, JSON.stringify(seed, null, 2));
  return seed;
}

function save(name, value) {
  writeFileSync(resolve(DATA_DIR, name), JSON.stringify(value, null, 2));
}

/* ---------- Notebook (local-only) ---------- */

export function listNotes() {
  return load("notebook.json", "notebook.seed.json");
}

export function addNote(draft) {
  const note = {
    id: "n" + Date.now(),
    text: draft.text ?? "",
    tags: draft.tags ?? [],
    binding: draft.binding ?? null,
    createdAt: "just now",
    pinned: false,
  };
  save("notebook.json", [note, ...listNotes()]);
  return note;
}

export function updateNote(id, patch) {
  const next = listNotes().map((n) => (n.id === id ? { ...n, ...patch } : n));
  save("notebook.json", next);
  return next.find((n) => n.id === id) ?? null;
}

export function removeNote(id) {
  save("notebook.json", listNotes().filter((n) => n.id !== id));
}

/* ---------- Observations (shared with the guild) ---------- */

export function listObservations() {
  return load("observations.json", "observations.seed.json");
}

export function shareObservation(draft) {
  const obs = {
    id: "ob" + Date.now(),
    status: "shared",
    sharedAt: "just now",
    raidId: getSnapshot().latestRaid.id,
    kind: draft.kind ?? "teamwork",
    title: draft.title ?? "",
    description: draft.description ?? "",
    credits: draft.credits ?? [],
    binding: draft.binding ?? null,
    sources: draft.sources ?? [],
    fromNoteId: draft.fromNoteId ?? null,
    viewers: 0,
  };
  save("observations.json", [obs, ...listObservations()]);
  return obs;
}

export function withdrawObservation(id) {
  save(
    "observations.json",
    listObservations().map((o) =>
      o.id === id ? { ...o, status: "withdrawn", withdrawnAt: "just now" } : o,
    ),
  );
}
