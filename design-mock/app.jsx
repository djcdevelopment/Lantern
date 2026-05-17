/* global React, ReactDOM, window */
// App shell: routing, tweaks, keyboard, cohort context, palette.

const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "homeLayout": "timeline",
  "aiTone": "trace",
  "showSupport": true,
  "theme": "dark"
}/*EDITMODE-END*/;

function App() {
  const [route, setRoute] = useStateApp("home");
  const [cohortContext, setCohortContext] = useStateApp(null);
  const [paletteOpen, setPaletteOpen] = useStateApp(false);
  const [askQueued, setAskQueued] = useStateApp(null);
  const [proposeState, setProposeState] = useStateApp(null);
  const [quickNoteState, setQuickNoteState] = useStateApp(null);
  const [activeMoment, setActiveMoment] = useStateApp(null);
  const [, setBump] = useStateApp(0);

  // Wire global openers so any component can call them.
  useEffectApp(() => {
    window.Propose = window.Propose || {};
    window.Propose.open = (seed) => setProposeState(seed || {});
    window.QuickNote = window.QuickNote || {};
    window.QuickNote.open = (seed) => setQuickNoteState(seed || {});
    window.Moment = window.Moment || {};
    window.Moment.open = (moment) => setActiveMoment(moment);
    window.__goRoute = setRoute;
    window.__campfireTick = () => setBump(x => x + 1);
  }, []);

  // useTweaks returns [values, setTweak]. Flatten into one object so
  // accessor patterns like `tweaks.theme` and `tweaks.setTweak(...)` work.
  const [tweakValues, setTweakFn] = window.useTweaks
    ? window.useTweaks(TWEAK_DEFAULTS)
    : [TWEAK_DEFAULTS, () => {}];
  const tweaks = React.useMemo(
    () => ({ ...tweakValues, setTweak: setTweakFn }),
    [tweakValues, setTweakFn]
  );

  useEffectApp(() => {
    document.documentElement.style.setProperty(
      "--density",
      tweaks.density === "compact" ? "0.78" : "1"
    );
  }, [tweaks.density]);

  // Apply theme via data attribute so all CSS variables flip together.
  useEffectApp(() => {
    document.documentElement.setAttribute("data-theme", tweaks.theme || "dark");
    // Notify the topbar ThemeCycle to re-read the attribute.
    window.dispatchEvent(new CustomEvent("campfire:theme-changed"));
  }, [tweaks.theme]);

  // Global keyboard.
  useEffectApp(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        // Allow ⌘K to open palette even from inputs.
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          setPaletteOpen(true);
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (e.metaKey || e.ctrlKey) return;
      // Quick-write note from anywhere (no nav, opens modal)
      if (e.key.toLowerCase() === "n" && !paletteOpen && !proposeState && !quickNoteState) {
        e.preventDefault();
        setQuickNoteState({});
        return;
      }
      const keys = {
        "1": "home", "2": "raids", "3": "replay",
        "4": "ask", "5": "contribute", "6": "settings",
        "7": "notebook", "8": "observations",
      };
      if (keys[e.key]) setRoute(keys[e.key]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen]);

  const openCohort = (scenarioId) => {
    const s = window.COHORT_SCENARIOS[scenarioId];
    if (!s) return;
    setCohortContext({
      scenarioId: s.id,
      members: s.members,
      range: s.range,
      pullId: s.pullId,
      pullLabel: s.pullLabel,
      t: s.t,
    });
    setRoute("replay");
  };

  const askQuestion = (q) => {
    setAskQueued({ q, at: Date.now() });
    setRoute("ask");
  };

  const renderPage = () => {
    const base = route.split("/")[0];
    if (base === "home") return <window.HomePage setRoute={setRoute} openRaid={() => setRoute("raids/2026-05-12")} openCohort={openCohort} tweaks={tweaks} />;
    if (base === "raids") {
      if (route.includes("/")) return <window.RaidReviewPage setRoute={setRoute} openCohort={openCohort} tweaks={tweaks} />;
      return <window.RaidsListPage setRoute={setRoute} />;
    }
    if (base === "replay") return <window.ReplayPage setRoute={setRoute} cohortContext={cohortContext} setCohortContext={setCohortContext} askQuestion={askQuestion} />;
    if (base === "ask") return <window.AskPage setRoute={setRoute} tweaks={tweaks} cohortContext={cohortContext} setCohortContext={setCohortContext} askQueued={askQueued} />;
    if (base === "contribute")   return <window.ContributePage setRoute={setRoute} />;
    if (base === "notebook")     return <window.NotebookPage setRoute={setRoute} openCohort={openCohort} />;
    if (base === "observations") return <window.ObservationsPage setRoute={setRoute} openCohort={openCohort} />;
    if (base === "settings")     return <window.SettingsPage />;
    return <window.HomePage setRoute={setRoute} tweaks={tweaks} openCohort={openCohort} />;
  };

  return (
    <div className="app">
      <window.Topbar onOpenCmd={() => setPaletteOpen(true)} />
      <window.Sidebar route={route} setRoute={setRoute} />
      <div className="main">
        {renderPage()}
      </div>

      {window.CommandPalette && (
        <window.CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          setRoute={setRoute}
          openCohort={openCohort}
          askQuestion={askQuestion}
          openPropose={(seed) => setProposeState(seed || {})}
        />
      )}

      {proposeState && window.ProposeModal && (
        <window.ProposeModal
          seed={proposeState}
          onClose={() => setProposeState(null)}
        />
      )}

      {quickNoteState && window.QuickNoteModal && (
        <window.QuickNoteModal
          seed={quickNoteState}
          onClose={() => setQuickNoteState(null)}
        />
      )}

      {activeMoment && window.MomentDrawer && (
        <window.MomentDrawer
          moment={activeMoment}
          onClose={() => setActiveMoment(null)}
          setRoute={setRoute}
          setCohortContext={setCohortContext}
          askQuestion={askQuestion}
        />
      )}

      {window.TweaksPanel && (
        <window.TweaksPanel>
          <window.TweakSection label="Layout">
            <window.TweakRadio
              label="Theme"
              value={tweaks.theme}
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
                { value: "gad", label: "GAD" },
              ]}
              onChange={(v) => tweaks.setTweak("theme", v)}
            />
            <window.TweakRadio
              label="Density"
              value={tweaks.density}
              options={[
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
              ]}
              onChange={(v) => tweaks.setTweak("density", v)}
            />
            <window.TweakRadio
              label="Home layout"
              value={tweaks.homeLayout}
              options={[
                { value: "timeline", label: "Timeline" },
                { value: "moments", label: "Moments" },
                { value: "roster", label: "Roster" },
              ]}
              onChange={(v) => tweaks.setTweak("homeLayout", v)}
            />
          </window.TweakSection>

          <window.TweakSection label="Workshop">
            <window.TweakRadio
              label="Answer tone"
              value={tweaks.aiTone}
              options={[
                { value: "trace", label: "Trace" },
                { value: "minimal", label: "Quiet" },
                { value: "tool", label: "Tool" },
              ]}
              onChange={(v) => tweaks.setTweak("aiTone", v)}
            />
          </window.TweakSection>

          <window.TweakSection label="Surfacing">
            <window.TweakToggle
              label="Show support contributions"
              value={tweaks.showSupport}
              onChange={(v) => tweaks.setTweak("showSupport", v)}
            />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
