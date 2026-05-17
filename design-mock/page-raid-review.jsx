/* global React, window */
// Raid review — player-first deep dive into one raid night.

const { useState: useStateR, useMemo: useMemoR } = React;

const RaidReviewPage = ({ setRoute, openCohort }) => {
  const raid = window.LATEST_RAID;
  const pulls = window.RAID_PULLS;
  // Pull detail is hidden until the user explicitly clicks a pull on the
  // timeline. Default state surfaces moments + timeline only.
  const [selectedPullId, setSelectedPullId] = useStateR(null);
  const selectedPull = selectedPullId ? pulls.find(p => p.id === selectedPullId) : null;
  const boss = selectedPull ? raid.bosses[selectedPull.boss - 1] : null;
  const total = pulls[pulls.length - 1].end;

  const openMoment = (m) => window.Moment && window.Moment.open(m);

  return (
    <div className="page raid-review-v2">
      <div className="review-header">
        <div>
          <div className="breadcrumb">
            <a onClick={() => setRoute("home")}>Home</a>
            <span style={{margin: "0 6px"}}>›</span>
            <a onClick={() => setRoute("raids")}>Raids</a>
            <span style={{margin: "0 6px"}}>›</span>
            <span style={{color: "var(--text)"}}>{raid.dateShort}, {raid.zone}</span>
          </div>
          <h1>{raid.zone} <em style={{color: "var(--ember)"}}>{raid.difficulty}</em></h1>
          <div className="sub">{raid.date} · {raid.duration} · 6 / 8 killed · 1 progression boss</div>
        </div>
        <div className="row" style={{gap: 8}}>
          <button className="btn small">
            <Icon name="book" size={12} /> Read retro on Hearth
          </button>
        </div>
      </div>

      {/* LEAD: moments from this raid — both contributions and reflections. */}
      <RaidMoments moments={window.MOMENTS} onMomentClick={openMoment} />

      {/* MIDDLE: timeline for spatial navigation */}
      <p className="h-eyebrow" style={{marginTop: 32}}>The full night · {raid.pulls} pulls</p>
      <RaidTimeline pulls={pulls} total={total} bosses={raid.bosses}
                    selectedId={selectedPullId}
                    onSelect={(id) => setSelectedPullId(id)}
                    setRoute={setRoute} openCohort={openCohort} />

      {/* BOTTOM: pull detail — only on explicit selection */}
      {selectedPull ? (
        <PullDetail pull={selectedPull} boss={boss}
                    onClose={() => setSelectedPullId(null)}
                    setRoute={setRoute} />
      ) : (
        <PullDetailPrompt />
      )}
    </div>
  );
};

/* ---------- Moments from this raid — the lead section ---------- */
const RaidMoments = ({ moments, onMomentClick }) => {
  // On raid review we surface BOTH contribution and reflection moments,
  // because investigation is the page's job. But we still lead with what
  // was given to the raid.
  const CELEBRATORY = new Set(["save", "swap", "feast", "comeback"]);
  const celebratory = moments.filter(m => CELEBRATORY.has(m.kind))
    .sort((a, b) => (b.weight || 3) - (a.weight || 3));
  const reflective = moments.filter(m => !CELEBRATORY.has(m.kind))
    .sort((a, b) => (b.weight || 3) - (a.weight || 3));

  return (
    <section className="raid-moments">
      {celebratory.length > 0 && (
        <>
          <div className="rm-section-head">
            <p className="h-eyebrow" style={{margin: 0}}>What you brought to this raid</p>
            <span className="faint mono" style={{fontSize: 11}}>
              {celebratory.length} {celebratory.length === 1 ? "contribution" : "contributions"}
            </span>
          </div>
          <div className="rm-strip">
            {celebratory.map(m => (
              <MomentTile key={m.id} moment={m} onClick={() => onMomentClick(m)} />
            ))}
          </div>
        </>
      )}

      {reflective.length > 0 && (
        <>
          <div className="rm-section-head" style={{marginTop: 22}}>
            <p className="h-eyebrow" style={{margin: 0}}>Moments worth investigating</p>
            <span className="faint mono" style={{fontSize: 11}}>
              {reflective.length} {reflective.length === 1 ? "moment" : "moments"} · click to descend
            </span>
          </div>
          <div className="rm-strip">
            {reflective.map(m => (
              <MomentTile key={m.id} moment={m} onClick={() => onMomentClick(m)} reflective />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

/* Compact tile that fits 3-4 across at 1680px — kind accent on left edge */
const MomentTile = ({ moment, onClick, reflective }) => {
  const m = moment;
  return (
    <div className={`moment-tile kind-${m.kind} ${reflective ? "reflective" : ""}`} onClick={onClick}>
      <div className="mt-head">
        <span className="mt-kind">
          <span className={`moment-dot kind-${m.kind}`}></span>
          {kindLabelShort(m.kind)}
        </span>
        <span className="mt-ctx mono">{m.ctx.split(" · ").slice(-1)[0]}</span>
      </div>
      <h4 className="mt-title">{m.title}</h4>
      <p className="mt-narrative">{m.short}</p>
      <div className="mt-foot">
        <span className="mt-action mono">Descend →</span>
      </div>
    </div>
  );
};

/* ---------- Pull detail — only renders on explicit selection ---------- */
const PullDetail = ({ pull, boss, onClose, setRoute }) => (
  <section className="pull-detail-v2">
    <div className="pd-head">
      <div>
        <p className="h-eyebrow" style={{margin: 0}}>Selected pull</p>
        <h2 className="pd-title">
          Boss {pull.boss} · {boss.name}
          <span className="pd-pull-n">pull {pull.n}</span>
        </h2>
        <div className="pd-meta mono">
          <span className={`pd-status ${pull.status}`}>{pull.status === "kill" ? "KILL" : "WIPE"}</span>
          · {Math.floor(pull.dur / 60)}:{String(pull.dur % 60).padStart(2,"0")} duration
          · starts at {Math.floor(pull.start / 60)}:{String(pull.start % 60).padStart(2,"0")}
        </div>
      </div>
      <div className="row" style={{gap: 6}}>
        <button className="btn small" onClick={() => setRoute("replay")}>
          <Icon name="play" size={11} /> Watch in replay
        </button>
        <button className="btn ghost small" onClick={onClose} title="Close pull detail">
          <Icon name="close" size={11} />
        </button>
      </div>
    </div>

    {/* Your timeline + event list */}
    <div className="pd-section">
      <div className="pd-section-head">
        <h3 className="h2">Your timeline · this pull</h3>
        <span className="chip role-heal"><span className="dot"></span>Healer</span>
      </div>
      <PlayerBar pull={pull} events={window.PULL_EVENTS} />
      <div className="pd-events">
        {window.PULL_EVENTS.map((e, i) => (
          <EventRow key={i} e={e} />
        ))}
      </div>
    </div>

    {/* What happened — context prose */}
    {pull.status === "wipe" && (
      <div className="pd-section">
        <div className="pd-section-head">
          <h3 className="h2">What happened</h3>
        </div>
        <p className="pd-prose">
          Healing collapsed during the phase 3 transition. Two healers died within four
          seconds at the add wave, leaving Veshrin unable to cover both tanks. Earlier in
          the pull you committed Pain Suppression on Karthuun at <span className="mono">02:42</span>,
          which bought the raid the cooldown it needed to survive add wave 1.
        </p>
      </div>
    )}
  </section>
);

/* ---------- Empty prompt when no pull is selected ---------- */
const PullDetailPrompt = () => (
  <div className="pd-prompt">
    <p className="h-eyebrow" style={{margin: 0}}>Pull detail</p>
    <p className="pd-prompt-body">
      Click any pull on the timeline above to see the moment-by-moment view: your defensives,
      saves, and what happened. Or click any moment tile above to descend into it directly.
    </p>
  </div>
);

const kindLabelShort = (kind) => ({
  death: "Death",
  save:  "Save",
  swap:  "Role swap",
  feast: "Quiet support",
  collapse: "Collapse",
  comeback: "Comeback",
}[kind] || kind);

/* ---------- Master timeline — clearer four-row hierarchy ---------- */
const RaidTimeline = ({ pulls, total, bosses, selectedId, onSelect, setRoute, openCohort }) => {
  // Group pulls by boss. Stretch each phase to abut the next phase's start
  // so the banding fills the entire timeline with no visual gaps.
  const phases = useMemoR(() => {
    const map = {};
    pulls.forEach(p => {
      if (!map[p.boss]) map[p.boss] = { boss: p.boss, start: p.start, end: p.end, count: 0, kills: 0 };
      else map[p.boss].end = p.end;
      map[p.boss].count++;
      if (p.status === "kill") map[p.boss].kills++;
    });
    const list = Object.values(map).sort((a, b) => a.boss - b.boss);
    return list.map((ph, i) => ({
      ...ph,
      regionStart: i === 0 ? 0 : ph.start,
      regionEnd: i < list.length - 1 ? list[i + 1].start : total,
    }));
  }, [pulls, total]);

  const pct = (x) => `${(x / total * 100)}%`;

  // Resolve a marker's screen position from its pullId.
  const markers = (window.COORD_MARKERS || []).map(m => {
    const p = pulls.find(x => x.id === m.pullId);
    if (!p) return null;
    const center = (p.start + p.end) / 2;
    return { ...m, x: center / total * 100, pull: p };
  }).filter(Boolean);

  // Counts for the scoreboard.
  const counts = {
    kills: pulls.filter(p => p.status === "kill").length,
    wipes: pulls.filter(p => p.status === "wipe").length,
  };
  const coordTypes = [
    { kind: "collapse",      label: "collapse" },
    { kind: "support-chain", label: "support chain" },
    { kind: "stack-break",   label: "stack break" },
    { kind: "comeback",      label: "comeback" },
  ];
  const coordCounts = coordTypes.reduce((m, c) => {
    m[c.kind] = markers.filter(x => x.kind === c.kind).length;
    return m;
  }, {});

  // Major time-axis ticks (15-min intervals).
  const ticks = [];
  for (let t = 0; t <= total; t += 900) ticks.push(t);
  if (ticks[ticks.length - 1] !== total) ticks.push(total);

  return (
    <div className="timeline-v2">
      {/* Row 1: icon-only coord markers with drop connectors */}
      <div className="cm-strip">
        {markers.map((m, i) => (
          <div key={i} className="cm-anchor" style={{ left: `${m.x}%` }}>
            <span className={`cm-icon kind-${m.kind}`}
                  title={`${m.label.toUpperCase()} · ${m.note}`}
                  onClick={() => {
                    if (m.scenarioId) openCohort && openCohort(m.scenarioId);
                    else onSelect(m.pull.id);
                  }}>
              {coordSymbol(m.kind)}
            </span>
            <span className="cm-drop"></span>
          </div>
        ))}
      </div>

      {/* Row 2: boss phase header — regions abut */}
      <div className="phase-header">
        {phases.map((ph) => (
          <div key={ph.boss}
               className="phase-label-pill"
               style={{ left: pct(ph.regionStart), width: pct(ph.regionEnd - ph.regionStart) }}>
            <span className="phase-num">B{ph.boss}</span>
            <span className="phase-name">{bosses[ph.boss-1].name.split(" ")[0].toUpperCase()}</span>
            <span className="phase-meta">{ph.kills > 0 ? `${ph.kills}/${ph.count}` : `${ph.count} att`}</span>
          </div>
        ))}
      </div>

      {/* Row 3: pull track with phase banding (also abutting) and dividers */}
      <div className="pull-track">
        {phases.map((ph, i) => (
          <div key={`band-${ph.boss}`}
               className={`phase-band ${i % 2 === 0 ? "even" : "odd"}`}
               style={{ left: pct(ph.regionStart), width: pct(ph.regionEnd - ph.regionStart) }}></div>
        ))}
        {/* Vertical dividers between phases — extend visually down into the track */}
        {phases.slice(1).map((ph) => (
          <div key={`div-${ph.boss}`}
               className="phase-divider"
               style={{ left: pct(ph.regionStart) }}></div>
        ))}
        {pulls.map(p => (
          <div key={p.id}
               className={`pull-v2 status-${p.status} ${p.id === selectedId ? "selected" : ""}`}
               style={{ left: pct(p.start), width: `calc(${pct(p.end - p.start)} - 2px)` }}
               onClick={() => onSelect(p.id)}
               title={`Boss ${p.boss} · Pull ${p.n} · ${p.status === "kill" ? "kill" : "wipe"} · ${Math.floor(p.dur/60)}:${String(p.dur%60).padStart(2,"0")}`}>
            {p.status === "kill" && <span className="pull-check">✓</span>}
            <span className="pull-num">{p.n}</span>
          </div>
        ))}
      </div>

      {/* Row 4: time axis */}
      <div className="time-axis-v2">
        {ticks.map((tt, i) => {
          const x = tt / total * 100;
          const h = Math.floor(tt/3600);
          const m = Math.floor((tt%3600)/60);
          const s = tt % 60;
          const label = h > 0
            ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
            : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
          return (
            <div key={i} className="ta-tick" style={{ left: `${x}%` }}>
              <span className="ta-tick-line"></span>
              <span className="ta-tick-label">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Scoreboard / legend — swatches double as the key */}
      <div className="timeline-scoreboard">
        <div className="sb-group">
          <span className="sb-item">
            <span className="sb-swatch kill"><span>✓</span></span>
            <span className="sb-num">{counts.kills}</span>
            <span className="sb-label">kills</span>
          </span>
          <span className="sb-item">
            <span className="sb-swatch wipe"></span>
            <span className="sb-num">{counts.wipes}</span>
            <span className="sb-label">wipes</span>
          </span>
        </div>
        <span className="sb-divider"></span>
        <div className="sb-group">
          {coordTypes.map(c => {
            const n = coordCounts[c.kind];
            return (
              <span key={c.kind} className={`sb-item coord-item ${n === 0 ? "empty" : ""}`}
                    title={n === 0 ? `No ${c.label} events tagged this raid` : ""}>
                <span className={`sb-icon kind-${c.kind}`}>{coordSymbol(c.kind)}</span>
                <span className="sb-num">{n}</span>
                <span className="sb-label">{c.label}</span>
              </span>
            );
          })}
        </div>
        <span className="sb-helper">click any pull to inspect · markers open the cohort</span>
      </div>
    </div>
  );
};

const coordSymbol = (kind) => ({
  "collapse":      "▼",
  "support-chain": "↻",
  "stack-break":   "↹",
  "comeback":      "✦",
}[kind] || "·");

/* ---------- Player bar — used inside PullDetail ---------- */
const PlayerBar = ({ pull, events }) => {
  const dur = pull.dur;
  return (
    <div className="player-bar-v2">
      <div className="pb-track-v2">
        <div className="pbv-phase even" style={{left: "0%", width: "35%"}}></div>
        <div className="pbv-phase odd"  style={{left: "35%", width: "35%"}}></div>
        <div className="pbv-phase even" style={{left: "70%", width: "30%"}}></div>
        <div className="pbv-phase-lbl" style={{left: "1%"}}>P1</div>
        <div className="pbv-phase-lbl" style={{left: "36%"}}>P2</div>
        <div className="pbv-phase-lbl" style={{left: "71%"}}>P3</div>
        <div className="pbv-divider" style={{left: "35%"}}></div>
        <div className="pbv-divider" style={{left: "70%"}}></div>
        {events.map((e, i) => (
          <div key={i}
               className={`pbv-event kind-${e.kind}`}
               style={{ left: `${(e.t / dur) * 100}%` }}
               title={`${Math.floor(e.t/60)}:${String(e.t%60).padStart(2,"0")} · ${e.label}`}>
            <span className="pbv-sym">{e.ico}</span>
          </div>
        ))}
      </div>
      <div className="pb-axis">
        <span>00:00</span>
        <span>P2 starts</span>
        <span>P3 starts</span>
        <span>{Math.floor(dur/60)}:{String(dur%60).padStart(2,"0")}</span>
      </div>
    </div>
  );
};

const EventRow = ({ e }) => {
  const hueMap = { death: 25, save: 165, cd: 60 };
  const kindLabel = { death: "DEATH", save: "SAVE", cd: "CD" };
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "60px 28px 1fr auto",
      gap: 12, alignItems: "center", padding: "6px 4px",
    }}>
      <span className="mono" style={{fontSize: 11, color: "var(--text-faint)"}}>
        {Math.floor(e.t/60)}:{String(e.t%60).padStart(2,"0")}
      </span>
      <SpellIcon hue={hueMap[e.kind]} glyph={e.ico} size="sm" />
      <span style={{fontSize: 13}}>{e.label}</span>
      <span className="chip" style={{
        color: e.kind === "death" ? "var(--bad)" : e.kind === "save" ? "var(--good)" : "var(--ember)",
        borderColor: "var(--border)",
      }}>{kindLabel[e.kind]}</span>
    </div>
  );
};

window.RaidReviewPage = RaidReviewPage;
