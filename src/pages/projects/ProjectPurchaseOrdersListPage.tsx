import * as React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { DocumentModulePageGate } from "@/components/DocumentModulePageGate";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useProjectWorkspace } from "@/context/ProjectWorkspaceContext";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { makeCurrencyFormatter } from "@/pages/documentEditor/currency";
import { filterDocumentsByProjectId } from "@/pages/projects/projectWorkspaceFilters";

export function ProjectPurchaseOrdersListPage() {
  const { loading: modLoading, purchaseOrdersEnabled } = useDocumentModules();
  const { active } = useWorkspace();
  const { projectId } = useProjectWorkspace();
  const [orders, setOrders] = React.useState<api.Quote[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!active || !purchaseOrdersEnabled) return;
    setLoading(true);
    void api
      .listPurchaseOrders(active.id)
      .then((q) =>
        setOrders(filterDocumentsByProjectId(q, projectId).filter((x) => !x.archived)),
      )
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [active, projectId, purchaseOrdersEnabled]);

  const fmt = React.useMemo(
    () => makeCurrencyFormatter(active?.baseCurrency ?? "EUR"),
    [active?.baseCurrency],
  );

  const base = `/home/projects/${projectId}/purchase-orders`;

  return (
    <DocumentModulePageGate
      loading={modLoading}
      enabled={purchaseOrdersEnabled}
      redirectTo="/marketplace/documents"
      redirectToast="Activez « Bons de commande » dans Marketplace (onglet Documents)."
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] p-4">
          <h1 className="text-lg font-semibold">Bons de commande du projet</h1>
          <Button type="button" size="sm" className="gap-1" asChild>
            <Link to={`${base}/edit?new=1`}>
              <Plus className="h-4 w-4" aria-hidden />
              Nouveau bon de commande
            </Link>
          </Button>
        </div>
        <ul className="min-h-0 flex-1 list-none space-y-0.5 overflow-y-auto p-2 text-sm">
          {loading ? (
            <li className="px-2 py-4 text-[var(--color-muted-foreground)]">
              Chargement…
            </li>
          ) : orders.length === 0 ? (
            <li className="px-2 py-4 text-[var(--color-muted-foreground)]">
              Aucun bon de commande pour ce projet.
            </li>
          ) : (
            orders.map((q) => (
              <li key={q.id}>
                <Link
                  to={`${base}/edit?focus=${encodeURIComponent(q.id)}`}
                  className="block rounded px-2 py-2 hover:bg-[var(--color-muted)]"
                >
                  <span className="font-medium tabular-nums">{q.number}</span>
                  {q.title ? (
                    <span className="ml-2 text-[var(--color-muted-foreground)]">
                      {q.title}
                    </span>
                  ) : null}
                  <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
                    {q.issueDate.slice(0, 10)} · {fmt(q.total)} TTC
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </DocumentModulePageGate>
  );
}
