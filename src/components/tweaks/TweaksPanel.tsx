/* ============================================================
   Tweaks panel — appearance + workshop preferences.
   ------------------------------------------------------------
   Opened from Settings → Appearance. Reads/writes the persisted
   `tweaks` on the workbench. (In the original prototype this was
   a design-tool host panel; in the real app it's a plain
   preferences dialog.)
   ============================================================ */

import { Icon } from "../Icon";
import { useWorkbench } from "@/state/workbench";
import type { Tweaks } from "@/api";

interface TweaksPanelProps {
  onClose: () => void;
}

interface Option<T> {
  value: T;
  label: string;
}

function TweakRadio<T extends string | boolean>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="tweak-row">
      <span className="tweak-label">{label}</span>
      <div className="tweak-options">
        {options.map((o) => (
          <span
            key={String(o.value)}
            className={`preset-pill ${o.value === value ? "active" : ""}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TweakToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="tweak-row">
      <span className="tweak-label">{label}</span>
      <div className={`toggle ${value ? "on" : ""}`} onClick={() => onChange(!value)} />
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tweak-section">
      <p className="h-eyebrow" style={{ margin: "0 0 8px" }}>
        {label}
      </p>
      <div className="stack" style={{ gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

export function TweaksPanel({ onClose }: TweaksPanelProps) {
  const { tweaks, setTweak } = useWorkbench();

  const set =
    <K extends keyof Tweaks>(key: K) =>
    (value: Tweaks[K]) =>
      setTweak(key, value);

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div
        className="card tweaks-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 400, maxHeight: "82vh", overflowY: "auto" }}
      >
        <div
          className="between"
          style={{ alignItems: "flex-start", marginBottom: 4 }}
        >
          <div>
            <p className="h-eyebrow" style={{ margin: 0 }}>
              Preferences · local
            </p>
            <h2 className="h1" style={{ fontStyle: "italic", margin: "4px 0 0" }}>
              Appearance.
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close">
            <Icon name="close" size={14} />
          </button>
        </div>

        <div className="divider" style={{ margin: "14px 0" }} />

        <div className="stack" style={{ gap: 18 }}>
          <Section label="Layout">
            <TweakRadio
              label="Theme"
              value={tweaks.theme}
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
                { value: "gad", label: "GAD" },
              ]}
              onChange={set("theme")}
            />
            <TweakRadio
              label="Density"
              value={tweaks.density}
              options={[
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
              ]}
              onChange={set("density")}
            />
            <TweakRadio
              label="Home layout"
              value={tweaks.homeLayout}
              options={[
                { value: "timeline", label: "Timeline" },
                { value: "moments", label: "Moments" },
                { value: "roster", label: "Roster" },
              ]}
              onChange={set("homeLayout")}
            />
          </Section>

          <Section label="Workshop">
            <TweakRadio
              label="Answer tone"
              value={tweaks.aiTone}
              options={[
                { value: "trace", label: "Trace" },
                { value: "minimal", label: "Quiet" },
                { value: "tool", label: "Tool" },
              ]}
              onChange={set("aiTone")}
            />
          </Section>

          <Section label="Surfacing">
            <TweakToggle
              label="Show support contributions"
              value={tweaks.showSupport}
              onChange={set("showSupport")}
            />
          </Section>
        </div>

        <div className="divider" style={{ margin: "16px 0 12px" }} />
        <p className="faint" style={{ fontSize: 12, margin: 0, lineHeight: 1.5 }}>
          These preferences are stored on this machine only.
        </p>
      </div>
    </div>
  );
}
