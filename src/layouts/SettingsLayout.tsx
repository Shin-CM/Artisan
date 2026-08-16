import { NavLink, Outlet } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import {
  isClientFollowupEnabledForWorkspace,
  isLocalTabletApiEnabledForWorkspace,
} from "@/lib/marketplaceModules";
import {
  Building2,
  Calendar,
  ChevronDown,
  FileText,
  Palette,
  Tablet,
  UserRoundSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded px-2 py-1.5 hover:bg-[var(--color-muted)]",
    isActive && "bg-[var(--color-muted)] font-medium",
  );

export function SettingsLayout() {
  const { plugins, loading: pluginsLoading } = useDocumentModules();
  const showLocalTabletApi =
    !pluginsLoading && isLocalTabletApiEnabledForWorkspace(plugins);
  const showClientFollowupAppsNav =
    !pluginsLoading && isClientFollowupEnabledForWorkspace(plugins);
  const showPluginsSection =
    !pluginsLoading && (showLocalTabletApi || showClientFollowupAppsNav);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <aside className="w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-card)] p-2 text-sm">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Paramètres
          </p>
          <nav className="space-y-2">
            <details open className="group">
              <summary className="flex cursor-pointer list-none items-center rounded px-2 py-1 text-xs font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/60">
                <ChevronDown className="mr-1 h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-0 -rotate-90" />
                Général
              </summary>
              <ul className="mt-1 space-y-0.5 pl-1">
                <li>
                  <NavLink
                    to="/settings/workspace"
                    className={navLinkClass}
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
                    Espace de travail
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/settings/calendar" className={navLinkClass}>
                    <Calendar className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
                    Calendrier
                  </NavLink>
                </li>
              </ul>
            </details>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center rounded px-2 py-1 text-xs font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/60">
                <ChevronDown className="mr-1 h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-0 -rotate-90" />
                Design
              </summary>
              <ul className="mt-1 space-y-0.5 pl-1">
                <li>
                  <NavLink to="/settings/branding" className={navLinkClass}>
                    <Palette className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
                    Branding
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/settings/template" className={navLinkClass}>
                    <FileText className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
                    Mise en page PDF
                  </NavLink>
                </li>
              </ul>
            </details>
            {showPluginsSection ? (
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center rounded px-2 py-1 text-xs font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/60">
                  <ChevronDown className="mr-1 h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-0 -rotate-90" />
                  Plugins
                </summary>
                <ul className="mt-1 space-y-0.5 pl-1">
                  {showLocalTabletApi ? (
                    <li>
                      <NavLink to="/settings/local-api" className={navLinkClass}>
                        <Tablet className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
                        API tablette
                      </NavLink>
                    </li>
                  ) : null}
                  {showClientFollowupAppsNav ? (
                    <li>
                      <NavLink
                        to="/settings/client-followup-apps"
                        className={navLinkClass}
                      >
                        <UserRoundSearch className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
                        Suivi clients — apps
                      </NavLink>
                    </li>
                  ) : null}
                </ul>
              </details>
            ) : null}
          </nav>
        </aside>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
