import type * as React from "react";
import type * as api from "@/lib/api";
import type {
  InvoiceEditableLine,
  QuoteEditableLine,
} from "@/pages/documentEditor/editableLineTypes";
import type { LineBillingMode } from "@/lib/lineBilling";

export type EditableDocumentLine = QuoteEditableLine | InvoiceEditableLine;

export type LineCommonViewProps = {
  variant: "quote" | "invoice";
  /** Décimales pour prix unitaire HT (paramètre espace de travail). */
  linePricesFractionDigits: number;
  /** Totaux ligne (TTC) : même moteur que PDF / agrégats document. */
  taxExempt: boolean;
  formatLineAmount: (n: number) => string;
  /** Ouvre la modale « nouvel article » pour la ligne concernée (pied du picker catalogue). */
  onOpenQuickArticle?: (lineIndex: number) => void;
  lines: EditableDocumentLine[];
  articles: api.Article[];
  categories: api.Category[];
  taxRates: api.TaxRate[];
  updateLine: (index: number, patch: Partial<EditableDocumentLine>) => void;
  removeLine: (index: number) => void;
  linePanelKey: (lineId: string | null | undefined, index: number) => string;
  combinedArticleVariantValue: (
    articleId: string | null,
    optionsSnapshotJson: string | undefined,
  ) => string;
  applyArticleVariantSelection: (
    lineIndex: number,
    line: EditableDocumentLine,
    billingMode: LineBillingMode,
    raw: string,
  ) => void;
  applyBillingModeChange: (
    lineIndex: number,
    line: EditableDocumentLine,
    mode: LineBillingMode,
  ) => void;
  selectClassName: string;
  inputClassName: string;
  inputDescClassName: string;
};

export type LineDesktopStateProps = {
  /** Évite deux popovers portés au `body` : seul le tableau desktop ouvre les options si `true` (≥ md). */
  isMdViewport: boolean;
  lineDetailsInPopover: boolean;
  noteIdPrefix: string;
  discOpenByLine: Record<string, boolean>;
  setDiscOpenByLine: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  noteOpenByLine: Record<string, boolean>;
  setNoteOpenByLine: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  openLinePopoverKey: string | null;
  setOpenLinePopoverKey: React.Dispatch<React.SetStateAction<string | null>>;
  focusedLineKey: string | null;
  setFocusedLineKey: React.Dispatch<React.SetStateAction<string | null>>;
  lineTdClassName: string;
  lineThClassName: string;
};

export type LineMobileStateProps = {
  /** Popover options ligne : ouvert seulement en vue mobile (`!isMdViewport`). */
  isMdViewport: boolean;
  lineDetailsInPopover: boolean;
  openLinePopoverKey: string | null;
  setOpenLinePopoverKey: React.Dispatch<React.SetStateAction<string | null>>;
};
