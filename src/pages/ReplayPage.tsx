// /replay — advanced replay surface.
//
// LAYOUT (widescreen-first):
//
//   [Header: breadcrumb + title]                         [Ask the workshop]
//   [Cohort selector bar — full width]
//
//   ┌──────────────────────────┬───────────────────────┐
//   │ ARENA + scrubber          │ YOU at <t>            │
//   │                          │ ROSTER picker         │
//   │                          │ LAYERS                │
//   └──────────────────────────┴───────────────────────┘
//
//   [Cohort detail grid — full width, only when cohort active]
//
// The right column NEVER reshapes. The YOU card always lives there.
// When a cohort is selected, detail appears below, not in place of YOU.

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type {
  CohortContext,
  CohortPreset,
  CohortScenario,
  ObservationDraft,
  PullEvent,
  RosterMember,
} from "@/api";
import { useSession } from "@/state/session";
import { useWorkbench, type QuickNoteSeed } from "@/state/workbench";
import { Icon } from "@/components/Icon";
import { SpellIcon, PAvatar } from "@/components/primitives";
import { Term } from "@/components/Term";
import { CohortCards } from "@/components/cohort/CohortCards";
import { fmtClock } from "@/lib/format";

/* ============================================================
   Module-local helpers
   ============================================================ */

const directionTitle = (d: string | undefined): string =>
  ({
    received: "How others helped you",
    impact: "How you affected others",
    team: "Team coordination",
    self: "About your own play",
    "what-if": "Alternate-history question",
    context: "Lead-up to this moment",
  }[d ?? ""] ?? "");

const hueFor = (kind: string): number =>
  ({ death: 25, save: 165, cd: 60 }[kind] ?? 60);

interface DiscoveryQuestion {
  q: string;
  ico: string;
  direction: string;
  scenario?: string;
}

function computeDiscoveryQuestions(
  _t: number,
  last: PullEvent | undefined,
): DiscoveryQuestion[] {
  if (!last) {
    return [
      { q: "Who's near me right now?", ico: "◐", direction: "self" },
      { q: "What's the next damage event in this pull?", ico: "↷", direction: "context" },
      { q: "Who needs the most healing right now?", ico: "✚", direction: "team" },
      { q: "Where should I be standing for the next phase?", ico: "→", direction: "self" },
    ];
  }
  if (last.kind === "death") {
    return [
      { q: "Who tried to save me in the last four seconds?", ico: "✚", direction: "received", scenario: "collapse" },
      { q: "Could I have lived if I had moved at 04:28?", ico: "?", direction: "self" },
      { q: "Did anyone else die because I went down?", ico: "↹", direction: "impact", scenario: "collapse" },
      { q: "What was I doing five seconds before this?", ico: "↶", direction: "context" },
    ];
  }
  if (last.kind === "save") {
    return [
      { q: "Was this defensive perfectly timed for the incoming damage?", ico: "✦", direction: "self" },
      { q: "Who else could have caught this with their cooldowns?", ico: "↻", direction: "team", scenario: "extcd" },
      { q: "Did this leave me vulnerable for the next mechanic?", ico: "→", direction: "impact" },
      { q: "What if I had held this cooldown for phase 3?", ico: "?", direction: "what-if" },
    ];
  }
  if (last.kind === "cd") {
    return [
      { q: "Did this cooldown overlap with another healer's?", ico: "↻", direction: "team", scenario: "extcd" },
      { q: "Who was this defensive helping most in this moment?", ico: "→", direction: "impact" },
      { q: "Was this the right moment to commit it?", ico: "?", direction: "self" },
      { q: "What damage was this meant to absorb?", ico: "✦", direction: "context" },
    ];
  }
  return [];
}

interface FramePlayer extends RosterMember {
  x: number;
  y: number;
  dead: boolean;
}

function computeFrame(
  t: number,
  roster: RosterMember[],
): FramePlayer[] {
  return roster.slice(0, 13).map((p, i) => {
    const angle = (i / 13) * Math.PI * 2;
    const baseR = p.role === "tank" ? 0.16 : p.role === "heal" ? 0.28 : 0.32;
    let bx = 50 + Math.cos(angle) * baseR * 100;
    let by = 50 + Math.sin(angle) * baseR * 100;
    if (p.role === "tank") {
      bx = 50 + Math.cos(angle + t * 0.005) * 12;
      by = 45 + Math.sin(angle + t * 0.005) * 9;
    } else {
      const drift = Math.sin(t * 0.02 + i) * 3.5;
      bx += drift;
      by += Math.cos(t * 0.018 + i) * 2.8;
    }
    const out: FramePlayer = { ...p, x: bx, y: by, dead: false };
    if (p.you) {
      out.x = 50;
      out.y = 50;
      if (t >= 272) out.dead = true;
    }
    if (p.name === "Volgrim" && t > 230) {
      const phase = Math.min(1, (t - 230) / 60);
      out.x = bx + phase * 12;
    }
    return out;
  });
}

/* ============================================================
   Sub-component prop interfaces
   ============================================================ */

interface ReplayHeaderProps {
  onAskWorkshop: () => void;
  cohortContext: CohortContext | null;
  navigate: (path: string) => void;
}

interface CohortSelectorBarProps {
  activePreset: string | null;
  scenarioId: string | null;
  selectedNames: string[];
  cohortPresets: CohortPreset[];
  onApplyPreset: (p: CohortPreset) => void;
  onApplyScenario: (id: string) => void;
  onClear: () => void;
}

interface YouMomentCardProps {
  t: number;
  pullEvents: PullEvent[];
  onDiscoveryClick: (q: DiscoveryQuestion) => void;
  onSaveToNotebook: (prefill: QuickNoteSeed) => void;
  onShareObservation: (prefill: ObservationDraft) => void;
}

interface RosterPickerCardProps {
  roster: RosterMember[];
  selectedNames: string[];
  onToggle: (name: string) => void;
}

interface LayersCardCompactProps {
  overlay: string;
  setOverlay: (v: string) => void;
}

interface ScrubberControlsProps {
  t: number;
  dur: number;
  playing: boolean;
  setPlaying: (v: boolean) => void;
  setT: (v: number) => void;
  scenario: CohortScenario | null;
  pullEvents: PullEvent[];
}

interface ReplayArenaProps {
  t: number;
  selectedNames: string[];
  overlay: string;
  roster: RosterMember[];
}

/* ============================================================
   Header — breadcrumb, title, top-right Ask the workshop
   ============================================================ */
function ReplayHeader({ onAskWorkshop, cohortContext, navigate }: ReplayHeaderProps) {
  const momentTitle = cohortContext?.momentTitle;
  return (
    <div className="replay-header-v2">
      <div>
        <div className="breadcrumb">
          <a onClick={() => navigate("/raids/2026-05-12")}>Raid review</a>
          <span style={{ margin: "0 6px" }}>›</span>
          <span style={{ color: "var(--text)" }}>Mug'Zee · Pull 6</span>
        </div>
        {momentTitle ? (
          <>
            <p className="replay-continuation">
              <Icon name="arrowR" size={11} /> Continuing from
            </p>
            <h1 className="replay-continuation-title">{momentTitle}</h1>
            <div className="sub">Pull 6 · 06:20 · seek anywhere · cohort preserved</div>
          </>
        ) : (
          <>
            <h1>Replay <em style={{ color: "var(--ember)" }}>advanced</em></h1>
            <div className="sub">Boss 7 · Pull 6 · 06:20 · wipe at 06:18</div>
          </>
        )}
      </div>
      <button className="btn primary ask-workshop-cta" onClick={onAskWorkshop}>
        <Icon name="ask" size={13} />
        Ask the workshop
        <span className="kbd-row" style={{ marginLeft: 6 }}><kbd>⌘</kbd><kbd>K</kbd></span>
      </button>
    </div>
  );
}

/* ============================================================
   Cohort selector bar — full width at the top
   ============================================================ */
function CohortSelectorBar({
  activePreset,
  scenarioId,
  selectedNames,
  cohortPresets,
  onApplyPreset,
  onApplyScenario,
  onClear,
}: CohortSelectorBarProps) {
  return (
    <div className="cohort-bar">
      <span className="cb-label">
        <Term k="cohort">Cohort</Term>
      </span>
      <div className="cb-section">
        <span className="cb-section-label">presets</span>
        <div className="cb-pills">
          {cohortPresets.map(p => (
            <span
              key={p.id}
              className={`preset-pill ${activePreset === p.id ? "active" : ""}`}
              onClick={() => onApplyPreset(p)}
            >
              <span className="pp-ico">{p.ico}</span>
              {p.label}
            </span>
          ))}
        </div>
      </div>
      <div className="cb-section">
        <span className="cb-section-label">scenarios</span>
        <div className="cb-pills">
          <span
            className={`preset-pill ${scenarioId === "collapse" ? "active" : ""}`}
            onClick={() => onApplyScenario("collapse")}
          >
            Phase 3 <Term k="collapse">collapse</Term>
          </span>
          <span
            className={`preset-pill ${scenarioId === "extcd" ? "active" : ""}`}
            onClick={() => onApplyScenario("extcd")}
          >
            <Term k="external cd chain">External CD chain</Term>
          </span>
          <span
            className={`preset-pill ${scenarioId === "spread" ? "active" : ""}`}
            onClick={() => onApplyScenario("spread")}
          >
            Cluster Bomb <Term k="spread">spread</Term>
          </span>
        </div>
      </div>
      <div className="cb-tail">
        <span className="cb-count">{selectedNames.length} of 6 selected · Durracktu pinned</span>
        {selectedNames.length > 1 && (
          <span className="preset-pill" onClick={onClear} style={{ color: "var(--text-mute)" }}>
            <Icon name="close" size={11} /> Clear
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   YOU at this moment — anchor card. Never reshapes.
   ============================================================ */
function YouMomentCard({
  t,
  pullEvents,
  onDiscoveryClick,
  onSaveToNotebook,
  onShareObservation,
}: YouMomentCardProps) {
  const past = pullEvents.filter(e => e.t <= t);
  const last = past[past.length - 1];
  const upcoming = pullEvents.find(e => e.t > t);
  const discoveries = computeDiscoveryQuestions(t, last);

  return (
    <div className="you-card">
      <div className="you-head">
        <PAvatar name="Durracktu" hue={80} size="lg" />
        <div className="you-id">
          <div className="you-name">Durracktu</div>
          <div className="you-spec">Disc Priest · Healer · pinned</div>
        </div>
        <span className="you-ts mono">{fmtClock(t)}</span>
      </div>

      <div className="you-now">
        <p className="h-eyebrow" style={{ margin: "0 0 8px" }}>You at {fmtClock(t)}</p>
        {last ? (
          <div className="you-event">
            <SpellIcon hue={hueFor(last.kind)} glyph={last.ico} />
            <div className="you-event-text">
              <div className="you-event-label">{last.label}</div>
              <div className="you-event-meta mono">
                {fmtClock(last.t)} ·{" "}
                {last.kind === "death" ? (
                  <span style={{ color: "var(--bad)" }}>death event</span>
                ) : last.kind === "save" ? (
                  <span style={{ color: "var(--good)" }}>defensive save</span>
                ) : (
                  <span style={{ color: "var(--ember)" }}>cooldown used</span>
                )}
                {upcoming && (
                  <> · next: <span style={{ color: "var(--text-dim)" }}>{upcoming.label}</span> in {upcoming.t - t}s</>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>Pull is about to begin.</p>
        )}
      </div>

      <div className="you-discovery">
        <p className="h-eyebrow" style={{ margin: "0 0 8px" }}>Discover · ask the workshop</p>
        <div className="discovery-list">
          {discoveries.map((q, i) => (
            <button
              key={i}
              className={`discovery-chip dir-${q.direction || "self"}`}
              onClick={() => onDiscoveryClick(q)}
              title={directionTitle(q.direction)}
            >
              <span className="dc-ico">{q.ico}</span>
              <span className="dc-q">{q.q}</span>
              <span className="dc-arrow">→</span>
            </button>
          ))}
        </div>
      </div>

      <div className="you-quick-actions">
        <button
          className="btn ghost small"
          onClick={() =>
            onSaveToNotebook({
              text: last
                ? `At ${fmtClock(t)} on Mug'Zee Pull 6: ${last.label}`
                : `At ${fmtClock(t)} on Mug'Zee Pull 6`,
              tags: ["self"],
              binding: { kind: "pull", pullId: "p18", label: `Mug'Zee · Pull 6 · ${fmtClock(t)}` },
            })
          }
        >
          <Icon name="book" size={11} /> Save this moment
        </button>
        {(last?.kind === "save" || last?.kind === "cd") ? (
          <button
            className="btn ghost small"
            onClick={() =>
              onShareObservation({
                kind: "teamwork",
                title: last.label,
                description: `${last.label} at ${fmtClock(t)} on Mug'Zee Pull 6.`,
                credits: ["Durracktu"],
                binding: { kind: "pull", pullId: "p18", label: `Mug'Zee · Pull 6 · ${fmtClock(t)}` },
              })
            }
          >
            <Icon name="upload" size={11} /> Share
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ============================================================
   Roster picker — vertical, sits under the YOU card
   ============================================================ */
function RosterPickerCard({ roster, selectedNames, onToggle }: RosterPickerCardProps) {
  return (
    <div className="roster-picker-card">
      <div className="rp-head">
        <p className="h-eyebrow" style={{ margin: 0 }}>Roster · pick a cohort</p>
        <span className="mono faint" style={{ fontSize: 10 }}>{selectedNames.length}/6</span>
      </div>
      <div className="rp-list">
        {roster.map(p => {
          const selected = selectedNames.includes(p.name);
          const pinned = p.you;
          return (
            <div
              key={p.name}
              className={`roster-chip ${selected ? "selected" : ""} ${pinned ? "pinned" : ""}`}
              onClick={() => onToggle(p.name)}
            >
              <PAvatar name={p.name} hue={p.hue} size="sm" />
              <span>{p.name}</span>
              <span className="role-tag">{p.role === "heal" ? "H" : p.role === "tank" ? "T" : "D"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Layers — compact
   ============================================================ */
function LayersCardCompact({ overlay, setOverlay }: LayersCardCompactProps) {
  const layers = [
    { id: "cohesion", label: "Cohort cohesion ring" },
    { id: "supportchain", label: "Support chain lines" },
    { id: "movement", label: "Movement trails" },
  ];
  return (
    <div className="layers-card-compact">
      <div className="rp-head">
        <p className="h-eyebrow" style={{ margin: 0 }}>Replay layers</p>
        <span className="mono faint" style={{ fontSize: 10 }}>{overlay !== "none" ? "1 active" : "none"}</span>
      </div>
      <div className="stack" style={{ gap: 2, padding: "6px 0 2px" }}>
        {layers.map(l => (
          <div key={l.id} className="between" style={{ padding: "5px 2px", fontSize: 12.5 }}>
            <span>{l.label}</span>
            <div
              className={`toggle ${overlay === l.id ? "on" : ""}`}
              onClick={() => setOverlay(overlay === l.id ? "none" : l.id)}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Scrubber + play controls
   ============================================================ */
function ScrubberControls({
  t,
  dur,
  playing,
  setPlaying,
  setT,
  scenario,
  pullEvents,
}: ScrubberControlsProps) {
  return (
    <div className="replay-controls" style={{ marginTop: 12 }}>
      <div className="play" onClick={() => setPlaying(!playing)}>
        <Icon name={playing ? "pause" : "play"} size={14} stroke={2.2} />
      </div>
      <div
        className="scrubber"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - r.left) / r.width;
          setT(Math.max(0, Math.min(dur, Math.round(ratio * dur))));
        }}
      >
        <div className="filled" style={{ width: `${(t / dur) * 100}%` }}></div>
        <div className="knob" style={{ left: `${(t / dur) * 100}%` }}></div>
        {scenario && (
          <div
            style={{
              position: "absolute",
              left: `${(scenario.range[0] / dur) * 100}%`,
              width: `${((scenario.range[1] - scenario.range[0]) / dur) * 100}%`,
              top: -3,
              bottom: -3,
              background: "oklch(0.78 0.13 60 / 0.18)",
              border: "1px solid var(--ember)",
              borderRadius: 3,
              pointerEvents: "none",
            }}
          ></div>
        )}
        {pullEvents.map((e, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(e.t / dur) * 100}%`,
              top: -3,
              bottom: -3,
              width: 2,
              background:
                e.kind === "death"
                  ? "var(--bad)"
                  : e.kind === "save"
                  ? "var(--good)"
                  : "var(--ember-deep)",
              opacity: 0.7,
              transform: "translateX(-1px)",
              cursor: "pointer",
            }}
            title={e.label}
            onClick={(ev) => {
              ev.stopPropagation();
              setT(e.t);
            }}
          ></div>
        ))}
      </div>
      <div className="time">
        {fmtClock(t)} / {fmtClock(dur)}
      </div>
    </div>
  );
}

/* ============================================================
   Arena (unchanged in behavior — preserves overlay logic)
   ============================================================ */
function ReplayArena({ t, selectedNames, overlay, roster }: ReplayArenaProps) {
  const players = computeFrame(t, roster);
  const trails =
    overlay === "movement"
      ? [0, 1, 2, 3, 4].map(i => computeFrame(Math.max(0, t - (i + 1) * 6), roster))
      : null;
  const supportLines =
    overlay === "supportchain"
      ? [
          { from: "Durracktu", to: "Karthuun" },
          { from: "Veshrin", to: "Brorvik" },
        ]
      : [];
  const cohort = players.filter(p => selectedNames.includes(p.name));
  const centroid =
    cohort.length > 1
      ? {
          x: cohort.reduce((s, p) => s + p.x, 0) / cohort.length,
          y: cohort.reduce((s, p) => s + p.y, 0) / cohort.length,
        }
      : null;
  const spread = centroid
    ? Math.max(...cohort.map(p => Math.hypot(p.x - centroid.x, p.y - centroid.y)))
    : 0;

  return (
    <div className="replay-stage">
      <div className="field"></div>

      {trails && (
        <svg
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {players.map((p, pi) => {
            const dim = selectedNames.length > 1 && !selectedNames.includes(p.name);
            if (dim || p.dead) return null;
            const past = trails
              .map(frame => frame.find(f => f.name === p.name))
              .filter((f): f is FramePlayer => Boolean(f));
            const d =
              `M ${p.x.toFixed(2)} ${p.y.toFixed(2)} ` +
              past.map(q => `L ${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join(" ");
            return (
              <path
                key={pi}
                d={d}
                fill="none"
                stroke={`var(--c-${p.cls.toLowerCase().replace(/\s/g, "")}, var(--text-dim))`}
                strokeWidth="0.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={p.you ? 0.75 : 0.4}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
      )}

      {t >= 246 && t <= 280 && (
        <div
          className="void"
          style={{
            left: "calc(50% - 80px)",
            top: "calc(50% - 80px)",
            width: 160,
            height: 160,
            borderColor: "oklch(0.55 0.15 25)",
            background: "oklch(0.35 0.15 25 / 0.18)",
            opacity: Math.min(1, (t - 246) / 8),
          }}
        ></div>
      )}

      {overlay === "cohesion" && centroid && cohort.length > 1 && (
        <div
          style={{
            position: "absolute",
            left: `${centroid.x}%`,
            top: `${centroid.y}%`,
            width: `${spread * 2}%`,
            height: `${spread * 2}%`,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            border: "1px dashed var(--ember)",
            background: "oklch(0.78 0.13 60 / 0.06)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -16,
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "var(--ember)",
              whiteSpace: "nowrap",
              textShadow: "0 1px 2px var(--bg-deep)",
            }}
          >
            cohort spread · {Math.round(spread)} yd
          </div>
        </div>
      )}

      {overlay === "supportchain" && (
        <svg
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {supportLines.map((l, i) => {
            const from = players.find(p => p.name === l.from);
            const to = players.find(p => p.name === l.to);
            if (!from || !to) return null;
            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="oklch(0.86 0.14 75)"
                strokeWidth="0.3"
                strokeDasharray="1 1"
                vectorEffect="non-scaling-stroke"
                opacity="0.7"
              />
            );
          })}
        </svg>
      )}

      {players.map((p, i) => {
        const inCohort = selectedNames.includes(p.name);
        const dim = selectedNames.length > 1 && !inCohort;
        return (
          <div
            key={i}
            className={`pdot ${p.you ? "me" : ""} ${inCohort && !p.you ? "in-cohort" : ""} ${dim ? "fade" : ""}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.dead
                ? "var(--text-mute)"
                : `var(--c-${p.cls.toLowerCase().replace(/\s/g, "")}, var(--text-dim))`,
              color: `var(--c-${p.cls.toLowerCase().replace(/\s/g, "")}, var(--text-dim))`,
              opacity: p.dead ? 0.4 : dim ? 0.32 : 1,
            }}
          >
            {(inCohort || p.you || ["tank", "heal"].includes(p.role)) && (
              <span className="nm">{p.name}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   ReplayPage — top-level export, no props
   ============================================================ */
export function ReplayPage() {
  const { roster, pullEvents, cohortScenarios, cohortPresets } = useSession();
  const { cohortContext, setCohortContext, askQuestion, openQuickNote, openPropose } =
    useWorkbench();
  const navigate = useNavigate();

  const dur = 380;

  const [t, setT] = useState<number>(cohortContext?.t ?? 272);
  const [playing, setPlaying] = useState(false);
  const [overlay, setOverlay] = useState("cohesion");

  const [selectedNames, setSelectedNames] = useState<string[]>(
    () => cohortContext?.members ?? ["Durracktu"],
  );
  const [scenarioId, setScenarioId] = useState<string | null>(
    cohortContext?.scenarioId ?? null,
  );
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT(p => (p >= dur ? 0 : p + 1)), 100);
    return () => clearInterval(id);
  }, [playing]);

  // React to cohortContext arriving (Workshop cite click, palette, etc.).
  useEffect(() => {
    if (cohortContext?.t != null) {
      setT(cohortContext.t);
      if (cohortContext.scenarioId) {
        setScenarioId(cohortContext.scenarioId);
        setSelectedNames(cohortContext.members);
      } else if (cohortContext.members) {
        setSelectedNames(cohortContext.members);
      }
    }
  }, [cohortContext?.t, cohortContext?.scenarioId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* --- Selection handlers --- */
  const togglePlayer = (name: string) => {
    setActivePreset(null);
    setScenarioId(null);
    setSelectedNames(prev => {
      if (prev.includes(name)) {
        if (name === "Durracktu") return prev; // pinned
        return prev.filter(n => n !== name);
      }
      if (prev.length >= 6) return prev;
      return [...prev, name];
    });
  };

  const applyPreset = (preset: CohortPreset) => {
    setScenarioId(null);
    setActivePreset(preset.id);
    setSelectedNames(
      ["Durracktu", ...preset.members.filter(n => n !== "Durracktu")].slice(0, 6),
    );
  };

  const applyScenario = (id: string) => {
    const s = cohortScenarios[id];
    if (!s) return;
    setScenarioId(id);
    setActivePreset(null);
    setSelectedNames(s.members);
    setT(s.t);
  };

  const clearCohort = () => {
    setActivePreset(null);
    setScenarioId(null);
    setSelectedNames(["Durracktu"]);
  };

  /* --- Inferred scenario for cohort details --- */
  const scenario = scenarioId ? cohortScenarios[scenarioId] ?? null : null;
  const inferredScenario = useMemo<CohortScenario | null>(() => {
    if (scenario) return scenario;
    if (selectedNames.length <= 1) return null;
    let best: CohortScenario | null = null;
    let bestScore = -1;
    for (const id of Object.keys(cohortScenarios)) {
      const s = cohortScenarios[id];
      const score = s.members.filter(n => selectedNames.includes(n)).length;
      if (score > bestScore) {
        best = s;
        bestScore = score;
      }
    }
    return best;
  }, [scenario, selectedNames, cohortScenarios]);

  /* --- Cross-page handoffs --- */
  const askAboutCohort = (s: CohortScenario) => {
    setCohortContext({
      scenarioId: s.id,
      members: s.members,
      range: s.range,
      pullId: s.pullId,
      pullLabel: s.pullLabel,
      t: s.t,
    });
    navigate("/ask");
  };

  const askWorkshopTopRight = () => {
    setCohortContext({
      scenarioId: scenarioId ?? null,
      members: selectedNames,
      range: [Math.max(0, t - 15), Math.min(dur, t + 15)],
      pullId: "p18",
      pullLabel: "Mug'Zee · Pull 6",
      t,
    });
    navigate("/ask");
  };

  // Discovery chip click — sets cohort context (with optional scenario) +
  // queues the question.
  const onDiscoveryClick = (q: DiscoveryQuestion) => {
    if (q.scenario) {
      const s = cohortScenarios[q.scenario];
      if (s) {
        setCohortContext({
          scenarioId: s.id,
          members: s.members,
          range: s.range,
          pullId: s.pullId,
          pullLabel: s.pullLabel,
          t,
        });
      }
    } else {
      setCohortContext({
        scenarioId: null,
        members: selectedNames,
        range: [Math.max(0, t - 15), Math.min(dur, t + 15)],
        pullId: "p18",
        pullLabel: "Mug'Zee · Pull 6",
        t,
      });
    }
    askQuestion(q.q);
  };

  return (
    <div className="page replay-page-v2">
      <ReplayHeader
        navigate={navigate}
        onAskWorkshop={askWorkshopTopRight}
        cohortContext={cohortContext}
      />

      <CohortSelectorBar
        activePreset={activePreset}
        scenarioId={scenarioId}
        selectedNames={selectedNames}
        cohortPresets={cohortPresets}
        onApplyPreset={applyPreset}
        onApplyScenario={applyScenario}
        onClear={clearCohort}
      />

      <div className="replay-grid-v2">
        <div className="replay-stage-col">
          <ReplayArena
            t={t}
            selectedNames={selectedNames}
            overlay={overlay}
            roster={roster}
          />
          <ScrubberControls
            t={t}
            dur={dur}
            playing={playing}
            setPlaying={setPlaying}
            setT={setT}
            scenario={inferredScenario}
            pullEvents={pullEvents}
          />
        </div>

        <div className="replay-side-col">
          <YouMomentCard
            t={t}
            pullEvents={pullEvents}
            onDiscoveryClick={onDiscoveryClick}
            onSaveToNotebook={(prefill) => openQuickNote(prefill)}
            onShareObservation={(prefill) => openPropose(prefill)}
          />
          <RosterPickerCard
            roster={roster}
            selectedNames={selectedNames}
            onToggle={togglePlayer}
          />
          <LayersCardCompact overlay={overlay} setOverlay={setOverlay} />
        </div>
      </div>

      {selectedNames.length > 1 && inferredScenario && (
        <div className="cohort-detail-row">
          <div className="cohort-detail-header">
            <p className="h-eyebrow" style={{ margin: 0 }}>Cohort detail</p>
            <h2 className="h1" style={{ fontStyle: "italic", margin: "4px 0 0" }}>
              {inferredScenario.title}
            </h2>
          </div>
          <CohortCards
            scenario={inferredScenario}
            onAskAbout={askAboutCohort}
            onSeekTo={setT}
            layout="grid"
          />
        </div>
      )}
    </div>
  );
}
