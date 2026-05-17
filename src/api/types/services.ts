/* ============================================================
   Lantern — Service contracts
   ------------------------------------------------------------
   The API surface the app talks to. `src/api/index.ts` binds
   ONE implementation of `LanternApi`. The HTTP implementation
   (src/api/http) talks to the local server; a cloud build reads
   pre-rendered static blobs. See CONTRACTS.md.
   ============================================================ */

import type {
  SessionSnapshot,
  HealthStatus,
  WorkshopAnswer,
  Note,
  NoteDraft,
  Observation,
  ObservationDraft,
  PackageItem,
  ConsentItem,
} from "./domain";

/**
 * Low-level key/value persistence for client-side UI preferences
 * (the tweaks panel). Bound to localStorage. Notebook and
 * observations are NOT stored here — those go through the server.
 */
export interface PersistenceAdapter {
  read<T>(key: string): T | null;
  write<T>(key: string, value: T): void;
}

/** Scoping passed to the Workshop alongside a free-text question. */
export interface WorkshopContext {
  /** Cohort scenario id, when the question is cohort-scoped. */
  cohortId?: string | null;
  members?: string[];
  range?: [number, number];
  pullId?: string;
}

/** Local-AI exploration. A real impl wraps the Ollama call. */
export interface WorkshopService {
  /**
   * Answer a question. The returned answer carries its own query
   * plan (`trace`), prose with inline citations (`body`), and the
   * sources it was built from.
   */
  ask(query: string, context: WorkshopContext | null): Promise<WorkshopAnswer>;
}

/** The player's local-only notebook. Backed by persistence. */
export interface NotebookService {
  list(): Promise<Note[]>;
  add(draft: NoteDraft): Promise<Note>;
  update(
    id: string,
    patch: Partial<Pick<Note, "text" | "tags" | "pinned">>,
  ): Promise<Note>;
  remove(id: string): Promise<void>;
}

/** Observations shared with the guild. Backed by persistence. */
export interface ObservationService {
  list(): Promise<Observation[]>;
  share(draft: ObservationDraft): Promise<Observation>;
  withdraw(id: string): Promise<void>;
}

/** Result of a successful contribution upload. */
export interface ContributeResult {
  ok: true;
  id: string;
}

/** The calm consent flow for sharing a parsed raid with the guild. */
export interface ContributeService {
  getPackage(
    raidId: string,
  ): Promise<{ items: PackageItem[]; consent: ConsentItem[] }>;
  submit(
    raidId: string,
    consents: Record<string, boolean>,
  ): Promise<ContributeResult>;
}

/**
 * The whole API surface. The UI imports exactly one binding of
 * this — see `src/api/index.ts`.
 */
export interface LanternApi {
  /**
   * One-shot load of the local archive at app startup. Identity
   * (`snapshot.player`) is resolved here too — a real build would
   * read it from the signed-in session.
   */
  bootstrap(): Promise<SessionSnapshot>;
  /** Live status of the local services (parser, Ollama, cache). */
  getHealth(): Promise<HealthStatus>;
  workshop: WorkshopService;
  notebook: NotebookService;
  observations: ObservationService;
  contribute: ContributeService;
}
