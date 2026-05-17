/* <Term> — glossary hover for the coordination vocabulary. */

import { useState, type ReactNode } from "react";
import { useSession } from "@/state/session";

interface TermProps {
  /** Glossary key, e.g. "cohort", "support chain". */
  k: string;
  children?: ReactNode;
}

export function Term({ k, children }: TermProps) {
  const { glossary } = useSession();
  const def = glossary[k];
  const [open, setOpen] = useState(false);

  if (!def) return <span>{children}</span>;

  return (
    <span
      className="term-anchor"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      <span className="term-text">{children ?? def.label}</span>
      {open && (
        <span className="term-tooltip" role="tooltip">
          <span className="term-label">{def.label}</span>
          <span className="term-short">{def.short}</span>
          {def.long && <span className="term-long">{def.long}</span>}
          <span className="term-foot">
            Glossary · part of the workshop vocabulary
          </span>
        </span>
      )}
    </span>
  );
}
