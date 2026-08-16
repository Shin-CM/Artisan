/** Identifiants stables des modèles PDF (devis / facture). */

export const PDF_TEMPLATE_VARIANT_IDS = [
  "classic",
  "modern",
  "stripe",
  "studio",
  "compact",
] as const;

export type PdfTemplateVariantId = (typeof PDF_TEMPLATE_VARIANT_IDS)[number];

export const PDF_TEMPLATE_VARIANTS: {
  id: PdfTemplateVariantId;
  label: string;
  description: string;
}[] = [
  {
    id: "classic",
    label: "Classique",
    description:
      "Mise en page traditionnelle : logo, titres noirs, tableau bordé.",
  },
  {
    id: "modern",
    label: "Moderne",
    description:
      "Grandes marges, en-tête de tableau gris clair, lignes discrètes.",
  },
  {
    id: "stripe",
    label: "Bandeau",
    description:
      "Bandeau coloré en tête avec le type de document et la référence.",
  },
  {
    id: "studio",
    label: "Studio",
    description:
      "Colonne latérale sombre pour le client, contenu principal à droite.",
  },
  {
    id: "compact",
    label: "Compact",
    description:
      "Police réduite et lignes resserrées pour tenir plus d’informations.",
  },
];

export function isPdfTemplateVariantId(
  v: string,
): v is PdfTemplateVariantId {
  return (PDF_TEMPLATE_VARIANT_IDS as readonly string[]).includes(v);
}

export function parsePdfTemplateVariantId(
  raw: string | null | undefined,
  fallback: PdfTemplateVariantId,
): PdfTemplateVariantId {
  const t = (raw ?? "").trim();
  if (t && isPdfTemplateVariantId(t)) return t;
  return fallback;
}
