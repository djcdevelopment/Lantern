/* ============================================================
   httpApi — the LanternApi binding used by the app.
   ------------------------------------------------------------
   Implements the LanternApi contract over HTTP. Every method is
   a thin call through the client; local vs cloud behavior is
   decided entirely inside client.ts.
   ============================================================ */

import { getJson, postJson, patchJson, deleteJson } from "./client";
import type {
  LanternApi,
  SessionSnapshot,
  HealthStatus,
  WorkshopAnswer,
  Note,
  Observation,
  PackageItem,
  ConsentItem,
  ContributeResult,
} from "../types";

export const httpApi: LanternApi = {
  bootstrap: () => getJson<SessionSnapshot>("/api/bootstrap"),

  getHealth: () => getJson<HealthStatus>("/api/health"),

  workshop: {
    ask: (query, context) =>
      postJson<WorkshopAnswer>("/api/workshop/ask", { query, context }),
  },

  notebook: {
    list: () => getJson<Note[]>("/api/notebook"),
    add: (draft) => postJson<Note>("/api/notebook", draft),
    update: (id, patch) =>
      patchJson<Note>(`/api/notebook/${encodeURIComponent(id)}`, patch),
    remove: (id) =>
      deleteJson<{ ok: true }>(`/api/notebook/${encodeURIComponent(id)}`).then(
        () => undefined,
      ),
  },

  observations: {
    list: () => getJson<Observation[]>("/api/observations"),
    share: (draft) => postJson<Observation>("/api/observations", draft),
    withdraw: (id) =>
      postJson<{ ok: true }>(
        `/api/observations/${encodeURIComponent(id)}/withdraw`,
      ).then(() => undefined),
  },

  contribute: {
    getPackage: (raidId) =>
      getJson<{ items: PackageItem[]; consent: ConsentItem[] }>(
        `/api/contribute/package?raidId=${encodeURIComponent(raidId)}`,
      ),
    submit: (raidId, consents) =>
      postJson<ContributeResult>("/api/contribute/submit", { raidId, consents }),
  },
};
