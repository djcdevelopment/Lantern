/* global React, window */
// Quick-capture note modal — opens with N or from inline "Add note" buttons.
// Saves directly to the Notebook. Smaller and faster than navigating to /notebook.

const { useState: useStateQ, useEffect: useEffectQ, useRef: useRefQ } = React;

const QuickNoteModal = ({ seed, onClose }) => {
  const [text, setText] = useStateQ(seed?.text || "");
  const [tags, setTags] = useStateQ(seed?.tags || []);
  const taRef = useRefQ(null);

  useEffectQ(() => { setTimeout(() => taRef.current?.focus(), 30); }, []);

  // Cmd/Ctrl+Enter to save.
  useEffectQ(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (text.trim()) save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [text, tags, seed]);

  const save = () => {
    window.Notebook.add({
      text: text.trim(),
      tags,
      binding: seed?.binding || null,
    });
    onClose();
  };

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="quicknote-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qn-head">
          <div>
            <p className="h-eyebrow" style={{margin: 0}}>New note · local-only</p>
            <h2 className="propose-title" style={{fontSize: 18}}>The bench notebook.</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={14} /></button>
        </div>

        {seed?.binding && (
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
          {window.NOTEBOOK_TAGS.map(t => (
            <span key={t.id}
                  className={`tag-chip ${tags.includes(t.id) ? "selected" : ""}`}
                  style={{"--hue": t.hue}}
                  onClick={() => setTags(tags.includes(t.id) ? tags.filter(x => x !== t.id) : [...tags, t.id])}>
              {t.label}
            </span>
          ))}
        </div>

        <div className="qn-foot">
          <span className="faint mono" style={{fontSize: 10}}>
            stays local · <kbd>⌘</kbd> <kbd>↵</kbd> to save
          </span>
          <button className="btn ghost small" onClick={onClose}>Cancel</button>
          <button className="btn primary small"
                  disabled={!text.trim()}
                  style={{opacity: text.trim() ? 1 : 0.4}}
                  onClick={save}>
            <Icon name="check" size={11} /> Save note
          </button>
        </div>
      </div>
    </div>
  );
};

const bindingIco = (kind) => ({
  cohort: "spark", raid: "raids", pull: "play", encounter: "book",
}[kind] || "folder");

// Global opener.
window.QuickNote = { open: () => console.warn("QuickNote modal not mounted") };

window.QuickNoteModal = QuickNoteModal;
