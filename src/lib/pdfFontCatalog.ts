export type CatalogPdfFontId = "inter" | "source-sans-3" | "lora";

export type CatalogPdfFontEntry = {
  id: CatalogPdfFontId;
  label: string;
  description: string;
  family: string;
  sources: {
    regular: string;
    bold: string;
    italic: string;
    /** Optionnel : sans URL, le gras italique n’est pas proposé en UI pour cette police. */
    boldItalic?: string;
  };
};

export type PdfFontCatalogProvider = () => CatalogPdfFontEntry[];

const defaultCatalog: CatalogPdfFontEntry[] = [
  {
    id: "inter",
    label: "Inter",
    description: "Sans-serif moderne, lisible sur mobile/tablette",
    family: "ArtisanCatalog_Inter",
    sources: {
      regular: "https://github.com/google/fonts/raw/main/ofl/inter/Inter-Regular.ttf",
      bold: "https://github.com/google/fonts/raw/main/ofl/inter/Inter-Bold.ttf",
      italic: "https://github.com/google/fonts/raw/main/ofl/inter/Inter-Italic.ttf",
      boldItalic:
        "https://github.com/google/fonts/raw/main/ofl/inter/Inter-BoldItalic.ttf",
    },
  },
  {
    id: "source-sans-3",
    label: "Source Sans 3",
    description: "Sans-serif neutre, très stable pour documents",
    family: "ArtisanCatalog_SourceSans3",
    sources: {
      regular:
        "https://github.com/google/fonts/raw/main/ofl/sourcesans3/SourceSans3-Regular.ttf",
      bold:
        "https://github.com/google/fonts/raw/main/ofl/sourcesans3/SourceSans3-Bold.ttf",
      italic:
        "https://github.com/google/fonts/raw/main/ofl/sourcesans3/SourceSans3-Italic.ttf",
    },
  },
  {
    id: "lora",
    label: "Lora",
    description: "Serif élégante pour devis/factures",
    family: "ArtisanCatalog_Lora",
    sources: {
      regular: "https://github.com/google/fonts/raw/main/ofl/lora/Lora-Regular.ttf",
      bold: "https://github.com/google/fonts/raw/main/ofl/lora/Lora-Bold.ttf",
      italic: "https://github.com/google/fonts/raw/main/ofl/lora/Lora-Italic.ttf",
    },
  },
];

const providers: PdfFontCatalogProvider[] = [() => defaultCatalog];

/**
 * Registre extensible pour brancher plus tard des packs Marketplace.
 * Les providers sont agnostiques plateforme (desktop/tablette/web).
 */
export function registerPdfFontCatalogProvider(provider: PdfFontCatalogProvider): void {
  providers.push(provider);
}

export function getPdfFontCatalog(): CatalogPdfFontEntry[] {
  const merged = providers.flatMap((p) => {
    try {
      return p();
    } catch {
      return [];
    }
  });
  const seen = new Set<string>();
  return merged.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

export function isCatalogPdfFontId(v: string | null | undefined): v is CatalogPdfFontId {
  if (!v) return false;
  return getPdfFontCatalog().some((x) => x.id === v);
}

export function findCatalogPdfFont(
  id: CatalogPdfFontId | string | null | undefined,
): CatalogPdfFontEntry | null {
  if (!id) return null;
  return getPdfFontCatalog().find((x) => x.id === id) ?? null;
}
