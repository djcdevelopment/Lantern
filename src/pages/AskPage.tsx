// Workshop (/ask) — local AI with inspectable trace + cohort-aware querying.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { PAvatar } from "@/components/primitives";
import { useSession } from "@/state/session";
import { useWorkbench } from "@/state/workbench";
import { useNotebook } from "@/state/memory";
import { api, CLOUD_MODE, CloudUnavailableError } from "@/api";
import type {
  CohortContext,
  WorkshopAnswer,
  AnswerBodyNode,
  CiteNode,
  CalloutNode,
  CohortScenario,
  ObservationDraft,
} from "@/api";
import type { QuickNoteSeed } from "@/state/workbench";

/* ---------- helpers ---------- */

const fmt = (t: number): string =>
  `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;

const defaultCohortQuestion = (ctx: CohortContext): string => {
  if (ctx.scenarioId === "collapse") return "Why did this cohort collapse?";
  if (ctx.scenarioId === "extcd")    return "Show cooldown overlap during phase transition.";
  if (ctx.scenarioId === "spread")   return "Which ranged stayed grouped during spread?";
  return "What happened in this moment?";
};

/* ---------- Sub-component props ---------- */

interface CohortContextBarProps {
  ctx: CohortContext;
  scenario: CohortScenario | null;
  onClear: () => void;
  onOpenReplay: () => void;
}

interface AnswerBlockProps {
  query: string;
  tone: string;
  cohortContext: CohortContext | null;
  setCohortContext: (c: CohortContext | null) => void;
  onNavigate: (path: string) => void;
}

interface AnswerBodyProps {
  body: AnswerBodyNode[];
  cohortContext: CohortContext | null;
  setCohortContext: (c: CohortContext | null) => void;
  onNavigate: (path: string) => void;
}

interface FindingFooterProps {
  answer: WorkshopAnswer;
  cohortContext: CohortContext | null;
  query: string;
  scenarios: Record<string, CohortScenario>;
  openPropose: (seed?: ObservationDraft) => void;
  openQuickNote: (seed?: QuickNoteSeed) => void;
  latestRaidId: string;
  latestRaidZone: string;
  latestRaidDifficulty: string;
}

interface AttachedNotesProps {
  scenarioId: string;
  onNavigate: (path: string) => void;
}

interface SuggestedQuestionsProps {
  cohortContext: CohortContext | null;
  onPick: (q: string) => void;
  askSuggestions: string[];
  cohortSuggestions: string[];
}

interface RecentQuestionsProps {
  onPick: (q: string) => void;
}

/* ---------- Cohort context bar ---------- */

const CohortContextBar = ({ ctx, scenario, onClear, onOpenReplay }: CohortContextBarProps) => {
  const { roster } = useSession();
  const members = ctx.members
    .map((n) => roster.find((p) => p.name === n))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  return (
    <div className="cohort-context">
      <span className="ctx-label">Context</span>
      <div className="ctx-members">
        {members.map((m) => (
          <PAvatar key={m.name} name={m.name} hue={m.hue} size="sm" />
        ))}
      </div>
      <div style={{ flex: 1 }}>
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

/* ---------- Answer body ---------- */

const AnswerBody = ({ body, cohortContext, setCohortContext, onNavigate }: AnswerBodyProps) => {
  const seekReplay = (t: number) => {
    if (cohortContext) {
      setCohortContext({ ...cohortContext, t });
    } else {
      setCohortContext({
        scenarioId: null,
        members: ["Durracktu"],
        range: [Math.max(0, t - 12), t + 12] as [number, number],
        pullId: "p18",
        pullLabel: "Mug'Zee · Pull 6",
        t,
      });
    }
    onNavigate("/replay");
  };

  return (
    <div className="a-body">
      <p>
        {body.map((n, i) => {
          if (typeof n === "string") {
            if (n === "br") return <br key={i} />;
            if (n === "br-strong")
              return <span key={i} style={{ display: "block", height: 12 }}></span>;
            return <span key={i}>{n}</span>;
          }
          if ("kind" in n) {
            const callout = n as CalloutNode;
            return (
              <span
                key={i}
                style={{
                  display: "block",
                  marginTop: 12,
                  padding: "12px 14px",
                  background: "var(--bg-deep)",
                  border: "1px solid var(--border)",
                  borderLeft: "2px solid var(--ember)",
                  borderRadius: 4,
                }}
              >
                <span className="h-eyebrow" style={{ display: "block", marginBottom: 6 }}>
                  {callout.title}
                </span>
                <span style={{ fontSize: 13.5, color: "var(--text)" }}>{callout.body}</span>
              </span>
            );
          }
          const cite = n as CiteNode;
          const hasSeek = cite.ref === "replay" && typeof cite.t === "number";
          const onClick = () => {
            if (hasSeek) seekReplay(cite.t as number);
            else if (cite.ref === "replay") onNavigate("/replay");
          };
          return (
            <cite
              key={i}
              onClick={onClick}
              title={
                hasSeek
                  ? `Seek replay to ${Math.floor((cite.t as number) / 60)}:${String((cite.t as number) % 60).padStart(2, "0")}`
                  : ""
              }
            >
              {cite.cite} ↗
            </cite>
          );
        })}
      </p>
    </div>
  );
};

/* ---------- Finding footer — propose this finding for the retro ---------- */

const FindingFooter = ({
  answer,
  cohortContext,
  query,
  scenarios,
  openPropose,
  openQuickNote,
  latestRaidId,
  latestRaidZone,
  latestRaidDifficulty,
}: FindingFooterProps) => {
  const callout = answer.body.find(
    (n): n is CalloutNode => typeof n !== "string" && "kind" in n,
  );
  const summary =
    callout?.body ||
    answer.body
      .filter((n): n is string => typeof n === "string" && n !== "br" && n !== "br-strong")
      .join("")
      .slice(0, 240);
  const scenarioId = answer.cohortId || cohortContext?.scenarioId;
  const scenario = scenarioId ? scenarios[scenarioId] : null;

  return (
    <div className="finding-footer">
      <div className="ff-text">
        <p className="h-eyebrow" style={{ margin: 0 }}>
          This finding
        </p>
        <p
          className="muted"
          style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.5, maxWidth: 540 }}
        >
          Worth surfacing for the rest of the guild? Share it as an observation —
          other raiders can open the same dataset and weigh in. It is <em>not</em> a retro entry;
          raid leads may or may not reference it when they write theirs.
        </p>
      </div>
      <div className="ff-actions">
        <button
          className="btn small propose"
          onClick={() =>
            openPropose({
              kind: callout ? "teamwork" : "celebration",
              title: scenario ? scenario.title : answer.question || query,
              description: summary,
              credits: scenario?.members || cohortContext?.members || [],
              binding: cohortContext?.scenarioId
                ? {
                    kind: "cohort",
                    label: scenario
                      ? scenario.title + " · " + scenario.pullLabel
                      : "Cohort selection",
                    scenarioId: cohortContext.scenarioId,
                  }
                : {
                    kind: "raid",
                    raidId: latestRaidId,
                    label: latestRaidZone + " " + latestRaidDifficulty,
                  },
            })
          }
        >
          <Icon name="upload" size={11} /> Share as an observation
        </button>
        <button
          className="btn ghost small"
          onClick={() =>
            openQuickNote({
              text: `From the workshop:\n\n${query}\n\n${summary}`,
              tags: ["ask-later"],
              binding: cohortContext?.scenarioId
                ? {
                    kind: "cohort",
                    label: scenario ? scenario.title : "Cohort selection",
                    scenarioId: cohortContext.scenarioId,
                  }
                : null,
            })
          }
        >
          <Icon name="book" size={11} /> Save to notebook
        </button>
      </div>
    </div>
  );
};

/* ---------- Attached notebook entries ---------- */

const AttachedNotes = ({ scenarioId, onNavigate }: AttachedNotesProps) => {
  const { notesByBinding } = useNotebook();
  const notes = notesByBinding("cohort", scenarioId);
  if (!notes || notes.length === 0) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <p
        className="h-eyebrow"
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <span>
          From your notebook · {notes.length} note{notes.length > 1 ? "s" : ""} bound to this
          cohort
        </span>
        <span
          style={{ cursor: "pointer", color: "var(--ember)" }}
          onClick={() => onNavigate("/notebook")}
        >
          open notebook ↗
        </span>
      </p>
      <div className="stack" style={{ gap: 8 }}>
        {notes.map((n) => (
          <div key={n.id} className="attached-note">
            {n.text}
            <div className="meta">
              {n.createdAt} · {n.tags.map((t) => "#" + t).join(" ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- Answer block ---------- */

const AnswerBlock = ({
  query,
  tone,
  cohortContext,
  setCohortContext,
  onNavigate,
}: AnswerBlockProps) => {
  const { cohortScenarios, latestRaid } = useSession();
  const { openPropose, openQuickNote } = useWorkbench();

  const [answer, setAnswer] = useState<WorkshopAnswer | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch the answer from the Workshop API whenever query changes (keyed by submittedAt).
  useEffect(() => {
    setAnswer(null);
    setRevealed(0);
    setError(null);
    let cancelled = false;
    const ctx = cohortContext
      ? {
          cohortId: cohortContext.scenarioId ?? null,
          members: cohortContext.members,
          range: cohortContext.range,
          pullId: cohortContext.pullId,
        }
      : null;
    api.workshop
      .ask(query, ctx)
      .then((result) => {
        if (!cancelled) setAnswer(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof CloudUnavailableError
            ? "The Workshop runs a local model — open Lantern in the desktop app to ask questions."
            : `The Workshop is unavailable — ${String((err as Error)?.message ?? err)}`,
        );
      });
    return () => {
      cancelled = true;
    };
    // cohortContext intentionally omitted: AnswerBlock is keyed by submittedAt
    // so it remounts on every new submission; query is the only stable trigger.
  }, [query]);

  // Once we have an answer, run the trace-reveal animation.
  useEffect(() => {
    if (!answer) return;
    setRevealed(0);
    const steps = answer.trace;
    const interval = setInterval(() => {
      setRevealed((r) => {
        if (r >= steps.length) {
          clearInterval(interval);
          return r;
        }
        return r + 1;
      });
    }, 260);
    return () => clearInterval(interval);
  }, [answer]);

  if (!answer) {
    return (
      <div>
        <div className="ask-prompt">
          <Icon name="chevR" size={14} /> {query}
        </div>
        <p className="muted">{error ?? "Consulting the local model…"}</p>
      </div>
    );
  }

  const steps = answer.trace;

  return (
    <div>
      <div className="ask-prompt">
        <Icon name="chevR" size={14} /> {query}
      </div>

      {tone === "trace" && (
        <div className="ask-trace" style={{ margin: "12px 0 16px" }}>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--text-mute)",
              marginBottom: 8,
              letterSpacing: "0.08em",
            }}
          >
            QUERY PLAN · {revealed < steps.length ? `step ${revealed + 1} of ${steps.length}` : "complete"}
          </div>
          {steps.map((s, i) => {
            const state = i < revealed ? "done" : i === revealed ? "active" : "idle";
            return (
              <div
                className="step"
                key={i}
                style={{ opacity: state === "idle" ? 0.35 : 1, transition: "opacity 0.2s" }}
              >
                <span className={`ic ${state === "done" ? "done" : state === "idle" ? "idle" : ""}`}>
                  {state === "done" ? "✓" : state === "active" ? "•" : "○"}
                </span>
                <span>
                  <span style={{ color: "var(--text)" }}>{s.label}</span>
                  <span style={{ color: "var(--text-faint)", marginLeft: 8 }}>{s.detail}</span>
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
            <p className="h-eyebrow" style={{ marginBottom: 12 }}>
              Finding · cited from log + replay
              {answer.cohortId && (
                <span style={{ marginLeft: 8, color: "var(--ember)" }}>· cohort-aware</span>
              )}
            </p>
          )}

          <AnswerBody
            body={answer.body}
            cohortContext={cohortContext}
            setCohortContext={setCohortContext}
            onNavigate={onNavigate}
          />

          <FindingFooter
            answer={answer}
            cohortContext={cohortContext}
            query={query}
            scenarios={cohortScenarios}
            openPropose={openPropose}
            openQuickNote={openQuickNote}
            latestRaidId={latestRaid.id}
            latestRaidZone={latestRaid.zone}
            latestRaidDifficulty={latestRaid.difficulty}
          />

          <div className="divider"></div>

          <p className="h-eyebrow" style={{ marginBottom: 10 }}>
            Sources
          </p>
          <div className="stack" style={{ gap: 6 }}>
            {answer.sources.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr auto",
                  gap: 10,
                  alignItems: "center",
                  padding: "6px 8px",
                  background: "var(--bg-deep)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 10, color: "var(--ember)", letterSpacing: "0.06em" }}
                >
                  {s.type.toUpperCase()}
                </span>
                <span className="mono" style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {s.label}
                </span>
                <span className="mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>
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

/* ---------- Suggested questions ---------- */

const SuggestedQuestions = ({
  cohortContext,
  onPick,
  askSuggestions,
  cohortSuggestions,
}: SuggestedQuestionsProps) => {
  const cohortMode = !!cohortContext;
  const suggestions = cohortMode ? cohortSuggestions : askSuggestions;
  return (
    <div>
      <p className="h-eyebrow">
        {cohortMode ? "Try asking about this cohort" : "Try asking"}
      </p>
      <div className={`suggested ${cohortMode ? "cohort-sugg" : ""}`}>
        {suggestions.map((s) => (
          <span key={s} className="s" onClick={() => onPick(s)}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ---------- Recent questions ---------- */

const RecentQuestions = ({ onPick }: RecentQuestionsProps) => {
  const { askHistory } = useSession();
  return (
    <div className="card flush">
      <div className="card-head">
        <h2 className="h2">Recent</h2>
        <span className="chip">Local history</span>
      </div>
      <div className="card-body ask-history" style={{ padding: "8px 8px" }}>
        {askHistory.map((h) => (
          <div key={h.id} className="h-item" onClick={() => onPick(h.q)}>
            <div className="q">{h.q}</div>
            <div className="meta">
              {h.t} · {h.encounter}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- AI status card ---------- */

const AIStatusCard = () => (
  <div className="card">
    <p className="h-eyebrow">Local model</p>
    <div className="status-grid">
      <div className="status-tile">
        <div className="lbl">Service</div>
        <div className="val">
          <span className="dot"></span>Ollama running
        </div>
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
    <p className="faint" style={{ fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
      Conversations stay on this machine. Nothing is sent over the network.
    </p>
  </div>
);

/* ---------- Page ---------- */

export function AskPage() {
  const navigate = useNavigate();
  const { cohortScenarios, askSuggestions, cohortSuggestions } = useSession();
  const { tweaks, cohortContext, setCohortContext, askQueued } = useWorkbench();

  const tone = tweaks?.aiTone || "trace";

  const defaultQ = cohortContext
    ? defaultCohortQuestion(cohortContext)
    : askSuggestions[0];

  const [query, setQuery] = useState(defaultQ);
  const [draft, setDraft] = useState("");
  const [submittedAt, setSubmittedAt] = useState(Date.now());

  // When cohort context changes (e.g. arriving from replay), refresh the
  // active question to a sensible cohort default — UNLESS the same tick also
  // produced an askQueued (a discovery chip click sets both, and the user's
  // explicit question should win).
  useEffect(() => {
    if (!cohortContext) return;
    if (askQueued?.at && askQueued.at >= (cohortContext._arrivedAt || 0)) return;
    setQuery(defaultCohortQuestion(cohortContext));
    setSubmittedAt(Date.now());
    // askQueued deliberately not in deps: we read its current value, not react to it
  }, [cohortContext?.scenarioId]);

  // Pick up a question queued by the command palette / discovery chip.
  // Declared AFTER the cohort effect so it runs last and wins on
  // same-render updates from setCohortContext + askQuestion.
  useEffect(() => {
    if (askQueued?.q) {
      setQuery(askQueued.q);
      setSubmittedAt(askQueued.at);
    }
  }, [askQueued?.at]);

  const submit = (q: string) => {
    setQuery(q);
    setDraft("");
    setSubmittedAt(Date.now());
  };

  // Active scenario object (resolved from context if present).
  const activeScenario = cohortContext?.scenarioId
    ? cohortScenarios[cohortContext.scenarioId] ?? null
    : null;

  const onNavigate = (path: string) => navigate(path);

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <p className="h-eyebrow">
          The Workshop · local exploration · nothing leaves this machine
        </p>
        <h1 className="h-display">Ask the workshop.</h1>
        <p className="muted" style={{ maxWidth: 640, marginTop: 8 }}>
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
          onOpenReplay={() => navigate("/replay")}
        />
      )}

      {/* Attached notebook entries (if any) */}
      {cohortContext?.scenarioId && (
        <AttachedNotes scenarioId={cohortContext.scenarioId} onNavigate={onNavigate} />
      )}

      <div className="ask-input" style={{ marginBottom: 22 }}>
        <Icon name="ask" size={16} />
        <input
          value={draft}
          disabled={CLOUD_MODE}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) submit(draft.trim());
          }}
          placeholder={
            CLOUD_MODE
              ? "The Workshop needs the local Lantern app…"
              : cohortContext
                ? "Ask about the selected cohort or moment…"
                : "Ask about last night's raid…"
          }
        />
        <span className="kbd-row">
          <kbd>↵</kbd>
        </span>
        <button
          className="btn primary small"
          disabled={CLOUD_MODE || !draft.trim()}
          style={{ opacity: !CLOUD_MODE && draft.trim() ? 1 : 0.4 }}
          onClick={() => draft.trim() && submit(draft.trim())}
        >
          Ask <Icon name="arrowR" size={11} />
        </button>
      </div>

      <div className="ask-shell">
        <div className="stack lg">
          <AnswerBlock
            key={submittedAt}
            query={query}
            tone={tone}
            cohortContext={cohortContext}
            setCohortContext={setCohortContext}
            onNavigate={onNavigate}
          />
          <SuggestedQuestions
            cohortContext={cohortContext}
            onPick={submit}
            askSuggestions={askSuggestions}
            cohortSuggestions={cohortSuggestions}
          />
        </div>
        <div className="stack lg">
          <RecentQuestions onPick={submit} />
          <AIStatusCard />
        </div>
      </div>
    </div>
  );
}
