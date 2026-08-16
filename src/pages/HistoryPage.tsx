import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { HistoryArchivesPanel } from "@/pages/history/HistoryArchivesPanel";
import { HistoryManualPanel } from "@/pages/history/HistoryManualPanel";
import { HistorySidebar } from "@/pages/history/HistorySidebar";
import { useHistoryPageState } from "@/pages/history/useHistoryPageState";

export function HistoryPage() {
  const s = useHistoryPageState();

  if (!s.active) return null;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <HistorySidebar section={s.section} onSectionChange={s.setSection} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-muted)]/10 px-4 py-3">
          {s.section === "archives" ? (
            <h2 className="text-lg font-medium">Archives</h2>
          ) : (
            <PageTitleWithInfo
              description={
                <>
                  Saisissez un montant par mois pour les périodes hors factures
                  dans l’app. Sur le graphique d’évolution du CA, ce montant{" "}
                  <strong>remplace</strong> la somme des factures pour ce mois.
                </>
              }
            >
              <h2 className="text-lg font-medium">CA manuel</h2>
            </PageTitleWithInfo>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {s.section === "archives" ? (
            <HistoryArchivesPanel
              navigate={s.navigate}
              archiveDocYearFilter={s.archiveDocYearFilter}
              setArchiveDocYearFilter={s.setArchiveDocYearFilter}
              currentCalendarYear={s.currentCalendarYear}
              globalNorm={s.globalNorm}
              clientById={s.clientById}
              fmt={s.fmt}
              invoices={s.invoices}
              quotes={s.quotes}
              purchaseOrders={s.purchaseOrders}
              manualEntries={s.manualEntries}
              archivedInvoicesFiltered={s.archivedInvoicesFiltered}
              archivedInvoicesDisplay={s.archivedInvoicesDisplay}
              archivedQuotesFiltered={s.archivedQuotesFiltered}
              archivedQuotesDisplay={s.archivedQuotesDisplay}
              archivedPurchaseOrdersFiltered={s.archivedPurchaseOrdersFiltered}
              archivedPurchaseOrdersDisplay={s.archivedPurchaseOrdersDisplay}
              manualPastYearsGrouped={s.manualPastYearsGrouped}
              editManualFromArchives={s.editManualFromArchives}
              deleteManual={s.deleteManual}
            />
          ) : (
            <HistoryManualPanel
              currency={s.currency}
              fmt={s.fmt}
              manualEntries={s.manualEntries}
              manualEntriesSearchFiltered={s.manualEntriesSearchFiltered}
              formYear={s.formYear}
              setFormYear={s.setFormYear}
              formMonth={s.formMonth}
              setFormMonth={s.setFormMonth}
              formAmount={s.formAmount}
              setFormAmount={s.setFormAmount}
              formNotes={s.formNotes}
              setFormNotes={s.setFormNotes}
              spreadYear={s.spreadYear}
              setSpreadYear={s.setSpreadYear}
              spreadTotal={s.spreadTotal}
              setSpreadTotal={s.setSpreadTotal}
              spreadBusy={s.spreadBusy}
              resetManualForm={s.resetManualForm}
              submitManualForm={s.submitManualForm}
              deleteManual={s.deleteManual}
              fillFormFromRow={s.fillFormFromRow}
              spreadAnnual={s.spreadAnnual}
            />
          )}
        </div>
      </div>
    </div>
  );
}
