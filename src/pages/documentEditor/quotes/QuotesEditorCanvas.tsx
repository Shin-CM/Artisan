import { Archive, ArchiveRestore, Plus } from "lucide-react";
import type * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DocumentDiscountForm } from "@/pages/documentEditor/DocumentDiscountForm";
import { DocumentLinesTable } from "@/pages/documentEditor/DocumentLinesTable";
import { DocumentTotalsSummary } from "@/pages/documentEditor/DocumentTotalsSummary";
import { DocumentPdfVariantPicker } from "@/components/DocumentPdfVariantPicker";
import {
  DocumentComplementsEditor,
  type EditableComplement,
} from "@/components/DocumentComplementsEditor";
import type { DocumentActionItem } from "@/pages/documentEditor/DocumentActionsMenu";
import { QuoteEditorToolbar } from "@/pages/documentEditor/quotes/QuoteEditorToolbar";
import {
  QuoteMetaSection,
  type QuoteSurfaceKind,
} from "@/pages/documentEditor/quotes/QuoteMetaSection";
import type { QuoteEditableLine } from "@/pages/documentEditor/editableLineTypes";
import type {
  DocumentLayoutState,
  QuoteWorkspacePreferences,
} from "@/lib/documentOptions";

type Props = {
  sel: api.Quote | null;
  quotePrefs: QuoteWorkspacePreferences;
  surfaceKind?: QuoteSurfaceKind;
  linesSectionHeading?: string;
  referenceHeading: string;
  customRefDraft: string;
  onCustomRefDraftChange: (v: string) => void;
  docTitle: string;
  onDocTitleChange: (v: string) => void;
  clientId: string;
  onClientIdChange: (v: string) => void;
  clientOptions: Array<{ value: string; label: string }>;
  selectedClient?: api.Client;
  baseCurrency: string;
  onOpenQuickClient: () => void;
  onOpenQuickArticle: (lineIndex: number) => void;
  status: string;
  onStatusChange: (v: string) => void;
  issueDate: string;
  onIssueDateChange: (v: string) => void;
  validUntil: string;
  onValidUntilChange: (v: string) => void;
  taxExempt: boolean;
  onTaxExemptChange: (v: boolean) => void;
  onOpenTaxRatesModal: () => void;
  linePricesFractionDigits: number;
  lines: QuoteEditableLine[];
  updateLine: (index: number, patch: Partial<QuoteEditableLine>) => void;
  removeLine: (index: number) => void;
  articles: api.Article[];
  categories: api.Category[];
  articleById: Map<string, api.Article>;
  taxRates: api.TaxRate[];
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
  fmt: (n: number) => string;
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
  documentActionItems: DocumentActionItem[];
  onDocumentAction: (actionId: string) => void;
  onDelete: () => void;
  onRestoreArchived: () => void;
  projectsModuleActive?: boolean;
  projectId?: string;
  onProjectIdChange?: (v: string) => void;
  projectOptions?: Array<{ value: string; label: string }>;
  projectSelectorLocked?: boolean;
  projectLockedLabel?: string;
};

export function QuotesEditorCanvas(props: Props) {
  const {
    sel,
    quotePrefs,
    surfaceKind = "quote",
    linesSectionHeading = "Articles du devis",
    referenceHeading,
    customRefDraft,
    onCustomRefDraftChange,
    docTitle,
    onDocTitleChange,
    clientId,
    onClientIdChange,
    clientOptions,
    selectedClient,
    baseCurrency,
    onOpenQuickClient,
    onOpenQuickArticle,
    status,
    onStatusChange,
    issueDate,
    onIssueDateChange,
    validUntil,
    onValidUntilChange,
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
    fmt,
    subtotal,
    taxTotal,
    total,
    discountBefore,
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
    documentActionItems,
    onDocumentAction,
    onDelete,
    onRestoreArchived,
    projectsModuleActive = false,
    projectId = "",
    onProjectIdChange = () => {},
    projectOptions = [],
    projectSelectorLocked = false,
    projectLockedLabel = "",
  } = props;

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

      <div className="px-4 pb-4 pt-1">
        <QuoteMetaSection
          documentSurface
          quotePrefs={quotePrefs}
          sel={sel}
          surfaceKind={surfaceKind}
          referenceHeading={referenceHeading}
          customRefDraft={customRefDraft}
          onCustomRefDraftChange={onCustomRefDraftChange}
          docTitle={docTitle}
          onDocTitleChange={onDocTitleChange}
          clientId={clientId}
          onClientIdChange={onClientIdChange}
          clientOptions={clientOptions}
          selectedClient={selectedClient}
          baseCurrency={baseCurrency}
          onOpenQuickClient={onOpenQuickClient}
          status={status}
          onStatusChange={onStatusChange}
          issueDate={issueDate}
          onIssueDateChange={onIssueDateChange}
          validUntil={validUntil}
          onValidUntilChange={onValidUntilChange}
          projectsModuleActive={projectsModuleActive}
          projectId={projectId}
          onProjectIdChange={onProjectIdChange}
          projectOptions={projectOptions}
          projectSelectorLocked={projectSelectorLocked}
          projectLockedLabel={projectLockedLabel}
        />

        <div className="w-full border-t border-[var(--color-border)] pt-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Label className="shrink-0" id="quote-articles-heading">
              {linesSectionHeading}
            </Label>
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-2"
              aria-labelledby="quote-articles-heading"
            >
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor="quote-tax-exempt"
                  className="cursor-pointer text-sm font-normal leading-none"
                  title="Document hors taxe"
                >
                  <span className="sr-only">Document hors taxe</span>
                  <span aria-hidden="true">Doc. HT</span>
                </Label>
                <Switch
                  id="quote-tax-exempt"
                  size="sm"
                  checked={taxExempt}
                  onCheckedChange={onTaxExemptChange}
                />
              </div>
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
            </div>
          </div>
          <DocumentLinesTable
            variant="quote"
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
          <div className="flex flex-wrap items-center gap-2 py-2">
            <Button type="button" size="sm" variant="outline" onClick={onAddLine}>
              Ajouter une ligne
            </Button>
          </div>
        </div>

        <DocumentDiscountForm
          documentSurface
          idPrefix="quote"
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
        />

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
          <Label htmlFor="quote-notes" className="text-xs text-[var(--color-muted-foreground)]">
            Notes (non imprimées sur le PDF)
          </Label>
          <textarea
            id="quote-notes"
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

        <div className="mt-4 flex flex-wrap items-center justify-end gap-1.5 border-t border-[var(--color-border)] pt-4">
          <QuoteEditorToolbar
            documentSurface
            pdfLoading={pdfLoading}
            canSave={canSave}
            hasExistingQuote={!!sel}
            onSave={onSave}
            onPreviewPdf={onPreviewPdf}
            onExportPdf={onExportPdf}
            documentActionItems={documentActionItems}
            onDocumentAction={onDocumentAction}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}
