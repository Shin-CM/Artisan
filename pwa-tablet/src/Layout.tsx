import { NavLink, Outlet } from "react-router-dom";
import { LogOut, Users, FileText } from "lucide-react";
import { clearStoredAuth } from "./api";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-800"
  }`;

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <span className="text-sm font-semibold tracking-tight text-sky-400">
            Artisan
          </span>
          <nav className="flex items-center gap-1">
            <NavLink to="/clients" className={navCls}>
              <Users className="h-4 w-4 shrink-0" />
              Clients
            </NavLink>
            <NavLink to="/quotes" className={navCls}>
              <FileText className="h-4 w-4 shrink-0" />
              Devis
            </NavLink>
            <button
              type="button"
              className="ml-1 flex items-center gap-1 rounded-lg px-2 py-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              title="Déconnexion"
              onClick={() => {
                clearStoredAuth();
                window.location.href = "/login";
              }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
