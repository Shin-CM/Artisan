import { normalizeDiscountKind } from "@/core/documentMath";
import type { LineDiscountFormKind } from "@/pages/documentEditor/editableLineTypes";

type EditorLineDisc = {
  lineDiscountKind: LineDiscountFormKind;
  lineDiscountValue: number;
  lineDiscountLabel: string;
};

/** Champs persistés (ligne API / `QuoteLine` / `InvoiceLine`). */
export function lineDiscountRowFromEditor(
  l: EditorLineDisc,
): {
  lineDiscountKind: string;
  lineDiscountValue: number;
  lineDiscountLabel: string | null;
} {
  const k = normalizeDiscountKind(l.lineDiscountKind);
  const v = Number.isFinite(l.lineDiscountValue)
    ? Math.max(0, l.lineDiscountValue)
    : 0;
  if (k === "none" || v <= 0) {
    return {
      lineDiscountKind: "none",
      lineDiscountValue: 0,
      lineDiscountLabel: null,
    };
  }
  return {
    lineDiscountKind: k,
    lineDiscountValue: v,
    lineDiscountLabel: l.lineDiscountLabel.trim() || null,
  };
}

/** Champs optionnels pour `QuoteInput` / `InvoiceInput` (IPC). */
export function lineDiscountInputFromEditor(l: EditorLineDisc): {
  lineDiscountKind: string | null;
  lineDiscountValue: number | null;
  lineDiscountLabel: string | null;
} {
  const r = lineDiscountRowFromEditor(l);
  if (r.lineDiscountKind === "none") {
    return {
      lineDiscountKind: null,
      lineDiscountValue: null,
      lineDiscountLabel: null,
    };
  }
  return {
    lineDiscountKind: r.lineDiscountKind,
    lineDiscountValue: r.lineDiscountValue,
    lineDiscountLabel: r.lineDiscountLabel,
  };
}

export function editorLineDiscountFromApi(l: {
  lineDiscountKind: string;
  lineDiscountValue: number;
  lineDiscountLabel: string | null;
}): Pick<EditorLineDisc, "lineDiscountKind" | "lineDiscountValue" | "lineDiscountLabel"> {
  const kind = normalizeDiscountKind(l.lineDiscountKind);
  return {
    lineDiscountKind: kind,
    lineDiscountValue: l.lineDiscountValue ?? 0,
    lineDiscountLabel: l.lineDiscountLabel ?? "",
  };
}
