import { QuickClientModal } from "@/components/QuickClientModal";
import { QuickArticleModal } from "@/components/QuickArticleModal";
import { DiscountPresetsModal } from "@/components/DiscountPresetsModal";
import { QuoteTaxRatesModal } from "@/components/QuoteTaxRatesModal";
import { QuotesSidebar } from "@/pages/documentEditor/QuotesSidebar";
import { QuotesEditorCanvas } from "@/pages/documentEditor/quotes/QuotesEditorCanvas";
import { emptyQuoteLine } from "@/pages/documentEditor/editableLineTypes";
import { normalizeLineBillingMode, quantityDefaultForMode } from "@/lib/lineBilling";
import { applyVariantToLine } from "@/lib/articleOptions";
import { useQuotesPage } from "@/pages/documentEditor/quotes/useQuotesPage";

type QuotesPageVm = ReturnType<typeof useQuotesPage>;

export function QuotesPageView(vm: QuotesPageVm) {
  const {
    kind,
    active,
    quoteGroups,
    sel,
    setSel,
    fmt,
    archiveQuoteFromList,
    handleDeleteQuote,
    sidebarTitle,
    quotePrefs,
    customRefDraft,
    setCustomRefDraft,
    docTitle,
    setDocTitle,
    clientId,
    setClientId,
    clientOptions,
    selectedClient,
    currency,
    setQuickClientOpen,
    quickArticleLineRef,
    setQuickArticleOpen,
    status,
    setStatus,
    issueDate,
    setIssueDate,
    validUntil,
    setValidUntil,
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
    handleSave,
    previewQuotePdf,
    exportQuotePdf,
    quoteDocumentActions,
    handleQuoteDocumentAction,
    setQuoteArchived,
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
  return (
    <div className="flex h-full min-h-0">
      <QuotesSidebar
        quoteGroups={quoteGroups}
        selectedId={sel?.id}
        fmt={fmt}
        onNew={() => setSel(null)}
        onSelect={setSel}
        onArchiveFromList={archiveQuoteFromList}
        onDelete={handleDeleteQuote}
        sidebarTitle={sidebarTitle}
      />
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
        <QuotesEditorCanvas
          sel={sel}
          quotePrefs={quotePrefs}
          surfaceKind={kind}
          linesSectionHeading={
            kind === "purchase_order"
              ? "Lignes du bon de commande"
              : "Articles du devis"
          }
          referenceHeading={referenceHeading}
          customRefDraft={customRefDraft}
          onCustomRefDraftChange={setCustomRefDraft}
          docTitle={docTitle}
          onDocTitleChange={setDocTitle}
          clientId={clientId}
          onClientIdChange={setClientId}
          clientOptions={clientOptions}
          selectedClient={selectedClient}
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
          validUntil={validUntil}
          onValidUntilChange={setValidUntil}
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
          onAddLine={() =>
            setLines((p) => [
              ...p,
              emptyQuoteLine({ defaultTaxRate: lineDefaultTaxRate }),
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
          fmt={fmt}
          subtotal={totals.subtotal}
          taxTotal={totals.taxTotal}
          total={totals.total}
          discountBefore={discountBefore}
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
          onSave={() => void handleSave()}
          onPreviewPdf={() => void previewQuotePdf()}
          onExportPdf={() => void exportQuotePdf()}
          documentActionItems={quoteDocumentActions}
          onDocumentAction={handleQuoteDocumentAction}
          onDelete={() => sel && void handleDeleteQuote(sel.id)}
          onRestoreArchived={() => void setQuoteArchived(false)}
          projectsModuleActive={projectsEnabled}
          projectId={projectId}
          onProjectIdChange={setProjectId}
          projectOptions={projectOptions}
          projectSelectorLocked={!!lockedProjectId}
          projectLockedLabel={projectLockedLabel}
        />
      </div>

      {active && (
        <>
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
        </>
      )}
    </div>
  );
}
