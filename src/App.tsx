/* ============================================================
   App — provider composition, shell chrome, routing, modals.
   ============================================================ */

import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { SessionProvider } from "@/state/session";
import { MemoryProvider } from "@/state/memory";
import { WorkbenchProvider, useWorkbench } from "@/state/workbench";

import { Topbar } from "@/components/shell/Topbar";
import { Sidebar } from "@/components/shell/Sidebar";
import { CloudBanner } from "@/components/shell/CloudBanner";
import { KEY_ROUTES } from "@/components/shell/nav";

import { CommandPalette } from "@/components/modals/CommandPalette";
import { ProposeModal } from "@/components/modals/ProposeModal";
import { QuickNoteModal } from "@/components/modals/QuickNoteModal";
import { MomentDrawer } from "@/components/modals/MomentDrawer";
import { TweaksPanel } from "@/components/tweaks/TweaksPanel";

import { HomePage } from "@/pages/HomePage";
import { RaidsListPage } from "@/pages/RaidsListPage";
import { RaidReviewPage } from "@/pages/RaidReviewPage";
import { ReplayPage } from "@/pages/ReplayPage";
import { AskPage } from "@/pages/AskPage";
import { ContributePage } from "@/pages/ContributePage";
import { NotebookPage } from "@/pages/NotebookPage";
import { ObservationsPage } from "@/pages/ObservationsPage";
import { SettingsPage } from "@/pages/SettingsPage";

/* ---------- Global keyboard shortcuts ---------- */
function useGlobalKeys() {
  const navigate = useNavigate();
  const {
    openPalette,
    openQuickNote,
    paletteOpen,
    proposeSeed,
    quickNoteSeed,
    activeMoment,
  } = useWorkbench();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA";

      // ⌘K / Ctrl+K opens the palette from anywhere, even inputs.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
        return;
      }
      if (inField || e.metaKey || e.ctrlKey) return;

      // Quick-write a note from anywhere.
      if (
        e.key.toLowerCase() === "n" &&
        !paletteOpen &&
        !proposeSeed &&
        !quickNoteSeed &&
        !activeMoment
      ) {
        e.preventDefault();
        openQuickNote();
        return;
      }

      // Number keys jump between routes.
      const to = KEY_ROUTES[e.key];
      if (to) navigate(to);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    navigate,
    openPalette,
    openQuickNote,
    paletteOpen,
    proposeSeed,
    quickNoteSeed,
    activeMoment,
  ]);
}

/* ---------- Global modal layer ---------- */
function ModalLayer() {
  const wb = useWorkbench();
  return (
    <>
      <CommandPalette open={wb.paletteOpen} onClose={wb.closePalette} />
      {wb.proposeSeed && (
        <ProposeModal seed={wb.proposeSeed} onClose={wb.closePropose} />
      )}
      {wb.quickNoteSeed && (
        <QuickNoteModal seed={wb.quickNoteSeed} onClose={wb.closeQuickNote} />
      )}
      {wb.activeMoment && (
        <MomentDrawer moment={wb.activeMoment} onClose={wb.closeMoment} />
      )}
      {wb.tweaksOpen && <TweaksPanel onClose={wb.closeTweaks} />}
    </>
  );
}

/* ---------- Shell ---------- */
function Shell() {
  useGlobalKeys();
  return (
    <div className="app">
      <Topbar />
      <Sidebar />
      <div className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/raids" element={<RaidsListPage />} />
          <Route path="/raids/:date" element={<RaidReviewPage />} />
          <Route path="/replay" element={<ReplayPage />} />
          <Route path="/ask" element={<AskPage />} />
          <Route path="/contribute" element={<ContributePage />} />
          <Route path="/notebook" element={<NotebookPage />} />
          <Route path="/observations" element={<ObservationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <ModalLayer />
      <CloudBanner />
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <MemoryProvider>
        <WorkbenchProvider>
          <Shell />
        </WorkbenchProvider>
      </MemoryProvider>
    </SessionProvider>
  );
}
