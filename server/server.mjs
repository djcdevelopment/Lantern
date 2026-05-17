/* ============================================================
   Lantern local server
   ------------------------------------------------------------
   A small raw-`http` server (no framework) that serves the
   LanternApi endpoints, persists notebook/observations to disk,
   and bridges the Workshop to a local Ollama install.

   The app's HTTP client (src/api/http) talks to this. The data
   behind it comes through dataSource.mjs — the parser seam.

   Run:  node server/server.mjs        (or `npm run server`)
   Port: 5181  (override with LANTERN_PORT)
   ============================================================ */

import { createServer } from "node:http";
import * as ds from "./dataSource.mjs";
import * as store from "./store.mjs";
import { ollamaHealth } from "./ollama.mjs";
import * as workshop from "./workshop.mjs";

const PORT = Number(process.env.LANTERN_PORT || 5181);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json", ...CORS });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 2_000_000) reject(new Error("request body too large"));
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

async function health() {
  const s = ds.getSnapshot();
  return {
    ok: true,
    ollama: await ollamaHealth(),
    parser: { state: "idle", lastParse: s.latestRaid.parsed },
    replayCache: { sizeMb: 412, encounters: 18 },
  };
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    return res.end();
  }

  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;
  const method = req.method;

  try {
    /* ---- read endpoints ---- */
    if (method === "GET" && path === "/api/health") {
      return send(res, 200, await health());
    }
    if (method === "GET" && path === "/api/bootstrap") {
      return send(res, 200, ds.getSnapshot());
    }
    if (method === "GET" && path === "/api/notebook") {
      return send(res, 200, store.listNotes());
    }
    if (method === "GET" && path === "/api/observations") {
      return send(res, 200, store.listObservations());
    }
    if (method === "GET" && path === "/api/contribute/package") {
      return send(res, 200, ds.getContributePackage(url.searchParams.get("raidId")));
    }

    /* ---- Workshop ---- */
    if (method === "POST" && path === "/api/workshop/ask") {
      const body = await readBody(req);
      return send(res, 200, await workshop.ask(body.query, body.context ?? null));
    }

    /* ---- Notebook writes ---- */
    if (method === "POST" && path === "/api/notebook") {
      return send(res, 200, store.addNote(await readBody(req)));
    }
    const noteMatch = path.match(/^\/api\/notebook\/([^/]+)$/);
    if (noteMatch && method === "PATCH") {
      const updated = store.updateNote(noteMatch[1], await readBody(req));
      if (!updated) return send(res, 404, { error: "note not found" });
      return send(res, 200, updated);
    }
    if (noteMatch && method === "DELETE") {
      store.removeNote(noteMatch[1]);
      return send(res, 200, { ok: true });
    }

    /* ---- Observation writes ---- */
    if (method === "POST" && path === "/api/observations") {
      return send(res, 200, store.shareObservation(await readBody(req)));
    }
    const withdrawMatch = path.match(/^\/api\/observations\/([^/]+)\/withdraw$/);
    if (withdrawMatch && method === "POST") {
      store.withdrawObservation(withdrawMatch[1]);
      return send(res, 200, { ok: true });
    }

    /* ---- Contribution ---- */
    if (method === "POST" && path === "/api/contribute/submit") {
      const body = await readBody(req);
      return send(res, 200, {
        ok: true,
        id: `contrib-${body.raidId ?? "raid"}-${Date.now()}`,
      });
    }

    send(res, 404, { error: `no route for ${method} ${path}` });
  } catch (err) {
    send(res, 500, { error: String(err?.message ?? err) });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Lantern server · http://127.0.0.1:${PORT}`);
});
