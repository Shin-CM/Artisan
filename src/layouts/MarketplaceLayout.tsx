import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex items-center border-b-2 px-3 py-2.5 text-sm transition-colors",
    isActive
      ? "border-[var(--color-foreground)] font-medium text-[var(--color-foreground)]"
      : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
  );

export function MarketplaceLayout() {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
      <nav
        className="mb-4 flex w-full min-w-0 shrink-0 flex-wrap gap-x-1 gap-y-1 border-b border-[var(--color-border)]"
        aria-label="Catégories marketplace"
      >
        <NavLink to="/marketplace" end className={tabClass}>
          Découvrir
        </NavLink>
        <NavLink to="/marketplace/documents" className={tabClass}>
          Documents
        </NavLink>
        <NavLink to="/marketplace/donnees" className={tabClass}>
          Données
        </NavLink>
        <NavLink to="/marketplace/stock" className={tabClass}>
          Stock
        </NavLink>
        <NavLink to="/marketplace/clients" className={tabClass}>
          Clients
        </NavLink>
        <NavLink to="/marketplace/integrations" className={tabClass}>
          Intégrations
        </NavLink>
        <NavLink to="/marketplace/reports" className={tabClass}>
          Rapports & exports
        </NavLink>
        <NavLink to="/marketplace/polices" className={tabClass}>
          Polices & typographie
        </NavLink>
        <NavLink to="/marketplace/sur-mesure" className={tabClass}>
          Sur mesure
        </NavLink>
      </nav>
      <div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
}
