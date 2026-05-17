// /contribute — calm consent flow for sharing parsed data with the guild.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/Icon";
import { useSession } from "@/state/session";
import { CLOUD_MODE } from "@/api";

/* ---------- Sub-component props ---------- */

interface LocalRowProps {
  ico: IconName;
  label: string;
  v: string;
}

interface ContribStatItemProps {
  label: string;
  v: string;
}

interface ContributedViewProps {
  onNavigateHome: () => void;
  onAgain: () => void;
  latestRaidDate: string;
}

/* ---------- Local row ---------- */

const LocalRow = ({ ico, label, v }: LocalRowProps) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "20px 1fr auto",
      alignItems: "center",
      gap: 10,
      fontSize: 13,
    }}
  >
    <span style={{ color: "var(--text-faint)" }}>
      <Icon name={ico} size={13} />
    </span>
    <span>{label}</span>
    <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>
      {v}
    </span>
  </div>
);

/* ---------- Contrib stat item ---------- */

const ContribStatItem = ({ label, v }: ContribStatItemProps) => (
  <div className="between">
    <span className="muted" style={{ fontSize: 13 }}>
      {label}
    </span>
    <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
      {v}
    </span>
  </div>
);

/* ---------- Contributed view ---------- */

const ContributedView = ({ onNavigateHome, onAgain, latestRaidDate }: ContributedViewProps) => (
  <div className="page">
    <div
      className="card"
      style={{
        maxWidth: 560,
        margin: "60px auto",
        background: "var(--surface)",
        borderColor: "var(--border-strong)",
        padding: 36,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          margin: "0 auto 20px",
          background: "radial-gradient(circle, var(--ember-glow), transparent 65%)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ember)",
        }}
      >
        <Icon name="check" size={28} stroke={2} />
      </div>
      <p className="h-eyebrow">Contributed · {latestRaidDate}</p>
      <h2 className="h1" style={{ fontStyle: "italic", margin: "8px 0 12px" }}>
        Tonight is now part of the chronicle.
      </h2>
      <p
        className="muted"
        style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}
      >
        Your raid lead can quote your notes in the next retrospective, and the advanced
        replay surface is now available for this raid. Anything you didn't include stays
        on this machine.
      </p>
      <div className="divider" style={{ margin: "24px 0" }}></div>
      <div className="row" style={{ justifyContent: "center", gap: 10 }}>
        <button className="btn" onClick={onAgain}>
          View package
        </button>
        <button className="btn primary" onClick={onNavigateHome}>
          Back to home
        </button>
      </div>
    </div>
  </div>
);

/* ---------- Page ---------- */

export function ContributePage() {
  const navigate = useNavigate();
  const { latestRaid, packageItems, consent } = useSession();

  const [consents, setConsents] = useState<Record<string, boolean>>(
    Object.fromEntries(consent.map((c) => [c.id, c.on])),
  );
  const [showMovement, setShowMovement] = useState(false);
  const [contributed, setContributed] = useState(false);

  const uploadSize = consents.movement && showMovement ? "12.8 MB" : "353 KB";
  const fileCount = Object.values(consents).filter(Boolean).length + 2; // metadata files

  if (contributed) {
    return (
      <ContributedView
        latestRaidDate={latestRaid.date}
        onAgain={() => setContributed(false)}
        onNavigateHome={() => navigate("/")}
      />
    );
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 22 }}>
        <p className="h-eyebrow">
          Contribute · last raid · {latestRaid.date}
        </p>
        <h1 className="h-display">
          Preserve this raid for the <em>chronicle</em>.
        </h1>
        <p
          className="muted"
          style={{ maxWidth: 640, marginTop: 8, fontSize: 14, lineHeight: 1.6 }}
        >
          Contribution is about <strong>preservation</strong>: parsed summaries, support events,
          and (optionally) movement traces — so the guild can recall tonight, and so other raiders
          can open it in the advanced replay surface. Interpretation lives elsewhere (the Workshop and
          Observations). Retros are authored separately by your raid leads. This page only handles
          substrate.
        </p>
      </div>

      <div className="contrib-grid">
        <div className="stack lg">
          <div className="card flush">
            <div className="card-head">
              <h2 className="h2">What's in the package</h2>
              <span className="chip">
                <Icon name="folder" size={11} />
                <span style={{ marginLeft: 2 }}>raid/{latestRaid.id}/</span>
              </span>
            </div>
            <div className="package-tree" style={{ padding: "8px 6px" }}>
              {packageItems.map((it, i) => {
                const isMovement = it.path.includes("movement");
                const uploading =
                  it.upload || (isMovement && consents.movement && showMovement);
                const cls = uploading ? "upload" : "local";
                return (
                  <div key={i} className={`ln ${cls}`}>
                    <span className="ind">{it.kind === "dir" ? "▸" : ""}</span>
                    <span className="ind">{it.kind === "file" ? "·" : ""}</span>
                    <span className="pth">{it.path}</span>
                    <span className="sz">{it.sz || ""}</span>
                    <span className="tag">{uploading ? "UPLOAD" : "STAYS LOCAL"}</span>
                  </div>
                );
              })}
            </div>
            <div
              className="card-body"
              style={{
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>
                {fileCount} files · {uploadSize} estimated upload
              </span>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>
                180 MB of raw log stays on your machine
              </span>
            </div>
          </div>

          <div className="card flush">
            <div className="card-head">
              <h2 className="h2">Consent</h2>
              <span className="faint mono" style={{ fontSize: 11 }}>
                You can change these at any time
              </span>
            </div>
            <div className="card-body" style={{ padding: "8px 16px" }}>
              {consent.map((c) => (
                <div key={c.id} className="consent-row">
                  <div>
                    <div className="label">{c.label}</div>
                    <div className="desc">{c.desc}</div>
                  </div>
                  <div
                    className={`toggle ${consents[c.id] ? "on" : ""}`}
                    onClick={() => {
                      const nv = !consents[c.id];
                      setConsents({ ...consents, [c.id]: nv });
                      if (c.id === "movement") setShowMovement(nv);
                    }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stack lg">
          <div className="card retro-card">
            <p className="h-eyebrow">What contributions do</p>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 6 }}>
              Your contribution preserves tonight's context. It makes the raid replayable for other
              raiders and gives the chronicle the substrate it needs to remember the night. It does
              <strong> not </strong> automatically appear in any retrospective — retros are written by
              your raid leads, as their own editorial work.
            </p>
            <div className="divider" style={{ margin: "14px 0 12px" }}></div>
            <div className="stack" style={{ gap: 6 }}>
              <ContribStatItem label="Raid illumination" v="In progress" />
              <ContribStatItem label="Replay reconstruction" v="Available" />
              <ContribStatItem label="Chronicle entry" v="Pending raid lead" />
            </div>
          </div>

          <div className="card flush">
            <div className="card-head">
              <h2 className="h2">What stays local</h2>
            </div>
            <div
              className="card-body"
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <LocalRow ico="lock" label="Raw combat log" v="180 MB" />
              <LocalRow ico="lock" label="/ask transcripts" v="4 KB" />
              <LocalRow ico="lock" label="Parser cache" v="62 MB" />
              <LocalRow ico="lock" label="Replay frame cache" v="412 MB" />
            </div>
          </div>

          <button
            className="btn primary"
            disabled={CLOUD_MODE}
            style={{
              padding: "12px 16px",
              justifyContent: "center",
              width: "100%",
              fontSize: 14,
              opacity: CLOUD_MODE ? 0.4 : 1,
            }}
            onClick={() => {
              if (!CLOUD_MODE) setContributed(true);
            }}
          >
            <Icon name="upload" size={14} />
            {CLOUD_MODE
              ? "Contribution needs the local app"
              : `Contribute to chronicle · ${uploadSize}`}
          </button>

          <button className="btn ghost" style={{ justifyContent: "center" }}>
            Save package without uploading
          </button>
        </div>
      </div>
    </div>
  );
}
