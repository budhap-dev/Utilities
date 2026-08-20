import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { TOOLS, GROUPS, searchTools } from '../registry';
import { Wrench, Home } from './Icons';

export default function Sidebar({ collapsed }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => searchTools(q), [q]);

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Wrench width={16} height={16} />
        </div>
        <div>
          <div className="sidebar__title">DevKit</div>
          <div className="sidebar__subtitle">Developer utilities</div>
        </div>
      </div>
      {!collapsed && (
        <div className="sidebar__search">
          <input
            className="input input--full"
            placeholder="Filter tools…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Filter tools"
          />
        </div>
      )}
      <nav className="sidebar__nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`} title="Home">
          <Home />
          <span>Home</span>
        </NavLink>
        {GROUPS.map((group) => {
          const items = filtered.filter((t) => t.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className="sidebar__group">
              <div className="sidebar__group-title">{group}</div>
              {items.map((t) => {
                const Icon = t.icon;
                return (
                  <NavLink
                    key={t.id}
                    to={`/tools/${t.id}`}
                    className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
                    title={t.name}
                  >
                    <Icon />
                    <span>{t.name}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
        {!filtered.length && <div className="empty-state">No tools match “{q}”</div>}
      </nav>
      <div className="sidebar__footer">{TOOLS.length} tools · 100% offline</div>
    </aside>
  );
}
