/* global React, window */
// Home — "What happened to me last night?"

const { useState: useStateH } = React;

const HomePage = ({ setRoute, openRaid, tweaks, openCohort }) => {
  const layout = tweaks?.homeLayout || "timeline";
  const showSupport = tweaks?.showSupport !== false;

  return (
    <div className="page home-page">
      <HomeHero setRoute={setRoute} openRaid={openRaid} />

      {layout === "timeline" && <HomeTimelineFirst showSupport={showSupport} setRoute={setRoute} openCohort={openCohort} />}
      {layout === "moments"  && <HomeMomentsFirst  showSupport={showSupport} setRoute={setRoute} openCohort={openCohort} />}
      {layout === "roster"   && <HomeRosterFirst   showSupport={showSupport} setRoute={setRoute} openCohort={openCohort} />}
    </div>
  );
};

/* ---------- Hero (latest raid card) ---------- */
const HomeHero = ({ openRaid }) => {
  const r = window.LATEST_RAID;
  return (
    <div className="raid-hero compact">
      <div className="hero-row">
        <div className="hero-meta">
          <p className="hero-eyebrow">
            <span className="dot"></span>
            Last night · parsed {r.parsed} · not yet shared
          </p>
          <h1 className="hero-title">
            {r.zone} <em>{r.difficulty}</em>
            <span className="hero-sep">·</span>
            <span className="hero-when">{r.dateShort}</span>
          </h1>
          <p className="hero-sub">
            {r.kills}/8 killed · 1 progression boss · you played {r.yourRole.split(" \u00b7 ")[0]} · 1 role swap (Disc → Holy)
          </p>
        </div>
        <button className="btn primary hero-cta" onClick={openRaid}>
          Open raid review <Icon name="arrowR" size={14} />
        </button>
      </div>
    </div>
  );
};

const Stat = ({ label, val, delta }) => (
  <div className="stat">
    <div className="label">{label}</div>
    <div className="val">{val}</div>
    {delta && <div className="delta">{delta}</div>}
  </div>
);

/* ---------- Layouts ---------- */
const HomeTimelineFirst = ({ showSupport, setRoute, openCohort }) => (
  <div className="home-main-grid">
    <div className="hm-left">
      <NotableMoments setRoute={setRoute} />
      <RetroExcerpt />
    </div>
    <div className="hm-right">
      <LocalAIPanel setRoute={setRoute} />
      {showSupport && <SupportPanel />}
      <CoordinationPanel openCohort={openCohort} />
      <ContinuityPanel />
    </div>
  </div>
);

const HomeMomentsFirst = ({ showSupport, setRoute, openCohort }) => (
  <div className="home-stack">
    <NotableMoments setRoute={setRoute} large />
    <div className="home-main-grid">
      <div className="hm-left">
        <CoordinationPanel openCohort={openCohort} />
        <RetroExcerpt />
      </div>
      <div className="hm-right">
        <LocalAIPanel setRoute={setRoute} />
        {showSupport && <SupportPanel />}
        <ContinuityPanel />
      </div>
    </div>
  </div>
);

const HomeRosterFirst = ({ showSupport, setRoute, openCohort }) => (
  <div className="home-main-grid">
    <div className="hm-left">
      <RosterPanel />
      <CoordinationPanel openCohort={openCohort} />
      <NotableMoments setRoute={setRoute} compact />
    </div>
    <div className="hm-right">
      {showSupport && <SupportPanel />}
      <RetroExcerpt />
      <LocalAIPanel setRoute={setRoute} />
      <ContinuityPanel />
    </div>
  </div>
);

/* ---------- Cards ---------- */
/* ---------- Your night — recognition only. No analysis filler. ---------- */
const NotableMoments = ({ setRoute, large, compact }) => {
  const moments = window.MOMENTS;

  // Home celebrates. Analysis lives in raid review.
  // We surface ONLY contribution moments: saves, swaps, feasts, comebacks.
  // Deaths/collapses are accessible from the raid review, never the hero.
  const CELEBRATORY = new Set(["save", "swap", "feast", "comeback"]);
  const celebratory = moments
    .filter(m => CELEBRATORY.has(m.kind))
    .sort((a, b) => (b.weight || 3) - (a.weight || 3));

  const openMoment = (m) => window.Moment && window.Moment.open(m);

  // Empty state — better than filler.
  if (celebratory.length === 0) {
    return <QuietNight setRoute={setRoute} />;
  }

  const lead = celebratory[0];
  const secondary = celebratory.slice(1, 3);
  const tail = celebratory.slice(3);

  return (
    <div className="your-night">
      <div className="yn-head">
        <div>
          <h2 className="h2">What you brought to the raid</h2>
          <span className="faint mono" style={{fontSize: 11, marginTop: 2, display: "block"}}>
            {celebratory.length} {celebratory.length === 1 ? "contribution" : "contributions"} worth remembering · click any to descend
          </span>
        </div>
        <button className="btn ghost small" onClick={() => setRoute("raids/2026-05-12")}>
          Full review <Icon name="chevR" size={12} />
        </button>
      </div>

      {/* Lead — strongest contribution */}
      <MomentHero moment={lead} onClick={() => openMoment(lead)} />

      {/* Secondary — two side-by-side */}
      {secondary.length > 0 && (
        <div className="yn-secondary">
          {secondary.map(m => (
            <MomentMedium key={m.id} moment={m} onClick={() => openMoment(m)} />
          ))}
        </div>
      )}

      {/* Tail — compact rows */}
      {tail.length > 0 && (
        <div className="yn-tail">
          {tail.map(m => (
            <MomentCompact key={m.id} moment={m} onClick={() => openMoment(m)} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Empty state — warm, brief, never apologetic ---------- */
const QuietNight = ({ setRoute }) => (
  <div className="quiet-night">
    <p className="h-eyebrow" style={{margin: 0}}>Your night</p>
    <p className="quiet-night-body">
      Tonight didn't surface any contribution moments yet. That's fine — not every raid has a clear save or swap to mark.
      When you're ready to investigate what happened, the raid review is waiting.
    </p>
    <button className="btn small" onClick={() => setRoute("raids/2026-05-12")}>
      Open raid review <Icon name="arrowR" size={11} />
    </button>
  </div>
);

/* === Lead moment — large bordered card with hero treatment === */
const MomentHero = ({ moment, onClick }) => {
  const m = moment;
  return (
    <div className={`moment-hero kind-${m.kind} weight-${m.weight || 3}`} onClick={onClick}>
      <div className="mh-bg"></div>
      <div className="mh-content">
        <div className="mh-eyebrow">
          <span className="mh-kind"><MomentDot kind={m.kind} /> {kindLabelShort(m.kind)}</span>
          <span className="mh-ctx mono">{m.ctx}</span>
        </div>
        <h3 className="mh-title">{m.title}</h3>
        <p className="mh-narrative">{m.narrative}</p>
        <div className="mh-action">
          <span>Descend into this moment</span>
          <Icon name="arrowR" size={14} />
        </div>
      </div>
    </div>
  );
};

/* === Medium moment — secondary cards === */
const MomentMedium = ({ moment, onClick }) => {
  const m = moment;
  return (
    <div className={`moment-medium kind-${m.kind}`} onClick={onClick}>
      <div className="mm-head">
        <span className="mm-kind"><MomentDot kind={m.kind} /> {kindLabelShort(m.kind)}</span>
        <span className="mm-ctx mono">{m.ctx.split(" · ").slice(-1)[0]}</span>
      </div>
      <h4 className="mm-title">{m.title}</h4>
      <p className="mm-narrative">{m.short}</p>
    </div>
  );
};

/* === Compact moment — single row === */
const MomentCompact = ({ moment, onClick }) => {
  const m = moment;
  return (
    <div className={`moment-compact kind-${m.kind}`} onClick={onClick}>
      <SpellIcon hue={m.hue} glyph={m.ico} size="sm" />
      <div className="mc-text">
        <span className="mc-title">{m.title}</span>
        <span className="mc-ctx mono">{m.ctx}</span>
      </div>
      <span className="mc-arrow mono">→</span>
    </div>
  );
};

/* Small kind dot — accent color */
const MomentDot = ({ kind }) => (
  <span className={`moment-dot kind-${kind}`}></span>
);

const kindLabelShort = (kind) => ({
  death: "Death",
  save:  "Save",
  swap:  "Role swap",
  feast: "Quiet support",
  collapse: "Collapse",
  comeback: "Comeback",
}[kind] || kind);

const RetroExcerpt = () => {
  const r = window.RETRO_EXCERPT;
  return (
    <div className="card retro-card">
      <p className="h-eyebrow">Retrospective · {r.postedAgo}</p>
      <div className="quote">"{r.excerpt}"</div>
      <div className="attrib">— {r.author}, {r.role}</div>
      <div className="divider" style={{margin: "16px 0 12px"}}></div>
      <div className="between">
        <span className="faint mono" style={{fontSize: 11}}>
          {r.read ? "Read" : "Unread"} · part of the guild chronicle
        </span>
        <button className="btn small">Read on Hearth <Icon name="arrowR" size={11} /></button>
      </div>
    </div>
  );
};

const LocalAIPanel = ({ setRoute }) => (
  <div className="card flush">
    <div className="card-head">
      <h2 className="h2">Ask the workshop</h2>
      <span className="chip"><span className="dot"></span>Local · ready</span>
    </div>
    <div className="card-body">
      <p className="muted" style={{fontSize: 13, marginTop: 0, marginBottom: 12}}>
        Ask about last night. Answers cite the combat log and replay frames they came from —
        nothing is sent off your machine.
      </p>
      <div className="suggested">
        {window.ASK_SUGGESTIONS.slice(0, 3).map(s => (
          <span key={s} className="s" onClick={() => setRoute("ask")}>{s}</span>
        ))}
      </div>
    </div>
  </div>
);

const SupportPanel = () => (
  <div className="card flush">
    <div className="card-head">
      <div>
        <h2 className="h2">Tonight's quiet generosity</h2>
        <span className="faint mono" style={{fontSize: 11, marginTop: 2, display: "block"}}>
          Support contributions logged for the chronicle
        </span>
      </div>
    </div>
    <div className="card-body support-list">
      {window.SUPPORT_ACTIONS.map((s, i) => (
        <div key={i} className="support-row">
          <SpellIcon hue={s.hue} glyph={s.ico} size="sm" />
          <div>
            <div className="what">
              {s.what}
              {s.isYou && <span className="chip ember" style={{marginLeft: 8, padding: "1px 6px", fontSize: 10}}>YOU</span>}
            </div>
            <div className="who">{s.who}</div>
          </div>
          {s.isYou ? (
            <span className="faint mono" style={{fontSize: 11}}>logged</span>
          ) : (
            <button className="btn ghost small"
                    style={{fontSize: 11, padding: "3px 8px"}}
                    onClick={() => window.Propose && window.Propose.open({
                      kind: "support",
                      title: s.what,
                      description: `${s.who} ${s.what.toLowerCase()}. Easy to overlook — worth surfacing so other raiders see it.`,
                      credits: [s.who],
                      binding: { kind: "raid", raidId: window.LATEST_RAID.id,
                                 label: window.LATEST_RAID.zone + " " + window.LATEST_RAID.difficulty + " · " + window.LATEST_RAID.dateShort },
                    })}>
              <Icon name="upload" size={10} /> Share
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

const ContinuityPanel = () => (
  <div className="card">
    <p className="h-eyebrow">Continuity</p>
    <div className="stack" style={{gap: 8}}>
      <div className="between">
        <span className="muted" style={{fontSize: 13}}>Raids attended</span>
        <span className="mono" style={{fontSize: 12}}>47 of 52 this season</span>
      </div>
      <div className="between">
        <span className="muted" style={{fontSize: 13}}>Progression contributions</span>
        <span className="mono" style={{fontSize: 12}}>12 role swaps · 8 feasts</span>
      </div>
      <div className="between">
        <span className="muted" style={{fontSize: 13}}>Longest streak</span>
        <span className="mono" style={{fontSize: 12}}>18 raids in a row</span>
      </div>
    </div>
    <div className="divider"></div>
    <p className="faint" style={{fontSize: 12, margin: 0, lineHeight: 1.5}}>
      These numbers stay on this machine until you choose to contribute them.
    </p>
  </div>
);

/* ---------- Coordination panel (calm, narrative) ---------- */
const CoordinationPanel = ({ openCohort }) => (
  <div className="card flush">
    <div className="card-head">
      <div>
        <h2 className="h2">Coordination highlights</h2>
        <span className="faint mono" style={{fontSize: 11, marginTop: 2, display: "block"}}>
          Patterns from how you moved together — no rankings, no scoring
        </span>
      </div>
    </div>
    <div className="card-body coord-highlights" style={{padding: "8px 6px"}}>
      {window.COORDINATION_HIGHLIGHTS.map((h, i) => (
        <div key={i} className="row" onClick={() => openCohort && openCohort(h.cohort)}>
          <SpellIcon hue={h.hue} glyph={h.ico} size="sm" />
          <div className="text">
            <div className="title">{h.title}</div>
            <div className="detail">{h.detail}</div>
          </div>
          <span className="open">OPEN COHORT ↗</span>
        </div>
      ))}
    </div>
  </div>
);

const RosterPanel = () => (
  <div className="card flush">
    <div className="card-head">
      <h2 className="h2">Tonight's roster</h2>
      <span className="faint mono" style={{fontSize: 11}}>{window.ROSTER.length} raiders</span>
    </div>
    <div className="card-body" style={{padding: 12}}>
      <div style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8}}>
        {window.ROSTER.map(p => (
          <div key={p.name} style={{
            display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 10,
            alignItems: "center", padding: "6px 8px", borderRadius: 6,
            background: p.you ? "var(--surface-2)" : "transparent",
            border: p.you ? "1px solid var(--border)" : "1px solid transparent",
          }}>
            <PAvatar name={p.name} hue={p.hue} />
            <div>
              <div style={{fontSize: 13, color: "var(--text)"}}>{p.name}{p.you && " — you"}</div>
              <div className="mono" style={{fontSize: 10, color: "var(--text-faint)"}}>
                {p.spec} {p.cls}{p.alt && " · alt"}
              </div>
            </div>
            <span className={`chip role-${p.role}`}>
              {p.role === "heal" ? "Heal" : p.role === "tank" ? "Tank" : "DPS"}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

window.HomePage = HomePage;
