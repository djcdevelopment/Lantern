/* ============================================================
   MomentDrawer — the contextual investigation surface.
   ------------------------------------------------------------
   Opens via useWorkbench().openMoment(moment) from anywhere. Lets
   the player descend into a moment: read the narrative, see who
   was there and what led to it, ask a contextual question, watch
   it in replay, save it, or share it — without leaving the page.
   ============================================================ */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../Icon";
import { PAvatar } from "../primitives";
import { useSession } from "@/state/session";
import { useWorkbench } from "@/state/workbench";
import { fmtClockPad } from "@/lib/format";
import type { CohortContext, Moment, MomentKind } from "@/api";

interface MomentDrawerProps {
  moment: Moment;
  onClose: () => void;
}

export function MomentDrawer({ moment: m, onClose }: MomentDrawerProps) {
  const { roster, cohortScenarios } = useSession();
  const { setCohortContext, openQuickNote, openPropose, askQuestion } =
    useWorkbench();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const scenario = m.scenarioId ? cohortScenarios[m.scenarioId] : null;
  const cohort = scenario ? scenario.members : m.members;

  const buildContext = (extra?: Partial<CohortContext>): CohortContext => ({
    momentId: m.id,
    momentTitle: m.title,
    scenarioId: m.scenarioId ?? null,
    members: cohort,
    range: scenario?.range ?? [Math.max(0, m.pullT - 12), m.pullT + 12],
    pullId: m.pullId,
    pullLabel: "Mug'Zee · Pull 6",
    t: m.pullT,
    ...extra,
  });

  const watchInReplay = () => {
    setCohortContext(buildContext());
    onClose();
    navigate("/replay");
  };

  const investigate = (q: string) => {
    setCohortContext(buildContext({ _arrivedAt: Date.now() }));
    onClose();
    askQuestion(q);
  };

  const saveToNotebook = () => {
    openQuickNote({
      text: `${m.title}\n\n${m.narrative}`,
      tags:
        m.kind === "swap" || m.kind === "feast"
          ? ["self"]
          : m.kind === "death"
            ? ["self", "mechanic"]
            : m.kind === "save"
              ? ["cooldowns"]
              : [],
      binding: {
        kind: "pull",
        pullId: m.pullId,
        label: `Mug'Zee · Pull 6 · ${fmtClockPad(m.pullT)}`,
      },
    });
    onClose();
  };

  const shareObservation = () => {
    openPropose({
      kind:
        m.kind === "death"
          ? "celebration"
          : m.kind === "save"
            ? "teamwork"
            : m.kind === "swap" || m.kind === "feast"
              ? "support"
              : "celebration",
      title: m.title,
      description: m.narrative,
      credits: cohort.length ? cohort : ["Durracktu"],
      binding: m.scenarioId
        ? {
            kind: "cohort",
            scenarioId: m.scenarioId,
            label: scenario ? scenario.title : m.title,
          }
        : {
            kind: "pull",
            pullId: m.pullId,
            label: `Mug'Zee · Pull 6 · ${fmtClockPad(m.pullT)}`,
          },
    });
    onClose();
  };

  const people = m.nearby.length > 0 ? m.nearby : m.members;

  return (
    <div className="moment-backdrop" onClick={onClose}>
      <div
        className={`moment-drawer kind-${m.kind} weight-${m.weight}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md-hero">
          <div className="md-hero-bg"></div>
          <div className="md-hero-content">
            <div className="md-eyebrow">
              <span className="md-kind-chip">
                <MomentKindIcon kind={m.kind} /> {kindLabel(m.kind)}
              </span>
              <span className="md-ts mono">{m.ctx}</span>
            </div>
            <h1 className="md-title">{m.title}</h1>
            <p className="md-short">{m.short}</p>
          </div>
          <button className="md-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
            <span className="kbd-row" style={{ marginLeft: 6 }}>
              <kbd>esc</kbd>
            </span>
          </button>
        </div>

        <div className="md-body">
          <section className="md-section">
            <p className="md-narrative">{m.narrative}</p>
          </section>

          {(m.nearby.length > 0 || m.members.length > 1) && (
            <section className="md-section">
              <p className="h-eyebrow md-section-label">Who was there</p>
              <div className="md-people">
                {people.map((name) => {
                  const r = roster.find((x) => x.name === name);
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

          {m.lead.length > 0 && (
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

          {m.aftermath && (
            <section className="md-section md-aftermath">
              <p className="h-eyebrow md-section-label">What came after</p>
              <p className="md-aftermath-text">{m.aftermath}</p>
            </section>
          )}

          {m.questions.length > 0 && (
            <section className="md-section">
              <p className="h-eyebrow md-section-label">
                Investigate · ask the workshop
              </p>
              <div className="md-questions">
                {m.questions.map((q, i) => (
                  <button
                    key={i}
                    className={`md-question dir-${q.direction}`}
                    onClick={() => investigate(q.q)}
                  >
                    <span className="md-q-text">{q.q}</span>
                    <span className="md-q-arrow">→</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="md-actions">
          <button className="btn primary md-watch" onClick={watchInReplay}>
            <Icon name="play" size={13} />
            Watch this moment
            <span className="md-action-sub">
              Open in replay at {fmtClockPad(m.pullT)}
            </span>
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
}

function MomentKindIcon({ kind }: { kind: MomentKind }) {
  const map: Record<MomentKind, string> = {
    death: "✕",
    save: "✚",
    swap: "↻",
    feast: "✦",
    collapse: "▼",
    comeback: "★",
  };
  return (
    <span style={{ fontFamily: "var(--font-display)", fontSize: 12 }}>
      {map[kind] || "·"}
    </span>
  );
}

function kindLabel(kind: MomentKind): string {
  return (
    {
      death: "Death",
      save: "Save",
      swap: "Role swap",
      feast: "Quiet support",
      collapse: "Collapse",
      comeback: "Comeback",
    } as Record<MomentKind, string>
  )[kind];
}
