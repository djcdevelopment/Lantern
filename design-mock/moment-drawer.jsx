/* global React, window */
// MomentDrawer — the contextual investigation surface.
//
// Opens via window.Moment.open(momentObject) from anywhere in the app.
// A moment is a narratively-framed event: a death, a save, a swap, a feast,
// a collapse. The drawer lets the user descend into it without leaving the
// page: read the narrative, see who was there, see what led to it, ask one
// of three contextual questions, watch in replay, save it, or share it.
//
// This is the load-bearing move toward "investigation as descent" rather
// than "investigation as a separate app mode."

const { useEffect: useEffectM, useState: useStateM } = React;

const MomentDrawer = ({ moment, onClose, setRoute, setCohortContext, askQuestion }) => {
  useEffectM(() => {
    if (!moment) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [moment]);

  if (!moment) return null;
  const m = moment;
  const scenario = m.scenarioId ? window.COHORT_SCENARIOS[m.scenarioId] : null;
  const cohort = scenario ? scenario.members : (m.members || []);

  const continueIn = (target, opts = {}) => {
    // Build a cohort context that anchors this moment.
    setCohortContext({
      momentId: m.id,
      momentTitle: m.title,
      scenarioId: m.scenarioId || null,
      members: cohort,
      range: scenario?.range || [Math.max(0, m.pullT - 12), m.pullT + 12],
      pullId: m.pullId,
      pullLabel: "Mug'Zee \u00b7 Pull 6", // simplified
      t: m.pullT,
      ...opts,
    });
    onClose();
    setRoute(target);
  };

  const watchInReplay = () => continueIn("replay");

  const investigate = (q) => {
    askQuestion(q);
    setCohortContext({
      momentId: m.id,
      momentTitle: m.title,
      scenarioId: m.scenarioId || null,
      members: cohort,
      range: scenario?.range || [Math.max(0, m.pullT - 12), m.pullT + 12],
      pullId: m.pullId,
      pullLabel: "Mug'Zee \u00b7 Pull 6",
      t: m.pullT,
      _arrivedAt: Date.now(),
    });
    onClose();
    setRoute("ask");
  };

  const saveToNotebook = () => {
    window.QuickNote && window.QuickNote.open({
      text: `${m.title}\n\n${m.narrative}`,
      tags: m.kind === "swap" || m.kind === "feast" ? ["self"] :
            m.kind === "death" ? ["self", "mechanic"] :
            m.kind === "save" ? ["cooldowns"] : [],
      binding: { kind: "pull", pullId: m.pullId, label: `Mug'Zee \u00b7 Pull 6 \u00b7 ${formatTime(m.pullT)}` },
    });
    onClose();
  };

  const shareObservation = () => {
    window.Propose && window.Propose.open({
      kind: m.kind === "death" ? "celebration" :
            m.kind === "save" ? "teamwork" :
            m.kind === "swap" || m.kind === "feast" ? "support" : "celebration",
      title: m.title,
      description: m.narrative,
      credits: cohort.length ? cohort : ["Durracktu"],
      binding: m.scenarioId
        ? { kind: "cohort", scenarioId: m.scenarioId,
            label: scenario ? scenario.title : m.title }
        : { kind: "pull", pullId: m.pullId,
            label: `Mug'Zee \u00b7 Pull 6 \u00b7 ${formatTime(m.pullT)}` },
    });
    onClose();
  };

  return (
    <div className="moment-backdrop" onClick={onClose}>
      <div className={`moment-drawer kind-${m.kind} weight-${m.weight || 3}`}
           onClick={(e) => e.stopPropagation()}>

        {/* Hero — kind-specific visual treatment */}
        <div className="md-hero">
          <div className="md-hero-bg"></div>
          <div className="md-hero-content">
            <div className="md-eyebrow">
              <span className="md-kind-chip"><MomentKindIcon kind={m.kind} /> {kindLabel(m.kind)}</span>
              <span className="md-ts mono">{m.ctx}</span>
            </div>
            <h1 className="md-title">{m.title}</h1>
            <p className="md-short">{m.short}</p>
          </div>
          <button className="md-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
            <span className="kbd-row" style={{marginLeft: 6}}><kbd>esc</kbd></span>
          </button>
        </div>

        <div className="md-body">
          {/* Narrative */}
          <section className="md-section">
            <p className="md-narrative">{m.narrative}</p>
          </section>

          {/* Who was there */}
          {(m.nearby?.length > 0 || m.members?.length > 1) && (
            <section className="md-section">
              <p className="h-eyebrow md-section-label">Who was there</p>
              <div className="md-people">
                {(m.nearby?.length > 0 ? m.nearby : m.members).map(name => {
                  const r = window.ROSTER.find(x => x.name === name);
                  if (!r) return null;
                  return (
                    <span key={name} className={`md-person role-${r.role}`}>
                      <PAvatar name={name} hue={r.hue} size="sm" />
                      <span>{name}</span>
                      <span className="md-person-role">
                        {r.role === "heal" ? "H" : r.role === "tank" ? "T" : "D"}
                      </span>
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {/* Lead-up */}
          {m.lead?.length > 0 && (
            <section className="md-section">
              <p className="h-eyebrow md-section-label">What led to this</p>
              <ol className="md-lead-list">
                {m.lead.map((ev, i) => (
                  <li key={i} className="md-lead-item">
                    <span className="md-lead-t mono">{ev.t}</span>
                    <span className="md-lead-text">{ev.text}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Aftermath */}
          {m.aftermath && (
            <section className="md-section md-aftermath">
              <p className="h-eyebrow md-section-label">What came after</p>
              <p className="md-aftermath-text">{m.aftermath}</p>
            </section>
          )}

          {/* Investigation questions */}
          {m.questions?.length > 0 && (
            <section className="md-section">
              <p className="h-eyebrow md-section-label">Investigate · ask the workshop</p>
              <div className="md-questions">
                {m.questions.map((q, i) => (
                  <button key={i}
                          className={`md-question dir-${q.direction || "self"}`}
                          onClick={() => investigate(q.q)}>
                    <span className="md-q-text">{q.q}</span>
                    <span className="md-q-arrow">→</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Actions footer */}
        <div className="md-actions">
          <button className="btn primary md-watch" onClick={watchInReplay}>
            <Icon name="play" size={13} />
            Watch this moment
            <span className="md-action-sub">Open in replay at {formatTime(m.pullT)}</span>
          </button>
          <button className="btn md-save" onClick={saveToNotebook}>
            <Icon name="book" size={12} /> Save to notebook
          </button>
          <button className="btn md-share" onClick={shareObservation}>
            <Icon name="upload" size={12} /> Share as observation
          </button>
        </div>
      </div>
    </div>
  );
};

const MomentKindIcon = ({ kind }) => {
  const m = {
    death: "✕",
    save:  "✚",
    swap:  "↻",
    feast: "✦",
    collapse: "▼",
    comeback: "★",
  };
  return <span style={{fontFamily: "var(--font-display)", fontSize: 12}}>{m[kind] || "·"}</span>;
};

const kindLabel = (kind) => ({
  death: "Death",
  save:  "Save",
  swap:  "Role swap",
  feast: "Quiet support",
  collapse: "Collapse",
  comeback: "Comeback",
}[kind] || kind);

const formatTime = (t) => {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// Global opener
window.Moment = { open: () => console.warn("Moment drawer not mounted yet") };

window.MomentDrawer = MomentDrawer;
