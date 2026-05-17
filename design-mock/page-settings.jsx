/* global React, window */

const { useState: useStateS } = React;

const SettingsPage = () => {
  const groups = window.SETTINGS_GROUPS;
  const [active, setActive] = useStateS(groups[0].id);
  const group = groups.find(g => g.id === active);

  const [toggles, setToggles] = useStateS({});

  return (
    <div className="page">
      <div style={{marginBottom: 24}}>
        <p className="h-eyebrow">Local-first tooling</p>
        <h1 className="h-display">Settings.</h1>
      </div>

      <div className="settings-grid">
        <div>
          <div className="nav">
            {groups.map(g => (
              <div key={g.id} className={`item ${g.id === active ? "active" : ""}`}
                   onClick={() => setActive(g.id)}>
                {g.title}
              </div>
            ))}
            <div className="divider"></div>
            <div className="item">Keybindings</div>
            <div className="item">Appearance</div>
            <div className="item">About</div>
          </div>
        </div>

        <div>
          <h2 className="h1" style={{marginBottom: 14, fontStyle: "italic"}}>{group.title}</h2>
          <div>
            {group.items.map((it, i) => (
              <div className="setting-row" key={i}>
                <div>
                  <div className="label">{it.label}</div>
                  <div className="desc">{it.desc}</div>
                </div>
                <div className="row" style={{gap: 12, alignItems: "center"}}>
                  {it.value && (
                    it.code
                      ? <code>{it.value}</code>
                      : <span className="faint mono" style={{fontSize: 12}}>{it.value}</span>
                  )}
                  {"toggle" in it && (
                    <div className={`toggle ${toggles[`${group.id}-${i}`] ? "on" : ""}`}
                         onClick={() => setToggles({...toggles, [`${group.id}-${i}`]: !toggles[`${group.id}-${i}`]})}></div>
                  )}
                  {it.state === "ok" && !("toggle" in it) && (
                    <span className="chip"><span className="dot" style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "var(--good)", boxShadow: "0 0 4px var(--good)",
                    }}></span>OK</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

window.SettingsPage = SettingsPage;
