/* global React, window */
// Cohort cards — relational, event-oriented. Not throughput.

const CohortCards = ({ scenario, onAskAbout, onSeekTo, layout = "stack" }) => {
  if (!scenario || !window.COHORT_CARDS[scenario.id]) {
    return null;
  }
  const cards = window.COHORT_CARDS[scenario.id];
  const [a, b] = scenario.range;

  if (layout === "grid") {
    return (
      <div className="cohort-detail-grid">
        <div className="cd-span-12"><CohortSummary scenario={scenario} onAskAbout={onAskAbout} /></div>
        <div className="cd-span-12"><CDChoreographyCard data={cards.cdChoreography} range={[a, b]} onSeek={onSeekTo} /></div>
        <div className="cd-span-6"><CohesionCard data={cards.cohesion} range={[a, b]} /></div>
        <div className="cd-span-6"><CoordinationCard data={cards.coordination} onSeek={onSeekTo} /></div>
        {cards.recoveries.length > 0 && (
          <div className={cards.deaths.length > 0 ? "cd-span-6" : "cd-span-12"}>
            <RecoveriesCard data={cards.recoveries} onSeek={onSeekTo} />
          </div>
        )}
        {cards.deaths.length > 0 && (
          <div className={cards.recoveries.length > 0 ? "cd-span-6" : "cd-span-12"}>
            <DeathsCard data={cards.deaths} onSeek={onSeekTo} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="stack lg">
      <CohortSummary scenario={scenario} onAskAbout={onAskAbout} />
      <CDChoreographyCard data={cards.cdChoreography} range={[a, b]} onSeek={onSeekTo} />
      <CohesionCard data={cards.cohesion} range={[a, b]} />
      <CoordinationCard data={cards.coordination} onSeek={onSeekTo} />
      {cards.recoveries.length > 0 && <RecoveriesCard data={cards.recoveries} onSeek={onSeekTo} />}
      {cards.deaths.length > 0 && <DeathsCard data={cards.deaths} onSeek={onSeekTo} />}
    </div>
  );
};

/* ---------- Summary ---------- */
const CohortSummary = ({ scenario, onAskAbout }) => {
  const roster = window.ROSTER;
  const members = scenario.members.map(n => roster.find(p => p.name === n)).filter(Boolean);
  const [a, b] = scenario.range;
  const tags = members.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {});
  const tagLabel = Object.entries(tags).map(([r, n]) =>
    `${n} ${r === "heal" ? "healer" : r === "tank" ? "tank" : "dps"}${n > 1 ? "s" : ""}`
  ).join(" · ");

  const notes = window.Notebook ? window.Notebook.byBinding("cohort", scenario.id) : [];

  return (
    <div className="cohort-card">
      <div className="ch-head">
        <div>
          <h3>{scenario.title}</h3>
          <div className="meta" style={{marginTop: 4}}>
            {tagLabel} · {fmt(a)}–{fmt(b)} · {scenario.pullLabel}
          </div>
        </div>
        <div className="avatar-cluster">
          {members.map(m => (
            <PAvatar key={m.name} name={m.name} hue={m.hue} size="sm" />
          ))}
        </div>
      </div>
      <div className="ch-body">
        <p style={{margin: 0, color: "var(--text-dim)", fontSize: 13.5, lineHeight: 1.55}}>
          {scenario.summary}
        </p>
        {notes.length > 0 && (
          <div style={{marginTop: 12}}>
            <p className="h-eyebrow" style={{marginBottom: 6}}>
              Your notes · {notes.length} bound to this cohort
            </p>
            <div className="stack" style={{gap: 6}}>
              {notes.map(n => (
                <div key={n.id} className="attached-note">
                  {n.text}
                  <div className="meta">{n.createdAt} · {n.tags.map(t => "#" + t).join(" ")}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="replay-actions" style={{marginTop: 14}}>
          <button className="ra-btn" onClick={() => onAskAbout(scenario)}>
            <span className="ra-ico"><Icon name="ask" size={13} /></span>
            Ask about this cohort
          </button>
          <button className="ra-btn propose"
                  onClick={() => window.Propose && window.Propose.open({
                    kind: scenario.id === "extcd" ? "teamwork" :
                          scenario.id === "spread" ? "teamwork" : "celebration",
                    title: scenario.title,
                    description: scenario.summary,
                    credits: scenario.members,
                    binding: { kind: "cohort", scenarioId: scenario.id,
                               label: scenario.title + " · " + scenario.pullLabel },
                  })}>
            <span className="ra-ico"><Icon name="upload" size={13} /></span>
            Share as an observation
          </button>
          <button className="add-note-btn"
                  onClick={() => window.QuickNote && window.QuickNote.open({
                    binding: { kind: "cohort", scenarioId: scenario.id,
                               label: scenario.title + " \u00b7 " + scenario.pullLabel },
                  })}>
            <span className="plus">+</span> Add note to this cohort
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- CD choreography ---------- */
const CDChoreographyCard = ({ data, range, onSeek }) => {
  const [a, b] = range;
  const dur = b - a;
  const pct = (t) => `${((t - a) / dur) * 100}%`;

  return (
    <div className="cohort-card">
      <div className="ch-head">
        <h3>Cooldown choreography</h3>
        <span className="meta">{data.reduce((n, r) => n + r.events.length, 0)} casts · cohort timeline</span>
      </div>
      <div className="ch-body">
        <div className="choreography">
          {data.map(row => (
            <div className="row" key={row.name}>
              <span className="who">{row.name}</span>
              <div className="track">
                {row.events.map((e, i) => (
                  <div key={i} className={`ev ${e.late ? "late" : ""}`}
                       style={{ left: pct(e.t), maxWidth: "60%" }}
                       title={`${e.label} · ${fmt(e.t)}`}
                       onClick={() => onSeek && onSeek(e.t)}>
                    {e.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="axis">
            <span>{fmt(a)}</span>
            <span>{fmt(Math.round((a + b) / 2))}</span>
            <span>{fmt(b)}</span>
          </div>
        </div>
        <p className="faint" style={{fontSize: 11.5, marginTop: 12, lineHeight: 1.55}}>
          Hover or click a cast to seek the replay. Coloring marks late commits, not "good" or "bad."
        </p>
      </div>
    </div>
  );
};

/* ---------- Cohesion (movement) line graph ---------- */
const CohesionCard = ({ data, range }) => {
  const [a, b] = range;
  const dur = b - a;
  const maxD = Math.max(...data.map(d => d.d), 50);

  // Build smooth path
  const pad = 6;
  const W = 100; // we use viewBox-100 coords
  const H = 100;
  const x = (t) => ((t - a) / dur) * (W - pad * 2) + pad;
  const y = (d) => H - pad - (d / maxD) * (H - pad * 2);

  const pathD = data.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${x(p.t).toFixed(2)} ${y(p.d).toFixed(2)}`
  ).join(" ");

  const areaD = `${pathD} L ${x(data[data.length-1].t)} ${H} L ${x(data[0].t)} ${H} Z`;

  return (
    <div className="cohort-card">
      <div className="ch-head">
        <h3>Movement cohesion</h3>
        <span className="meta">Mean pairwise distance · lower = stacked</span>
      </div>
      <div className="ch-body">
        <div className="cohesion-graph">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="cgrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="oklch(0.78 0.13 60)" stopOpacity="0.32" />
                <stop offset="100%" stopColor="oklch(0.78 0.13 60)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#cgrad)" />
            <path d={pathD}
                  fill="none"
                  stroke="oklch(0.86 0.14 75)"
                  strokeWidth="1"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke" />
            {data.filter(d => d.marker).map((d, i) => (
              <g key={i}>
                <line x1={x(d.t)} x2={x(d.t)} y1={pad} y2={H - pad}
                      stroke="oklch(0.86 0.14 75)" strokeWidth="0.5" strokeDasharray="2 2"
                      vectorEffect="non-scaling-stroke" />
                <circle cx={x(d.t)} cy={y(d.d)} r="1.2" fill="oklch(0.92 0.14 75)" />
              </g>
            ))}
          </svg>
          <div className="cohesion-band top">stacked ↑</div>
          <div className="cohesion-band bot">spread ↓</div>
          {data.filter(d => d.marker).map((d, i) => (
            <div key={i}
                 className="cohesion-marker"
                 data-label={d.marker}
                 style={{left: `${((d.t - a) / dur) * 100}%`}}></div>
          ))}
        </div>
        <div className="axis" style={{
          display: "flex", justifyContent: "space-between",
          fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-mute)",
          marginTop: 6,
        }}>
          <span>{fmt(a)}</span><span>{fmt(b)}</span>
        </div>
      </div>
    </div>
  );
};

/* ---------- Coordination event list ---------- */
const CoordinationCard = ({ data, onSeek }) => (
  <div className="cohort-card">
    <div className="ch-head">
      <h3>Coordination events</h3>
      <span className="meta">{data.length} within selection</span>
    </div>
    <div className="ch-body coord-list">
      {data.map((e, i) => (
        <div key={i} className="coord-row" onClick={() => onSeek && onSeek(e.t)} style={{cursor: "pointer"}}>
          <span className="ts">{fmt(e.t)}</span>
          <span className={`ico kind-${e.kind}`}>{symbolFor(e.kind)}</span>
          <span className="label">{e.label}</span>
          <span className="kind-tag">{e.kind.replace("-", " ")}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ---------- Recoveries ---------- */
const RecoveriesCard = ({ data, onSeek }) => (
  <div className="cohort-card">
    <div className="ch-head">
      <h3>Recoveries within cohort</h3>
      <span className="meta">{data.length} {data.length === 1 ? "save" : "saves"}</span>
    </div>
    <div className="ch-body coord-list">
      {data.map((r, i) => (
        <div key={i} className="coord-row" onClick={() => onSeek && onSeek(r.t)} style={{cursor: "pointer"}}>
          <span className="ts">{fmt(r.t)}</span>
          <span className="ico kind-save">✚</span>
          <span className="label">
            {r.who} <span className="faint" style={{fontFamily: "var(--font-mono)", fontSize: 11}}>· {r.note}</span>
          </span>
          <span className="kind-tag">by {r.by}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ---------- Deaths ---------- */
const DeathsCard = ({ data, onSeek }) => (
  <div className="cohort-card">
    <div className="ch-head">
      <h3>Deaths within cohort</h3>
      <span className="meta">{data.length}</span>
    </div>
    <div className="ch-body coord-list">
      {data.map((d, i) => (
        <div key={i} className="coord-row" onClick={() => onSeek && onSeek(d.t)} style={{cursor: "pointer"}}>
          <span className="ts">{fmt(d.t)}</span>
          <span className="ico kind-death">✕</span>
          <span className="label">
            {d.who} <span className="faint" style={{fontFamily: "var(--font-mono)", fontSize: 11, marginLeft: 6}}>{d.cause}</span>
            <div className="faint" style={{fontFamily: "var(--font-mono)", fontSize: 10, marginTop: 2}}>{d.note}</div>
          </span>
          <span className="kind-tag" />
        </div>
      ))}
    </div>
  </div>
);

/* ---------- Empty state ---------- */
const CohortEmpty = ({ onPickScenario }) => (
  <div className="cohort-empty">
    <p className="h-eyebrow">No cohort selected</p>
    <p style={{margin: "8px auto 0", maxWidth: 360, lineHeight: 1.55}}>
      Pick players from the roster strip, drag-select on the timeline, or jump straight to
      one of these mocked coordination scenarios:
    </p>
    <div className="examples">
      <span className="ex" onClick={() => onPickScenario("collapse")}>Phase 3 healing collapse</span>
      <span className="ex" onClick={() => onPickScenario("extcd")}>External CD chain</span>
      <span className="ex" onClick={() => onPickScenario("spread")}>Ranged spread on Cluster Bomb</span>
    </div>
  </div>
);

/* ---------- Helpers ---------- */
const fmt = (t) => `${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`;
const symbolFor = (kind) => ({
  "death": "✕",
  "save": "✚",
  "support-chain": "↻",
  "stack-break": "↹",
  "spread": "✦",
  "divergence": "↕",
  "collapse": "▼",
}[kind] || "·");

Object.assign(window, {
  CohortCards, CohortEmpty,
  CohortSummary, CDChoreographyCard, CohesionCard, CoordinationCard,
  RecoveriesCard, DeathsCard,
});
