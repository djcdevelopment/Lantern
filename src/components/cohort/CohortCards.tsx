/* ============================================================
   Cohort cards — relational, event-oriented analysis of a
   selected cohort. Not throughput. Rendered in the replay
   surface (and re-usable anywhere a CohortScenario is in hand).
   ============================================================ */

import { Icon } from "../Icon";
import { PAvatar } from "../primitives";
import { useSession } from "@/state/session";
import { useNotebook } from "@/state/memory";
import { useWorkbench } from "@/state/workbench";
import { fmtClock } from "@/lib/format";
import type {
  CDChoreographyRow,
  CohesionPoint,
  CohortDeath,
  CohortRecovery,
  CohortScenario,
  CoordinationEvent,
  CoordinationKind,
} from "@/api";

interface CohortCardsProps {
  scenario: CohortScenario;
  onAskAbout: (s: CohortScenario) => void;
  onSeekTo: (t: number) => void;
  layout?: "stack" | "grid";
}

export function CohortCards({
  scenario,
  onAskAbout,
  onSeekTo,
  layout = "stack",
}: CohortCardsProps) {
  const { cohortCards } = useSession();
  const cards = cohortCards[scenario.id];
  if (!cards) return null;

  const [a, b] = scenario.range;

  if (layout === "grid") {
    return (
      <div className="cohort-detail-grid">
        <div className="cd-span-12">
          <CohortSummary scenario={scenario} onAskAbout={onAskAbout} />
        </div>
        <div className="cd-span-12">
          <CDChoreographyCard data={cards.cdChoreography} range={[a, b]} onSeek={onSeekTo} />
        </div>
        <div className="cd-span-6">
          <CohesionCard data={cards.cohesion} range={[a, b]} />
        </div>
        <div className="cd-span-6">
          <CoordinationCard data={cards.coordination} onSeek={onSeekTo} />
        </div>
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
      {cards.recoveries.length > 0 && (
        <RecoveriesCard data={cards.recoveries} onSeek={onSeekTo} />
      )}
      {cards.deaths.length > 0 && <DeathsCard data={cards.deaths} onSeek={onSeekTo} />}
    </div>
  );
}

/* ---------- Summary ---------- */
interface CohortSummaryProps {
  scenario: CohortScenario;
  onAskAbout: (s: CohortScenario) => void;
}

function CohortSummary({ scenario, onAskAbout }: CohortSummaryProps) {
  const { roster } = useSession();
  const { notesByBinding } = useNotebook();
  const { openPropose, openQuickNote } = useWorkbench();

  const members = scenario.members
    .map((n) => roster.find((p) => p.name === n))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const [a, b] = scenario.range;

  const tags = members.reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {});
  const tagLabel = Object.entries(tags)
    .map(
      ([r, n]) =>
        `${n} ${r === "heal" ? "healer" : r === "tank" ? "tank" : "dps"}${n > 1 ? "s" : ""}`,
    )
    .join(" · ");

  const notes = notesByBinding("cohort", scenario.id);

  return (
    <div className="cohort-card">
      <div className="ch-head">
        <div>
          <h3>{scenario.title}</h3>
          <div className="meta" style={{ marginTop: 4 }}>
            {tagLabel} · {fmtClock(a)}–{fmtClock(b)} · {scenario.pullLabel}
          </div>
        </div>
        <div className="avatar-cluster">
          {members.map((m) => (
            <PAvatar key={m.name} name={m.name} hue={m.hue} size="sm" />
          ))}
        </div>
      </div>
      <div className="ch-body">
        <p
          style={{
            margin: 0,
            color: "var(--text-dim)",
            fontSize: 13.5,
            lineHeight: 1.55,
          }}
        >
          {scenario.summary}
        </p>
        {notes.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p className="h-eyebrow" style={{ marginBottom: 6 }}>
              Your notes · {notes.length} bound to this cohort
            </p>
            <div className="stack" style={{ gap: 6 }}>
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
        )}
        <div className="replay-actions" style={{ marginTop: 14 }}>
          <button className="ra-btn" onClick={() => onAskAbout(scenario)}>
            <span className="ra-ico">
              <Icon name="ask" size={13} />
            </span>
            Ask about this cohort
          </button>
          <button
            className="ra-btn propose"
            onClick={() =>
              openPropose({
                kind:
                  scenario.id === "extcd" || scenario.id === "spread"
                    ? "teamwork"
                    : "celebration",
                title: scenario.title,
                description: scenario.summary,
                credits: scenario.members,
                binding: {
                  kind: "cohort",
                  scenarioId: scenario.id,
                  label: scenario.title + " · " + scenario.pullLabel,
                },
              })
            }
          >
            <span className="ra-ico">
              <Icon name="upload" size={13} />
            </span>
            Share as an observation
          </button>
          <button
            className="add-note-btn"
            onClick={() =>
              openQuickNote({
                binding: {
                  kind: "cohort",
                  scenarioId: scenario.id,
                  label: scenario.title + " · " + scenario.pullLabel,
                },
              })
            }
          >
            <span className="plus">+</span> Add note to this cohort
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- CD choreography ---------- */
interface CDChoreographyCardProps {
  data: CDChoreographyRow[];
  range: [number, number];
  onSeek: (t: number) => void;
}

function CDChoreographyCard({ data, range, onSeek }: CDChoreographyCardProps) {
  const [a, b] = range;
  const dur = b - a;
  const pct = (t: number) => `${((t - a) / dur) * 100}%`;

  return (
    <div className="cohort-card">
      <div className="ch-head">
        <h3>Cooldown choreography</h3>
        <span className="meta">
          {data.reduce((n, r) => n + r.events.length, 0)} casts · cohort timeline
        </span>
      </div>
      <div className="ch-body">
        <div className="choreography">
          {data.map((row) => (
            <div className="row" key={row.name}>
              <span className="who">{row.name}</span>
              <div className="track">
                {row.events.map((e, i) => (
                  <div
                    key={i}
                    className={`ev ${e.late ? "late" : ""}`}
                    style={{ left: pct(e.t), maxWidth: "60%" }}
                    title={`${e.label} · ${fmtClock(e.t)}`}
                    onClick={() => onSeek(e.t)}
                  >
                    {e.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="axis">
            <span>{fmtClock(a)}</span>
            <span>{fmtClock(Math.round((a + b) / 2))}</span>
            <span>{fmtClock(b)}</span>
          </div>
        </div>
        <p className="faint" style={{ fontSize: 11.5, marginTop: 12, lineHeight: 1.55 }}>
          Hover or click a cast to seek the replay. Coloring marks late commits, not
          "good" or "bad."
        </p>
      </div>
    </div>
  );
}

/* ---------- Cohesion (movement) line graph ---------- */
interface CohesionCardProps {
  data: CohesionPoint[];
  range: [number, number];
}

function CohesionCard({ data, range }: CohesionCardProps) {
  const [a, b] = range;
  const dur = b - a;
  const maxD = Math.max(...data.map((d) => d.d), 50);

  const pad = 6;
  const W = 100;
  const H = 100;
  const x = (t: number) => ((t - a) / dur) * (W - pad * 2) + pad;
  const y = (d: number) => H - pad - (d / maxD) * (H - pad * 2);

  const pathD = data
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.t).toFixed(2)} ${y(p.d).toFixed(2)}`)
    .join(" ");
  const areaD = `${pathD} L ${x(data[data.length - 1].t)} ${H} L ${x(data[0].t)} ${H} Z`;

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
                <stop offset="0%" stopColor="oklch(0.78 0.13 60)" stopOpacity="0.32" />
                <stop offset="100%" stopColor="oklch(0.78 0.13 60)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#cgrad)" />
            <path
              d={pathD}
              fill="none"
              stroke="oklch(0.86 0.14 75)"
              strokeWidth="1"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {data
              .filter((d) => d.marker)
              .map((d, i) => (
                <g key={i}>
                  <line
                    x1={x(d.t)}
                    x2={x(d.t)}
                    y1={pad}
                    y2={H - pad}
                    stroke="oklch(0.86 0.14 75)"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={x(d.t)} cy={y(d.d)} r="1.2" fill="oklch(0.92 0.14 75)" />
                </g>
              ))}
          </svg>
          <div className="cohesion-band top">stacked ↑</div>
          <div className="cohesion-band bot">spread ↓</div>
          {data
            .filter((d) => d.marker)
            .map((d, i) => (
              <div
                key={i}
                className="cohesion-marker"
                data-label={d.marker}
                style={{ left: `${((d.t - a) / dur) * 100}%` }}
              ></div>
            ))}
        </div>
        <div
          className="axis"
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-mute)",
            marginTop: 6,
          }}
        >
          <span>{fmtClock(a)}</span>
          <span>{fmtClock(b)}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Coordination event list ---------- */
interface CoordinationCardProps {
  data: CoordinationEvent[];
  onSeek: (t: number) => void;
}

function CoordinationCard({ data, onSeek }: CoordinationCardProps) {
  return (
    <div className="cohort-card">
      <div className="ch-head">
        <h3>Coordination events</h3>
        <span className="meta">{data.length} within selection</span>
      </div>
      <div className="ch-body coord-list">
        {data.map((e, i) => (
          <div
            key={i}
            className="coord-row"
            onClick={() => onSeek(e.t)}
            style={{ cursor: "pointer" }}
          >
            <span className="ts">{fmtClock(e.t)}</span>
            <span className={`ico kind-${e.kind}`}>{symbolFor(e.kind)}</span>
            <span className="label">{e.label}</span>
            <span className="kind-tag">{e.kind.replace("-", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Recoveries ---------- */
interface RecoveriesCardProps {
  data: CohortRecovery[];
  onSeek: (t: number) => void;
}

function RecoveriesCard({ data, onSeek }: RecoveriesCardProps) {
  return (
    <div className="cohort-card">
      <div className="ch-head">
        <h3>Recoveries within cohort</h3>
        <span className="meta">
          {data.length} {data.length === 1 ? "save" : "saves"}
        </span>
      </div>
      <div className="ch-body coord-list">
        {data.map((r, i) => (
          <div
            key={i}
            className="coord-row"
            onClick={() => onSeek(r.t)}
            style={{ cursor: "pointer" }}
          >
            <span className="ts">{fmtClock(r.t)}</span>
            <span className="ico kind-save">✚</span>
            <span className="label">
              {r.who}{" "}
              <span
                className="faint"
                style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
              >
                · {r.note}
              </span>
            </span>
            <span className="kind-tag">by {r.by}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Deaths ---------- */
interface DeathsCardProps {
  data: CohortDeath[];
  onSeek: (t: number) => void;
}

function DeathsCard({ data, onSeek }: DeathsCardProps) {
  return (
    <div className="cohort-card">
      <div className="ch-head">
        <h3>Deaths within cohort</h3>
        <span className="meta">{data.length}</span>
      </div>
      <div className="ch-body coord-list">
        {data.map((d, i) => (
          <div
            key={i}
            className="coord-row"
            onClick={() => onSeek(d.t)}
            style={{ cursor: "pointer" }}
          >
            <span className="ts">{fmtClock(d.t)}</span>
            <span className="ico kind-death">✕</span>
            <span className="label">
              {d.who}{" "}
              <span
                className="faint"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  marginLeft: 6,
                }}
              >
                {d.cause}
              </span>
              <div
                className="faint"
                style={{ fontFamily: "var(--font-mono)", fontSize: 10, marginTop: 2 }}
              >
                {d.note}
              </div>
            </span>
            <span className="kind-tag" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
function symbolFor(kind: CoordinationKind): string {
  const map: Record<CoordinationKind, string> = {
    death: "✕",
    save: "✚",
    "support-chain": "↻",
    "stack-break": "↹",
    spread: "✦",
    divergence: "↕",
    collapse: "▼",
    comeback: "✦",
  };
  return map[kind] || "·";
}
