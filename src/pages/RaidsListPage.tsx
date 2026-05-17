import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { useSession } from "@/state/session";

export function RaidsListPage() {
  const navigate = useNavigate();
  const { raidHistory: raids } = useSession();

  return (
    <div className="page">
      <div style={{ marginBottom: 24 }}>
        <p className="h-eyebrow">Local archive · 47 raids since 2025-08-04</p>
        <h1 className="h-display">Your raids.</h1>
        <p className="muted" style={{ maxWidth: 640, marginTop: 8 }}>
          Every raid you've parsed on this machine. Newest first. Click any raid to open the player-first review.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button className="btn">All raids · {raids.length}</button>
        <button className="btn ghost">Heroic only</button>
        <button className="btn ghost">Progression nights</button>
        <button className="btn ghost">Where I role-swapped</button>
        <div style={{ flex: 1 }}></div>
        <button className="btn ghost">
          <Icon name="search" size={13} /> Find moment
        </button>
      </div>

      <div className="raid-list">
        {raids.map((r) => (
          <div key={r.id} className="raid-row" onClick={() => navigate("/raids/2026-05-12")}>
            <div className="date">
              {r.day.toUpperCase()}
              <span className="day">{r.date}</span>
            </div>
            <div>
              <div className="title">{r.title}</div>
              <div className="bosses">{r.bosses}</div>
            </div>
            <div className="stats">
              <span>
                {r.deaths === 0 ? "no deaths" : <><b>{r.deaths}</b> death{r.deaths !== 1 && "s"}</>}
              </span>
              {r.swap && <span className="chip ember" style={{ padding: "1px 8px" }}>{r.swap}</span>}
              {r.contributed
                ? <span style={{ color: "var(--good)" }}>● contributed</span>
                : <span style={{ color: "var(--ember)" }}>● not yet shared</span>}
            </div>
            <Icon name="chevR" size={14} />
          </div>
        ))}
      </div>
    </div>
  );
}
