import { QuickClientModal } from "@/components/QuickClientModal";
import { QuickArticleModal } from "@/components/QuickArticleModal";
import { DiscountPresetsModal } from "@/components/DiscountPresetsModal";
import { QuoteTaxRatesModal } from "@/components/QuoteTaxRatesModal";
import { InvoicesSidebar } from "@/pages/documentEditor/InvoicesSidebar";
import { InvoicesEditorCanvas } from "@/pages/documentEditor/invoices/InvoicesEditorCanvas";
import { emptyInvoiceLine } from "@/pages/documentEditor/editableLineTypes";
import { normalizeLineBillingMode, quantityDefaultForMode } from "@/lib/lineBilling";
import { applyVariantToLine } from "@/lib/articleOptions";
import { useInvoicesPage } from "@/pages/documentEditor/invoices/useInvoicesPage";

type InvoicesPageVm = ReturnType<typeof useInvoicesPage>;

export function InvoicesPageView(vm: InvoicesPageVm) {
  const {
    documentKind,
    docLabel,
    active,
    invoicesForSidebar,
    sel,
    setSel,
    fmt,
    creditedInvoiceOptions,
    creditedInvoiceId,
    setCreditedInvoiceId,
    invoicePrefs,
    customRefDraft,
    setCustomRefDraft,
    clientId,
    setClientId,
    clientOptions,
    selectedInvoiceClient,
    currency,
    setQuickClientOpen,
    quickArticleLineRef,
    setQuickArticleOpen,
    status,
    setStatus,
    issueDate,
    setIssueDate,
    dueDate,
    setDueDate,
    amountPaid,
    setAmountPaid,
    lineEntryMode,
    setLineEntryMode,
    taxExempt,
    setTaxExempt,
    setTaxRatesModalOpen,
    documentInputPrefs,
    lines,
    updateLine,
    removeLine,
    articles,
    categories,
    articleById,
    taxRates,
    quotes,
    quotesFiltered,
    quoteListFilter,
    setQuoteListFilter,
    clientById,
    importWholeQuote,
    setLines,
    lineDefaultTaxRate,
    discountPresets,
    discountPresetSelectKey,
    discountKind,
    setDiscountKind,
    discountValue,
    setDiscountValue,
    discountLabel,
    setDiscountLabel,
    setDiscountPresetsModalOpen,
    setDiscountPresetSelectKey,
    totals,
    discountBefore,
    remaining,
    complements,
    setComplements,
    snippets,
    notes,
    setNotes,
    pdfTemplateVariant,
    setPdfTemplateVariant,
    docLayout,
    pdfLoading,
    canUseEditor,
    contentLocked,
    handleSave,
    previewInvoicePdf,
    exportInvoicePdf,
    setInvoiceArchived,
    handleDeleteInvoice,
    invoiceDocumentActions,
    handleInvoiceDocumentAction,
    projectsEnabled,
    projectId,
    setProjectId,
    projectOptions,
    lockedProjectId,
    projectLockedLabel,
    quickClientOpen,
    load,
    quickArticleOpen,
    taxRatesModalOpen,
    discountPresetsModalOpen,
    referenceHeading,
  } = vm;
  if (!active) return null;

  return (
    <div className="flex h-full min-h-0">
      <InvoicesSidebar
        invoices={invoicesForSidebar}
        selectedId={sel?.id}
        fmt={fmt}
        onNew={() => setSel(null)}
        onSelect={setSel}
        sidebarTitle={docLabel + "s"}
      />
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <InvoicesEditorCanvas
          sel={sel}
          invoicePrefs={invoicePrefs}
          documentKind={documentKind}
          documentTypeLabel={docLabel}
          linesSectionHeading={
            documentKind === "credit_note"
              ? "Lignes de l’avoir"
              : "Lignes de facture"
          }
          creditedInvoiceOptions={creditedInvoiceOptions}
          creditedInvoiceId={creditedInvoiceId}
          onCreditedInvoiceIdChange={setCreditedInvoiceId}
          referenceHeading={referenceHeading}
          customRefDraft={customRefDraft}
          onCustomRefDraftChange={setCustomRefDraft}
          clientId={clientId}
          onClientIdChange={setClientId}
          clientOptions={clientOptions}
          selectedInvoiceClient={selectedInvoiceClient}
          baseCurrency={currency}
          onOpenQuickClient={() => setQuickClientOpen(true)}
          onOpenQuickArticle={(lineIndex) => {
            quickArticleLineRef.current = lineIndex;
            setQuickArticleOpen(true);
          }}
          status={status}
          onStatusChange={setStatus}
          issueDate={issueDate}
          onIssueDateChange={setIssueDate}
          dueDate={dueDate}
          onDueDateChange={setDueDate}
          amountPaid={amountPaid}
          onAmountPaidChange={setAmountPaid}
          lineEntryMode={lineEntryMode}
          onLineEntryModeChange={setLineEntryMode}
          taxExempt={taxExempt}
          onTaxExemptChange={setTaxExempt}
          onOpenTaxRatesModal={() => setTaxRatesModalOpen(true)}
          linePricesFractionDigits={
            documentInputPrefs.linePricesFractionDigits
          }
          lines={lines}
          updateLine={updateLine}
          removeLine={removeLine}
          articles={articles}
          categories={categories}
          articleById={articleById}
          taxRates={taxRates}
          quotes={quotes}
          quotesFiltered={quotesFiltered}
          quoteListFilter={quoteListFilter}
          onQuoteListFilterChange={setQuoteListFilter}
          clientById={clientById}
          fmt={fmt}
          onImportQuote={importWholeQuote}
          onAddLine={() =>
            setLines((p) => [
              ...p,
              emptyInvoiceLine({ defaultTaxRate: lineDefaultTaxRate }),
            ])
          }
          discountPresets={discountPresets}
          discountPresetSelectKey={discountPresetSelectKey}
          discountKind={discountKind}
          onDiscountKindChange={setDiscountKind}
          discountValue={discountValue}
          onDiscountValueChange={setDiscountValue}
          discountLabel={discountLabel}
          onDiscountLabelChange={setDiscountLabel}
          onOpenDiscountPresetsModal={() => setDiscountPresetsModalOpen(true)}
          onDiscountPresetPick={(id) => {
            setDiscountPresetSelectKey((k) => k + 1);
            if (!id) return;
            const p = discountPresets.find((x) => x.id === id);
            if (p) {
              setDiscountKind(p.kind === "fixed" ? "fixed" : "percent");
              setDiscountValue(p.value);
              setDiscountLabel(p.name);
            }
          }}
          subtotal={totals.subtotal}
          taxTotal={totals.taxTotal}
          total={totals.total}
          discountBefore={discountBefore}
          remaining={remaining}
          complements={complements}
          onComplementsChange={setComplements}
          snippets={snippets}
          notes={notes}
          onNotesChange={setNotes}
          pdfTemplateVariant={pdfTemplateVariant}
          onPdfTemplateVariantChange={setPdfTemplateVariant}
          docLayout={docLayout}
          pdfLoading={pdfLoading}
          canSave={canUseEditor}
          contentLocked={contentLocked}
          onSave={() => void handleSave()}
          onPreviewPdf={() => void previewInvoicePdf()}
          onExportPdf={() => void exportInvoicePdf()}
          onArchive={() => void setInvoiceArchived(true)}
          onDelete={() => void handleDeleteInvoice()}
          onRestoreArchived={() => void setInvoiceArchived(false)}
          documentActionItems={invoiceDocumentActions}
          onDocumentAction={handleInvoiceDocumentAction}
          projectsModuleActive={projectsEnabled}
          projectId={projectId}
          onProjectIdChange={setProjectId}
          projectOptions={projectOptions}
          projectSelectorLocked={!!lockedProjectId}
          projectLockedLabel={projectLockedLabel}
        />
      </div>

      <QuickClientModal
        open={quickClientOpen}
        onOpenChange={setQuickClientOpen}
        workspaceId={active.id}
        baseCurrency={active.baseCurrency}
        onCreated={(c) => {
          setClientId(c.id);
          void load();
        }}
      />
      <QuickArticleModal
        open={quickArticleOpen}
        onOpenChange={(o) => {
          setQuickArticleOpen(o);
          if (!o) quickArticleLineRef.current = null;
        }}
        workspaceId={active.id}
        categories={categories}
        onCreated={(article) => {
          const i = quickArticleLineRef.current;
          quickArticleLineRef.current = null;
          if (i != null) {
            setLines((prev) =>
              prev.map((l, j) => {
                if (j !== i) return l;
                const billing = normalizeLineBillingMode(l.billingMode);
                const variantPatch = applyVariantToLine({
                  article,
                  billingMode: billing,
                  variantId: null,
                  linePricesFractionDigits:
                    documentInputPrefs.linePricesFractionDigits,
                });
                return {
                  ...l,
                  articleId: article.id,
                  ...variantPatch,
                  quantity:
                    billing === "flat"
                      ? 1
                      : quantityDefaultForMode(billing, l.quantity),
                };
              }),
            );
          }
          void load();
        }}
      />
      <QuoteTaxRatesModal
        open={taxRatesModalOpen}
        onOpenChange={setTaxRatesModalOpen}
        workspaceId={active.id}
        countryCode={active.countryCode}
        onSaved={() => void load()}
      />
      <DiscountPresetsModal
        open={discountPresetsModalOpen}
        onOpenChange={setDiscountPresetsModalOpen}
        workspaceId={active.id}
        onSaved={() => void load()}
      />
    </div>
  );
}
