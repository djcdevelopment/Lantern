/* ============================================================
   HTTP client — the transport under the LanternApi binding.
   ------------------------------------------------------------
   Two modes, chosen at build time:

   • Local (default) — talks to the Lantern server on :5181
     (override with VITE_API_BASE). All reads + writes work.

   • Cloud (VITE_CLOUD_MODE=true) — GET URLs are rewritten to the
     flat static-blob paths baked by scripts/prerender.mjs. Writes
     (POST/PATCH/DELETE) throw CloudUnavailableError — the hosted
     build is read-only; authoring needs the local app.

   Cloud URL convention (must match scripts/prerender.mjs):
     GET /api/foo?b=2&a=1  →  <BASE>/api/foo--a=1--b=2.json
     (query keys sorted alphabetically; path segments preserved)
   ============================================================ */

const RAW_BASE = import.meta.env.VITE_API_BASE as string | undefined;

/** True in builds produced by `npm run build:cloud`. */
export const CLOUD_MODE = import.meta.env.VITE_CLOUD_MODE === "true";

/** Base URL for API calls. Local → the server; cloud → same origin. */
export const API_BASE = (RAW_BASE ?? (CLOUD_MODE ? "" : "http://127.0.0.1:5181")).replace(
  /\/$/,
  "",
);

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class CloudUnavailableError extends Error {
  constructor(message = "This needs the local Lantern app.") {
    super(message);
    this.name = "CloudUnavailableError";
  }
}

/** Map a runtime GET URL to its flat static-blob path (cloud mode). */
export function toCloudPath(path: string): string {
  const qIdx = path.indexOf("?");
  const basePath = qIdx === -1 ? path : path.slice(0, qIdx);
  const params = new URLSearchParams(qIdx === -1 ? "" : path.slice(qIdx + 1));
  const parts: string[] = [];
  for (const k of [...params.keys()].sort()) parts.push(`${k}=${params.get(k)}`);
  const suffix = parts.length ? "--" + parts.join("--") : "";
  return `${basePath}${suffix}.json`;
}

export async function getJson<T>(path: string): Promise<T> {
  const url = CLOUD_MODE ? API_BASE + toCloudPath(path) : API_BASE + path;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new ApiError(0, `Cannot reach ${url} — ${String((err as Error).message)}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function writeJson<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  if (CLOUD_MODE) {
    throw new CloudUnavailableError(
      `${method} ${path} is not available on the hosted app — open Lantern locally.`,
    );
  }
  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(
      0,
      `Cannot reach ${API_BASE + path} — ${String((err as Error).message)}`,
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const postJson = <T>(path: string, body?: unknown) =>
  writeJson<T>("POST", path, body);
export const patchJson = <T>(path: string, body?: unknown) =>
  writeJson<T>("PATCH", path, body);
export const deleteJson = <T>(path: string) => writeJson<T>("DELETE", path);
