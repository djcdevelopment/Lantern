/* global React, window */
// ⌘K command palette — keyboard-driven jump-to-anywhere.

const { useState: useStateK, useEffect: useEffectK, useMemo: useMemoK, useRef: useRefK } = React;

const CommandPalette = ({ open, onClose, setRoute, openCohort, askQuestion, openPropose }) => {
  const [q, setQ] = useStateK("");
  const [cursor, setCursor] = useStateK(0);
  const inputRef = useRefK(null);

  useEffectK(() => {
    if (open) {
      setQ("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Compose all available commands.
  const allCommands = useMemoK(() => {
    const cmds = [];

    // Navigation
    const nav = [
      { kind: "nav", title: "Home",       hint: "1", action: () => setRoute("home") },
      { kind: "nav", title: "Raids",      hint: "2", action: () => setRoute("raids") },
      { kind: "nav", title: "Replay",     hint: "3", action: () => setRoute("replay") },
      { kind: "nav", title: "Workshop",   hint: "4", action: () => setRoute("ask") },
      { kind: "nav", title: "Contribute", hint: "5", action: () => setRoute("contribute") },
      { kind: "nav", title: "Notebook",   hint: "7", action: () => setRoute("notebook") },
      { kind: "nav", title: "Settings",   hint: "6", action: () => setRoute("settings") },
    ];
    nav.forEach(c => cmds.push({ ...c, section: "Jump to" }));

    // Cohort scenarios
    Object.values(window.COHORT_SCENARIOS || {}).forEach(s => cmds.push({
      kind: "cohort",
      section: "Cohort scenarios",
      title: s.title,
      subtitle: s.pullLabel + " · " + s.members.length + " raiders",
      action: () => openCohort(s.id),
    }));

    // Propose for the retro — quick action
    cmds.push({
      kind: "propose",
      section: "Share as an observation",
      title: "Share an observation with the guild",
      subtitle: "Send a moment to the Workshop — not a retro entry",
      action: () => openPropose && openPropose({}),
    });
    Object.values(window.COHORT_SCENARIOS || {}).forEach(s => cmds.push({
      kind: "propose",
      section: "Share as an observation",
      title: `Share: ${s.title}`,
      subtitle: "pre-filled from cohort · you'll review before sharing",
      action: () => openPropose && openPropose({
        kind: s.id === "extcd" ? "teamwork" : s.id === "spread" ? "teamwork" : "celebration",
        title: s.title,
        description: s.summary,
        credits: s.members,
        binding: { kind: "cohort", scenarioId: s.id, label: s.title + " · " + s.pullLabel },
      }),
    }));

    // Direct nav to Observations
    cmds.push({
      kind: "nav",
      section: "Jump to",
      title: "Observations",
      hint: "8",
      action: () => setRoute("observations"),
    });

    // Recent raids
    (window.RAID_HISTORY || []).slice(0, 4).forEach(r => cmds.push({
      kind: "raid",
      section: "Raids",
      title: r.title,
      subtitle: r.day + " · " + r.date + " · " + r.bosses,
      action: () => setRoute("raids/2026-05-12"),
    }));

    // Suggested questions
    (window.ASK_SUGGESTIONS || []).slice(0, 4).forEach(s => cmds.push({
      kind: "ask",
      section: "Ask the Workshop",
      title: s,
      action: () => { askQuestion(s); },
    }));
    (window.COHORT_SUGGESTIONS || []).slice(0, 3).forEach(s => cmds.push({
      kind: "ask",
      section: "Ask the Workshop",
      title: s,
      subtitle: "cohort-aware",
      action: () => { askQuestion(s); },
    }));

    // Notebook entries
    if (window.Notebook) {
      window.Notebook.all().slice(0, 8).forEach(n => cmds.push({
        kind: "note",
        section: "Notebook",
        title: n.text.length > 80 ? n.text.slice(0, 80) + "…" : n.text,
        subtitle: n.binding?.label || (n.tags.length ? n.tags.map(t => "#" + t).join(" ") : "free-floating"),
        action: () => setRoute("notebook"),
      }));
    }

    // Pulls / moments
    cmds.push({ kind: "moment", section: "Moments", title: "Mug'Zee · Pull 6 · 04:32 · your death",
      subtitle: "open at this timestamp", action: () => setRoute("replay") });
    cmds.push({ kind: "moment", section: "Moments", title: "Stix Bunkjunker · kill pull",
      subtitle: "comeback · five raiders under 8% HP", action: () => setRoute("replay") });

    return cmds;
  }, []);

  const matched = useMemoK(() => {
    if (!q.trim()) return allCommands;
    const needle = q.toLowerCase();
    return allCommands.filter(c =>
      c.title.toLowerCase().includes(needle) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(needle)) ||
      c.section.toLowerCase().includes(needle)
    );
  }, [q, allCommands]);

  // Reset cursor when filter changes.
  useEffectK(() => { setCursor(0); }, [q]);

  // Keyboard handling.
  useEffectK(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(matched.length - 1, c + 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(0, c - 1)); }
      if (e.key === "Enter")     {
        e.preventDefault();
        if (matched[cursor]) {
          matched[cursor].action();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, matched, cursor]);

  if (!open) return null;

  // Group matched by section, preserving original section order.
  const grouped = [];
  const seen = new Set();
  matched.forEach(c => {
    if (!seen.has(c.section)) { seen.add(c.section); grouped.push({ section: c.section, items: [] }); }
    grouped[grouped.findIndex(g => g.section === c.section)].items.push(c);
  });

  let flatIdx = 0;

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <Icon name="search" size={14} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump anywhere, ask a question, find a moment…"
          />
          <span className="kbd-row"><kbd>esc</kbd></span>
        </div>
        <div className="palette-results">
          {grouped.length === 0 && (
            <div className="palette-empty">
              No matches. Try "pull", "cohort", "settings", or a question.
            </div>
          )}
          {grouped.map((g, gi) => (
            <div key={gi} className="palette-group">
              <div className="palette-section">{g.section}</div>
              {g.items.map((c) => {
                const idx = flatIdx++;
                return (
                  <div
                    key={idx}
                    className={`palette-item ${idx === cursor ? "active" : ""}`}
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => { c.action(); onClose(); }}
                  >
                    <span className={`palette-kind kind-${c.kind}`}>
                      <Icon name={kindIcon(c.kind)} size={12} />
                    </span>
                    <div className="palette-title">
                      <div>{c.title}</div>
                      {c.subtitle && <div className="palette-subtitle">{c.subtitle}</div>}
                    </div>
                    {c.hint && <span className="kbd-row"><kbd>{c.hint}</kbd></span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span className="kbd-row"><kbd>↑</kbd><kbd>↓</kbd></span>
          <span>navigate</span>
          <span style={{margin: "0 8px"}}>·</span>
          <span className="kbd-row"><kbd>↵</kbd></span>
          <span>open</span>
          <span style={{margin: "0 8px"}}>·</span>
          <span className="kbd-row"><kbd>esc</kbd></span>
          <span>close</span>
          <span style={{flex: 1}}></span>
          <span style={{color: "var(--text-mute)"}}>{matched.length} results · local</span>
        </div>
      </div>
    </div>
  );
};

const kindIcon = (k) => ({
  nav: "arrowR",
  cohort: "spark",
  raid: "raids",
  ask: "ask",
  note: "book",
  moment: "play",
  propose: "upload",
}[k] || "arrowR");

window.CommandPalette = CommandPalette;
