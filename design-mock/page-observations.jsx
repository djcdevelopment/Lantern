/* global React, window */
// /observations — shared interpretations of raid evidence.
//
// This surface is separate from /contribute. Contribution is about
// preserving raid context (substrate). Observations are about
// sharing interpretations — they are exploratory, withdrawable,
// and NEVER automatically become part of any retrospective.

const { useState: useStateO, useMemo: useMemoO } = React;

const ObservationsPage = ({ setRoute, openCohort }) => {
  const [items, setItems] = useStateO(() => window.Observations.all());
  const [filter, setFilter] = useStateO("shared");
  const [scope, setScope] = useStateO("guild"); // 'guild' | 'mine'

  const refresh = () => setItems(window.Observations.all());

  const visible = useMemoO(() => {
    let v = items;
    if (filter !== "all") v = v.filter(p => p.status === filter);
    // Mock 'mine' — assume the player created the pending External CD chain one
    // plus anything saved via Observations.add() in this session. Items shipped
    // in the seed without an authoring marker are "from other raiders".
    if (scope === "mine") {
      v = v.filter(p => p.id === "ob1" || p.id.startsWith("ob") && !["ob2", "ob3"].includes(p.id));
    }
    return v;
  }, [items, filter, scope]);

  const counts = {
    shared:     items.filter(p => p.status === "shared").length,
    referenced: items.filter(p => p.status === "referenced").length,
    withdrawn:  items.filter(p => p.status === "withdrawn").length,
  };

  return (
    <div className="page">
      <div style={{marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16}}>
        <div>
          <p className="h-eyebrow">Workshop · shared interpretations · {items.length} observations</p>
          <h1 className="h-display">Observations.</h1>
          <p className="muted" style={{maxWidth: 640, marginTop: 8, fontSize: 14, lineHeight: 1.6}}>
            Raiders share <window.Term k="cohort">interpretations</window.Term> of shared
            evidence here — clean chains, quiet support, comebacks, open questions.
            Observations are exploratory. They are <em>not</em> retrospective fragments —
            retros are authored independently. Raid leads may reference an observation
            when they write, or they may not; either way, the observation stays here
            for raiders to read and discuss.
          </p>
        </div>
        <button className="btn primary"
                onClick={() => window.Propose && window.Propose.open({
                  kind: "celebration",
                  binding: { kind: "raid", raidId: window.LATEST_RAID.id,
                             label: window.LATEST_RAID.zone + " " + window.LATEST_RAID.difficulty + " · " + window.LATEST_RAID.dateShort },
                })}>
          <Icon name="plus" size={13} /> New observation
        </button>
      </div>

      <div className="obs-toolbar">
        <div className="obs-scope">
          <span className={`obs-scope-btn ${scope === "guild" ? "active" : ""}`}
                onClick={() => setScope("guild")}>
            <Icon name="raids" size={12} /> Guild
            <span className="count">{items.length}</span>
          </span>
          <span className={`obs-scope-btn ${scope === "mine" ? "active" : ""}`}
                onClick={() => setScope("mine")}>
            <Icon name="book" size={12} /> Yours
          </span>
        </div>

        <div style={{flex: 1}}></div>

        <div className="obs-filters">
          <FilterPill on={filter === "shared"}     onClick={() => setFilter("shared")}>
            Shared · {counts.shared}
          </FilterPill>
          <FilterPill on={filter === "referenced"} onClick={() => setFilter("referenced")}>
            Referenced · {counts.referenced}
          </FilterPill>
          <FilterPill on={filter === "withdrawn"}  onClick={() => setFilter("withdrawn")}>
            Withdrawn · {counts.withdrawn}
          </FilterPill>
          <FilterPill on={filter === "all"}        onClick={() => setFilter("all")}>
            All
          </FilterPill>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="cohort-empty" style={{padding: "32px 24px"}}>
          <p className="h-eyebrow">Nothing here yet</p>
          <p style={{margin: "8px auto 0", maxWidth: 420, lineHeight: 1.55}}>
            Use <strong>Share as an observation</strong> from a cohort card, notebook entry,
            workshop finding, or moment — surface something other raiders might want to look at.
          </p>
        </div>
      ) : (
        <div className="prop-list">
          {visible.map(p => (
            <ObservationCard
              key={p.id}
              p={p}
              onWithdraw={() => { window.Observations.withdraw(p.id); refresh(); }}
              onOpenBinding={() => {
                if (p.binding?.kind === "cohort") openCohort(p.binding.scenarioId);
                else if (p.binding?.kind === "raid") setRoute("raids/2026-05-12");
              }}
              setRoute={setRoute}
            />
          ))}
        </div>
      )}

      <div className="obs-foot-note">
        <Icon name="lock" size={12} />
        <span>
          Drafts and unshared notes stay on your machine. Withdrawing an observation removes it
          from the guild's surface immediately. <window.Term k="cohort" /> data attached to an
          observation is the same data you'd see if you opened it in Replay yourself —
          no extra information leaves your machine.
        </span>
      </div>
    </div>
  );
};

const FilterPill = ({ on, onClick, children }) => (
  <span className={`preset-pill ${on ? "active" : ""}`} onClick={onClick}>{children}</span>
);

const ObservationCard = ({ p, onWithdraw, onOpenBinding, setRoute }) => {
  const kindMeta = window.OBSERVATION_KINDS.find(k => k.id === p.kind) || window.OBSERVATION_KINDS[0];
  return (
    <div className={`prop-card status-${p.status}`} style={{"--hue": kindMeta.hue}}>
      <div className="prop-head">
        <p className="prop-title">{p.title}</p>
        <span className={`prop-status status-${p.status}`}>
          <span className="dot" style={{width: 5, height: 5, borderRadius: "50%", background: "currentColor"}}></span>
          {p.status}
        </span>
      </div>
      <div className="prop-meta">
        <span>{kindMeta.label.toUpperCase()}</span>
        <span>·</span>
        <span>shared {p.sharedAt}</span>
        {p.binding && <>
          <span>·</span>
          <span style={{color: "var(--ember)", cursor: "pointer"}} onClick={onOpenBinding}>
            <Icon name="folder" size={10} /> {p.binding.label}
          </span>
        </>}
        {p.fromNoteId && <>
          <span>·</span>
          <span className="prop-from-note" onClick={() => setRoute("notebook")}>
            <Icon name="book" size={10} /> From your notebook
          </span>
        </>}
        {p.referencedIn && <>
          <span>·</span>
          <span style={{color: "var(--good)"}}>{p.referencedIn}</span>
        </>}
        {p.withdrawnAt && <>
          <span>·</span>
          <span>withdrawn {p.withdrawnAt}</span>
        </>}
        {typeof p.viewers === "number" && p.status !== "withdrawn" && <>
          <span>·</span>
          <span><Icon name="eye" size={10} /> {p.viewers} raiders viewed</span>
        </>}
      </div>
      <p className="prop-desc">{p.description}</p>
      <div className="prop-foot">
        <div className="prop-credits">
          <span style={{color: "var(--text-mute)"}}>credits:</span>
          <div className="avatar-cluster">
            {p.credits.map(name => {
              const r = window.ROSTER.find(x => x.name === name);
              return <PAvatar key={name} name={name} hue={r?.hue || 250} size="sm" />;
            })}
          </div>
          <span style={{color: "var(--text-dim)"}}>{p.credits.join(", ")}</span>
        </div>
        {p.status === "shared" && (
          <div className="row" style={{gap: 6}}>
            <button className="btn ghost small" onClick={onWithdraw}>Withdraw</button>
          </div>
        )}
        {p.status === "referenced" && (
          <button className="btn ghost small">Read on Hearth <Icon name="arrowR" size={11} /></button>
        )}
      </div>
    </div>
  );
};

window.ObservationsPage = ObservationsPage;
