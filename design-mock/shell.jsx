/* global React */
// Shared UI primitives + nav chrome.

const { useState, useEffect, useRef, useMemo } = React;

/* ---------- Icons (line, 16px) ---------- */
const Icon = ({ name, size = 16, stroke = 1.6 }) => {
  const paths = {
    home:      "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z",
    raids:     "M4 5h16M5 5v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5M9 9h6M9 13h6M9 17h4",
    replay:    "M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4M10 9l6 3-6 3Z",
    ask:       "M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-4 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z M8 10h8 M8 13h5",
    contribute:"M12 4v10 M7 9l5-5 5 5 M5 18h14",
    settings:  "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z M19.4 13.7l1.6 1-1.8 3.1-1.9-.6a7.9 7.9 0 0 1-1.7 1l-.4 2h-3.6l-.4-2a7.9 7.9 0 0 1-1.7-1l-1.9.6-1.8-3.1 1.6-1a7.6 7.6 0 0 1 0-2l-1.6-1 1.8-3.1 1.9.6a7.9 7.9 0 0 1 1.7-1l.4-2h3.6l.4 2a7.9 7.9 0 0 1 1.7 1l1.9-.6 1.8 3.1-1.6 1a7.6 7.6 0 0 1 0 2Z",
    spark:     "M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M5.6 18.4l2.1-2.1 M16.3 7.7l2.1-2.1",
    arrowR:    "M5 12h14 M13 6l6 6-6 6",
    arrowL:    "M19 12H5 M11 6l-6 6 6 6",
    chevR:     "M9 6l6 6-6 6",
    chevD:     "M6 9l6 6 6-6",
    play:      "M6 4l14 8-14 8Z",
    pause:     "M7 4h4v16H7Z M13 4h4v16h-4Z",
    flame:     "M12 22a6 6 0 0 0 6-6c0-4-3-5-3-9 0-2-2-4-3-5-1 2-2 3-2 5 0 3-4 4-4 9a6 6 0 0 0 6 6Z M12 22a3 3 0 0 0 3-3c0-2-2-2-2-4l-1-1c-1 1-3 2-3 5a3 3 0 0 0 3 3Z",
    check:     "M5 12l4 4 10-10",
    close:     "M6 6l12 12 M18 6L6 18",
    plus:      "M12 5v14 M5 12h14",
    search:    "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z M16 16l4 4",
    eye:       "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z",
    lock:      "M6 11V8a6 6 0 0 1 12 0v3 M5 11h14v10H5Z",
    upload:    "M12 4v12 M7 9l5-5 5 5 M5 20h14",
    cpu:       "M6 6h12v12H6Z M9 9h6v6H9Z M2 9h2 M2 15h2 M20 9h2 M20 15h2 M9 2v2 M15 2v2 M9 20v2 M15 20v2",
    book:      "M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2Z M5 18a2 2 0 0 1 2-2h12",
    swap:      "M4 7h14 M14 3l4 4-4 4 M20 17H6 M10 13l-4 4 4 4",
    skull:     "M12 3a7 7 0 0 0-7 7v4l2 2v3h2v-2h2v2h2v-2h2v2h2v-3l2-2v-4a7 7 0 0 0-7-7Z M9 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z M15 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
    shield:    "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Z",
    sparkle:   "M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4Z M19 16l.7 1.8L22 18l-2.3.7L19 20l-.7-1.5L16 18l2.3-.2Z",
    cog:       "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z M19.4 13.7l1.6 1-1.8 3.1-1.9-.6a7.9 7.9 0 0 1-1.7 1l-.4 2h-3.6l-.4-2a7.9 7.9 0 0 1-1.7-1l-1.9.6-1.8-3.1 1.6-1a7.6 7.6 0 0 1 0-2l-1.6-1 1.8-3.1 1.9.6a7.9 7.9 0 0 1 1.7-1l.4-2h3.6l.4 2a7.9 7.9 0 0 1 1.7 1l1.9-.6 1.8 3.1-1.6 1a7.6 7.6 0 0 1 0 2Z",
    folder:    "M3 6h6l2 2h10v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z",
  };
  const d = paths[name] || paths.spark;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
};

/* ---------- Spell icon placeholder ---------- */
const SpellIcon = ({ hue = 60, glyph, size = "" }) => (
  <span className={`spell-icon ${size}`} style={{ "--hue": hue }}>
    <span className="runic">{glyph || "✦"}</span>
  </span>
);

/* ---------- Player avatar ---------- */
const PAvatar = ({ name, hue, size = "" }) => (
  <span className={`pavatar ${size}`} style={{ "--hue": hue }} title={name}>
    {(name || "?").slice(0, 1)}
  </span>
);

/* ---------- Brand glyph (small lantern mark) ---------- */
const BrandGlyph = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="ember-glow"
       fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
       style={{ color: "var(--ember)" }}>
    <path d="M12 21a5 5 0 0 0 5-5c0-3-2.2-3.6-2.2-6.5 0-1.8-1.4-3-2.8-4.5-.8 1.6-1.6 2.5-1.6 4 0 2.5-3.4 3-3.4 7a5 5 0 0 0 5 5Z" fill="oklch(0.55 0.13 45 / 0.4)" />
    <path d="M12 21a2.5 2.5 0 0 0 2.5-2.5c0-1.5-1.5-1.6-1.5-3l-1-1c-.8 1-2.5 1.7-2.5 4A2.5 2.5 0 0 0 12 21Z" fill="oklch(0.78 0.13 60)" stroke="none" />
  </svg>
);

/* ---------- Sidebar ---------- */
const NAV_ITEMS = [
  { id: "home",         label: "Home",         icon: "home",       key: "1" },
  { id: "raids",        label: "Raids",        icon: "raids",      key: "2", badge: "47" },
  { id: "replay",       label: "Replay",       icon: "replay",     key: "3" },
  { id: "ask",          label: "Workshop",     icon: "ask",        key: "4" },
  { id: "notebook",     label: "Notebook",     icon: "book",       key: "7" },
  { id: "observations", label: "Observations", icon: "sparkle",    key: "8" },
  { id: "contribute",   label: "Contribute",   icon: "contribute", key: "5" },
  { id: "settings",     label: "Settings",     icon: "settings",   key: "6" },
];

const Sidebar = ({ route, setRoute }) => {
  // Live counts (re-read on every render; App re-renders on data changes).
  const noteCount = window.Notebook ? window.Notebook.all().length : 0;
  const obsCount = window.Observations ? window.Observations.counts().shared : 0;

  const liveBadges = {
    notebook:     noteCount > 0 ? String(noteCount) : null,
    observations: obsCount > 0 ? String(obsCount) : null,
  };

  return (
  <aside className="sidebar">
    <div className="nav-section">Workbench</div>
    {NAV_ITEMS.slice(0, 4).map(n => (
      <div key={n.id}
           className={`nav-item ${route.startsWith(n.id) ? "active" : ""}`}
           onClick={() => setRoute(n.id)}>
        <span className="ico"><Icon name={n.icon} /></span>
        <span>{n.label}</span>
        {n.badge && <span className="badge">{n.badge}</span>}
        {!n.badge && <span className="key">{n.key}</span>}
      </div>
    ))}
    <div className="nav-section">Memory</div>
    {NAV_ITEMS.slice(4).map(n => {
      const live = liveBadges[n.id];
      return (
        <div key={n.id}
             className={`nav-item ${route.startsWith(n.id) ? "active" : ""}`}
             onClick={() => setRoute(n.id)}>
          <span className="ico"><Icon name={n.icon} /></span>
          <span>{n.label}</span>
          {live ? <span className="badge live">{live}</span> : <span className="key">{n.key}</span>}
        </div>
      );
    })}

    <div className="player-card">
      <div className="avatar"></div>
      <div className="meta">
        <span className="name">{window.PLAYER.name}</span>
        <span className="sub">{window.PLAYER.spec} {window.PLAYER.class} · {window.PLAYER.realm}</span>
      </div>
    </div>
  </aside>
  );
};

/* ---------- Topbar ---------- */
const Topbar = ({ onOpenCmd }) => (
  <div className="topbar">
    <div className="brand">
      <span className="glyph"><BrandGlyph /></span>
      <span>lantern</span>
      <span className="mono" style={{ color: "var(--text-mute)", marginLeft: 6, fontSize: 10, fontStyle: "normal" }}>v0.18</span>
    </div>
    <div className="status-strip">
      <div className="item"><span className="dot"></span>Parser <span style={{color: "var(--text-mute)", marginLeft: 4}}>idle · last 2:47 ago</span></div>
      <div className="item"><span className="dot"></span>Ollama <span style={{color: "var(--text-mute)", marginLeft: 4}}>llama3.1:70b · 11434</span></div>
      <div className="item"><span className="dot idle"></span>Replay cache <span style={{color: "var(--text-mute)", marginLeft: 4}}>412 MB</span></div>
    </div>
    <div className="right">
      <ThemeCycle />
      <span style={{width: 1, height: 14, background: "var(--border)"}}></span>
      <span onClick={() => window.QuickNote && window.QuickNote.open({})}
            style={{cursor: "pointer", display: "flex", gap: 6, alignItems: "center", color: "var(--text-faint)"}}
            title="Quick note (N)">
        <Icon name="book" size={12} />
        <span>note</span>
        <span className="kbd-row"><kbd>N</kbd></span>
      </span>
      <span style={{width: 1, height: 14, background: "var(--border)"}}></span>
      <span onClick={onOpenCmd} style={{cursor: "pointer", display: "flex", gap: 8, alignItems: "center"}}>
        <Icon name="search" size={12} />
        <span style={{color: "var(--text-faint)"}}>Search raids, players, moments</span>
        <span className="kbd-row"><kbd>⌘</kbd><kbd>K</kbd></span>
      </span>
    </div>
  </div>
);

/* ---------- Theme cycle — quick switch in the topbar ---------- */
const THEMES = [
  { id: "dark",  label: "dark",  glyph: "◐" },
  { id: "light", label: "light", glyph: "○" },
  { id: "gad",   label: "GAD",   glyph: "●" },
];

// Custom event used to keep ThemeCycle in sync with the data-theme attribute
// when other parts of the app (the Tweaks panel) change theme. Avoids
// polling, which races with pointer-drag handlers elsewhere.
const THEME_CHANGED_EVENT = "campfire:theme-changed";

function ThemeCycle() {
  const [current, setCurrent] = useState(
    () => document.documentElement.getAttribute("data-theme") || "dark"
  );

  useEffect(() => {
    const onChange = () => {
      const t = document.documentElement.getAttribute("data-theme") || "dark";
      setCurrent(t);
    };
    window.addEventListener(THEME_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(THEME_CHANGED_EVENT, onChange);
  }, []);

  const next = () => {
    const idx = THEMES.findIndex(t => t.id === current);
    const nextTheme = THEMES[(idx + 1) % THEMES.length];
    try {
      window.parent.postMessage({
        type: '__edit_mode_set_keys',
        edits: { theme: nextTheme.id },
      }, '*');
    } catch (e) {}
    document.documentElement.setAttribute("data-theme", nextTheme.id);
    setCurrent(nextTheme.id);
    window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT));
  };

  const cur = THEMES.find(t => t.id === current) || THEMES[0];
  return (
    <span onClick={next}
          style={{cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center", color: "var(--text-faint)"}}
          title={`Theme · ${cur.label} (click to cycle)`}>
      <span style={{color: "var(--ember)", fontSize: 11}}>{cur.glyph}</span>
      <span>{cur.label}</span>
    </span>
  );
}

/* ---------- <Term> — glossary hover for coordination vocabulary ---------- */
function Term({ k, children }) {
  const def = window.GLOSSARY && window.GLOSSARY[k];
  const [open, setOpen] = useState(false);
  if (!def) return <span>{children}</span>;
  return (
    <span className="term-anchor"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          tabIndex={0}>
      <span className="term-text">{children || def.label}</span>
      {open && (
        <span className="term-tooltip" role="tooltip">
          <span className="term-label">{def.label}</span>
          <span className="term-short">{def.short}</span>
          {def.long && <span className="term-long">{def.long}</span>}
          <span className="term-foot">Glossary · part of the workshop vocabulary</span>
        </span>
      )}
    </span>
  );
}

Object.assign(window, { Icon, SpellIcon, PAvatar, BrandGlyph, Sidebar, Topbar, NAV_ITEMS, Term });
