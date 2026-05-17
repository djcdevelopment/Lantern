/* Line icons, 16px default. Single-path SVGs drawn with currentColor. */

const PATHS = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z",
  raids: "M4 5h16M5 5v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5M9 9h6M9 13h6M9 17h4",
  replay: "M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4M10 9l6 3-6 3Z",
  ask: "M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-4 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z M8 10h8 M8 13h5",
  contribute: "M12 4v10 M7 9l5-5 5 5 M5 18h14",
  settings:
    "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z M19.4 13.7l1.6 1-1.8 3.1-1.9-.6a7.9 7.9 0 0 1-1.7 1l-.4 2h-3.6l-.4-2a7.9 7.9 0 0 1-1.7-1l-1.9.6-1.8-3.1 1.6-1a7.6 7.6 0 0 1 0-2l-1.6-1 1.8-3.1 1.9.6a7.9 7.9 0 0 1 1.7-1l.4-2h3.6l.4 2a7.9 7.9 0 0 1 1.7 1l1.9-.6 1.8 3.1-1.6 1a7.6 7.6 0 0 1 0 2Z",
  spark:
    "M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M5.6 18.4l2.1-2.1 M16.3 7.7l2.1-2.1",
  arrowR: "M5 12h14 M13 6l6 6-6 6",
  arrowL: "M19 12H5 M11 6l-6 6 6 6",
  chevR: "M9 6l6 6-6 6",
  chevD: "M6 9l6 6 6-6",
  play: "M6 4l14 8-14 8Z",
  pause: "M7 4h4v16H7Z M13 4h4v16h-4Z",
  flame:
    "M12 22a6 6 0 0 0 6-6c0-4-3-5-3-9 0-2-2-4-3-5-1 2-2 3-2 5 0 3-4 4-4 9a6 6 0 0 0 6 6Z M12 22a3 3 0 0 0 3-3c0-2-2-2-2-4l-1-1c-1 1-3 2-3 5a3 3 0 0 0 3 3Z",
  check: "M5 12l4 4 10-10",
  close: "M6 6l12 12 M18 6L6 18",
  plus: "M12 5v14 M5 12h14",
  search: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z M16 16l4 4",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z",
  lock: "M6 11V8a6 6 0 0 1 12 0v3 M5 11h14v10H5Z",
  upload: "M12 4v12 M7 9l5-5 5 5 M5 20h14",
  cpu: "M6 6h12v12H6Z M9 9h6v6H9Z M2 9h2 M2 15h2 M20 9h2 M20 15h2 M9 2v2 M15 2v2 M9 20v2 M15 20v2",
  book: "M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2Z M5 18a2 2 0 0 1 2-2h12",
  swap: "M4 7h14 M14 3l4 4-4 4 M20 17H6 M10 13l-4 4 4 4",
  skull:
    "M12 3a7 7 0 0 0-7 7v4l2 2v3h2v-2h2v2h2v-2h2v2h2v-3l2-2v-4a7 7 0 0 0-7-7Z M9 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z M15 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Z",
  sparkle:
    "M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4Z M19 16l.7 1.8L22 18l-2.3.7L19 20l-.7-1.5L16 18l2.3-.2Z",
  cog: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z M19.4 13.7l1.6 1-1.8 3.1-1.9-.6a7.9 7.9 0 0 1-1.7 1l-.4 2h-3.6l-.4-2a7.9 7.9 0 0 1-1.7-1l-1.9.6-1.8-3.1 1.6-1a7.6 7.6 0 0 1 0-2l-1.6-1 1.8-3.1 1.9.6a7.9 7.9 0 0 1 1.7-1l.4-2h3.6l.4 2a7.9 7.9 0 0 1 1.7 1l1.9-.6 1.8 3.1-1.6 1a7.6 7.6 0 0 1 0 2Z",
  folder: "M3 6h6l2 2h10v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z",
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
}

export function Icon({ name, size = 16, stroke = 1.6 }: IconProps) {
  const d = PATHS[name] ?? PATHS.spark;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
