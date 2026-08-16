import type { NavigateFunction } from "react-router-dom";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { monthLabel, type ArchiveDocYearFilter, type ManualPastYearsGrouped } from "./historyUtils";

type Fmt = (n: number) => string;

export function HistoryArchivesPanel({
  navigate,
  archiveDocYearFilter,
  setArchiveDocYearFilter,
  currentCalendarYear,
  globalNorm,
  clientById,
  fmt,
  invoices,
  quotes,
  purchaseOrders,
  manualEntries,
  archivedInvoicesFiltered,
  archivedInvoicesDisplay,
  archivedQuotesFiltered,
  archivedQuotesDisplay,
  archivedPurchaseOrdersFiltered,
  archivedPurchaseOrdersDisplay,
  manualPastYearsGrouped,
  editManualFromArchives,
  deleteManual,
}: {
  navigate: NavigateFunction;
  archiveDocYearFilter: ArchiveDocYearFilter;
  setArchiveDocYearFilter: (v: ArchiveDocYearFilter) => void;
  currentCalendarYear: number;
  globalNorm: string;
  clientById: Map<string, api.Client>;
  fmt: Fmt;
  invoices: api.Invoice[];
  quotes: api.Quote[];
  purchaseOrders: api.Quote[];
  manualEntries: api.ManualRevenueEntry[];
  archivedInvoicesFiltered: api.Invoice[];
  archivedInvoicesDisplay: api.Invoice[];
  archivedQuotesFiltered: api.Quote[];
  archivedQuotesDisplay: api.Quote[];
  archivedPurchaseOrdersFiltered: api.Quote[];
  archivedPurchaseOrdersDisplay: api.Quote[];
  manualPastYearsGrouped: ManualPastYearsGrouped;
  editManualFromArchives: (row: api.ManualRevenueEntry) => void;
  deleteManual: (id: string) => void | Promise<void>;
}) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--color-muted-foreground)]">
          Période affichée
        </span>
        <div className="inline-flex rounded-md border border-[var(--color-border)] p-0.5">
          <Button
            type="button"
            size="sm"
            variant={archiveDocYearFilter === "all" ? "secondary" : "ghost"}
            className="h-8 rounded-sm px-3 text-xs"
            onClick={() => setArchiveDocYearFilter("all")}
          >
            Toutes les dates
          </Button>
          <Button
            type="button"
            size="sm"
            variant={
              archiveDocYearFilter === "past_years" ? "secondary" : "ghost"
            }
            className="h-8 rounded-sm px-3 text-xs"
            onClick={() => setArchiveDocYearFilter("past_years")}
            title={`Année d’émission strictement avant ${currentCalendarYear}`}
          >
            Années passées uniquement
          </Button>
        </div>
        {archiveDocYearFilter === "past_years" ? (
          <span className="text-xs text-[var(--color-muted-foreground)]">
            Année d’émission strictement antérieure à {currentCalendarYear}
          </span>
        ) : null}
      </div>

      <section className="mb-8">
        <h3 className="mb-2 text-sm font-medium">Factures et avoirs archivés</h3>
        {archivedInvoicesDisplay.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {globalNorm && archivedInvoicesFiltered.length > 0
              ? "Aucun document ne correspond à la recherche."
              : invoices.length === 0
                ? "Aucune facture ni avoir archivé."
                : archiveDocYearFilter === "past_years"
                  ? `Aucun document dont l’année d’émission est antérieure à ${currentCalendarYear}.`
                  : "Aucune facture ni avoir archivé."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/20 text-left text-xs text-[var(--color-muted-foreground)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Numéro</th>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Statut</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                  <th className="w-28 px-3 py-2 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {archivedInvoicesDisplay.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                      {(inv.documentKind ?? "invoice") === "credit_note"
                        ? "Avoir"
                        : "Facture"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{inv.number}</td>
                    <td className="px-3 py-2">
                      {(inv.clientId && clientById.get(inv.clientId)?.name) ||
                        "—"}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                      {inv.issueDate.slice(0, 10)}
                    </td>
                    <td className="px-3 py-2">{inv.status}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmt(inv.total)}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() =>
                          void navigate(
                            (inv.documentKind ?? "invoice") === "credit_note"
                              ? `/home/credit-notes?focus=${inv.id}`
                              : `/home/invoices?focus=${inv.id}`,
                          )
                        }
                      >
                        Ouvrir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium">Devis archivés</h3>
        {archivedQuotesDisplay.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {globalNorm && archivedQuotesFiltered.length > 0
              ? "Aucun devis archivé ne correspond à la recherche."
              : quotes.length === 0
                ? "Aucun devis archivé."
                : archiveDocYearFilter === "past_years"
                  ? `Aucun devis archivé dont l’année d’émission est antérieure à ${currentCalendarYear}.`
                  : "Aucun devis archivé."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/20 text-left text-xs text-[var(--color-muted-foreground)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Référence</th>
                  <th className="px-3 py-2 font-medium">Intitulé</th>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Statut</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                  <th className="w-28 px-3 py-2 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {archivedQuotesDisplay.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{q.number}</td>
                    <td className="max-w-[200px] truncate px-3 py-2">
                      {q.title?.trim() || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {(q.clientId && clientById.get(q.clientId)?.name) || "—"}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                      {q.issueDate.slice(0, 10)}
                    </td>
                    <td className="px-3 py-2">{q.status}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmt(q.total)}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => void navigate(`/home/quotes?focus=${q.id}`)}
                      >
                        Ouvrir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h3 className="mb-2 text-sm font-medium">Bons de commande archivés</h3>
        {archivedPurchaseOrdersDisplay.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {globalNorm && archivedPurchaseOrdersFiltered.length > 0
              ? "Aucun bon de commande archivé ne correspond à la recherche."
              : purchaseOrders.length === 0
                ? "Aucun bon de commande archivé."
                : archiveDocYearFilter === "past_years"
                  ? `Aucun bon de commande archivé dont l’année d’émission est antérieure à ${currentCalendarYear}.`
                  : "Aucun bon de commande archivé."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/20 text-left text-xs text-[var(--color-muted-foreground)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Référence</th>
                  <th className="px-3 py-2 font-medium">Intitulé</th>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Statut</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                  <th className="w-28 px-3 py-2 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {archivedPurchaseOrdersDisplay.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{q.number}</td>
                    <td className="max-w-[200px] truncate px-3 py-2">
                      {q.title?.trim() || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {(q.clientId && clientById.get(q.clientId)?.name) || "—"}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                      {q.issueDate.slice(0, 10)}
                    </td>
                    <td className="px-3 py-2">{q.status}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmt(q.total)}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() =>
                          void navigate(`/home/purchase-orders?focus=${q.id}`)
                        }
                      >
                        Ouvrir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h3 className="mb-2 text-sm font-medium">CA saisi manuellement</h3>
        {manualPastYearsGrouped.yearsDesc.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {globalNorm &&
            manualEntries.some((e) => e.year < currentCalendarYear)
              ? "Aucune saisie manuelle ne correspond à la recherche."
              : "Aucune saisie manuelle pour une année précédente."}
          </p>
        ) : (
          <div className="space-y-8">
            {manualPastYearsGrouped.yearsDesc.map((y) => {
              const rows = manualPastYearsGrouped.byYear.get(y) ?? [];
              return (
                <div key={y}>
                  <h4 className="mb-2 border-b border-[var(--color-border)] pb-1 text-sm font-semibold tabular-nums">
                    {y}
                  </h4>
                  <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
                    <table className="w-full min-w-[480px] text-sm">
                      <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/20 text-left text-xs text-[var(--color-muted-foreground)]">
                        <tr>
                          <th className="px-3 py-2 font-medium">Mois</th>
                          <th className="px-3 py-2 font-medium text-right">
                            Montant TTC
                          </th>
                          <th className="px-3 py-2 font-medium">Notes</th>
                          <th className="w-36 px-3 py-2 font-medium"> </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-[var(--color-border)] last:border-0"
                          >
                            <td className="px-3 py-2">
                              {monthLabel(row.month)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {fmt(row.amount)}
                            </td>
                            <td className="max-w-[220px] truncate px-3 py-2 text-[var(--color-muted-foreground)]">
                              {row.notes || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              <div className="flex flex-row flex-nowrap items-center gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 shrink-0"
                                  onClick={() => editManualFromArchives(row)}
                                >
                                  Modifier
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 shrink-0"
                                  onClick={() => void deleteManual(row.id)}
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
