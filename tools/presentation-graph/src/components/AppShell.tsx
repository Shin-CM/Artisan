import { ExternalLink, MonitorPlay, Network } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `pg-nav__link${isActive ? " pg-nav__link--active" : ""}`;

export function AppShell() {
  return (
    <div className="pg-root">
      <header className="pg-header">
        <div className="pg-header__brand">
          <Network aria-hidden className="pg-header__icon" size={22} />
          <span className="pg-header__title">Graphe Artisan</span>
        </div>
        <nav className="pg-nav" aria-label="Vues">
          <NavLink to="/pitch" className={navCls} end>
            <MonitorPlay size={18} aria-hidden />
            Présentation
          </NavLink>
          <NavLink to="/tech" className={navCls}>
            <ExternalLink size={18} aria-hidden />
            Technique
          </NavLink>
        </nav>
      </header>
      <main className="pg-main">
        <Outlet />
      </main>
    </div>
  );
}
