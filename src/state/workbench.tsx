/* ============================================================
   WorkbenchProvider — ephemeral app-shell state
   ------------------------------------------------------------
   Everything that lives only for the current session and is not
   archive data: the active cohort selection, queued questions,
   UI preferences (tweaks), and the openers for the global modals
   (command palette, propose, quick-note, moment drawer).
   ============================================================ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { persistence, CLOUD_MODE } from "@/api";
import type {
  CohortContext,
  Moment,
  NoteBinding,
  ObservationDraft,
  Tweaks,
} from "@/api";
import { useSession } from "./session";

const TWEAKS_KEY = "campfire.tweaks.v1";

const TWEAK_DEFAULTS: Tweaks = {
  density: "comfortable",
  homeLayout: "timeline",
  aiTone: "trace",
  showSupport: true,
  theme: "dark",
};

/** Seed for the quick-note modal. */
export interface QuickNoteSeed {
  text?: string;
  tags?: string[];
  binding?: NoteBinding | null;
}

/** A question queued for the Workshop by another surface. */
export interface AskQueued {
  q: string;
  at: number;
}

interface WorkbenchValue {
  /* cohort selection */
  cohortContext: CohortContext | null;
  setCohortContext: (c: CohortContext | null) => void;
  /* queued workshop question */
  askQueued: AskQueued | null;
  /* UI preferences */
  tweaks: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
  /* modal state (read by the Shell) */
  proposeSeed: ObservationDraft | null;
  quickNoteSeed: QuickNoteSeed | null;
  activeMoment: Moment | null;
  paletteOpen: boolean;
  tweaksOpen: boolean;
  /* modal openers / closers */
  openPropose: (seed?: ObservationDraft) => void;
  closePropose: () => void;
  openQuickNote: (seed?: QuickNoteSeed) => void;
  closeQuickNote: () => void;
  openMoment: (m: Moment) => void;
  closeMoment: () => void;
  openPalette: () => void;
  closePalette: () => void;
  openTweaks: () => void;
  closeTweaks: () => void;
  /* cross-surface navigation helpers */
  openCohort: (scenarioId: string) => void;
  askQuestion: (q: string) => void;
}

const WorkbenchContext = createContext<WorkbenchValue | null>(null);

function loadTweaks(): Tweaks {
  const stored = persistence.read<Partial<Tweaks>>(TWEAKS_KEY);
  return { ...TWEAK_DEFAULTS, ...(stored ?? {}) };
}

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const { cohortScenarios } = useSession();
  const navigate = useNavigate();

  const [cohortContext, setCohortContext] = useState<CohortContext | null>(null);
  const [askQueued, setAskQueued] = useState<AskQueued | null>(null);
  const [tweaks, setTweaks] = useState<Tweaks>(loadTweaks);

  const [proposeSeed, setProposeSeed] = useState<ObservationDraft | null>(null);
  const [quickNoteSeed, setQuickNoteSeed] = useState<QuickNoteSeed | null>(null);
  const [activeMoment, setActiveMoment] = useState<Moment | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  /* Apply theme via data attribute so every CSS variable flips together. */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tweaks.theme);
  }, [tweaks.theme]);

  /* Density scales spacing app-wide. */
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--density",
      tweaks.density === "compact" ? "0.78" : "1",
    );
  }, [tweaks.density]);

  const setTweak = useCallback<WorkbenchValue["setTweak"]>((key, value) => {
    setTweaks((prev) => {
      const next = { ...prev, [key]: value };
      persistence.write(TWEAKS_KEY, next);
      return next;
    });
  }, []);

  const openCohort = useCallback(
    (scenarioId: string) => {
      const s = cohortScenarios[scenarioId];
      if (!s) return;
      setCohortContext({
        scenarioId: s.id,
        members: s.members,
        range: s.range,
        pullId: s.pullId,
        pullLabel: s.pullLabel,
        t: s.t,
      });
      navigate("/replay");
    },
    [cohortScenarios, navigate],
  );

  const askQuestion = useCallback(
    (q: string) => {
      setAskQueued({ q, at: Date.now() });
      navigate("/ask");
    },
    [navigate],
  );

  const value = useMemo<WorkbenchValue>(
    () => ({
      cohortContext,
      setCohortContext,
      askQueued,
      tweaks,
      setTweak,
      proposeSeed,
      quickNoteSeed,
      activeMoment,
      paletteOpen,
      tweaksOpen,
      // Authoring is local-only — the hosted (cloud) build is read-only,
      // so these openers no-op there (the CloudBanner explains why).
      openPropose: (seed) => {
        if (!CLOUD_MODE) setProposeSeed(seed ?? {});
      },
      closePropose: () => setProposeSeed(null),
      openQuickNote: (seed) => {
        if (!CLOUD_MODE) setQuickNoteSeed(seed ?? {});
      },
      closeQuickNote: () => setQuickNoteSeed(null),
      openMoment: (m) => setActiveMoment(m),
      closeMoment: () => setActiveMoment(null),
      openPalette: () => setPaletteOpen(true),
      closePalette: () => setPaletteOpen(false),
      openTweaks: () => setTweaksOpen(true),
      closeTweaks: () => setTweaksOpen(false),
      openCohort,
      askQuestion,
    }),
    [
      cohortContext,
      askQueued,
      tweaks,
      setTweak,
      proposeSeed,
      quickNoteSeed,
      activeMoment,
      paletteOpen,
      tweaksOpen,
      openCohort,
      askQuestion,
    ],
  );

  return (
    <WorkbenchContext.Provider value={value}>
      {children}
    </WorkbenchContext.Provider>
  );
}

/** Ephemeral app-shell state: cohort context, tweaks, modal openers. */
export function useWorkbench(): WorkbenchValue {
  const ctx = useContext(WorkbenchContext);
  if (!ctx) throw new Error("useWorkbench must be used within WorkbenchProvider");
  return ctx;
}
