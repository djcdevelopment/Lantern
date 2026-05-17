/* ============================================================
   SessionProvider — bootstrapped read-only archive snapshot
   ------------------------------------------------------------
   Loads the local archive once at startup via `api.bootstrap()`
   and exposes it synchronously to the whole app. Identity
   (`snapshot.player`) is resolved here too.
   ============================================================ */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, API_BASE, CLOUD_MODE } from "@/api";
import type { SessionSnapshot } from "@/api";

const SessionContext = createContext<SessionSnapshot | null>(null);

const LanternMark = () => (
  <svg
    width={22}
    height={22}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 21a5 5 0 0 0 5-5c0-3-2.2-3.6-2.2-6.5 0-1.8-1.4-3-2.8-4.5-.8 1.6-1.6 2.5-1.6 4 0 2.5-3.4 3-3.4 7a5 5 0 0 0 5 5Z" />
  </svg>
);

function BootSplash() {
  return (
    <div className="boot-splash">
      <div className="boot-mark">
        <LanternMark />
      </div>
      <span className="boot-label">lantern · reading the archive…</span>
    </div>
  );
}

function BootError({ message }: { message: string }) {
  return (
    <div className="boot-splash">
      <div className="boot-mark" style={{ animation: "none", color: "var(--bad)" }}>
        <LanternMark />
      </div>
      <span className="boot-label" style={{ color: "var(--text)" }}>
        Lantern can't reach its data.
      </span>
      <span
        className="boot-label"
        style={{ color: "var(--text-faint)", maxWidth: 420, textAlign: "center" }}
      >
        {CLOUD_MODE
          ? "The hosted archive failed to load."
          : `No response from the Lantern server at ${API_BASE}. Start it with `}
        {!CLOUD_MODE && <code>npm run dev</code>}
        {!CLOUD_MODE && " (runs the server + app together)."}
      </span>
      <span className="boot-label" style={{ color: "var(--text-mute)", fontSize: 11 }}>
        {message}
      </span>
    </div>
  );
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    api
      .bootstrap()
      .then((s) => {
        if (live) setSnapshot(s);
      })
      .catch((err: unknown) => {
        if (live) setError(String((err as Error)?.message ?? err));
      });
    return () => {
      live = false;
    };
  }, []);

  if (error) return <BootError message={error} />;
  if (!snapshot) return <BootSplash />;

  return (
    <SessionContext.Provider value={snapshot}>
      {children}
    </SessionContext.Provider>
  );
}

/** The bootstrapped session snapshot. Stable for the app's lifetime. */
export function useSession(): SessionSnapshot {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
