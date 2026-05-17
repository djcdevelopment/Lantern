/* ============================================================
   Lantern — API binding
   ------------------------------------------------------------
   THE SWAP POINT. The whole app imports `api` from here and
   nowhere else.

   `api` is the HTTP binding (src/api/http). In a local build it
   talks to the Lantern server on :5181; in a cloud build
   (`npm run build:cloud`) it reads pre-rendered static blobs and
   writes are disabled. The data source behind the server is the
   `dataSource` seam — see server/dataSource.mjs and CONTRACTS.md.

   `persistence` is the small client-side store for UI prefs only.
   ============================================================ */

import type { LanternApi, PersistenceAdapter } from "./types";
import { localStoragePersistence } from "./persistence/localStorage";
import { httpApi } from "./http/httpApi";

/** Client-side persistence — UI preferences (tweaks) only. */
export const persistence: PersistenceAdapter = localStoragePersistence;

/** The single API surface the UI talks to. */
export const api: LanternApi = httpApi;

export { CLOUD_MODE, API_BASE, ApiError, CloudUnavailableError } from "./http/client";
export * from "./types";
