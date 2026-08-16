import { NavLink, Outlet } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentSetupBanner } from "@/components/DocumentSetupBanner";
import { useDocumentModules } from "@/context/DocumentModulesContext";

const dot = "mr-2 inline-block h-2 w-2 rounded-full";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center rounded px-2 py-1.5 hover:bg-[var(--color-muted)]",
    isActive && "bg-[var(--color-muted)] font-medium",
  );

export function HomeLayout() {
  const {
    loading,
    purchaseOrdersEnabled,
    creditNotesEnabled,
    crmPipelineEnabled,
    recoveryAssistedEnabled,
    clientFollowupEnabled,
    projectsEnabled,
    stockManagerEnabled,
  } = useDocumentModules();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <aside className="relative z-0 w-52 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-card)] p-2 text-sm">
          <details open className="group mb-2">
            <summary className="flex cursor-pointer list-none items-center font-medium">
              <ChevronDown className="mr-1 h-4 w-4 group-open:rotate-0 -rotate-90 transition-transform" />
              Vue d&apos;ensemble
            </summary>
            <ul className="mt-1 space-y-0.5 pl-2">
              <li>
                <NavLink to="/home/dashboard" className={navLinkClass}>
                  <span className={cn(dot, "bg-emerald-500")} />
                  Tableau de bord
                </NavLink>
              </li>
              <li>
                <NavLink to="/home/reports" className={navLinkClass}>
                  <span className={cn(dot, "bg-red-500")} />
                  Rapports
                </NavLink>
              </li>
              {!loading && projectsEnabled ? (
                <li>
                  <NavLink to="/home/projects" className={navLinkClass}>
                    <span className={cn(dot, "bg-sky-500")} />
                    Projets
                  </NavLink>
                </li>
              ) : null}
              {!loading && stockManagerEnabled ? (
                <li>
                  <NavLink to="/home/stock" className={navLinkClass}>
                    <span className={cn(dot, "bg-lime-600")} />
                    Stock
                  </NavLink>
                </li>
              ) : null}
            </ul>
          </details>

          <details open className="group mb-2">
            <summary className="flex cursor-pointer list-none items-center font-medium">
              <ChevronDown className="mr-1 h-4 w-4 group-open:rotate-0 -rotate-90 transition-transform" />
              Documents
            </summary>
            <ul className="mt-1 space-y-0.5 pl-2">
              <li>
                <NavLink to="/home/quotes" className={navLinkClass}>
                  <span className={cn(dot, "bg-blue-700")} />
                  Devis
                </NavLink>
              </li>
              {!loading && purchaseOrdersEnabled ? (
                <li>
                  <NavLink to="/home/purchase-orders" className={navLinkClass}>
                    <span className={cn(dot, "bg-indigo-600")} />
                    Bons de commande
                  </NavLink>
                </li>
              ) : null}
              <li>
                <NavLink to="/home/invoices" className={navLinkClass}>
                  <span className={cn(dot, "bg-violet-600")} />
                  Factures
                </NavLink>
              </li>
              {!loading && creditNotesEnabled ? (
                <li>
                  <NavLink to="/home/credit-notes" className={navLinkClass}>
                    <span className={cn(dot, "bg-amber-600")} />
                    Avoirs
                  </NavLink>
                </li>
              ) : null}
            </ul>
          </details>

          {loading ||
          crmPipelineEnabled ||
          recoveryAssistedEnabled ||
          clientFollowupEnabled ? (
            <details open className="group mb-2">
              <summary className="flex cursor-pointer list-none items-center font-medium">
                <ChevronDown className="mr-1 h-4 w-4 group-open:rotate-0 -rotate-90 transition-transform" />
                Clients &amp; encaissements
              </summary>
              <ul className="mt-1 space-y-0.5 pl-2">
                {!loading && crmPipelineEnabled ? (
                  <li>
                    <NavLink to="/home/crm" className={navLinkClass}>
                      <span className={cn(dot, "bg-teal-500")} />
                      Pipeline CRM
                    </NavLink>
                  </li>
                ) : null}
                {!loading && clientFollowupEnabled ? (
                  <li>
                    <NavLink to="/home/client-followup" className={navLinkClass}>
                      <span className={cn(dot, "bg-cyan-500")} />
                      Suivi clients
                    </NavLink>
                  </li>
                ) : null}
                {!loading && recoveryAssistedEnabled ? (
                  <li>
                    <NavLink to="/home/recovery" className={navLinkClass}>
                      <span className={cn(dot, "bg-orange-500")} />
                      Recouvrement
                    </NavLink>
                  </li>
                ) : null}
              </ul>
            </details>
          ) : null}
        </aside>
        <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <DocumentSetupBanner />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
