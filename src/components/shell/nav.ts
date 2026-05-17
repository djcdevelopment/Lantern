import type { IconName } from "../Icon";

/** A primary-navigation entry. */
export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  to: string;
  /** Number key (1–8) that jumps to this route. */
  key: string;
  /** Static badge (live badges are computed in the Sidebar). */
  badge?: string;
}

/** The "Workbench" group — the live raid-review workflow. */
export const NAV_PRIMARY: NavItem[] = [
  { id: "home", label: "Home", icon: "home", to: "/", key: "1" },
  { id: "raids", label: "Raids", icon: "raids", to: "/raids", key: "2", badge: "47" },
  { id: "replay", label: "Replay", icon: "replay", to: "/replay", key: "3" },
  { id: "ask", label: "Workshop", icon: "ask", to: "/ask", key: "4" },
];

/** The "Memory" group — what the player authors and keeps. */
export const NAV_MEMORY: NavItem[] = [
  { id: "notebook", label: "Notebook", icon: "book", to: "/notebook", key: "7" },
  { id: "observations", label: "Observations", icon: "sparkle", to: "/observations", key: "8" },
  { id: "contribute", label: "Contribute", icon: "contribute", to: "/contribute", key: "5" },
  { id: "settings", label: "Settings", icon: "settings", to: "/settings", key: "6" },
];

export const NAV_ALL: NavItem[] = [...NAV_PRIMARY, ...NAV_MEMORY];

/** Number-key → route map for the global keyboard shortcuts. */
export const KEY_ROUTES: Record<string, string> = Object.fromEntries(
  NAV_ALL.map((n) => [n.key, n.to]),
);
