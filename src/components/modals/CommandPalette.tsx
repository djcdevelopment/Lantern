/* ============================================================
   ⌘K command palette — keyboard-driven jump-to-anywhere.
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, type IconName } from "../Icon";
import { useSession } from "@/state/session";
import { useNotebook } from "@/state/memory";
import { useWorkbench } from "@/state/workbench";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

type CommandKind = "nav" | "cohort" | "propose" | "raid" | "ask" | "note" | "moment";

interface Command {
  kind: CommandKind;
  section: string;
  title: string;
  subtitle?: string;
  hint?: string;
  action: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { cohortScenarios, raidHistory, askSuggestions, cohortSuggestions } =
    useSession();
  const { notes } = useNotebook();
  const { openCohort, askQuestion, openPropose } = useWorkbench();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [open]);

  const allCommands = useMemo<Command[]>(() => {
    const cmds: Command[] = [];

    const nav: { title: string; hint: string; to: string }[] = [
      { title: "Home", hint: "1", to: "/" },
      { title: "Raids", hint: "2", to: "/raids" },
      { title: "Replay", hint: "3", to: "/replay" },
      { title: "Workshop", hint: "4", to: "/ask" },
      { title: "Contribute", hint: "5", to: "/contribute" },
      { title: "Notebook", hint: "7", to: "/notebook" },
      { title: "Settings", hint: "6", to: "/settings" },
    ];
    nav.forEach((c) =>
      cmds.push({
        kind: "nav",
        section: "Jump to",
        title: c.title,
        hint: c.hint,
        action: () => navigate(c.to),
      }),
    );

    Object.values(cohortScenarios).forEach((s) =>
      cmds.push({
        kind: "cohort",
        section: "Cohort scenarios",
        title: s.title,
        subtitle: `${s.pullLabel} · ${s.members.length} raiders`,
        action: () => openCohort(s.id),
      }),
    );

    cmds.push({
      kind: "propose",
      section: "Share as an observation",
      title: "Share an observation with the guild",
      subtitle: "Send a moment to the Workshop — not a retro entry",
      action: () => openPropose(),
    });
    Object.values(cohortScenarios).forEach((s) =>
      cmds.push({
        kind: "propose",
        section: "Share as an observation",
        title: `Share: ${s.title}`,
        subtitle: "pre-filled from cohort · you'll review before sharing",
        action: () =>
          openPropose({
            kind: s.id === "extcd" || s.id === "spread" ? "teamwork" : "celebration",
            title: s.title,
            description: s.summary,
            credits: s.members,
            binding: {
              kind: "cohort",
              scenarioId: s.id,
              label: s.title + " · " + s.pullLabel,
            },
          }),
      }),
    );

    cmds.push({
      kind: "nav",
      section: "Jump to",
      title: "Observations",
      hint: "8",
      action: () => navigate("/observations"),
    });

    raidHistory.slice(0, 4).forEach((r) =>
      cmds.push({
        kind: "raid",
        section: "Raids",
        title: r.title,
        subtitle: `${r.day} · ${r.date} · ${r.bosses}`,
        action: () => navigate("/raids/2026-05-12"),
      }),
    );

    askSuggestions.slice(0, 4).forEach((s) =>
      cmds.push({
        kind: "ask",
        section: "Ask the Workshop",
        title: s,
        action: () => askQuestion(s),
      }),
    );
    cohortSuggestions.slice(0, 3).forEach((s) =>
      cmds.push({
        kind: "ask",
        section: "Ask the Workshop",
        title: s,
        subtitle: "cohort-aware",
        action: () => askQuestion(s),
      }),
    );

    notes.slice(0, 8).forEach((n) =>
      cmds.push({
        kind: "note",
        section: "Notebook",
        title: n.text.length > 80 ? n.text.slice(0, 80) + "…" : n.text,
        subtitle:
          n.binding?.label ||
          (n.tags.length ? n.tags.map((t) => "#" + t).join(" ") : "free-floating"),
        action: () => navigate("/notebook"),
      }),
    );

    cmds.push({
      kind: "moment",
      section: "Moments",
      title: "Mug'Zee · Pull 6 · 04:32 · your death",
      subtitle: "open at this timestamp",
      action: () => navigate("/replay"),
    });
    cmds.push({
      kind: "moment",
      section: "Moments",
      title: "Stix Bunkjunker · kill pull",
      subtitle: "comeback · five raiders under 8% HP",
      action: () => navigate("/replay"),
    });

    return cmds;
  }, [
    cohortScenarios,
    raidHistory,
    askSuggestions,
    cohortSuggestions,
    notes,
    navigate,
    openCohort,
    askQuestion,
    openPropose,
  ]);

  const matched = useMemo<Command[]>(() => {
    if (!q.trim()) return allCommands;
    const needle = q.toLowerCase();
    return allCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(needle)) ||
        c.section.toLowerCase().includes(needle),
    );
  }, [q, allCommands]);

  useEffect(() => {
    setCursor(0);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(matched.length - 1, c + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (matched[cursor]) {
          matched[cursor].action();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, matched, cursor, onClose]);

  if (!open) return null;

  // Group matched commands by section, preserving section order.
  const grouped: { section: string; items: Command[] }[] = [];
  matched.forEach((c) => {
    let group = grouped.find((g) => g.section === c.section);
    if (!group) {
      group = { section: c.section, items: [] };
      grouped.push(group);
    }
    group.items.push(c);
  });

  let flatIdx = 0;

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <Icon name="search" size={14} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump anywhere, ask a question, find a moment…"
          />
          <span className="kbd-row">
            <kbd>esc</kbd>
          </span>
        </div>
        <div className="palette-results">
          {grouped.length === 0 && (
            <div className="palette-empty">
              No matches. Try "pull", "cohort", "settings", or a question.
            </div>
          )}
          {grouped.map((g, gi) => (
            <div key={gi} className="palette-group">
              <div className="palette-section">{g.section}</div>
              {g.items.map((c) => {
                const idx = flatIdx++;
                return (
                  <div
                    key={idx}
                    className={`palette-item ${idx === cursor ? "active" : ""}`}
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => {
                      c.action();
                      onClose();
                    }}
                  >
                    <span className={`palette-kind kind-${c.kind}`}>
                      <Icon name={kindIcon(c.kind)} size={12} />
                    </span>
                    <div className="palette-title">
                      <div>{c.title}</div>
                      {c.subtitle && (
                        <div className="palette-subtitle">{c.subtitle}</div>
                      )}
                    </div>
                    {c.hint && (
                      <span className="kbd-row">
                        <kbd>{c.hint}</kbd>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span className="kbd-row">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
          </span>
          <span>navigate</span>
          <span style={{ margin: "0 8px" }}>·</span>
          <span className="kbd-row">
            <kbd>↵</kbd>
          </span>
          <span>open</span>
          <span style={{ margin: "0 8px" }}>·</span>
          <span className="kbd-row">
            <kbd>esc</kbd>
          </span>
          <span>close</span>
          <span style={{ flex: 1 }}></span>
          <span style={{ color: "var(--text-mute)" }}>
            {matched.length} results · local
          </span>
        </div>
      </div>
    </div>
  );
}

function kindIcon(k: CommandKind): IconName {
  return (
    {
      nav: "arrowR",
      cohort: "spark",
      raid: "raids",
      ask: "ask",
      note: "book",
      moment: "play",
      propose: "upload",
    } as Record<CommandKind, IconName>
  )[k];
}
