/* Top status bar — brand, live local-service status, theme, search. */

import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { BrandGlyph } from "../primitives";
import { useWorkbench } from "@/state/workbench";
import { api } from "@/api";
import type { HealthStatus, Theme } from "@/api";

const THEMES: { id: Theme; label: string; glyph: string }[] = [
  { id: "dark", label: "dark", glyph: "◐" },
  { id: "light", label: "light", glyph: "○" },
  { id: "gad", label: "GAD", glyph: "●" },
];

function ThemeCycle() {
  const { tweaks, setTweak } = useWorkbench();
  const cur = THEMES.find((t) => t.id === tweaks.theme) ?? THEMES[0];

  const next = () => {
    const idx = THEMES.findIndex((t) => t.id === tweaks.theme);
    setTweak("theme", THEMES[(idx + 1) % THEMES.length].id);
  };

  return (
    <span
      onClick={next}
      style={{
        cursor: "pointer",
        display: "inline-flex",
        gap: 6,
        alignItems: "center",
        color: "var(--text-faint)",
      }}
      title={`Theme · ${cur.label} (click to cycle)`}
    >
      <span style={{ color: "var(--ember)", fontSize: 11 }}>{cur.glyph}</span>
      <span>{cur.label}</span>
    </span>
  );
}

/** Polls the local services so the strip reflects reality, not a guess. */
function useHealth(): HealthStatus | null {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  useEffect(() => {
    let live = true;
    const tick = () => {
      api
        .getHealth()
        .then((h) => {
          if (live) setHealth(h);
        })
        .catch(() => {
          /* leave the last-known value; the strip just goes stale */
        });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, []);
  return health;
}

const portOf = (endpoint: string): string => {
  try {
    return new URL(endpoint).port || "—";
  } catch {
    return "—";
  }
};

function StatusStrip() {
  const health = useHealth();
  const muted = { color: "var(--text-mute)", marginLeft: 4 };

  if (!health) {
    return (
      <div className="status-strip">
        <div className="item">
          <span className="dot idle"></span>Local services
          <span style={muted}>connecting…</span>
        </div>
      </div>
    );
  }

  const { ollama, parser, replayCache } = health;

  return (
    <div className="status-strip">
      <div className="item">
        <span className="dot"></span>Parser
        <span style={muted}>
          {parser.state} · last {parser.lastParse}
        </span>
      </div>
      <div className="item">
        <span className={`dot ${ollama.reachable ? "" : "idle"}`}></span>Ollama
        <span style={muted}>
          {ollama.reachable
            ? `${ollama.models[0] ?? "ready"} · ${portOf(ollama.endpoint)}`
            : `offline · ${portOf(ollama.endpoint)}`}
        </span>
      </div>
      <div className="item">
        <span className="dot idle"></span>Replay cache
        <span style={muted}>{replayCache.sizeMb} MB</span>
      </div>
    </div>
  );
}

export function Topbar() {
  const { openQuickNote, openPalette } = useWorkbench();

  return (
    <div className="topbar">
      <div className="brand">
        <span className="glyph">
          <BrandGlyph />
        </span>
        <span>lantern</span>
        <span
          className="mono"
          style={{
            color: "var(--text-mute)",
            marginLeft: 6,
            fontSize: 10,
            fontStyle: "normal",
          }}
        >
          v0.18
        </span>
      </div>

      <StatusStrip />

      <div className="right">
        <ThemeCycle />
        <span style={{ width: 1, height: 14, background: "var(--border)" }}></span>
        <span
          onClick={() => openQuickNote()}
          style={{
            cursor: "pointer",
            display: "flex",
            gap: 6,
            alignItems: "center",
            color: "var(--text-faint)",
          }}
          title="Quick note (N)"
        >
          <Icon name="book" size={12} />
          <span>note</span>
          <span className="kbd-row">
            <kbd>N</kbd>
          </span>
        </span>
        <span style={{ width: 1, height: 14, background: "var(--border)" }}></span>
        <span
          onClick={openPalette}
          style={{ cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}
        >
          <Icon name="search" size={12} />
          <span style={{ color: "var(--text-faint)" }}>
            Search raids, players, moments
          </span>
          <span className="kbd-row">
            <kbd>⌘</kbd>
            <kbd>K</kbd>
          </span>
        </span>
      </div>
    </div>
  );
}
