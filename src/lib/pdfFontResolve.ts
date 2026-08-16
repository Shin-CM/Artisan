import { Font } from "@react-pdf/renderer";
import { isTauri } from "@tauri-apps/api/core";
import * as api from "@/lib/api";
import type { BrandingPdfFont } from "@/lib/documentOptions";
import { reactPdfBodyFontFamily } from "@/lib/pdfBodyFont";
import { findCatalogPdfFont } from "@/lib/pdfFontCatalog";

/**
 * @react-pdf empile les `Font.register` pour une même `family` : la résolution
 * garde la **première** source au poids 400 — changer de police fichier sans nom
 * de famille distinct faisait rester l’ancienne police (aperçu / export successifs).
 */
function stableFamilyNameFromKey(prefix: string, key: string): string {
  const s = `${prefix}\0${key}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `ArtisanPdf_${(h >>> 0).toString(36)}`;
}

let lastSystemFontKey: string | null = null;
let lastResolvedSystemFamily: string | null = null;
let lastCatalogFontId: string | null = null;
let lastResolvedCatalogFamily: string | null = null;
let lastWorkspaceFontKey: string | null = null;
let lastResolvedWorkspaceFamily: string | null = null;

function systemFontKey(p: Extract<BrandingPdfFont, { kind: "system" }>): string {
  return `${p.path}\0${p.faceIndex}`;
}

function workspaceFontKey(
  workspaceId: string,
  p: Extract<BrandingPdfFont, { kind: "workspace" }>,
): string {
  return `${workspaceId}\0${p.relativePath}`;
}

function fontDataUrlMime(path: string): string {
  const ext = path.replace(/^.*\./, "").toLowerCase();
  if (ext === "ttf") return "font/ttf";
  if (ext === "otf") return "font/otf";
  return "application/octet-stream";
}

function registerDataUrlFamily(family: string, dataUrl: string): void {
  /**
   * Trois faces seulement : une 4ᵉ (700 + italic) avec la même data URL faisait
   * planter fontkit dans certains cas (`undefined.tables` au parse cmap).
   */
  Font.register({
    family,
    fonts: [
      { src: dataUrl, fontWeight: 400, fontStyle: "normal" },
      { src: dataUrl, fontWeight: 700, fontStyle: "normal" },
      { src: dataUrl, fontWeight: 400, fontStyle: "italic" },
    ],
  });
}

/**
 * Résout le nom de famille à passer à `stylesForPdfVariant` : polices PDF
 * intégrées, bibliothèque, copie workspace, ou (rétrocompat) lecture système.
 * En cas d’échec chargeable, lève une Error avec un message utilisateur.
 */
export async function resolvePdfExportBodyFontFamily(
  pdfFont: BrandingPdfFont,
  workspaceId: string,
): Promise<string> {
  if (pdfFont.kind === "builtin") {
    lastSystemFontKey = null;
    lastResolvedSystemFamily = null;
    lastCatalogFontId = null;
    lastResolvedCatalogFamily = null;
    lastWorkspaceFontKey = null;
    lastResolvedWorkspaceFamily = null;
    return reactPdfBodyFontFamily(pdfFont.builtinId);
  }

  if (pdfFont.kind === "catalog") {
    lastWorkspaceFontKey = null;
    lastResolvedWorkspaceFamily = null;
    lastSystemFontKey = null;
    lastResolvedSystemFamily = null;
    const entry = findCatalogPdfFont(pdfFont.fontId);
    if (!entry) {
      throw new Error("Police de bibliothèque inconnue ou retirée.");
    }
    if (lastCatalogFontId === entry.id && lastResolvedCatalogFamily) {
      return lastResolvedCatalogFamily;
    }
    const baseFonts: {
      src: string;
      fontWeight: number;
      fontStyle: "normal" | "italic";
    }[] = [
      { src: entry.sources.regular, fontWeight: 400, fontStyle: "normal" },
      { src: entry.sources.bold, fontWeight: 700, fontStyle: "normal" },
      { src: entry.sources.italic, fontWeight: 400, fontStyle: "italic" },
    ];
    const bi = entry.sources.boldItalic?.trim();
    try {
      Font.register({
        family: entry.family,
        fonts: bi
          ? [
              ...baseFonts,
              { src: bi, fontWeight: 700, fontStyle: "italic" },
            ]
          : baseFonts,
      });
      lastCatalogFontId = entry.id;
      lastResolvedCatalogFamily = entry.family;
      return entry.family;
    } catch (eFirst) {
      if (bi) {
        try {
          Font.register({ family: entry.family, fonts: baseFonts });
          lastCatalogFontId = entry.id;
          lastResolvedCatalogFamily = entry.family;
          return entry.family;
        } catch {
          /* fallthrough */
        }
      }
      lastCatalogFontId = null;
      lastResolvedCatalogFamily = null;
      throw new Error(
        `Impossible de charger la police « ${entry.label} » (réseau ou format). ${String(eFirst)}`,
      );
    }
  }

  if (pdfFont.kind === "workspace") {
    lastCatalogFontId = null;
    lastResolvedCatalogFamily = null;
    lastSystemFontKey = null;
    lastResolvedSystemFamily = null;
    const key = workspaceFontKey(workspaceId, pdfFont);
    if (lastWorkspaceFontKey === key && lastResolvedWorkspaceFamily) {
      return lastResolvedWorkspaceFamily;
    }
    const rel = pdfFont.relativePath.trim();
    if (!rel) {
      throw new Error("Chemin de police workspace invalide.");
    }
    const dataUrl = await api.readWorkspaceAssetBase64(workspaceId, rel);
    if (!dataUrl) {
      throw new Error(
        "Fichier de police introuvable dans les données de l’espace. Réimportez la police dans Paramètres → Branding.",
      );
    }
    const family = stableFamilyNameFromKey("ws", key);
    try {
      registerDataUrlFamily(family, dataUrl);
      lastWorkspaceFontKey = key;
      lastResolvedWorkspaceFamily = family;
      return family;
    } catch (e) {
      lastWorkspaceFontKey = null;
      lastResolvedWorkspaceFamily = null;
      throw new Error(
        `La police enregistrée n’a pas pu être utilisée pour le PDF. ${String(e)}`,
      );
    }
  }

  /* kind === "system" — rétrocompat */
  lastWorkspaceFontKey = null;
  lastResolvedWorkspaceFamily = null;
  lastCatalogFontId = null;
  lastResolvedCatalogFamily = null;

  if (!isTauri()) {
    throw new Error(
      "Cette police repose sur un fichier système : ouvrez Artisan en application de bureau, ou choisissez une police intégrée / bibliothèque / importée.",
    );
  }
  const key = systemFontKey(pdfFont);
  if (lastSystemFontKey === key && lastResolvedSystemFamily) {
    return lastResolvedSystemFamily;
  }
  const family = stableFamilyNameFromKey("sys", key);
  try {
    const b64 = await api.readFontFileBase64(pdfFont.path, pdfFont.faceIndex);
    const mime = fontDataUrlMime(pdfFont.path);
    const dataUrl = `data:${mime};base64,${b64}`;
    registerDataUrlFamily(family, dataUrl);
    lastSystemFontKey = key;
    lastResolvedSystemFamily = family;
    return family;
  } catch (e) {
    lastSystemFontKey = null;
    lastResolvedSystemFamily = null;
    throw new Error(
      `Impossible de lire la police système enregistrée (chemin ou format). Réimportez-la depuis Paramètres → Branding. ${String(e)}`,
    );
  }
}

/** Indique si le rendu PDF peut déclarer une face gras+italique (polices intégrées, fichier avec approximation, catalogue si URL dédiée). */
export function brandingPdfFontSupportsBoldItalic(
  pdfFont: BrandingPdfFont,
): boolean {
  if (pdfFont.kind === "builtin") return true;
  if (pdfFont.kind === "catalog") {
    const entry = findCatalogPdfFont(pdfFont.fontId);
    return Boolean(entry?.sources.boldItalic?.trim());
  }
  return false;
}
