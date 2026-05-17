/* ============================================================
   Quick-capture note modal — opens with N or from inline "Add
   note" buttons. Saves straight to the notebook.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { useSession } from "@/state/session";
import { useNotebook } from "@/state/memory";
import type { QuickNoteSeed } from "@/state/workbench";
import type { BindingKind } from "@/api";

interface QuickNoteModalProps {
  seed: QuickNoteSeed;
  onClose: () => void;
}

const bindingIco = (kind: BindingKind): "spark" | "raids" | "play" | "book" =>
  ({ cohort: "spark", raid: "raids", pull: "play", encounter: "book" } as const)[
    kind
  ];

export function QuickNoteModal({ seed, onClose }: QuickNoteModalProps) {
  const { noteTags } = useSession();
  const { addNote } = useNotebook();
  const [text, setText] = useState(seed.text ?? "");
  const [tags, setTags] = useState<string[]>(seed.tags ?? []);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = setTimeout(() => taRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, []);

  const save = () => {
    if (!text.trim()) return;
    void addNote({ text: text.trim(), tags, binding: seed.binding ?? null });
    onClose();
  };

  // ⌘/Ctrl+Enter to save.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, tags, seed]);

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="quicknote-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qn-head">
          <div>
            <p className="h-eyebrow" style={{ margin: 0 }}>
              New note · local-only
            </p>
            <h2 className="propose-title" style={{ fontSize: 18 }}>
              The bench notebook.
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </div>

        {seed.binding && (
          <div className="qn-binding">
            <Icon name={bindingIco(seed.binding.kind)} size={11} />
            <span>Binding: {seed.binding.label}</span>
          </div>
        )}

        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Something you noticed, want to ask later, or want to remember…"
        />

        <div className="qn-tags">
          {noteTags.map((t) => (
            <span
              key={t.id}
              className={`tag-chip ${tags.includes(t.id) ? "selected" : ""}`}
              style={{ "--hue": t.hue }}
              onClick={() =>
                setTags(
                  tags.includes(t.id)
                    ? tags.filter((x) => x !== t.id)
                    : [...tags, t.id],
                )
              }
            >
              {t.label}
            </span>
          ))}
        </div>

        <div className="qn-foot">
          <span className="faint mono" style={{ fontSize: 10 }}>
            stays local · <kbd>⌘</kbd> <kbd>↵</kbd> to save
          </span>
          <button className="btn ghost small" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary small"
            disabled={!text.trim()}
            style={{ opacity: text.trim() ? 1 : 0.4 }}
            onClick={save}
          >
            <Icon name="check" size={11} /> Save note
          </button>
        </div>
      </div>
    </div>
  );
}
