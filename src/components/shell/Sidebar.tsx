/* Left navigation rail + player card. */

import { NavLink } from "react-router-dom";
import { Icon } from "../Icon";
import { useSession } from "@/state/session";
import { useNotebook, useObservations } from "@/state/memory";
import { NAV_MEMORY, NAV_PRIMARY, type NavItem } from "./nav";

function NavRow({ item, badge }: { item: NavItem; badge: string | null }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
    >
      <span className="ico">
        <Icon name={item.icon} />
      </span>
      <span>{item.label}</span>
      {badge ? (
        <span className={`badge ${item.badge ? "" : "live"}`}>{badge}</span>
      ) : (
        <span className="key">{item.key}</span>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { player } = useSession();
  const { notes } = useNotebook();
  const { observations } = useObservations();

  const noteCount = notes.length;
  const obsShared = observations.filter((o) => o.status === "shared").length;

  const liveBadge: Record<string, string | null> = {
    notebook: noteCount > 0 ? String(noteCount) : null,
    observations: obsShared > 0 ? String(obsShared) : null,
  };

  return (
    <aside className="sidebar">
      <div className="nav-section">Workbench</div>
      {NAV_PRIMARY.map((n) => (
        <NavRow key={n.id} item={n} badge={n.badge ?? null} />
      ))}

      <div className="nav-section">Memory</div>
      {NAV_MEMORY.map((n) => (
        <NavRow key={n.id} item={n} badge={liveBadge[n.id] ?? null} />
      ))}

      <div className="player-card">
        <div className="avatar"></div>
        <div className="meta">
          <span className="name">{player.name}</span>
          <span className="sub">
            {player.spec} {player.class} · {player.realm}
          </span>
        </div>
      </div>
    </aside>
  );
}
