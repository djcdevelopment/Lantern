// /notebook — personal scratchpad. Local-only. Notes can bind to a raid,
// pull, cohort scenario, or encounter, and are surfaceable by the Workshop.

import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/Icon";
import { useSession } from "@/state/session";
import { useNotebook, useObservations } from "@/state/memory";
import { useWorkbench } from "@/state/workbench";
import { CLOUD_MODE } from "@/api";
import type { Note, NoteTag, NoteBinding, BindingKind, ObservationDraft, Observation } from "@/api";

// Keep for the storage meta-card display string only.
const NOTEBOOK_KEY = "campfire.notebook.v1";

function bindingIcon(kind: BindingKind): IconName {
  const map: Record<BindingKind, IconName> = {
    cohort: "spark",
    raid: "raids",
    pull: "play",
    encounter: "book",
  };
  return map[kind] ?? "folder";
}

/* ============================================================
   Sub-components
   ============================================================ */

interface NoteCardProps {
  note: Note;
  editing: boolean;
  noteTags: NoteTag[];
  onEdit: () => void;
  onSave: (patch: { text: string; tags: string[] }) => void;
  onCancel: () => void;
  onPin: () => void;
  onDelete: () => void;
  onBindingClick: (b: NoteBinding | null) => void;
  observationByNoteId: (noteId: string) => Observation | undefined;
  onNavigateObservations: () => void;
  onOpenPropose: (seed: ObservationDraft) => void;
}

function NoteCard({
  note,
  editing,
  noteTags,
  onEdit,
  onSave,
  onCancel,
  onPin,
  onDelete,
  onBindingClick,
  observationByNoteId,
  onNavigateObservations,
  onOpenPropose,
}: NoteCardProps) {
  const [text, setText] = useState(note.text);
  const [tags, setTags] = useState(note.tags);

  useEffect(() => {
    setText(note.text);
    setTags(note.tags);
  }, [note.id, editing]);

  if (editing) {
    return (
      <div className="note-card editing">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
        />
        <div className="note-tag-picker">
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
        <div className="note-actions">
          <button className="btn ghost small" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn primary small"
            onClick={() => onSave({ text, tags })}
          >
            <Icon name="check" size={11} /> Save
          </button>
        </div>
      </div>
    );
  }

  const obs = observationByNoteId(note.id);
  const obsLabel = obs
    ? obs.status === "referenced"
      ? "Referenced in retro"
      : obs.status === "shared"
        ? "Shared as observation"
        : "Withdrawn"
    : null;
  const obsCls = obs
    ? obs.status === "shared"
      ? "pending"
      : obs.status === "referenced"
        ? "included"
        : "withdrawn"
    : null;

  return (
    <div className={`note-card ${note.pinned ? "pinned" : ""}`}>
      <div className="note-head">
        <div className="note-meta">
          <span className="when">{note.createdAt}</span>
          {note.pinned && (
            <span
              className="chip ember"
              style={{ padding: "1px 7px", fontSize: 10 }}
            >
              PINNED
            </span>
          )}
          {note.binding && (
            <span className="binding" onClick={() => onBindingClick(note.binding)}>
              <Icon name={bindingIcon(note.binding.kind)} size={11} />
              {note.binding.label}
            </span>
          )}
          {obs && obsLabel && obsCls && (
            <span
              className={`note-proposed ${obsCls}`}
              onClick={(e) => {
                e.stopPropagation();
                onNavigateObservations();
              }}
              title={`Observation ${obs.id} · ${obs.status}`}
            >
              <Icon name="upload" size={9} /> {obsLabel}
            </span>
          )}
        </div>
        <div className="note-controls">
          <button
            className="icon-btn"
            onClick={() =>
              onOpenPropose({
                kind: note.tags.includes("thanks")
                  ? "support"
                  : note.tags.includes("progression")
                    ? "teamwork"
                    : "celebration",
                title: note.text.split("\n")[0].slice(0, 120),
                description: note.text,
                credits: [],
                binding: note.binding,
                fromNoteId: note.id,
              })
            }
            title="Share as an observation"
          >
            <Icon name="upload" size={12} />
          </button>
          <button
            className="icon-btn"
            onClick={onPin}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            <Icon name="sparkle" size={12} />
          </button>
          <button className="icon-btn" onClick={onEdit} title="Edit">
            <Icon name="cog" size={12} />
          </button>
          <button className="icon-btn" onClick={onDelete} title="Delete">
            <Icon name="close" size={12} />
          </button>
        </div>
      </div>
      <div className="note-body" onClick={onEdit}>
        {note.text}
      </div>
      {note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.map((tid) => {
            const t = noteTags.find((x) => x.id === tid);
            if (!t) return null;
            return (
              <span
                key={tid}
                className="tag-chip readonly"
                style={{ "--hue": t.hue }}
              >
                {t.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface NoteDraftProps {
  noteTags: NoteTag[];
  onSave: (d: { text: string; tags: string[] }) => void;
  onCancel: () => void;
}

function NoteDraft({ noteTags, onSave, onCancel }: NoteDraftProps) {
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  return (
    <div className="note-card editing draft">
      <p className="h-eyebrow" style={{ marginBottom: 8 }}>
        New note
      </p>
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Something you noticed, want to ask later, or remember…"
        rows={4}
      />
      <div className="note-tag-picker">
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
      <div className="note-actions">
        <span
          className="faint mono"
          style={{ fontSize: 10, marginRight: "auto" }}
        >
          stays local · binding optional
        </span>
        <button className="btn ghost small" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn primary small"
          disabled={!text.trim()}
          style={{ opacity: text.trim() ? 1 : 0.4 }}
          onClick={() => text.trim() && onSave({ text: text.trim(), tags })}
        >
          <Icon name="check" size={11} /> Save note
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   NotebookPage
   ============================================================ */

export function NotebookPage() {
  const { noteTags } = useSession();
  const { notes, addNote, updateNote, removeNote } = useNotebook();
  const { observationByNoteId } = useObservations();
  const { openPropose, openCohort } = useWorkbench();
  const navigate = useNavigate();

  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);

  const visible = useMemo(() => {
    let v = notes;
    if (filterTag) v = v.filter((n) => n.tags.includes(filterTag));
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      v = v.filter(
        (n) =>
          n.text.toLowerCase().includes(q) ||
          n.tags.some((t) => t.includes(q)) ||
          (n.binding?.label || "").toLowerCase().includes(q),
      );
    }
    return [...v].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [notes, filterTag, searchQ]);

  const tagCounts = useMemo(() => {
    const m: Record<string, number> = {};
    notes.forEach((n) => n.tags.forEach((t) => { m[t] = (m[t] || 0) + 1; }));
    return m;
  }, [notes]);

  const onBindingClick = (b: NoteBinding | null) => {
    if (!b) return;
    if (b.kind === "cohort" && b.scenarioId) openCohort(b.scenarioId);
    else if (b.kind === "raid") navigate("/raids/2026-05-12");
    else if (b.kind === "pull") navigate("/raids/2026-05-12");
    else if (b.kind === "encounter") navigate("/raids");
  };

  return (
    <div className="page">
      <div
        style={{
          marginBottom: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 16,
        }}
      >
        <div>
          <p className="h-eyebrow">
            Notebook · {notes.length} entries · local-only
          </p>
          <h1 className="h-display">The bench notebook.</h1>
          <p className="muted" style={{ maxWidth: 580, marginTop: 8 }}>
            Your scratchpad. Retros are written by your raid lead — this is
            where your own observations, questions, and reminders live. Nothing
            here leaves this machine unless you explicitly share it.
          </p>
        </div>
        {!CLOUD_MODE && (
          <button className="btn primary" onClick={() => setDraftOpen(true)}>
            <Icon name="plus" size={13} /> New note
            <span className="kbd-row" style={{ marginLeft: 8 }}>
              <kbd>N</kbd>
            </span>
          </button>
        )}
      </div>

      <div className="notebook-grid">
        <aside className="notebook-side">
          <div className="notebook-search">
            <Icon name="search" size={12} />
            <input
              placeholder="Search notes…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
          </div>

          <div className="nb-side-section">Filter by tag</div>
          <div className="nb-tag-list">
            <div
              className={`nb-tag-row ${!filterTag ? "active" : ""}`}
              onClick={() => setFilterTag(null)}
            >
              <span>All notes</span>
              <span className="count">{notes.length}</span>
            </div>
            {noteTags.map((t) => (
              <div
                key={t.id}
                className={`nb-tag-row ${filterTag === t.id ? "active" : ""}`}
                onClick={() =>
                  setFilterTag(filterTag === t.id ? null : t.id)
                }
              >
                <span className="tag-chip" style={{ "--hue": t.hue }}>
                  {t.label}
                </span>
                <span className="count">{tagCounts[t.id] || 0}</span>
              </div>
            ))}
          </div>

          <div className="nb-side-section">Bound to</div>
          <div className="nb-tag-list">
            <div className="nb-tag-row">
              <span>This raid</span>
              <span className="count">
                {
                  notes.filter(
                    (n) =>
                      n.binding?.raidId === "2026-05-12" ||
                      n.binding?.kind === "cohort",
                  ).length
                }
              </span>
            </div>
            <div className="nb-tag-row">
              <span>Cohort scenarios</span>
              <span className="count">
                {notes.filter((n) => n.binding?.kind === "cohort").length}
              </span>
            </div>
            <div className="nb-tag-row">
              <span>Free-floating</span>
              <span className="count">
                {notes.filter((n) => !n.binding).length}
              </span>
            </div>
          </div>

          <div className="nb-meta-card">
            <p className="h-eyebrow">Storage</p>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--text-faint)",
                lineHeight: 1.6,
              }}
            >
              {notes.length} entries · ~{Math.ceil(JSON.stringify(notes).length / 1024)} KB
              <br />
              browser localStorage
              <br />
              key <code>{NOTEBOOK_KEY}</code>
            </div>
          </div>
        </aside>

        <div className="notebook-main">
          {draftOpen && (
            <NoteDraft
              noteTags={noteTags}
              onSave={async (d) => {
                await addNote(d);
                setDraftOpen(false);
              }}
              onCancel={() => setDraftOpen(false)}
            />
          )}

          {visible.length === 0 && !draftOpen && (
            <div
              className="cohort-empty"
              style={{ textAlign: "left", padding: "20px 22px" }}
            >
              <p className="h-eyebrow">No notes match</p>
              <p style={{ margin: "8px 0 0" }}>
                Clear the filter, or press <kbd>N</kbd> to write something.
              </p>
            </div>
          )}

          <div className="note-list">
            {visible.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                editing={editingId === n.id}
                noteTags={noteTags}
                onEdit={() => setEditingId(n.id)}
                onSave={async (patch) => {
                  await updateNote(n.id, patch);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
                onPin={() => updateNote(n.id, { pinned: !n.pinned })}
                onDelete={() => removeNote(n.id)}
                onBindingClick={onBindingClick}
                observationByNoteId={observationByNoteId}
                onNavigateObservations={() => navigate("/observations")}
                onOpenPropose={openPropose}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
