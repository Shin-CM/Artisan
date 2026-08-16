import * as React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useProjectWorkspace } from "@/context/ProjectWorkspaceContext";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { makeCurrencyFormatter } from "@/pages/documentEditor/currency";
import { filterDocumentsByProjectId } from "@/pages/projects/projectWorkspaceFilters";

export function ProjectInvoicesListPage() {
  const { active } = useWorkspace();
  const { projectId } = useProjectWorkspace();
  const [invoices, setInvoices] = React.useState<api.Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!active) return;
    setLoading(true);
    void api
      .listInvoices(active.id)
      .then((list) => {
        const open = list.filter(
          (i) => !i.archived && (i.documentKind ?? "invoice") === "invoice",
        );
        setInvoices(filterDocumentsByProjectId(open, projectId));
      })
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [active, projectId]);

  const fmt = React.useMemo(
    () => makeCurrencyFormatter(active?.baseCurrency ?? "EUR"),
    [active?.baseCurrency],
  );

  const base = `/home/projects/${projectId}/invoices`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] p-4">
        <h1 className="text-lg font-semibold">Factures du projet</h1>
        <Button type="button" size="sm" className="gap-1" asChild>
          <Link to={`${base}/edit?new=1`}>
            <Plus className="h-4 w-4" aria-hidden />
            Nouvelle facture
          </Link>
        </Button>
      </div>
      <ul className="min-h-0 flex-1 list-none space-y-0.5 overflow-y-auto p-2 text-sm">
        {loading ? (
          <li className="px-2 py-4 text-[var(--color-muted-foreground)]">
            Chargement…
          </li>
        ) : invoices.length === 0 ? (
          <li className="px-2 py-4 text-[var(--color-muted-foreground)]">
            Aucune facture pour ce projet.
          </li>
        ) : (
          invoices.map((inv) => (
            <li key={inv.id}>
              <Link
                to={`${base}/edit?focus=${encodeURIComponent(inv.id)}`}
                className="block rounded px-2 py-2 hover:bg-[var(--color-muted)]"
              >
                <span className="font-medium tabular-nums">{inv.number}</span>
                <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
                  {inv.issueDate.slice(0, 10)} · {fmt(inv.total)} TTC
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
