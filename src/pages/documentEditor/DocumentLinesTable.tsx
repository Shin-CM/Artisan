import * as React from "react";
import type * as api from "@/lib/api";
import type {
  InvoiceEditableLine,
  QuoteEditableLine,
} from "@/pages/documentEditor/editableLineTypes";
import {
  type LineBillingMode,
  quantityDefaultForMode,
  unitPriceForArticleMode,
} from "@/lib/lineBilling";
import { roundMoneyHt } from "@/core/documentMath";
import {
  applyVariantToLine,
  articleHasVariants,
  STANDARD_VARIANT_VALUE,
  variantSelectValueFromLine,
} from "@/lib/articleOptions";
import { DocumentLinesMobileCards } from "@/pages/documentEditor/DocumentLinesMobileCards";
import { DocumentLinesDesktopTable } from "@/pages/documentEditor/DocumentLinesDesktopTable";
import type { EditableDocumentLine } from "@/pages/documentEditor/documentLineViewTypes";

type CommonProps = {
  linePricesFractionDigits: number;
  taxExempt: boolean;
  formatLineAmount: (n: number) => string;
  onOpenQuickArticle?: (lineIndex: number) => void;
  articles: api.Article[];
  categories: api.Category[];
  articleById: Map<string, api.Article>;
  taxRates: api.TaxRate[];
  removeLine: (index: number) => void;
};

type QuoteTableProps = CommonProps & {
  variant: "quote";
  lines: QuoteEditableLine[];
  updateLine: (index: number, patch: Partial<QuoteEditableLine>) => void;
  /** Vue devis unifiée : description, remise et note dans un popover sous la ligne. */
  lineDetailsInPopover?: boolean;
};

type InvoiceTableProps = CommonProps & {
  variant: "invoice";
  lines: InvoiceEditableLine[];
  updateLine: (index: number, patch: Partial<InvoiceEditableLine>) => void;
  /** Facture unifiée : détails de ligne (description/remise/note) dans un popover. */
  lineDetailsInPopover?: boolean;
};

export type DocumentLinesTableProps = QuoteTableProps | InvoiceTableProps;

/** Ligne article : même padding et hauteur de contrôle partout */
const LINE_TD = "px-1 py-1.5 align-top";
const LINE_TH = "px-1 py-2 text-left text-xs font-medium";
const CTL_H = "h-8 min-h-8 w-full min-w-0 text-xs leading-none shadow-sm";
const SELECT_LINE = `${CTL_H} rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-1.5 focus:outline-none`;
const INPUT_LINE = `${CTL_H} rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-1.5 focus:outline-none`;
/** Champ description (ligne sous TVA + actions, à droite du tableau). */
const INPUT_DESC_LINE =
  "h-7 min-h-7 w-full min-w-0 rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-1 text-[11px] leading-none shadow-sm focus:outline-none";

function linePanelKey(lineId: string | null | undefined, index: number): string {
  return lineId ?? `new-${index}`;
}

function combinedArticleVariantValue(
  articleId: string | null,
  optionsSnapshotJson: string | undefined,
): string {
  if (!articleId) return "";
  const variant = variantSelectValueFromLine(optionsSnapshotJson, articleId);
  return variant === STANDARD_VARIANT_VALUE
    ? `a:${articleId}`
    : `v:${articleId}:${variant}`;
}

function parseCombinedArticleVariantValue(
  raw: string,
): { articleId: string | null; variantId: string | null } {
  if (!raw) return { articleId: null, variantId: null };
  if (raw.startsWith("a:")) {
    return { articleId: raw.slice(2), variantId: null };
  }
  if (raw.startsWith("v:")) {
    const parts = raw.split(":");
    if (parts.length >= 3) {
      return { articleId: parts[1] || null, variantId: parts[2] || null };
    }
  }
  return { articleId: null, variantId: null };
}

export function DocumentLinesTable(props: DocumentLinesTableProps) {
  const {
    variant,
    linePricesFractionDigits,
    taxExempt,
    formatLineAmount,
    onOpenQuickArticle,
    lines,
    articles,
    categories,
    articleById,
    taxRates,
    updateLine,
    removeLine,
  } = props;

  const lineDetailsInPopover = props.lineDetailsInPopover === true;

  const noteIdPrefix = variant === "quote" ? "line-note" : "inv-line-note";

  const [discOpenByLine, setDiscOpenByLine] = React.useState<
    Record<string, boolean>
  >({});
  const [noteOpenByLine, setNoteOpenByLine] = React.useState<
    Record<string, boolean>
  >({});
  const [openLinePopoverKey, setOpenLinePopoverKey] = React.useState<
    string | null
  >(null);
  const [focusedLineKey, setFocusedLineKey] = React.useState<string | null>(
    null,
  );

  const [isMdViewport, setIsMdViewport] = React.useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px)").matches
      : false,
  );

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    let prev = mq.matches;
    const sync = () => {
      const next = mq.matches;
      setIsMdViewport(next);
      if (prev !== next) {
        setOpenLinePopoverKey(null);
        prev = next;
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  function applyArticleVariantSelection(
    lineIndex: number,
    line: EditableDocumentLine,
    billingMode: LineBillingMode,
    raw: string,
  ) {
    const picked = parseCombinedArticleVariantValue(raw);
    const article = picked.articleId ? articleById.get(picked.articleId) : undefined;
    if (!article) {
      updateLine(lineIndex, {
        articleId: null,
        optionsSnapshotJson: "{}",
      });
      return;
    }
    const variantPatch = applyVariantToLine({
      article,
      billingMode,
      variantId: picked.variantId,
      linePricesFractionDigits,
    });
    updateLine(lineIndex, {
      articleId: article.id,
      ...variantPatch,
      quantity:
        billingMode === "flat"
          ? 1
          : quantityDefaultForMode(billingMode, line.quantity),
    });
  }

  function applyBillingModeChange(
    lineIndex: number,
    line: EditableDocumentLine,
    mode: LineBillingMode,
  ) {
    const article = line.articleId ? articleById.get(line.articleId) : undefined;
    if (article && articleHasVariants(article)) {
      const raw = variantSelectValueFromLine(line.optionsSnapshotJson, line.articleId);
      const variantId = raw === STANDARD_VARIANT_VALUE ? null : raw;
      const variantPatch = applyVariantToLine({
        article,
        billingMode: mode,
        variantId,
        linePricesFractionDigits,
      });
      updateLine(lineIndex, {
        billingMode: mode,
        ...variantPatch,
        quantity: mode === "flat" ? 1 : quantityDefaultForMode(mode, line.quantity),
      });
      return;
    }
    updateLine(lineIndex, {
      billingMode: mode,
      unitPrice: article
        ? roundMoneyHt(
            unitPriceForArticleMode(article, mode),
            linePricesFractionDigits,
          )
        : line.unitPrice,
      quantity: mode === "flat" ? 1 : quantityDefaultForMode(mode, line.quantity),
    });
  }

  return (
    <>
      <DocumentLinesMobileCards
        variant={variant}
        linePricesFractionDigits={linePricesFractionDigits}
        taxExempt={taxExempt}
        formatLineAmount={formatLineAmount}
        onOpenQuickArticle={onOpenQuickArticle}
        lines={lines}
        articles={articles}
        categories={categories}
        taxRates={taxRates}
        isMdViewport={isMdViewport}
        lineDetailsInPopover={lineDetailsInPopover}
        openLinePopoverKey={openLinePopoverKey}
        setOpenLinePopoverKey={setOpenLinePopoverKey}
        updateLine={updateLine as (
          index: number,
          patch: Partial<EditableDocumentLine>,
        ) => void}
        removeLine={removeLine}
        linePanelKey={linePanelKey}
        combinedArticleVariantValue={combinedArticleVariantValue}
        applyArticleVariantSelection={applyArticleVariantSelection}
        applyBillingModeChange={applyBillingModeChange}
        selectClassName={SELECT_LINE}
        inputClassName={INPUT_LINE}
        inputDescClassName={INPUT_DESC_LINE}
      />

      <DocumentLinesDesktopTable
        variant={variant}
        linePricesFractionDigits={linePricesFractionDigits}
        taxExempt={taxExempt}
        formatLineAmount={formatLineAmount}
        onOpenQuickArticle={onOpenQuickArticle}
        lines={lines}
        articles={articles}
        categories={categories}
        taxRates={taxRates}
        isMdViewport={isMdViewport}
        lineDetailsInPopover={lineDetailsInPopover}
        noteIdPrefix={noteIdPrefix}
        discOpenByLine={discOpenByLine}
        setDiscOpenByLine={setDiscOpenByLine}
        noteOpenByLine={noteOpenByLine}
        setNoteOpenByLine={setNoteOpenByLine}
        openLinePopoverKey={openLinePopoverKey}
        setOpenLinePopoverKey={setOpenLinePopoverKey}
        focusedLineKey={focusedLineKey}
        setFocusedLineKey={setFocusedLineKey}
        updateLine={updateLine as (
          index: number,
          patch: Partial<EditableDocumentLine>,
        ) => void}
        removeLine={removeLine}
        linePanelKey={linePanelKey}
        combinedArticleVariantValue={combinedArticleVariantValue}
        applyArticleVariantSelection={applyArticleVariantSelection}
        applyBillingModeChange={applyBillingModeChange}
        lineTdClassName={LINE_TD}
        lineThClassName={LINE_TH}
        selectClassName={SELECT_LINE}
        inputClassName={INPUT_LINE}
        inputDescClassName={INPUT_DESC_LINE}
      />
    </>
  );
}
