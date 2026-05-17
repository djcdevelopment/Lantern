/* ============================================================
   MemoryProvider — the player's authored memory
   ------------------------------------------------------------
   Notebook (local-only notes) and Observations (interpretations
   shared with the guild). Reactive: mutations write through the
   API's persistence-backed services, then refresh in-memory
   state so the sidebar badges and lists stay live.
   ============================================================ */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, CloudUnavailableError } from "@/api";
import type {
  BindingKind,
  Note,
  NoteDraft,
  Observation,
  ObservationDraft,
} from "@/api";

interface MemoryValue {
  notes: Note[];
  observations: Observation[];
  addNote: (draft: NoteDraft) => Promise<Note>;
  updateNote: (
    id: string,
    patch: Partial<Pick<Note, "text" | "tags" | "pinned">>,
  ) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  shareObservation: (draft: ObservationDraft) => Promise<Observation>;
  withdrawObservation: (id: string) => Promise<void>;
  /** Notes anchored to a given binding target. */
  notesByBinding: (kind: BindingKind, ref: string) => Note[];
  /** The observation a note was shared as, if any. */
  observationByNoteId: (noteId: string) => Observation | undefined;
}

const MemoryContext = createContext<MemoryValue | null>(null);

export function MemoryProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);

  useEffect(() => {
    api.notebook.list().then(setNotes);
    api.observations.list().then(setObservations);
  }, []);

  const value = useMemo<MemoryValue>(() => {
    const refreshNotes = async () => setNotes(await api.notebook.list());
    const refreshObs = async () => setObservations(await api.observations.list());

    // The hosted (cloud) build is read-only — write calls reject with
    // CloudUnavailableError. Swallow that one error so a click is a quiet
    // no-op (the CloudBanner explains it); re-throw anything else.
    const ignoreCloud = (err: unknown) => {
      if (!(err instanceof CloudUnavailableError)) throw err;
    };

    return {
      notes,
      observations,
      addNote: async (draft) => {
        try {
          const note = await api.notebook.add(draft);
          await refreshNotes();
          return note;
        } catch (err) {
          ignoreCloud(err);
          return {
            id: "cloud-noop",
            text: draft.text,
            tags: draft.tags ?? [],
            binding: draft.binding ?? null,
            createdAt: "—",
          };
        }
      },
      updateNote: async (id, patch) => {
        try {
          await api.notebook.update(id, patch);
          await refreshNotes();
        } catch (err) {
          ignoreCloud(err);
        }
      },
      removeNote: async (id) => {
        try {
          await api.notebook.remove(id);
          await refreshNotes();
        } catch (err) {
          ignoreCloud(err);
        }
      },
      shareObservation: async (draft) => {
        try {
          const obs = await api.observations.share(draft);
          await refreshObs();
          return obs;
        } catch (err) {
          ignoreCloud(err);
          return {
            id: "cloud-noop",
            status: "shared",
            sharedAt: "—",
            raidId: "",
            kind: draft.kind ?? "teamwork",
            title: draft.title ?? "",
            description: draft.description ?? "",
            credits: draft.credits ?? [],
            binding: draft.binding ?? null,
            sources: draft.sources ?? [],
          };
        }
      },
      withdrawObservation: async (id) => {
        try {
          await api.observations.withdraw(id);
          await refreshObs();
        } catch (err) {
          ignoreCloud(err);
        }
      },
      notesByBinding: (kind, ref) =>
        notes.filter((n) => {
          const b = n.binding;
          if (!b || b.kind !== kind) return false;
          if (kind === "cohort") return b.scenarioId === ref;
          if (kind === "pull") return b.pullId === ref;
          if (kind === "raid") return b.raidId === ref;
          if (kind === "encounter") return b.encounterId === ref;
          return false;
        }),
      observationByNoteId: (noteId) =>
        observations.find((o) => o.fromNoteId === noteId),
    };
  }, [notes, observations]);

  return (
    <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>
  );
}

function useMemoryStore(): MemoryValue {
  const ctx = useContext(MemoryContext);
  if (!ctx) throw new Error("memory hooks must be used within MemoryProvider");
  return ctx;
}

/** Notebook slice of the memory store. */
export function useNotebook() {
  const m = useMemoryStore();
  return {
    notes: m.notes,
    addNote: m.addNote,
    updateNote: m.updateNote,
    removeNote: m.removeNote,
    notesByBinding: m.notesByBinding,
  };
}

/** Observations slice of the memory store. */
export function useObservations() {
  const m = useMemoryStore();
  return {
    observations: m.observations,
    shareObservation: m.shareObservation,
    withdrawObservation: m.withdrawObservation,
    observationByNoteId: m.observationByNoteId,
  };
}
