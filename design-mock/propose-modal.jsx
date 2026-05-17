/* global React, window */
// "Propose for the retro" — push-button proposal modal.
//
// Three steps: compose → confirm → success. The confirm step states plainly
// what happens, who can see it, how to cancel, and how it helps the guild.
// Nothing is sent until the user confirms. Withdrawable any time before the
// raid lead publishes the retrospective.

const { useState: useStateProp, useEffect: useEffectProp, useRef: useRefProp } = React;

const PROPOSALS_KEY = "campfire.proposals.v1";

// Store (localStorage-backed).
function loadProposals() {
  try {
    const raw = localStorage.getItem(PROPOSALS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [...window.PROPOSALS_SEED];
}
function saveProposals(p) {
  try { localStorage.setItem(PROPOSALS_KEY, JSON.stringify(p)); } catch (e) {}
}

window.Observations = {
  all: () => loadProposals(),
  add: (seed) => {
    const all = loadProposals();
    const p = {
      id: "ob" + Date.now(),
      status: "shared",
      sharedAt: "just now",
      raidId: window.LATEST_RAID.id,
      kind: seed.kind || "teamwork",
      title: seed.title || "",
      description: seed.description || "",
      credits: seed.credits || [],
      binding: seed.binding || null,
      sources: seed.sources || [],
      fromNoteId: seed.fromNoteId || null,
      viewers: 0,
    };
    saveProposals([p, ...all]);
    if (window.__campfireTick) window.__campfireTick();
    return p;
  },
  withdraw: (id) => {
    const all = loadProposals();
    saveProposals(all.map(p => p.id === id ? { ...p, status: "withdrawn", withdrawnAt: "just now" } : p));
    if (window.__campfireTick) window.__campfireTick();
  },
  remove: (id) => {
    const all = loadProposals();
    saveProposals(all.filter(p => p.id !== id));
    if (window.__campfireTick) window.__campfireTick();
  },
  byNoteId: (noteId) => loadProposals().find(p => p.fromNoteId === noteId),
  counts: () => {
    const all = loadProposals();
    return {
      shared: all.filter(p => p.status === "shared").length,
      referenced: all.filter(p => p.status === "referenced").length,
      withdrawn: all.filter(p => p.status === "withdrawn").length,
      total: all.length,
    };
  },
};
// Backward-compat alias so existing code paths keep working until renamed.
window.Proposals = window.Observations;

// Global opener — entry points call window.Propose.open({...seed}).
// app.jsx wires this to setProposeState.
window.Propose = {
  open: () => console.warn("Propose modal not mounted yet"),
};

/* ============================================================
   Modal component
   ============================================================ */

const ProposeModal = ({ seed, onClose, onSubmitted }) => {
  const [step, setStep] = useStateProp("compose");
  const [kind, setKind] = useStateProp(seed.kind || "teamwork");
  const [title, setTitle] = useStateProp(seed.title || "");
  const [description, setDescription] = useStateProp(seed.description || "");
  const [credits, setCredits] = useStateProp(seed.credits || []);
  const [submitted, setSubmitted] = useStateProp(null);

  const submit = () => {
    const p = window.Proposals.add({
      kind, title, description, credits,
      binding: seed.binding,
      sources: seed.sources || guessSources(seed.binding),
      fromNoteId: seed.fromNoteId,
    });
    setSubmitted(p);
    setStep("success");
    onSubmitted && onSubmitted(p);
  };

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="propose-modal" onClick={(e) => e.stopPropagation()}>
        {step === "compose" && (
          <ComposeStep
            kind={kind} setKind={setKind}
            title={title} setTitle={setTitle}
            description={description} setDescription={setDescription}
            credits={credits} setCredits={setCredits}
            seed={seed}
            onCancel={onClose}
            onReview={() => setStep("confirm")}
          />
        )}
        {step === "confirm" && (
          <ConfirmStep
            kind={kind} title={title} description={description} credits={credits}
            seed={seed}
            onBack={() => setStep("compose")}
            onCancel={onClose}
            onConfirm={submit}
          />
        )}
        {step === "success" && (
          <SuccessStep
            proposal={submitted}
            onClose={onClose}
            onViewProposals={() => { onClose(); window.__goRoute && window.__goRoute("observations"); }}
          />
        )}
      </div>
    </div>
  );
};

/* ---------- COMPOSE ---------- */
const ComposeStep = ({ kind, setKind, title, setTitle, description, setDescription, credits, setCredits, seed, onCancel, onReview }) => {
  const allCredits = window.ROSTER.map(r => r.name);
  const titleRef = useRefProp(null);
  useEffectProp(() => { if (!title) titleRef.current?.focus(); }, []);

  const kindMeta = window.PROPOSAL_KINDS.find(k => k.id === kind) || window.PROPOSAL_KINDS[0];

  return (
    <>
      <div className="propose-head">
        <div>
          <p className="h-eyebrow" style={{margin: 0}}>Step 1 of 2 · Compose</p>
          <h2 className="propose-title">Share an observation</h2>
        </div>
        <button className="icon-btn" onClick={onCancel} title="Cancel"><Icon name="close" size={14} /></button>
      </div>

      <div className="propose-body">
        <p className="muted" style={{margin: "0 0 16px", fontSize: 13, lineHeight: 1.6, maxWidth: 540}}>
          Surface something worth a closer look — a quiet handoff, a comeback, a kindness,
          an open question. Observations live in the guild's Workshop. Your raid leads <em>may</em>
          reference one when they author the next retrospective, but retros are written
          independently. Observations are interpretations, not retro fragments.
        </p>

        <Field label="Kind" hint="The shape of what you're surfacing">
          <div className="kind-picker">
            {window.OBSERVATION_KINDS.map(k => (
              <span key={k.id}
                    className={`kind-chip ${kind === k.id ? "selected" : ""}`}
                    style={{"--hue": k.hue}}
                    onClick={() => setKind(k.id)}>
                <span className="kind-dot"></span>
                {k.label}
              </span>
            ))}
          </div>
          <p className="faint" style={{fontSize: 11.5, marginTop: 6}}>{kindMeta.desc}</p>
        </Field>

        <Field label="Headline" hint="One short line. What did you notice?">
          <input
            ref={titleRef}
            className="propose-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. External CD chain on add wave 1 was the cleanest of the night"
          />
        </Field>

        <Field label="Why" hint="A few sentences. Plain language is best.">
          <textarea
            className="propose-textarea"
            value={description}
            rows={4}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, why it mattered, and what your raid leads should look at."
          />
        </Field>

        <Field label="Credit" hint="Who deserves recognition. You can credit multiple raiders.">
          <div className="credit-picker">
            {allCredits.map(name => {
              const p = window.ROSTER.find(r => r.name === name);
              const on = credits.includes(name);
              return (
                <span key={name}
                      className={`credit-chip ${on ? "selected" : ""}`}
                      onClick={() => setCredits(on ? credits.filter(c => c !== name) : [...credits, name])}>
                  <PAvatar name={name} hue={p?.hue || 250} size="sm" />
                  <span>{name}</span>
                </span>
              );
            })}
          </div>
        </Field>

        <Field label="Dataset attached" hint="What other raiders will be able to inspect">
          <DatasetSummary seed={seed} />
        </Field>
      </div>

      <div className="propose-foot">
        <span className="faint mono" style={{fontSize: 11, marginRight: "auto"}}>
          Nothing is shared until you confirm.
        </span>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn primary"
                disabled={!title.trim() || !description.trim() || credits.length === 0}
                style={{opacity: (title.trim() && description.trim() && credits.length > 0) ? 1 : 0.4}}
                onClick={onReview}>
          Review <Icon name="arrowR" size={12} />
        </button>
      </div>
    </>
  );
};

/* ---------- CONFIRM ---------- */
const ConfirmStep = ({ kind, title, description, credits, seed, onBack, onCancel, onConfirm }) => {
  const kindMeta = window.OBSERVATION_KINDS.find(k => k.id === kind);
  return (
    <>
      <div className="propose-head">
        <div>
          <p className="h-eyebrow" style={{margin: 0}}>Step 2 of 2 · Confirm</p>
          <h2 className="propose-title">Share this with the guild's Workshop?</h2>
        </div>
        <button className="icon-btn" onClick={onCancel} title="Cancel"><Icon name="close" size={14} /></button>
      </div>

      <div className="propose-body">
        {/* Summary card */}
        <div className="confirm-summary" style={{"--hue": kindMeta.hue}}>
          <div className="cs-kind">{kindMeta.label}</div>
          <div className="cs-title">{title}</div>
          <p className="cs-desc">{description}</p>
          <div className="cs-credits">
            <span className="h-eyebrow" style={{marginRight: 8}}>credits</span>
            <div className="avatar-cluster">
              {credits.map(name => {
                const p = window.ROSTER.find(r => r.name === name);
                return <PAvatar key={name} name={name} hue={p?.hue || 250} size="sm" />;
              })}
            </div>
            <span className="faint" style={{marginLeft: 10, fontSize: 12}}>{credits.join(", ")}</span>
          </div>
          <div className="cs-dataset">
            <DatasetSummary seed={seed} />
          </div>
        </div>

        {/* The clarity section — every concern addressed in plain language */}
        <div className="confirm-clarity">
          <ClarityRow ico="upload" label="What happens"
            body={<>Your observation appears in the guild's <strong>Observations</strong> surface for
              raiders to read and discuss. It is <strong>not</strong> a retrospective entry — retros are
              written independently by your raid leads. They <em>may</em> reference your observation if
              they find it useful, but they may not, and that's fine: observations live alongside retros,
              not inside them.</>} />

          <ClarityRow ico="eye" label="Who can see it"
            body={<>Other raiders in your guild who open the Observations surface,
              plus your raid leads. Anyone who can see it can also link the same dataset
              you attached — cohort, replay frame, or moment — and inspect it themselves.
              Other raiders cannot edit your text.</>} />

          <ClarityRow ico="close" label="How to cancel"
            body={<>Withdraw at any time from <strong>Observations · Yours</strong>. The observation
              is removed from the guild's surface immediately. If a raid lead has already referenced it
              in a published retrospective, their reference (their words) remains theirs to edit.</>} />

          <ClarityRow ico="spark" label="How this helps"
            body={<>Observations are how raiders share interpretations of shared evidence.
              A clean cooldown chain, an alt-swap that mattered, a comeback worth celebrating —
              these are easy to miss in raw numbers. Sharing one helps other raiders see what
              you saw, and gives raid leads something to draw on when they author memory for the chronicle.</>} />
        </div>
      </div>

      <div className="propose-foot">
        <button className="btn ghost" onClick={onBack}>
          <Icon name="arrowL" size={12} /> Back
        </button>
        <span style={{flex: 1}}></span>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" onClick={onConfirm}>
          <Icon name="upload" size={12} /> Share with the Workshop
        </button>
      </div>
    </>
  );
};

/* ---------- SUCCESS ---------- */
const SuccessStep = ({ proposal, onClose, onViewProposals }) => (
  <>
    <div className="propose-success">
      <div className="success-glyph">
        <Icon name="check" size={28} stroke={2} />
      </div>
      <p className="h-eyebrow">Observation shared · visible in the Workshop</p>
      <h2 className="propose-title" style={{marginTop: 8}}>Your observation is now in the guild's Workshop.</h2>
      <p className="muted" style={{maxWidth: 480, margin: "12px auto 0", fontSize: 14, lineHeight: 1.6}}>
        Other raiders can open the dataset you attached and read what you saw. Raid leads <em>may</em>
        draw on it when they next author a retrospective — the retro stays theirs to write. You can
        withdraw any time from <strong>Observations</strong>.
      </p>

      <div className="success-recap">
        <span className="chip ember">SHARED</span>
        <span style={{fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)"}}>id {proposal.id}</span>
      </div>

      <div className="row" style={{justifyContent: "center", gap: 10, marginTop: 22}}>
        <button className="btn" onClick={onClose}>Done</button>
        <button className="btn primary" onClick={onViewProposals}>
          View in Observations <Icon name="arrowR" size={12} />
        </button>
      </div>
    </div>
  </>
);

/* ---------- Helpers ---------- */
const Field = ({ label, hint, children }) => (
  <div className="propose-field">
    <div className="pf-head">
      <span className="pf-label">{label}</span>
      {hint && <span className="pf-hint">{hint}</span>}
    </div>
    {children}
  </div>
);

const ClarityRow = ({ ico, label, body }) => (
  <div className="clarity-row">
    <span className="clarity-ico"><Icon name={ico} size={14} /></span>
    <div>
      <div className="clarity-label">{label}</div>
      <div className="clarity-body">{body}</div>
    </div>
  </div>
);

const DatasetSummary = ({ seed }) => {
  const sources = seed.sources || guessSources(seed.binding);
  return (
    <div className="dataset-summary">
      {seed.binding && (
        <div className="ds-line">
          <Icon name={bindingIco(seed.binding.kind)} size={12} />
          <span><strong>Binding:</strong> {seed.binding.label}</span>
        </div>
      )}
      {sources.length > 0 && sources.map((s, i) => (
        <div key={i} className="ds-line">
          <Icon name="folder" size={12} />
          <span>{s}</span>
        </div>
      ))}
      {seed.fromNoteId && (
        <div className="ds-line">
          <Icon name="book" size={12} />
          <span><strong>From your notebook:</strong> note {seed.fromNoteId}</span>
        </div>
      )}
      <p className="faint" style={{fontSize: 11, margin: "8px 0 0", lineHeight: 1.5}}>
        Your raw combat log, /ask transcripts, and any unattached notebook entries stay on this machine.
      </p>
    </div>
  );
};

const guessSources = (binding) => {
  if (!binding) return [];
  if (binding.kind === "cohort") return ["Replay frames for the bound cohort range", "Cohort coordination event list"];
  if (binding.kind === "pull")   return ["Pull replay frames", "Pull combat log slice"];
  if (binding.kind === "raid")   return ["Raid encounter summaries"];
  return [];
};

const bindingIco = (kind) => ({
  cohort: "spark", raid: "raids", pull: "play", encounter: "book",
}[kind] || "folder");

window.ProposeModal = ProposeModal;
