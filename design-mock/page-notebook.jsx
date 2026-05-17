/* global React, window */
// /notebook — personal scratchpad. Local-only. Notes can bind to a raid,
// pull, cohort scenario, or encounter, and are surfaceable by the Workshop.

const { useState: useStateN, useMemo: useMemoN, useEffect: useEffectN, useRef: useRefN } = React;

const NOTEBOOK_KEY = "campfire.notebook.v1";

// Persisted store. Falls back to seed on first load.
function loadNotebook() {
  try {
    const raw = localStorage.getItem(NOTEBOOK_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [...window.NOTEBOOK_SEED];
}
function saveNotebook(notes) {
  try { localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(notes)); } catch (e) {}
}

// Singleton-ish accessor for other pages — they don't all want React state.
window.Notebook = {
  all: () => loadNotebook(),
  add: (entry) => {
    const notes = loadNotebook();
    const newEntry = {
      id: "n" + Date.now(),
      text: entry.text || "",
      tags: entry.tags || [],
      binding: entry.binding || null,
      createdAt: "just now",
      pinned: false,
    };
    const next = [newEntry, ...notes];
    saveNotebook(next);
    if (window.__campfireTick) window.__campfireTick();
    return newEntry;
  },
  byBinding: (kind, ref) => loadNotebook().filter(n => {
    if (!n.binding) return false;
    if (n.binding.kind !== kind) return false;
    if (kind === "cohort" && n.binding.scenarioId === ref) return true;
    if (kind === "pull" && n.binding.pullId === ref) return true;
    if (kind === "raid" && n.binding.raidId === ref) return true;
    if (kind === "encounter" && n.binding.encounterId === ref) return true;
    return false;
  }),
};

/* ============================================================
   Notebook page
   ============================================================ */

const NotebookPage = ({ setRoute, openCohort }) => {
  const [notes, setNotes] = useStateN(() => loadNotebook());
  const [filterTag, setFilterTag] = useStateN(null);
  const [searchQ, setSearchQ] = useStateN("");
  const [editingId, setEditingId] = useStateN(null);
  const [draftOpen, setDraftOpen] = useStateN(false);

  const update = (next) => { setNotes(next); saveNotebook(next); };

  const visible = useMemoN(() => {
    let v = notes;
    if (filterTag) v = v.filter(n => n.tags.includes(filterTag));
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      v = v.filter(n =>
        n.text.toLowerCase().includes(q) ||
        n.tags.some(t => t.includes(q)) ||
        (n.binding?.label || "").toLowerCase().includes(q)
      );
    }
    return [...v].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [notes, filterTag, searchQ]);

  const tagCounts = useMemoN(() => {
    const m = {};
    notes.forEach(n => n.tags.forEach(t => { m[t] = (m[t] || 0) + 1; }));
    return m;
  }, [notes]);

  const onBindingClick = (b) => {
    if (!b) return;
    if (b.kind === "cohort" && b.scenarioId) openCohort(b.scenarioId);
    else if (b.kind === "raid") setRoute("raids/2026-05-12");
    else if (b.kind === "pull") setRoute("raids/2026-05-12");
    else if (b.kind === "encounter") setRoute("raids");
  };

  return (
    <div className="page">
      <div style={{marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16}}>
        <div>
          <p className="h-eyebrow">Notebook · {notes.length} entries · local-only</p>
          <h1 className="h-display">The bench notebook.</h1>
          <p className="muted" style={{maxWidth: 580, marginTop: 8}}>
            Your scratchpad. Retros are written by your raid lead — this is where your own
            observations, questions, and reminders live. Nothing here leaves this machine
            unless you explicitly share it.
          </p>
        </div>
        <button className="btn primary" onClick={() => setDraftOpen(true)}>
          <Icon name="plus" size={13} /> New note
          <span className="kbd-row" style={{marginLeft: 8}}><kbd>N</kbd></span>
        </button>
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
            <div className={`nb-tag-row ${!filterTag ? "active" : ""}`}
                 onClick={() => setFilterTag(null)}>
              <span>All notes</span>
              <span className="count">{notes.length}</span>
            </div>
            {window.NOTEBOOK_TAGS.map(t => (
              <div key={t.id}
                   className={`nb-tag-row ${filterTag === t.id ? "active" : ""}`}
                   onClick={() => setFilterTag(filterTag === t.id ? null : t.id)}>
                <span className="tag-chip" style={{"--hue": t.hue}}>{t.label}</span>
                <span className="count">{tagCounts[t.id] || 0}</span>
              </div>
            ))}
          </div>

          <div className="nb-side-section">Bound to</div>
          <div className="nb-tag-list">
            <div className="nb-tag-row">
              <span>This raid</span>
              <span className="count">{notes.filter(n => n.binding?.raidId === "2026-05-12" || n.binding?.kind === "cohort").length}</span>
            </div>
            <div className="nb-tag-row">
              <span>Cohort scenarios</span>
              <span className="count">{notes.filter(n => n.binding?.kind === "cohort").length}</span>
            </div>
            <div className="nb-tag-row">
              <span>Free-floating</span>
              <span className="count">{notes.filter(n => !n.binding).length}</span>
            </div>
          </div>

          <div className="nb-meta-card">
            <p className="h-eyebrow">Storage</p>
            <div className="mono" style={{fontSize: 11, color: "var(--text-faint)", lineHeight: 1.6}}>
              {notes.length} entries · ~{Math.ceil(JSON.stringify(notes).length / 1024)} KB<br />
              browser localStorage<br />
              key <code>{NOTEBOOK_KEY}</code>
            </div>
          </div>
        </aside>

        <div className="notebook-main">
          {draftOpen && (
            <NoteDraft
              onSave={(d) => {
                const newNote = window.Notebook.add(d);
                update([newNote, ...notes]);
                setDraftOpen(false);
              }}
              onCancel={() => setDraftOpen(false)}
            />
          )}

          {visible.length === 0 && !draftOpen && (
            <div className="cohort-empty" style={{textAlign: "left", padding: "20px 22px"}}>
              <p className="h-eyebrow">No notes match</p>
              <p style={{margin: "8px 0 0"}}>
                Clear the filter, or press <kbd>N</kbd> to write something.
              </p>
            </div>
          )}

          <div className="note-list">
            {visible.map(n => (
              <NoteCard
                key={n.id}
                note={n}
                editing={editingId === n.id}
                onEdit={() => setEditingId(n.id)}
                onSave={(patch) => {
                  const next = notes.map(x => x.id === n.id ? {...x, ...patch} : x);
                  update(next);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
                onPin={() => update(notes.map(x => x.id === n.id ? {...x, pinned: !x.pinned} : x))}
                onDelete={() => update(notes.filter(x => x.id !== n.id))}
                onBindingClick={onBindingClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Note card ---------- */
const NoteCard = ({ note, editing, onEdit, onSave, onCancel, onPin, onDelete, onBindingClick }) => {
  const [text, setText] = useStateN(note.text);
  const [tags, setTags] = useStateN(note.tags);
  useEffectN(() => { setText(note.text); setTags(note.tags); }, [note.id, editing]);

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
          {window.NOTEBOOK_TAGS.map(t => (
            <span key={t.id}
                  className={`tag-chip ${tags.includes(t.id) ? "selected" : ""}`}
                  style={{"--hue": t.hue}}
                  onClick={() => setTags(tags.includes(t.id) ? tags.filter(x => x !== t.id) : [...tags, t.id])}>
              {t.label}
            </span>
          ))}
        </div>
        <div className="note-actions">
          <button className="btn ghost small" onClick={onCancel}>Cancel</button>
          <button className="btn primary small" onClick={() => onSave({text, tags})}>
            <Icon name="check" size={11} /> Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`note-card ${note.pinned ? "pinned" : ""}`}>
      <div className="note-head">
        <div className="note-meta">
          <span className="when">{note.createdAt}</span>
          {note.pinned && <span className="chip ember" style={{padding: "1px 7px", fontSize: 10}}>PINNED</span>}
          {note.binding && (
            <span className="binding" onClick={() => onBindingClick(note.binding)}>
              <Icon name={bindingIcon(note.binding.kind)} size={11} />
              {note.binding.label}
            </span>
          )}
          {(() => {
            // Surface observation status if this note led to one.
            const p = window.Observations && window.Observations.byNoteId
              ? window.Observations.byNoteId(note.id) : null;
            if (!p) return null;
            const label = p.status === "referenced" ? "Referenced in retro"
                       : p.status === "shared" ? "Shared as observation"
                       : "Withdrawn";
            const cls = p.status === "shared" ? "pending"
                     : p.status === "referenced" ? "included"
                     : "withdrawn";
            return (
              <span className={`note-proposed ${cls}`}
                    onClick={(e) => { e.stopPropagation(); window.__goRoute && window.__goRoute("observations"); }}
                    title={`Observation ${p.id} \u00b7 ${p.status}`}>
                <Icon name="upload" size={9} /> {label}
              </span>
            );
          })()}
        </div>
        <div className="note-controls">
          <button className="icon-btn"
                  onClick={() => window.Propose && window.Propose.open({
                    kind: note.tags.includes("thanks") ? "support" :
                          note.tags.includes("progression") ? "teamwork" : "celebration",
                    title: note.text.split("\n")[0].slice(0, 120),
                    description: note.text,
                    credits: [],
                    binding: note.binding,
                    fromNoteId: note.id,
                  })}
                  title="Share as an observation">
            <Icon name="upload" size={12} />
          </button>
          <button className="icon-btn" onClick={onPin} title={note.pinned ? "Unpin" : "Pin"}>
            <Icon name="sparkle" size={12} />
          </button>
          <button className="icon-btn" onClick={onEdit} title="Edit"><Icon name="cog" size={12} /></button>
          <button className="icon-btn" onClick={onDelete} title="Delete"><Icon name="close" size={12} /></button>
        </div>
      </div>
      <div className="note-body" onClick={onEdit}>{note.text}</div>
      {note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.map(tid => {
            const t = window.NOTEBOOK_TAGS.find(x => x.id === tid);
            if (!t) return null;
            return <span key={tid} className="tag-chip readonly" style={{"--hue": t.hue}}>{t.label}</span>;
          })}
        </div>
      )}
    </div>
  );
};

/* ---------- New-note draft (top of list) ---------- */
const NoteDraft = ({ onSave, onCancel }) => {
  const [text, setText] = useStateN("");
  const [tags, setTags] = useStateN([]);
  const taRef = useRefN(null);
  useEffectN(() => { taRef.current?.focus(); }, []);

  return (
    <div className="note-card editing draft">
      <p className="h-eyebrow" style={{marginBottom: 8}}>New note</p>
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Something you noticed, want to ask later, or remember…"
        rows={4}
      />
      <div className="note-tag-picker">
        {window.NOTEBOOK_TAGS.map(t => (
          <span key={t.id}
                className={`tag-chip ${tags.includes(t.id) ? "selected" : ""}`}
                style={{"--hue": t.hue}}
                onClick={() => setTags(tags.includes(t.id) ? tags.filter(x => x !== t.id) : [...tags, t.id])}>
            {t.label}
          </span>
        ))}
      </div>
      <div className="note-actions">
        <span className="faint mono" style={{fontSize: 10, marginRight: "auto"}}>
          stays local · binding optional
        </span>
        <button className="btn ghost small" onClick={onCancel}>Cancel</button>
        <button className="btn primary small"
                disabled={!text.trim()}
                style={{opacity: text.trim() ? 1 : 0.4}}
                onClick={() => text.trim() && onSave({text: text.trim(), tags})}>
          <Icon name="check" size={11} /> Save note
        </button>
      </div>
    </div>
  );
};

const bindingIcon = (kind) => ({
  cohort: "spark",
  raid: "raids",
  pull: "play",
  encounter: "book",
}[kind] || "folder");

window.NotebookPage = NotebookPage;
