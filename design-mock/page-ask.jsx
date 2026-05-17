/* global React, window */
// Workshop (/ask) — local AI with inspectable trace + cohort-aware querying.

const { useState: useStateA, useEffect: useEffectA } = React;

const AskPage = ({ setRoute, tweaks, cohortContext, setCohortContext, askQueued }) => {
  const tone = tweaks?.aiTone || "trace"; // 'trace' | 'minimal' | 'tool'

  // Default question depends on cohort context.
  const defaultQ = cohortContext
    ? defaultCohortQuestion(cohortContext)
    : window.ASK_DEMO_QUESTION;

  const [query, setQuery] = useStateA(defaultQ);
  const [draft, setDraft] = useStateA("");
  const [submittedAt, setSubmittedAt] = useStateA(Date.now());

  // When cohort context changes (e.g. arriving from replay), refresh the
  // active question to a sensible cohort default — UNLESS the same tick also
  // produced an askQueued (a discovery chip click sets both, and the user's
  // explicit question should win).
  useEffectA(() => {
    if (!cohortContext) return;
    // Skip if askQueued is fresh (same render or newer).
    if (askQueued?.at && askQueued.at >= (cohortContext._arrivedAt || 0)) return;
    setQuery(defaultCohortQuestion(cohortContext));
    setSubmittedAt(Date.now());
  }, [cohortContext?.scenarioId]);

  // Pick up a question queued by the command palette / discovery chip.
  // Declared AFTER the cohort effect so it runs last and wins on
  // same-render updates from setCohortContext + askQuestion.
  useEffectA(() => {
    if (askQueued?.q) {
      setQuery(askQueued.q);
      setSubmittedAt(askQueued.at);
    }
  }, [askQueued?.at]);

  const submit = (q) => {
    setQuery(q);
    setDraft("");
    setSubmittedAt(Date.now());
  };

  // Active scenario object (resolved from context if present).
  const activeScenario = cohortContext?.scenarioId
    ? window.COHORT_SCENARIOS[cohortContext.scenarioId]
    : null;

  return (
    <div className="page">
      <div style={{marginBottom: 20}}>
        <p className="h-eyebrow">
          The Workshop · local exploration · nothing leaves this machine
        </p>
        <h1 className="h-display">Ask the workshop.</h1>
        <p className="muted" style={{maxWidth: 640, marginTop: 8}}>
          Answers cite the combat log lines, replay frames, or encounter metadata they were
          built from. You can open any source inline, and you can ask about a selected cohort
          or moment from the replay.
        </p>
      </div>

      {/* Cohort context bar */}
      {cohortContext && (
        <CohortContextBar
          ctx={cohortContext}
          scenario={activeScenario}
          onClear={() => setCohortContext(null)}
          onOpenReplay={() => setRoute("replay")}
        />
      )}

      {/* Attached notebook entries (if any) */}
      {cohortContext?.scenarioId && window.Notebook && (
        <AttachedNotes scenarioId={cohortContext.scenarioId} setRoute={setRoute} />
      )}

      <div className="ask-input" style={{marginBottom: 22}}>
        <Icon name="ask" size={16} />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) submit(draft.trim()); }}
          placeholder={cohortContext
            ? "Ask about the selected cohort or moment…"
            : "Ask about last night's raid…"}
        />
        <span className="kbd-row"><kbd>↵</kbd></span>
        <button className="btn primary small"
                disabled={!draft.trim()}
                style={{opacity: draft.trim() ? 1 : 0.4}}
                onClick={() => draft.trim() && submit(draft.trim())}>
          Ask <Icon name="arrowR" size={11} />
        </button>
      </div>

      <div className="ask-shell">
        <div className="stack lg">
          <AnswerBlock key={submittedAt} query={query} tone={tone}
                       cohortContext={cohortContext}
                       setCohortContext={setCohortContext}
                       setRoute={setRoute} />
          <SuggestedQuestions
            cohortContext={cohortContext}
            onPick={submit}
          />
        </div>
        <div className="stack lg">
          <RecentQuestions onPick={submit} />
          <AIStatusCard />
        </div>
      </div>
    </div>
  );
};

const defaultCohortQuestion = (ctx) => {
  if (ctx.scenarioId === "collapse") return "Why did this cohort collapse?";
  if (ctx.scenarioId === "extcd")    return "Show cooldown overlap during phase transition.";
  if (ctx.scenarioId === "spread")   return "Which ranged stayed grouped during spread?";
  return "What happened in this moment?";
};

/* ---------- Cohort context bar ---------- */
const CohortContextBar = ({ ctx, scenario, onClear, onOpenReplay }) => {
  const members = ctx.members.map(n => window.ROSTER.find(p => p.name === n)).filter(Boolean);
  return (
    <div className="cohort-context">
      <span className="ctx-label">Context</span>
      <div className="ctx-members">
        {members.map(m => <PAvatar key={m.name} name={m.name} hue={m.hue} size="sm" />)}
      </div>
      <div style={{flex: 1}}>
        <div className="ctx-title">
          {scenario ? scenario.title : `${ctx.members.length} raiders selected`}
        </div>
        <div className="ctx-sub">
          {ctx.pullLabel} · {fmt(ctx.range[0])}–{fmt(ctx.range[1])}
        </div>
      </div>
      <button className="btn small" onClick={onOpenReplay}>
        <Icon name="play" size={11} /> Open in replay
      </button>
      <button className="btn ghost small" onClick={onClear} title="Clear cohort context">
        <Icon name="close" size={12} />
      </button>
    </div>
  );
};

/* ---------- Answer block ---------- */
const AnswerBlock = ({ query, tone, cohortContext, setCohortContext, setRoute }) => {
  const key = query.toLowerCase().trim();
  const answer = window.WORKSHOP_ANSWERS[key] || makeGeneric(query, cohortContext);

  const steps = answer.trace;
  const [revealed, setRevealed] = useStateA(0);
  useEffectA(() => {
    setRevealed(0);
    const interval = setInterval(() => {
      setRevealed(r => {
        if (r >= steps.length) { clearInterval(interval); return r; }
        return r + 1;
      });
    }, 260);
    return () => clearInterval(interval);
  }, [query]);

  return (
    <div>
      <div className="ask-prompt">
        <Icon name="chevR" size={14} /> {query}
      </div>

      {tone === "trace" && (
        <div className="ask-trace" style={{margin: "12px 0 16px"}}>
          <div className="mono" style={{fontSize: 10, color: "var(--text-mute)", marginBottom: 8, letterSpacing: "0.08em"}}>
            QUERY PLAN · {revealed < steps.length ? `step ${revealed + 1} of ${steps.length}` : "complete"}
          </div>
          {steps.map((s, i) => {
            const state = i < revealed ? "done" : i === revealed ? "active" : "idle";
            return (
              <div className="step" key={i} style={{opacity: state === "idle" ? 0.35 : 1, transition: "opacity 0.2s"}}>
                <span className={`ic ${state === "done" ? "done" : state === "idle" ? "idle" : ""}`}>
                  {state === "done" ? "✓" : state === "active" ? "•" : "○"}
                </span>
                <span>
                  <span style={{color: "var(--text)"}}>{s.label}</span>
                  <span style={{color: "var(--text-faint)", marginLeft: 8}}>{s.detail}</span>
                </span>
                <span className="t">{state === "done" ? `${(0.04 + i * 0.12).toFixed(2)}s` : ""}</span>
              </div>
            );
          })}
        </div>
      )}

      {revealed >= steps.length && (
        <div className="ask-answer">
          {tone !== "tool" && (
            <p className="h-eyebrow" style={{marginBottom: 12}}>
              Finding · cited from log + replay
              {answer.cohortId && <span style={{marginLeft: 8, color: "var(--ember)"}}>· cohort-aware</span>}
            </p>
          )}

          <AnswerBody body={answer.body}
                      cohortContext={cohortContext}
                      setCohortContext={setCohortContext}
                      setRoute={setRoute} />

          {/* Workshop → Propose bridge */}
          <FindingFooter answer={answer} cohortContext={cohortContext} query={query} />

          <div className="divider"></div>

          <p className="h-eyebrow" style={{marginBottom: 10}}>Sources</p>
          <div className="stack" style={{gap: 6}}>
            {answer.sources.map((s, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "70px 1fr auto",
                gap: 10, alignItems: "center", padding: "6px 8px",
                background: "var(--bg-deep)", border: "1px solid var(--border)",
                borderRadius: 4, cursor: "pointer",
              }}>
                <span className="mono" style={{fontSize: 10, color: "var(--ember)", letterSpacing: "0.06em"}}>
                  {s.type.toUpperCase()}
                </span>
                <span className="mono" style={{fontSize: 12, color: "var(--text-dim)"}}>{s.label}</span>
                <span className="mono" style={{fontSize: 10, color: "var(--text-faint)"}}>
                  {s.t || "open"} ↗
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AnswerBody = ({ body, cohortContext, setCohortContext, setRoute }) => {
  const seekReplay = (t) => {
    if (cohortContext) {
      setCohortContext({ ...cohortContext, t });
    } else {
      setCohortContext({
        scenarioId: null,
        members: ["Durracktu"],
        range: [Math.max(0, t - 12), t + 12],
        pullId: "p18",
        pullLabel: "Mug'Zee · Pull 6",
        t,
      });
    }
    setRoute("replay");
  };
  return (
  <div className="a-body">
    <p>
      {body.map((n, i) => {
        if (typeof n === "string") {
          if (n === "br") return <br key={i} />;
          if (n === "br-strong") return <span key={i} style={{display: "block", height: 12}}></span>;
          return <span key={i}>{n}</span>;
        }
        if (n.kind === "callout") {
          return (
            <span key={i} style={{
              display: "block",
              marginTop: 12,
              padding: "12px 14px",
              background: "var(--bg-deep)",
              border: "1px solid var(--border)",
              borderLeft: "2px solid var(--ember)",
              borderRadius: 4,
            }}>
              <span className="h-eyebrow" style={{display: "block", marginBottom: 6}}>{n.title}</span>
              <span style={{fontSize: 13.5, color: "var(--text)"}}>{n.body}</span>
            </span>
          );
        }
        const hasSeek = n.ref === "replay" && typeof n.t === "number";
        const onClick = () => {
          if (hasSeek) seekReplay(n.t);
          else if (n.ref === "replay") setRoute("replay");
        };
        return <cite key={i} onClick={onClick} title={hasSeek ? `Seek replay to ${Math.floor(n.t/60)}:${String(n.t%60).padStart(2,"0")}` : ""}>{n.cite} ↗</cite>;
      })}
    </p>
  </div>
  );
};

const makeGeneric = (query, cohortContext) => ({
  question: query,
  trace: [
    { state: "done", label: "Resolved query",       detail: query },
    cohortContext
      ? { state: "done", label: "Loaded cohort context", detail: `${cohortContext.members.length} raiders · ${fmt(cohortContext.range[0])}–${fmt(cohortContext.range[1])}` }
      : { state: "done", label: "Scoped to last raid",   detail: window.LATEST_RAID.date },
    { state: "done", label: "Scanned combat log",   detail: "Matching ability + movement events" },
    { state: "done", label: "Cross-referenced replay",detail:"Relevant frame intervals" },
  ],
  body: [
    "I scanned the parsed combat log and cross-referenced replay frames for your question. ",
    "Three pulls match the pattern you described — pulls 6, 7, and 9 of Boss 7 all show similar timing.",
    "br-strong",
    { kind: "callout",
      title: "Placeholder",
      body: "This is a stand-in for the live model response. A real answer would resolve here, citing log lines and replay frames inline." },
  ],
  sources: [
    { type: "Replay", label: "Mug'Zee · Pull 6", t: "any" },
    { type: "Log",    label: "Combat log · scoped to last raid" },
  ],
});

/* ---------- Suggested questions ---------- */
const SuggestedQuestions = ({ cohortContext, onPick }) => {
  const cohortMode = !!cohortContext;
  const suggestions = cohortMode ? window.COHORT_SUGGESTIONS : window.ASK_SUGGESTIONS;
  return (
    <div>
      <p className="h-eyebrow">
        {cohortMode ? "Try asking about this cohort" : "Try asking"}
      </p>
      <div className={`suggested ${cohortMode ? "cohort-sugg" : ""}`}>
        {suggestions.map(s => (
          <span key={s} className="s" onClick={() => onPick(s)}>{s}</span>
        ))}
      </div>
    </div>
  );
};

/* ---------- Finding footer — propose this finding for the retro ---------- */
const FindingFooter = ({ answer, cohortContext, query }) => {
  // Extract a callout body from the answer to pre-fill description.
  const callout = answer.body.find(n => n && n.kind === "callout");
  const summary = callout?.body || answer.body.filter(n => typeof n === "string" && n !== "br" && n !== "br-strong").join("").slice(0, 240);
  const scenarioId = answer.cohortId || cohortContext?.scenarioId;
  const scenario = scenarioId ? window.COHORT_SCENARIOS[scenarioId] : null;

  return (
    <div className="finding-footer">
      <div className="ff-text">
        <p className="h-eyebrow" style={{margin: 0}}>This finding</p>
        <p className="muted" style={{margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.5, maxWidth: 540}}>
          Worth surfacing for the rest of the guild? Share it as an observation —
          other raiders can open the same dataset and weigh in. It is <em>not</em> a retro entry;
          raid leads may or may not reference it when they write theirs.
        </p>
      </div>
      <div className="ff-actions">
        <button className="btn small propose"
                onClick={() => window.Propose && window.Propose.open({
                  kind: callout ? "teamwork" : "celebration",
                  title: scenario ? scenario.title : answer.question || query,
                  description: summary,
                  credits: scenario?.members || cohortContext?.members || [],
                  binding: cohortContext?.scenarioId
                    ? { kind: "cohort", scenarioId: cohortContext.scenarioId,
                        label: scenario ? scenario.title + " · " + scenario.pullLabel : "Cohort selection" }
                    : { kind: "raid", raidId: window.LATEST_RAID.id,
                        label: window.LATEST_RAID.zone + " " + window.LATEST_RAID.difficulty },
                })}>
          <Icon name="upload" size={11} /> Share as an observation
        </button>
        <button className="btn ghost small"
                onClick={() => window.QuickNote && window.QuickNote.open({
                  text: `From the workshop:\n\n${query}\n\n${summary}`,
                  tags: ["ask-later"],
                  binding: cohortContext?.scenarioId
                    ? { kind: "cohort", scenarioId: cohortContext.scenarioId,
                        label: scenario ? scenario.title : "Cohort selection" }
                    : null,
                })}>
          <Icon name="book" size={11} /> Save to notebook
        </button>
      </div>
    </div>
  );
};

/* ---------- Attached notebook entries ---------- */
const AttachedNotes = ({ scenarioId, setRoute }) => {
  const notes = window.Notebook.byBinding("cohort", scenarioId);
  if (!notes || notes.length === 0) return null;
  return (
    <div style={{marginBottom: 18}}>
      <p className="h-eyebrow" style={{display: "flex", justifyContent: "space-between"}}>
        <span>From your notebook · {notes.length} note{notes.length > 1 ? "s" : ""} bound to this cohort</span>
        <span style={{cursor: "pointer", color: "var(--ember)"}} onClick={() => setRoute("notebook")}>open notebook ↗</span>
      </p>
      <div className="stack" style={{gap: 8}}>
        {notes.map(n => (
          <div key={n.id} className="attached-note">
            {n.text}
            <div className="meta">{n.createdAt} · {n.tags.map(t => "#" + t).join(" ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecentQuestions = ({ onPick }) => (
  <div className="card flush">
    <div className="card-head">
      <h2 className="h2">Recent</h2>
      <span className="chip">Local history</span>
    </div>
    <div className="card-body ask-history" style={{padding: "8px 8px"}}>
      {window.ASK_HISTORY.map(h => (
        <div key={h.id} className="h-item" onClick={() => onPick(h.q)}>
          <div className="q">{h.q}</div>
          <div className="meta">{h.t} · {h.encounter}</div>
        </div>
      ))}
    </div>
  </div>
);

const AIStatusCard = () => (
  <div className="card">
    <p className="h-eyebrow">Local model</p>
    <div className="status-grid">
      <div className="status-tile">
        <div className="lbl">Service</div>
        <div className="val"><span className="dot"></span>Ollama running</div>
      </div>
      <div className="status-tile">
        <div className="lbl">Model</div>
        <div className="val">llama3.1:70b</div>
      </div>
      <div className="status-tile">
        <div className="lbl">Context</div>
        <div className="val">12,840 tokens</div>
      </div>
      <div className="status-tile">
        <div className="lbl">Last query</div>
        <div className="val">2.1s · cached</div>
      </div>
    </div>
    <p className="faint" style={{fontSize: 12, marginTop: 12, lineHeight: 1.5}}>
      Conversations stay on this machine. Nothing is sent over the network.
    </p>
  </div>
);

const fmt = (t) => `${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`;

window.AskPage = AskPage;
