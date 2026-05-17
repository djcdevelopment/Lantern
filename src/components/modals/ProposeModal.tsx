/* ============================================================
   "Share an observation" modal — compose → confirm → success.
   Nothing is shared until the player confirms. The confirm step
   states plainly what happens, who sees it, and how to withdraw.
   ============================================================ */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../Icon";
import { PAvatar } from "../primitives";
import { useSession } from "@/state/session";
import { useObservations } from "@/state/memory";
import type {
  BindingKind,
  NoteBinding,
  Observation,
  ObservationDraft,
} from "@/api";

interface ProposeModalProps {
  seed: ObservationDraft;
  onClose: () => void;
}

export function ProposeModal({ seed, onClose }: ProposeModalProps) {
  const { shareObservation } = useObservations();
  const [step, setStep] = useState<"compose" | "confirm" | "success">("compose");
  const [kind, setKind] = useState(seed.kind ?? "teamwork");
  const [title, setTitle] = useState(seed.title ?? "");
  const [description, setDescription] = useState(seed.description ?? "");
  const [credits, setCredits] = useState<string[]>(seed.credits ?? []);
  const [submitted, setSubmitted] = useState<Observation | null>(null);

  const submit = async () => {
    const obs = await shareObservation({
      kind,
      title,
      description,
      credits,
      binding: seed.binding ?? null,
      sources: seed.sources ?? guessSources(seed.binding ?? null),
      fromNoteId: seed.fromNoteId,
    });
    setSubmitted(obs);
    setStep("success");
  };

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="propose-modal" onClick={(e) => e.stopPropagation()}>
        {step === "compose" && (
          <ComposeStep
            kind={kind}
            setKind={setKind}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            credits={credits}
            setCredits={setCredits}
            seed={seed}
            onCancel={onClose}
            onReview={() => setStep("confirm")}
          />
        )}
        {step === "confirm" && (
          <ConfirmStep
            kind={kind}
            title={title}
            description={description}
            credits={credits}
            seed={seed}
            onBack={() => setStep("compose")}
            onCancel={onClose}
            onConfirm={submit}
          />
        )}
        {step === "success" && submitted && (
          <SuccessStep observation={submitted} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

/* ---------- COMPOSE ---------- */
interface ComposeStepProps {
  kind: string;
  setKind: (k: string) => void;
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  credits: string[];
  setCredits: (c: string[]) => void;
  seed: ObservationDraft;
  onCancel: () => void;
  onReview: () => void;
}

function ComposeStep({
  kind,
  setKind,
  title,
  setTitle,
  description,
  setDescription,
  credits,
  setCredits,
  seed,
  onCancel,
  onReview,
}: ComposeStepProps) {
  const { roster, observationKinds } = useSession();
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!title) titleRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kindMeta =
    observationKinds.find((k) => k.id === kind) ?? observationKinds[0];

  return (
    <>
      <div className="propose-head">
        <div>
          <p className="h-eyebrow" style={{ margin: 0 }}>
            Step 1 of 2 · Compose
          </p>
          <h2 className="propose-title">Share an observation</h2>
        </div>
        <button className="icon-btn" onClick={onCancel} title="Cancel">
          <Icon name="close" size={14} />
        </button>
      </div>

      <div className="propose-body">
        <p
          className="muted"
          style={{ margin: "0 0 16px", fontSize: 13, lineHeight: 1.6, maxWidth: 540 }}
        >
          Surface something worth a closer look — a quiet handoff, a comeback, a
          kindness, an open question. Observations live in the guild's Workshop. Your
          raid leads <em>may</em> reference one when they author the next retrospective,
          but retros are written independently. Observations are interpretations, not
          retro fragments.
        </p>

        <Field label="Kind" hint="The shape of what you're surfacing">
          <div className="kind-picker">
            {observationKinds.map((k) => (
              <span
                key={k.id}
                className={`kind-chip ${kind === k.id ? "selected" : ""}`}
                style={{ "--hue": k.hue }}
                onClick={() => setKind(k.id)}
              >
                <span className="kind-dot"></span>
                {k.label}
              </span>
            ))}
          </div>
          <p className="faint" style={{ fontSize: 11.5, marginTop: 6 }}>
            {kindMeta.desc}
          </p>
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

        <Field
          label="Credit"
          hint="Who deserves recognition. You can credit multiple raiders."
        >
          <div className="credit-picker">
            {roster.map((p) => {
              const on = credits.includes(p.name);
              return (
                <span
                  key={p.name}
                  className={`credit-chip ${on ? "selected" : ""}`}
                  onClick={() =>
                    setCredits(
                      on
                        ? credits.filter((c) => c !== p.name)
                        : [...credits, p.name],
                    )
                  }
                >
                  <PAvatar name={p.name} hue={p.hue} size="sm" />
                  <span>{p.name}</span>
                </span>
              );
            })}
          </div>
        </Field>

        <Field
          label="Dataset attached"
          hint="What other raiders will be able to inspect"
        >
          <DatasetSummary seed={seed} />
        </Field>
      </div>

      <div className="propose-foot">
        <span className="faint mono" style={{ fontSize: 11, marginRight: "auto" }}>
          Nothing is shared until you confirm.
        </span>
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn primary"
          disabled={!title.trim() || !description.trim() || credits.length === 0}
          style={{
            opacity:
              title.trim() && description.trim() && credits.length > 0 ? 1 : 0.4,
          }}
          onClick={onReview}
        >
          Review <Icon name="arrowR" size={12} />
        </button>
      </div>
    </>
  );
}

/* ---------- CONFIRM ---------- */
interface ConfirmStepProps {
  kind: string;
  title: string;
  description: string;
  credits: string[];
  seed: ObservationDraft;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmStep({
  kind,
  title,
  description,
  credits,
  seed,
  onBack,
  onCancel,
  onConfirm,
}: ConfirmStepProps) {
  const { roster, observationKinds } = useSession();
  const kindMeta =
    observationKinds.find((k) => k.id === kind) ?? observationKinds[0];

  return (
    <>
      <div className="propose-head">
        <div>
          <p className="h-eyebrow" style={{ margin: 0 }}>
            Step 2 of 2 · Confirm
          </p>
          <h2 className="propose-title">Share this with the guild's Workshop?</h2>
        </div>
        <button className="icon-btn" onClick={onCancel} title="Cancel">
          <Icon name="close" size={14} />
        </button>
      </div>

      <div className="propose-body">
        <div className="confirm-summary" style={{ "--hue": kindMeta.hue }}>
          <div className="cs-kind">{kindMeta.label}</div>
          <div className="cs-title">{title}</div>
          <p className="cs-desc">{description}</p>
          <div className="cs-credits">
            <span className="h-eyebrow" style={{ marginRight: 8 }}>
              credits
            </span>
            <div className="avatar-cluster">
              {credits.map((name) => {
                const p = roster.find((r) => r.name === name);
                return (
                  <PAvatar key={name} name={name} hue={p?.hue ?? 250} size="sm" />
                );
              })}
            </div>
            <span className="faint" style={{ marginLeft: 10, fontSize: 12 }}>
              {credits.join(", ")}
            </span>
          </div>
          <div className="cs-dataset">
            <DatasetSummary seed={seed} />
          </div>
        </div>

        <div className="confirm-clarity">
          <ClarityRow
            ico="upload"
            label="What happens"
            body={
              <>
                Your observation appears in the guild's <strong>Observations</strong>{" "}
                surface for raiders to read and discuss. It is <strong>not</strong> a
                retrospective entry — retros are written independently by your raid
                leads. They <em>may</em> reference your observation if they find it
                useful, but they may not, and that's fine: observations live alongside
                retros, not inside them.
              </>
            }
          />
          <ClarityRow
            ico="eye"
            label="Who can see it"
            body={
              <>
                Other raiders in your guild who open the Observations surface, plus your
                raid leads. Anyone who can see it can also link the same dataset you
                attached — cohort, replay frame, or moment — and inspect it themselves.
                Other raiders cannot edit your text.
              </>
            }
          />
          <ClarityRow
            ico="close"
            label="How to cancel"
            body={
              <>
                Withdraw at any time from <strong>Observations · Yours</strong>. The
                observation is removed from the guild's surface immediately. If a raid
                lead has already referenced it in a published retrospective, their
                reference (their words) remains theirs to edit.
              </>
            }
          />
          <ClarityRow
            ico="spark"
            label="How this helps"
            body={
              <>
                Observations are how raiders share interpretations of shared evidence. A
                clean cooldown chain, an alt-swap that mattered, a comeback worth
                celebrating — these are easy to miss in raw numbers. Sharing one helps
                other raiders see what you saw, and gives raid leads something to draw
                on when they author memory for the chronicle.
              </>
            }
          />
        </div>
      </div>

      <div className="propose-foot">
        <button className="btn ghost" onClick={onBack}>
          <Icon name="arrowL" size={12} /> Back
        </button>
        <span style={{ flex: 1 }}></span>
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn primary" onClick={onConfirm}>
          <Icon name="upload" size={12} /> Share with the Workshop
        </button>
      </div>
    </>
  );
}

/* ---------- SUCCESS ---------- */
interface SuccessStepProps {
  observation: Observation;
  onClose: () => void;
}

function SuccessStep({ observation, onClose }: SuccessStepProps) {
  const navigate = useNavigate();
  return (
    <div className="propose-success">
      <div className="success-glyph">
        <Icon name="check" size={28} stroke={2} />
      </div>
      <p className="h-eyebrow">Observation shared · visible in the Workshop</p>
      <h2 className="propose-title" style={{ marginTop: 8 }}>
        Your observation is now in the guild's Workshop.
      </h2>
      <p
        className="muted"
        style={{ maxWidth: 480, margin: "12px auto 0", fontSize: 14, lineHeight: 1.6 }}
      >
        Other raiders can open the dataset you attached and read what you saw. Raid
        leads <em>may</em> draw on it when they next author a retrospective — the retro
        stays theirs to write. You can withdraw any time from{" "}
        <strong>Observations</strong>.
      </p>

      <div className="success-recap">
        <span className="chip ember">SHARED</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-faint)",
          }}
        >
          id {observation.id}
        </span>
      </div>

      <div className="row" style={{ justifyContent: "center", gap: 10, marginTop: 22 }}>
        <button className="btn" onClick={onClose}>
          Done
        </button>
        <button
          className="btn primary"
          onClick={() => {
            onClose();
            navigate("/observations");
          }}
        >
          View in Observations <Icon name="arrowR" size={12} />
        </button>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="propose-field">
      <div className="pf-head">
        <span className="pf-label">{label}</span>
        {hint && <span className="pf-hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ClarityRow({
  ico,
  label,
  body,
}: {
  ico: "upload" | "eye" | "close" | "spark";
  label: string;
  body: ReactNode;
}) {
  return (
    <div className="clarity-row">
      <span className="clarity-ico">
        <Icon name={ico} size={14} />
      </span>
      <div>
        <div className="clarity-label">{label}</div>
        <div className="clarity-body">{body}</div>
      </div>
    </div>
  );
}

function DatasetSummary({ seed }: { seed: ObservationDraft }) {
  const sources = seed.sources ?? guessSources(seed.binding ?? null);
  return (
    <div className="dataset-summary">
      {seed.binding && (
        <div className="ds-line">
          <Icon name={bindingIco(seed.binding.kind)} size={12} />
          <span>
            <strong>Binding:</strong> {seed.binding.label}
          </span>
        </div>
      )}
      {sources.map((s, i) => (
        <div key={i} className="ds-line">
          <Icon name="folder" size={12} />
          <span>{s}</span>
        </div>
      ))}
      {seed.fromNoteId && (
        <div className="ds-line">
          <Icon name="book" size={12} />
          <span>
            <strong>From your notebook:</strong> note {seed.fromNoteId}
          </span>
        </div>
      )}
      <p className="faint" style={{ fontSize: 11, margin: "8px 0 0", lineHeight: 1.5 }}>
        Your raw combat log, /ask transcripts, and any unattached notebook entries stay
        on this machine.
      </p>
    </div>
  );
}

function guessSources(binding: NoteBinding | null): string[] {
  if (!binding) return [];
  if (binding.kind === "cohort")
    return [
      "Replay frames for the bound cohort range",
      "Cohort coordination event list",
    ];
  if (binding.kind === "pull")
    return ["Pull replay frames", "Pull combat log slice"];
  if (binding.kind === "raid") return ["Raid encounter summaries"];
  return [];
}

const bindingIco = (kind: BindingKind): "spark" | "raids" | "play" | "book" =>
  ({ cohort: "spark", raid: "raids", pull: "play", encounter: "book" } as const)[
    kind
  ];
