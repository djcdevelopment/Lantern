/* Small formatting helpers shared across surfaces. */

/** Seconds → "M:SS" (e.g. 272 → "4:32"). */
export function fmtClock(t: number): string {
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

/** Seconds → "MM:SS" with a zero-padded minute (e.g. 272 → "04:32"). */
export function fmtClockPad(t: number): string {
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** Seconds → "H:MM:SS" when over an hour, else "MM:SS". */
export function fmtClockLong(t: number): string {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** CSS custom-property reference for a class color, e.g. "DK" → var(--c-dk). */
export function classColorVar(cls: string): string {
  return `var(--c-${cls.toLowerCase().replace(/\s/g, "")}, var(--text-dim))`;
}
