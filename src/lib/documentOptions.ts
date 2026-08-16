/** Mise en page des PDF / documents (stockée dans `profile_json.documentLayout`). */

import {
  type PdfTemplateVariantId,
  isPdfTemplateVariantId,
  parsePdfTemplateVariantId,
} from "@/lib/pdfTemplateVariants";
import {
  type PdfBodyFontId,
  normalizePdfBodyFontId,
} from "@/lib/pdfBodyFont";
import {
  isCatalogPdfFontId,
  type CatalogPdfFontId,
} from "@/lib/pdfFontCatalog";
import {
  defaultPdfTypography,
  parsePdfTypography,
  type PdfTypographyState,
} from "@/lib/pdfTypography";

export type { PdfTypographyState };

/** Entrée de la bibliothèque de polices copiées dans l’espace (fichiers sous `workspace_assets/.../fonts/`). */
export type BrandingImportedWorkspaceFont = {
  relativePath: string;
  label: string;
};

function parseImportedWorkspaceFonts(
  b: Record<string, unknown>,
): BrandingImportedWorkspaceFont[] {
  const raw = b.importedWorkspaceFonts;
  if (!Array.isArray(raw)) return [];
  const out: BrandingImportedWorkspaceFont[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const relativePath =
      typeof o.relativePath === "string" ? o.relativePath.trim() : "";
    const label = typeof o.label === "string" ? o.label.trim() : "";
    if (!relativePath || !label) continue;
    if (out.some((x) => x.relativePath === relativePath)) continue;
    out.push({ relativePath, label });
  }
  return out;
}

/** Choix de police pour le corps des PDF (branding). */
export type BrandingPdfFont =
  | { kind: "builtin"; builtinId: PdfBodyFontId }
  | { kind: "catalog"; fontId: CatalogPdfFontId }
  /** Police copiée sous workspace_assets/.../fonts/ (fiable pour PDF). */
  | {
      kind: "workspace";
      relativePath: string;
      displayFamily: string;
    }
  /** @deprecated Profils anciens : chemin OS + lecture directe (rétrocompat). */
  | {
      kind: "system";
      path: string;
      faceIndex: number;
      family: string;
    };

function parseBrandingPdfFont(b: Record<string, unknown>): BrandingPdfFont {
  const raw = b.pdfFont;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if (o.kind === "workspace") {
      const relativePath =
        typeof o.relativePath === "string" ? o.relativePath.trim() : "";
      const displayFamily =
        typeof o.displayFamily === "string" ? o.displayFamily.trim() : "";
      if (relativePath && displayFamily) {
        return { kind: "workspace", relativePath, displayFamily };
      }
    }
    if (o.kind === "system") {
      const path = typeof o.path === "string" ? o.path : "";
      const faceIndex =
        typeof o.faceIndex === "number" && Number.isFinite(o.faceIndex)
          ? Math.trunc(o.faceIndex)
          : 0;
      const family = typeof o.family === "string" ? o.family : "";
      if (path.trim() && family.trim()) {
        return { kind: "system", path, faceIndex, family };
      }
    }
    if (o.kind === "builtin") {
      return {
        kind: "builtin",
        builtinId: normalizePdfBodyFontId(
          typeof o.builtinId === "string" ? o.builtinId : undefined,
        ),
      };
    }
    if (o.kind === "catalog") {
      const fontId = typeof o.fontId === "string" ? o.fontId : "";
      if (isCatalogPdfFontId(fontId)) return { kind: "catalog", fontId };
    }
  }
  const legacy = normalizePdfBodyFontId(
    typeof b.pdfBodyFont === "string" ? b.pdfBodyFont : undefined,
  );
  return { kind: "builtin", builtinId: legacy };
}

function serializeBrandingPdfFont(p: BrandingPdfFont): Record<string, unknown> {
  if (p.kind === "builtin") {
    return { kind: "builtin", builtinId: p.builtinId };
  }
  if (p.kind === "catalog") {
    return { kind: "catalog", fontId: p.fontId };
  }
  if (p.kind === "workspace") {
    return {
      kind: "workspace",
      relativePath: p.relativePath,
      displayFamily: p.displayFamily,
    };
  }
  return {
    kind: "system",
    path: p.path,
    faceIndex: p.faceIndex,
    family: p.family,
  };
}

export type DocumentBlockToggles = {
  showLogo: boolean;
  showTagline: boolean;
  showLegalFooter: boolean;
  showTaxBreakdown: boolean;
  /** Numéro du document (ex. DEV-xxxxx / FAC-xxxxx) sur le PDF exporté uniquement. */
  showDocumentNumberOnPdf: boolean;
};

export type DocumentLayoutState = {
  /** Modèle PDF par défaut pour les nouveaux documents (surcharge possible sur chaque devis/facture). */
  defaultPdfVariant: PdfTemplateVariantId;
  quote: DocumentBlockToggles;
  invoice: DocumentBlockToggles;
  footerText: string;
  /** Si le module Projets est actif et le document a un projet : afficher le libellé sur les PDF devis / facture / BDC. */
  showProjectOnPdf: boolean;
  /** Typo par blocs (appliquée seulement si le module Marketplace est actif). */
  pdfTypography: PdfTypographyState;
};

const defaultToggles = (): DocumentBlockToggles => ({
  showLogo: true,
  showTagline: true,
  showLegalFooter: true,
  showTaxBreakdown: true,
  showDocumentNumberOnPdf: true,
});

export function defaultDocumentLayout(): DocumentLayoutState {
  return {
    defaultPdfVariant: "classic",
    quote: defaultToggles(),
    invoice: defaultToggles(),
    footerText: "",
    showProjectOnPdf: true,
    pdfTypography: defaultPdfTypography(),
  };
}

function parseToggles(
  raw: unknown,
  fallback: DocumentBlockToggles,
): DocumentBlockToggles {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  const o = raw as Record<string, unknown>;
  return {
    showLogo: typeof o.showLogo === "boolean" ? o.showLogo : fallback.showLogo,
    showTagline:
      typeof o.showTagline === "boolean" ? o.showTagline : fallback.showTagline,
    showLegalFooter:
      typeof o.showLegalFooter === "boolean"
        ? o.showLegalFooter
        : fallback.showLegalFooter,
    showTaxBreakdown:
      typeof o.showTaxBreakdown === "boolean"
        ? o.showTaxBreakdown
        : fallback.showTaxBreakdown,
    showDocumentNumberOnPdf:
      typeof o.showDocumentNumberOnPdf === "boolean"
        ? o.showDocumentNumberOnPdf
        : fallback.showDocumentNumberOnPdf,
  };
}

export function parseDocumentLayout(profileJson: string): DocumentLayoutState {
  const d = defaultDocumentLayout();
  try {
    const p = JSON.parse(profileJson || "{}") as Record<string, unknown>;
    const raw = p.documentLayout;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return d;
    const o = raw as Record<string, unknown>;
    let defaultPdfVariant = parsePdfTemplateVariantId(
      typeof o.defaultPdfVariant === "string" ? o.defaultPdfVariant : "",
      d.defaultPdfVariant,
    );
    if (typeof o.preset === "string" && !o.defaultPdfVariant) {
      if (o.preset === "minimal") defaultPdfVariant = "modern";
      else if (o.preset === "classic") defaultPdfVariant = "classic";
    }
    return {
      defaultPdfVariant,
      quote: parseToggles(o.quote, d.quote),
      invoice: parseToggles(o.invoice, d.invoice),
      footerText:
        typeof o.footerText === "string" ? o.footerText : d.footerText,
      showProjectOnPdf:
        typeof o.showProjectOnPdf === "boolean"
          ? o.showProjectOnPdf
          : d.showProjectOnPdf,
      pdfTypography: parsePdfTypography(o.pdfTypography),
    };
  } catch {
    return d;
  }
}

export function mergeDocumentLayoutIntoProfile(
  base: Record<string, unknown>,
  layout: DocumentLayoutState,
): Record<string, unknown> {
  return { ...base, documentLayout: layout };
}

/** Variante effective pour un devis ou facture (surcharge document ou défaut espace). */
export function resolvePdfTemplateVariant(
  documentOverride: string | null | undefined,
  layout: DocumentLayoutState,
): PdfTemplateVariantId {
  const t = (documentOverride ?? "").trim();
  if (t && isPdfTemplateVariantId(t)) return t;
  return layout.defaultPdfVariant;
}

/** Position horizontale du logo sur les PDF (titre et slogan restent alignés à gauche). */
export type BrandingLogoAlignment = "left" | "center" | "right";

function parseBrandingLogoAlignment(v: unknown): BrandingLogoAlignment {
  if (v === "center" || v === "right") return v;
  return "left";
}

export type BrandingState = {
  documentTitle: string;
  tagline: string;
  logoRelativePath: string;
  logoAlignment: BrandingLogoAlignment;
  pdfFont: BrandingPdfFont;
  /** Polices importées mémorisées pour cet espace (sélection ultérieure). */
  importedWorkspaceFonts: BrandingImportedWorkspaceFont[];
};

export function parseBranding(profileJson: string): BrandingState {
  try {
    const p = JSON.parse(profileJson || "{}") as Record<string, unknown>;
    const b =
      p.branding &&
      typeof p.branding === "object" &&
      !Array.isArray(p.branding)
        ? (p.branding as Record<string, unknown>)
        : {};
    const pdfFont = parseBrandingPdfFont(b);
    let importedWorkspaceFonts = parseImportedWorkspaceFonts(b);
    if (
      pdfFont.kind === "workspace" &&
      !importedWorkspaceFonts.some(
        (e) => e.relativePath === pdfFont.relativePath,
      )
    ) {
      importedWorkspaceFonts = [
        ...importedWorkspaceFonts,
        {
          relativePath: pdfFont.relativePath,
          label: pdfFont.displayFamily,
        },
      ];
    }
    return {
      documentTitle:
        typeof b.documentTitle === "string" ? b.documentTitle : "",
      tagline: typeof b.tagline === "string" ? b.tagline : "",
      logoRelativePath:
        typeof b.logoRelativePath === "string" ? b.logoRelativePath : "",
      logoAlignment: parseBrandingLogoAlignment(b.logoAlignment),
      pdfFont,
      importedWorkspaceFonts,
    };
  } catch {
    return {
      documentTitle: "",
      tagline: "",
      logoRelativePath: "",
      logoAlignment: "left",
      pdfFont: { kind: "builtin", builtinId: "helvetica" },
      importedWorkspaceFonts: [],
    };
  }
}

/** Fusionne le bloc `branding` dans un profil déjà fusionné (adresse, SIRET, etc.). */
export function mergeBrandingIntoProfile(
  base: Record<string, unknown>,
  branding: BrandingState,
): Record<string, unknown> {
  const out = { ...base };
  const b: Record<string, unknown> = {};
  const dt = branding.documentTitle.trim();
  const tg = branding.tagline.trim();
  const lp = branding.logoRelativePath.trim();
  if (dt) b.documentTitle = dt;
  if (tg) b.tagline = tg;
  if (lp) b.logoRelativePath = lp;
  b.logoAlignment = branding.logoAlignment;
  b.pdfFont = serializeBrandingPdfFont(branding.pdfFont);
  b.importedWorkspaceFonts = branding.importedWorkspaceFonts
    .map((e) => ({
      relativePath: e.relativePath.trim(),
      label: e.label.trim(),
    }))
    .filter((e) => e.relativePath.length > 0 && e.label.length > 0);
  if (Object.keys(b).length === 0) delete out.branding;
  else out.branding = b;
  return out;
}

/** Bandeau « personnalisez vos documents » masqué une fois pour l’espace. */
export function parseDocumentOnboardingMuted(profileJson: string): boolean {
  try {
    const p = JSON.parse(profileJson || "{}") as Record<string, unknown>;
    const h = p.hints;
    if (!h || typeof h !== "object" || Array.isArray(h)) return false;
    return (h as Record<string, unknown>).documentOnboardingMuted === true;
  } catch {
    return false;
  }
}

export function mergeDocumentOnboardingMuted(
  base: Record<string, unknown>,
): Record<string, unknown> {
  const hints =
    base.hints &&
    typeof base.hints === "object" &&
    !Array.isArray(base.hints)
      ? { ...(base.hints as Record<string, unknown>) }
      : {};
  hints.documentOnboardingMuted = true;
  return { ...base, hints };
}

/** Borne inf. / sup. pour `linePricesFractionDigits` (profil + UI). */
export const LINE_PRICES_FRACTION_DIGITS_MIN = 2;
export const LINE_PRICES_FRACTION_DIGITS_MAX = 6;

export function clampLinePricesFractionDigits(n: number): number {
  const t = Math.trunc(Number(n));
  if (!Number.isFinite(t)) return LINE_PRICES_FRACTION_DIGITS_MIN;
  return Math.min(
    LINE_PRICES_FRACTION_DIGITS_MAX,
    Math.max(LINE_PRICES_FRACTION_DIGITS_MIN, t),
  );
}

/** Saisie des lignes devis / factures (`profile_json.documentInputPreferences`). */
export type DocumentInputPreferences = {
  /** Décimales pour prix unitaire HT (arrondi catalogue + variante, affichage champ). */
  linePricesFractionDigits: number;
};

export function defaultDocumentInputPreferences(): DocumentInputPreferences {
  return { linePricesFractionDigits: LINE_PRICES_FRACTION_DIGITS_MIN };
}

export function parseDocumentInputPreferences(
  profileJson: string,
): DocumentInputPreferences {
  const defaults = defaultDocumentInputPreferences();
  try {
    const p = JSON.parse(profileJson || "{}") as Record<string, unknown>;
    const raw = p.documentInputPreferences;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
    const o = raw as Record<string, unknown>;
    return {
      linePricesFractionDigits: clampLinePricesFractionDigits(
        Number(o.linePricesFractionDigits),
      ),
    };
  } catch {
    return defaults;
  }
}

export function mergeDocumentInputPreferencesIntoProfile(
  base: Record<string, unknown>,
  prefs: DocumentInputPreferences,
): Record<string, unknown> {
  const prev =
    base.documentInputPreferences &&
    typeof base.documentInputPreferences === "object" &&
    !Array.isArray(base.documentInputPreferences)
      ? { ...(base.documentInputPreferences as Record<string, unknown>) }
      : {};
  return {
    ...base,
    documentInputPreferences: {
      ...prev,
      linePricesFractionDigits: clampLinePricesFractionDigits(
        prefs.linePricesFractionDigits,
      ),
    },
  };
}

export type QuoteWorkspacePreferences = {
  allowCustomReference: boolean;
  /** Inséré dans le modèle via le jeton `{PREFIX}`. */
  customReferencePrefix: string;
  /**
   * Jetons : `{AUTO}` (prochain DEV-xxxxx / FAC-xxxxx), `{PREFIX}`, `{YYYY}`, `{YY}`, `{MM}`, `{DD}`.
   * Documenté pour référence ; la saisie de la référence sur le devis / la facture reste libre.
   */
  customReferenceTemplate: string;
  /** Préremplissage du champ référence pour chaque **nouveau** devis (saisie libre). */
  defaultCustomReference: string;
};

export function defaultQuoteWorkspacePreferences(): QuoteWorkspacePreferences {
  return {
    allowCustomReference: false,
    customReferencePrefix: "",
    customReferenceTemplate: "",
    defaultCustomReference: "",
  };
}

function parseQuotePrefString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function parseQuoteWorkspacePreferences(
  profileJson: string,
): QuoteWorkspacePreferences {
  const defaults = defaultQuoteWorkspacePreferences();
  try {
    const p = JSON.parse(profileJson || "{}") as Record<string, unknown>;
    const raw = p.quotePreferences;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
    const o = raw as Record<string, unknown>;
    return {
      allowCustomReference:
        typeof o.allowCustomReference === "boolean"
          ? o.allowCustomReference
          : defaults.allowCustomReference,
      customReferencePrefix: parseQuotePrefString(o.customReferencePrefix),
      customReferenceTemplate: parseQuotePrefString(o.customReferenceTemplate),
      defaultCustomReference: parseQuotePrefString(o.defaultCustomReference),
    };
  } catch {
    return defaults;
  }
}

export function mergeQuoteWorkspacePreferencesIntoProfile(
  base: Record<string, unknown>,
  prefs: QuoteWorkspacePreferences,
): Record<string, unknown> {
  const prev =
    base.quotePreferences &&
    typeof base.quotePreferences === "object" &&
    !Array.isArray(base.quotePreferences)
      ? { ...(base.quotePreferences as Record<string, unknown>) }
      : {};
  return {
    ...base,
    quotePreferences: {
      ...prev,
      allowCustomReference: prefs.allowCustomReference === true,
      customReferencePrefix: prefs.customReferencePrefix,
      customReferenceTemplate: prefs.customReferenceTemplate,
      defaultCustomReference: prefs.defaultCustomReference,
    },
  };
}

/** Préférences factures (`profile_json.invoicePreferences`). */
export type InvoiceWorkspacePreferences = QuoteWorkspacePreferences & {
  /**
   * Si vrai, le contenu d’une facture (pas un avoir) n’est plus modifiable
   * dès que le statut n’est plus « brouillon ». Défaut : actif.
   */
  lockIssuedInvoices: boolean;
};

export function defaultInvoiceWorkspacePreferences(): InvoiceWorkspacePreferences {
  return {
    ...defaultQuoteWorkspacePreferences(),
    lockIssuedInvoices: true,
  };
}

/** Contenu verrouillé : facture classique, plus en brouillon, option d’espace active. */
export function issuedInvoiceContentLocked(
  sel: { documentKind?: string | null; status: string } | null | undefined,
  prefs: Pick<InvoiceWorkspacePreferences, "lockIssuedInvoices">,
): boolean {
  if (!sel || !prefs.lockIssuedInvoices) return false;
  if ((sel.documentKind ?? "invoice") !== "invoice") return false;
  return sel.status.trim() !== "draft";
}

export function parseInvoiceWorkspacePreferences(
  profileJson: string,
): InvoiceWorkspacePreferences {
  const defaults = defaultInvoiceWorkspacePreferences();
  try {
    const p = JSON.parse(profileJson || "{}") as Record<string, unknown>;
    const raw = p.invoicePreferences;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
    const o = raw as Record<string, unknown>;
    return {
      allowCustomReference:
        typeof o.allowCustomReference === "boolean"
          ? o.allowCustomReference
          : defaults.allowCustomReference,
      customReferencePrefix: parseQuotePrefString(o.customReferencePrefix),
      customReferenceTemplate: parseQuotePrefString(o.customReferenceTemplate),
      defaultCustomReference: parseQuotePrefString(o.defaultCustomReference),
      lockIssuedInvoices:
        typeof o.lockIssuedInvoices === "boolean"
          ? o.lockIssuedInvoices
          : defaults.lockIssuedInvoices,
    };
  } catch {
    return defaults;
  }
}

export function mergeInvoiceWorkspacePreferencesIntoProfile(
  base: Record<string, unknown>,
  prefs: InvoiceWorkspacePreferences,
): Record<string, unknown> {
  const prev =
    base.invoicePreferences &&
    typeof base.invoicePreferences === "object" &&
    !Array.isArray(base.invoicePreferences)
      ? { ...(base.invoicePreferences as Record<string, unknown>) }
      : {};
  return {
    ...base,
    invoicePreferences: {
      ...prev,
      allowCustomReference: prefs.allowCustomReference === true,
      customReferencePrefix: prefs.customReferencePrefix,
      customReferenceTemplate: prefs.customReferenceTemplate,
      defaultCustomReference: prefs.defaultCustomReference,
      lockIssuedInvoices: prefs.lockIssuedInvoices !== false,
    },
  };
}
