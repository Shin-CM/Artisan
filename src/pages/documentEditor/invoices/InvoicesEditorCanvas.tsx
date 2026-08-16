import { Archive, ArchiveRestore, Plus } from "lucide-react";
import type * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DocumentLinesTable } from "@/pages/documentEditor/DocumentLinesTable";
import { InvoiceQuoteImportPanel } from "@/pages/documentEditor/InvoiceQuoteImportPanel";
import { DocumentDiscountForm } from "@/pages/documentEditor/DocumentDiscountForm";
import { DocumentTotalsSummary } from "@/pages/documentEditor/DocumentTotalsSummary";
import {
  DocumentComplementsEditor,
  type EditableComplement,
} from "@/components/DocumentComplementsEditor";
import { DocumentPdfVariantPicker } from "@/components/DocumentPdfVariantPicker";
import type { DocumentActionItem } from "@/pages/documentEditor/DocumentActionsMenu";
import { InvoiceEditorToolbar } from "@/pages/documentEditor/invoices/InvoiceEditorToolbar";
import { InvoiceMetaSection } from "@/pages/documentEditor/invoices/InvoiceMetaSection";
import type { InvoiceEditableLine } from "@/pages/documentEditor/editableLineTypes";
import type { InvoiceWorkspacePreferences, DocumentLayoutState } from "@/lib/documentOptions";

type Props = {
  sel: api.Invoice | null;
  invoicePrefs: InvoiceWorkspacePreferences;
  documentKind?: "invoice" | "credit_note";
  documentTypeLabel?: string;
  linesSectionHeading?: string;
  creditedInvoiceOptions?: { value: string; label: string }[];
  creditedInvoiceId?: string;
  onCreditedInvoiceIdChange?: (v: string) => void;
  referenceHeading: string;
  customRefDraft: string;
  onCustomRefDraftChange: (v: string) => void;
  clientId: string;
  onClientIdChange: (v: string) => void;
  clientOptions: Array<{ value: string; label: string }>;
  selectedInvoiceClient?: api.Client;
  baseCurrency: string;
  onOpenQuickClient: () => void;
  onOpenQuickArticle: (lineIndex: number) => void;
  status: string;
  onStatusChange: (v: string) => void;
  issueDate: string;
  onIssueDateChange: (v: string) => void;
  dueDate: string;
  onDueDateChange: (v: string) => void;
  amountPaid: number;
  onAmountPaidChange: (v: number) => void;
  lineEntryMode: "articles" | "quotes";
  onLineEntryModeChange: (v: "articles" | "quotes") => void;
  taxExempt: boolean;
  onTaxExemptChange: (v: boolean) => void;
  onOpenTaxRatesModal: () => void;
  linePricesFractionDigits: number;
  lines: InvoiceEditableLine[];
  updateLine: (index: number, patch: Partial<InvoiceEditableLine>) => void;
  removeLine: (index: number) => void;
  articles: api.Article[];
  categories: api.Category[];
  articleById: Map<string, api.Article>;
  taxRates: api.TaxRate[];
  quotes: api.Quote[];
  quotesFiltered: api.Quote[];
  quoteListFilter: string;
  onQuoteListFilterChange: (v: string) => void;
  clientById: Map<string, api.Client>;
  fmt: (n: number) => string;
  onImportQuote: (quoteId: string) => void;
  onAddLine: () => void;
  discountPresets: api.DiscountPreset[];
  discountPresetSelectKey: number;
  discountKind: "none" | "percent" | "fixed";
  onDiscountKindChange: (v: "none" | "percent" | "fixed") => void;
  discountValue: number;
  onDiscountValueChange: (n: number) => void;
  discountLabel: string;
  onDiscountLabelChange: (v: string) => void;
  onOpenDiscountPresetsModal: () => void;
  onDiscountPresetPick: (id: string) => void;
  subtotal: number;
  taxTotal: number;
  total: number;
  discountBefore?:
    | {
        grossSubtotal: number;
        discountAmountHt: number;
        label: string | null;
      }
    | undefined;
  remaining: number;
  complements: EditableComplement[];
  onComplementsChange: (items: EditableComplement[]) => void;
  snippets: api.TextSnippet[];
  notes: string;
  onNotesChange: (v: string) => void;
  pdfTemplateVariant: string;
  onPdfTemplateVariantChange: (v: string) => void;
  docLayout: DocumentLayoutState;
  pdfLoading: boolean;
  canSave: boolean;
  onSave: () => void;
  onPreviewPdf: () => void;
  onExportPdf: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onRestoreArchived: () => void;
  documentActionItems?: DocumentActionItem[];
  onDocumentAction?: (actionId: string) => void;
  projectsModuleActive?: boolean;
  projectId?: string;
  onProjectIdChange?: (v: string) => void;
  projectOptions?: Array<{ value: string; label: string }>;
  projectSelectorLocked?: boolean;
  projectLockedLabel?: string;
  contentLocked?: boolean;
};

export function InvoicesEditorCanvas(props: Props) {
  const {
    sel,
    invoicePrefs,
    documentKind = "invoice",
    documentTypeLabel = "Facture",
    linesSectionHeading = "Lignes de facture",
    creditedInvoiceOptions,
    creditedInvoiceId = "",
    onCreditedInvoiceIdChange,
    referenceHeading,
    customRefDraft,
    onCustomRefDraftChange,
    clientId,
    onClientIdChange,
    clientOptions,
    selectedInvoiceClient,
    baseCurrency,
    onOpenQuickClient,
    onOpenQuickArticle,
    status,
    onStatusChange,
    issueDate,
    onIssueDateChange,
    dueDate,
    onDueDateChange,
    amountPaid,
    onAmountPaidChange,
    lineEntryMode,
    onLineEntryModeChange,
    taxExempt,
    onTaxExemptChange,
    onOpenTaxRatesModal,
    linePricesFractionDigits,
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
    onQuoteListFilterChange,
    clientById,
    fmt,
    onImportQuote,
    onAddLine,
    discountPresets,
    discountPresetSelectKey,
    discountKind,
    onDiscountKindChange,
    discountValue,
    onDiscountValueChange,
    discountLabel,
    onDiscountLabelChange,
    onOpenDiscountPresetsModal,
    onDiscountPresetPick,
    subtotal,
    taxTotal,
    total,
    discountBefore,
    remaining,
    complements,
    onComplementsChange,
    snippets,
    notes,
    onNotesChange,
    pdfTemplateVariant,
    onPdfTemplateVariantChange,
    docLayout,
    pdfLoading,
    canSave,
    onSave,
    onPreviewPdf,
    onExportPdf,
    onArchive,
    onDelete,
    onRestoreArchived,
    documentActionItems = [],
    onDocumentAction,
    projectsModuleActive = false,
    projectId = "",
    onProjectIdChange = () => {},
    projectOptions = [],
    projectSelectorLocked = false,
    projectLockedLabel = "",
    contentLocked = false,
  } = props;

  const effectiveLineMode =
    documentKind === "credit_note" ? "articles" : lineEntryMode;

  return (
    <div className="mx-auto w-full max-w-7xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm">
      {sel?.archived ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2">
          <p className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            <Archive className="h-4 w-4 shrink-0" />
            Document archivé — visible dans Bases de données → Historique.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={onRestoreArchived}
          >
            <ArchiveRestore className="h-4 w-4" />
            Restaurer
          </Button>
        </div>
      ) : null}

      {contentLocked ? (
        <div className="border-b border-[var(--color-border)] px-3 py-2">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Facture verrouillée : le contenu n’est plus modifiable. Vous pouvez
            encore changer le statut, le montant payé, exporter le PDF ou créer
            un avoir. Désactivez le verrouillage dans Paramètres → Espace de
            travail si besoin.
          </p>
        </div>
      ) : null}

      <div className="px-4 pb-4 pt-1">
        <InvoiceMetaSection
          documentSurface
          invoicePrefs={invoicePrefs}
          sel={sel}
          documentTypeLabel={documentTypeLabel}
          referenceHeading={referenceHeading}
          customRefDraft={customRefDraft}
          onCustomRefDraftChange={onCustomRefDraftChange}
          clientId={clientId}
          onClientIdChange={onClientIdChange}
          clientOptions={clientOptions}
          selectedClient={selectedInvoiceClient}
          baseCurrency={baseCurrency}
          onOpenQuickClient={onOpenQuickClient}
          status={status}
          onStatusChange={onStatusChange}
          issueDate={issueDate}
          onIssueDateChange={onIssueDateChange}
          dueDate={dueDate}
          onDueDateChange={onDueDateChange}
          amountPaid={amountPaid}
          onAmountPaidChange={onAmountPaidChange}
          creditedInvoiceOptions={creditedInvoiceOptions}
          creditedInvoiceId={creditedInvoiceId}
          onCreditedInvoiceIdChange={onCreditedInvoiceIdChange}
          projectsModuleActive={projectsModuleActive}
          projectId={projectId}
          onProjectIdChange={onProjectIdChange}
          projectOptions={projectOptions}
          projectSelectorLocked={projectSelectorLocked}
          projectLockedLabel={projectLockedLabel}
          contentLocked={contentLocked}
        />

        <fieldset
          disabled={contentLocked}
          className={
            contentLocked
              ? "min-w-0 border-0 p-0 opacity-90"
              : "min-w-0 border-0 p-0"
          }
        >

        <div className="w-full border-t border-[var(--color-border)] pt-3">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Label className="shrink-0" id="inv-lines-heading">
                {linesSectionHeading}
              </Label>
              {documentKind !== "credit_note" ? (
              <div
                className="inline-flex rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-0.5"
                role="group"
                aria-label="Mode de saisie des lignes"
              >
                <Button
                  type="button"
                  size="sm"
                  variant={lineEntryMode === "articles" ? "secondary" : "ghost"}
                  className="h-8 rounded-sm px-3 text-xs"
                  onClick={() => onLineEntryModeChange("articles")}
                >
                  Saisir les articles
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={lineEntryMode === "quotes" ? "secondary" : "ghost"}
                  className="h-8 rounded-sm px-3 text-xs"
                  onClick={() => onLineEntryModeChange("quotes")}
                >
                  Choisir un devis
                </Button>
              </div>
              ) : null}
            </div>
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-2"
              aria-labelledby="inv-lines-heading"
            >
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor="itex"
                  className="cursor-pointer text-sm font-normal leading-none"
                  title="Document hors taxe"
                >
                  <span className="sr-only">Document hors taxe</span>
                  <span aria-hidden="true">Doc. HT</span>
                </Label>
                <Switch
                  id="itex"
                  size="sm"
                  checked={taxExempt}
                  onCheckedChange={onTaxExemptChange}
                />
              </div>
              {effectiveLineMode === "articles" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  aria-label="Gérer les taux de TVA"
                  title="Gérer les taux de TVA"
                  onClick={onOpenTaxRatesModal}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Taux TVA</span>
                </Button>
              ) : null}
            </div>
          </div>

          {effectiveLineMode === "articles" ? (
            <DocumentLinesTable
              variant="invoice"
              lineDetailsInPopover
              linePricesFractionDigits={linePricesFractionDigits}
              taxExempt={taxExempt}
              formatLineAmount={fmt}
              onOpenQuickArticle={onOpenQuickArticle}
              lines={lines}
              updateLine={updateLine}
              removeLine={removeLine}
              articles={articles}
              categories={categories}
              articleById={articleById}
              taxRates={taxRates}
            />
          ) : (
            <InvoiceQuoteImportPanel
              quotes={quotes}
              quotesFiltered={quotesFiltered}
              quoteListFilter={quoteListFilter}
              onQuoteListFilterChange={onQuoteListFilterChange}
              clientById={clientById}
              fmt={fmt}
              onImportQuote={onImportQuote}
            />
          )}

          {effectiveLineMode === "articles" ? (
            <div className="flex flex-wrap items-center gap-2 py-2">
              <Button type="button" size="sm" variant="outline" onClick={onAddLine}>
                Ajouter une ligne
              </Button>
            </div>
          ) : null}
        </div>

        <DocumentDiscountForm
          documentSurface
          idPrefix="inv"
          presets={discountPresets}
          presetSelectKey={discountPresetSelectKey}
          kind={discountKind}
          onKindChange={onDiscountKindChange}
          value={discountValue}
          onValueChange={onDiscountValueChange}
          label={discountLabel}
          onLabelChange={onDiscountLabelChange}
          onOpenPresetsModal={onOpenDiscountPresetsModal}
          onPresetPick={onDiscountPresetPick}
        />

        <DocumentTotalsSummary
          documentSurface
          fmt={fmt}
          subtotal={subtotal}
          taxTotal={taxTotal}
          total={total}
          discountBefore={discountBefore}
        >
          <div className="flex justify-between text-[var(--color-muted-foreground)]">
            <span>Reste à payer</span>
            <span>{fmt(remaining)}</span>
          </div>
        </DocumentTotalsSummary>

        <div>
          <Label className="sr-only">Modules additionnels</Label>
          <DocumentComplementsEditor
            documentSurface
            items={complements}
            onChange={onComplementsChange}
            snippets={snippets}
          />
        </div>

        <div className="border-t border-[var(--color-border)] py-3">
          <Label
            htmlFor="inv-notes"
            className="text-xs text-[var(--color-muted-foreground)]"
          >
            Notes (non imprimées sur le PDF)
          </Label>
          <textarea
            id="inv-notes"
            className="mt-1 min-h-[3.5rem] w-full resize-y border-0 border-b border-[var(--color-border)] bg-transparent px-0 py-1 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus-visible:border-[var(--color-ring)]"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Notes internes…"
            aria-label="Notes"
          />
        </div>

        <DocumentPdfVariantPicker
          documentSurface
          value={pdfTemplateVariant}
          onChange={onPdfTemplateVariantChange}
          workspaceDefaultVariant={docLayout.defaultPdfVariant}
        />

        </fieldset>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-1.5 border-t border-[var(--color-border)] pt-4">
          <InvoiceEditorToolbar
            documentSurface
            pdfLoading={pdfLoading}
            canSave={canSave}
            canDelete={!contentLocked}
            hasExistingInvoice={!!sel}
            invoiceArchived={!!sel?.archived}
            onSave={onSave}
            onPreviewPdf={onPreviewPdf}
            onExportPdf={onExportPdf}
            onArchive={onArchive}
            onDelete={onDelete}
            documentActionItems={documentActionItems}
            onDocumentAction={onDocumentAction}
          />
        </div>
      </div>
    </div>
  );
}
