/** Polices standard PDF (@react-pdf / moteur PDF), sans fichier externe. */

export type PdfBodyFontId = "helvetica" | "times" | "courier";

export const PDF_BODY_FONT_OPTIONS: {
  id: PdfBodyFontId;
  label: string;
  description: string;
}[] = [
  {
    id: "helvetica",
    label: "Helvetica",
    description: "Sans-serif, lisible (défaut)",
  },
  {
    id: "times",
    label: "Times",
    description: "Serif, style classique",
  },
  {
    id: "courier",
    label: "Courier",
    description: "Chasse fixe",
  },
];

export function normalizePdfBodyFontId(
  v: string | null | undefined,
): PdfBodyFontId {
  if (v === "times" || v === "courier") return v;
  return "helvetica";
}

/** Nom attendu par react-pdf pour les polices intégrées. */
export function reactPdfBodyFontFamily(id: PdfBodyFontId): string {
  if (id === "times") return "Times-Roman";
  if (id === "courier") return "Courier";
  return "Helvetica";
}
