import * as api from "@/lib/api";

export function movementKindLabel(kind: string): string {
  if (kind === "in") return "Entrée";
  if (kind === "out") return "Sortie";
  if (kind === "adjustment") return "Ajustement";
  return kind;
}

export function normSupplierField(s: string | null | undefined): string | null {
  const t = s?.trim() ?? "";
  return t === "" ? null : t;
}

/** Reprend la fiche catalogue pour `updateArticle` (fournisseur / ref. modifiables depuis Stock). */
export function articleToUpdateInput(
  a: api.Article,
  overrides: { supplierName: string | null; supplierReference: string | null },
): Parameters<typeof api.updateArticle>[1] {
  let optionsJson: unknown = [];
  try {
    optionsJson = JSON.parse(a.optionsJson || "[]") as unknown;
  } catch {
    optionsJson = [];
  }
  return {
    name: a.name,
    description: a.description,
    categoryId: a.categoryId,
    basePrice: a.basePrice,
    flatPrice: a.flatPrice,
    hourlyRate: a.hourlyRate,
    productionCost: a.productionCost,
    optionsJson,
    supplierName: overrides.supplierName,
    supplierReference: overrides.supplierReference,
  };
}

