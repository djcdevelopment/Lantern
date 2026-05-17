import type { PersistenceAdapter } from "../types";

/**
 * Browser localStorage binding of the PersistenceAdapter contract.
 * Everything is namespaced under `campfire.*` (the project's
 * original codename) so existing prototype state migrates cleanly.
 *
 * A desktop build swaps this for a file- or SQLite-backed adapter;
 * nothing else changes — see CONTRACTS.md.
 */
export const localStoragePersistence: PersistenceAdapter = {
  read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota / private-mode — silently drop, prototype is best-effort */
    }
  },
};
