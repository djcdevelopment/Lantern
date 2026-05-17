/* Small visual primitives reused across every surface. */

/** Sizes accepted by the avatar / spell-icon primitives. */
export type GlyphSize = "" | "sm" | "lg";

interface SpellIconProps {
  hue?: number;
  glyph?: string;
  size?: GlyphSize;
}

/** A runic glyph badge tinted by hue — used for moments and support. */
export function SpellIcon({ hue = 60, glyph, size = "" }: SpellIconProps) {
  return (
    <span className={`spell-icon ${size}`} style={{ "--hue": hue }}>
      <span className="runic">{glyph || "✦"}</span>
    </span>
  );
}

interface PAvatarProps {
  name: string;
  hue: number;
  size?: GlyphSize;
}

/** A player avatar — first initial on a hue-tinted disc. */
export function PAvatar({ name, hue, size = "" }: PAvatarProps) {
  return (
    <span className={`pavatar ${size}`} style={{ "--hue": hue }} title={name}>
      {(name || "?").slice(0, 1)}
    </span>
  );
}

/** The small lantern brand mark. */
export function BrandGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="ember-glow"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--ember)" }}
    >
      <path
        d="M12 21a5 5 0 0 0 5-5c0-3-2.2-3.6-2.2-6.5 0-1.8-1.4-3-2.8-4.5-.8 1.6-1.6 2.5-1.6 4 0 2.5-3.4 3-3.4 7a5 5 0 0 0 5 5Z"
        fill="oklch(0.55 0.13 45 / 0.4)"
      />
      <path
        d="M12 21a2.5 2.5 0 0 0 2.5-2.5c0-1.5-1.5-1.6-1.5-3l-1-1c-.8 1-2.5 1.7-2.5 4A2.5 2.5 0 0 0 12 21Z"
        fill="oklch(0.78 0.13 60)"
        stroke="none"
      />
    </svg>
  );
}
