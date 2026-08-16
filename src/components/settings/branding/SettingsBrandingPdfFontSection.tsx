import * as React from "react";
import { isTauri } from "@tauri-apps/api/core";
import type { Workspace } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { BrandingState } from "@/lib/documentOptions";
import {
  PDF_BODY_FONT_OPTIONS,
  type PdfBodyFontId,
} from "@/lib/pdfBodyFont";
import { getPdfFontCatalog, type CatalogPdfFontId } from "@/lib/pdfFontCatalog";
import { WorkspacePdfFontsInstalledPanel } from "./WorkspacePdfFontsInstalledPanel";

export type FontSourceTab = "builtin" | "catalog" | "installed";

export type SettingsBrandingPdfFontSectionProps = {
  workspace: Workspace;
  branding: BrandingState;
  setBranding: React.Dispatch<React.SetStateAction<BrandingState>>;
  fontSourceTab: FontSourceTab;
  setFontSourceTab: React.Dispatch<React.SetStateAction<FontSourceTab>>;
  fontImportError: string | null;
  setFontImportError: (value: string | null) => void;
  fontImportBusy: boolean;
  setFontImportBusy: (value: boolean) => void;
  ttcFaceIndex: number;
  setTtcFaceIndex: React.Dispatch<React.SetStateAction<number>>;
};

export function SettingsBrandingPdfFontSection({
  workspace,
  branding,
  setBranding,
  fontSourceTab,
  setFontSourceTab,
  fontImportError,
  setFontImportError,
  fontImportBusy,
  setFontImportBusy,
  ttcFaceIndex,
  setTtcFaceIndex,
}: SettingsBrandingPdfFontSectionProps) {
  const catalogFonts = React.useMemo(() => getPdfFontCatalog(), []);

  return (
    <div className="rounded-lg border border-[var(--color-border)] p-4">
      <h2 className="text-sm font-semibold">Police des PDF</h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        Polices intégrées, bibliothèque de l’app, ou fichiers copiés dans les
        données de l&apos;app (<strong>.ttf</strong>, <strong>.otf</strong>,{" "}
        <strong>.ttc</strong>) — mémorisés dans la bibliothèque de l&apos;espace
        pour les réutiliser. Vous restez responsable des licences.
      </p>

      <fieldset className="mt-3 space-y-2">
        <legend className="text-sm font-medium text-[var(--color-foreground)]">
          Source
        </legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="pdf-font-src"
              checked={fontSourceTab === "builtin"}
              onChange={() => {
                setFontSourceTab("builtin");
                setFontImportError(null);
                setBranding((b) => ({
                  ...b,
                  pdfFont:
                    b.pdfFont.kind === "builtin"
                      ? b.pdfFont
                      : { kind: "builtin", builtinId: "helvetica" },
                }));
              }}
            />
            Intégrée (sans fichier)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="pdf-font-src"
              checked={fontSourceTab === "catalog"}
              onChange={() => {
                setFontSourceTab("catalog");
                setFontImportError(null);
                setBranding((b) => ({
                  ...b,
                  pdfFont: {
                    kind: "catalog",
                    fontId:
                      b.pdfFont.kind === "catalog"
                        ? b.pdfFont.fontId
                        : catalogFonts[0]?.id ?? "inter",
                  },
                }));
              }}
            />
            Bibliothèque app (desktop/tablette)
          </label>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 text-sm",
              !isTauri() && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="radio"
              name="pdf-font-src"
              disabled={!isTauri()}
              checked={fontSourceTab === "installed"}
              onChange={() => {
                if (!isTauri()) return;
                setFontSourceTab("installed");
                setFontImportError(null);
              }}
            />
            Fichiers dans l&apos;espace (bibliothèque)
          </label>
        </div>
      </fieldset>

      {fontSourceTab === "builtin" ? (
        <div className="mt-3">
          <Label htmlFor="brand-font">Famille</Label>
          <select
            id="brand-font"
            className="mt-1 flex h-9 w-full max-w-md rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm focus:outline-none"
            value={
              branding.pdfFont.kind === "builtin"
                ? branding.pdfFont.builtinId
                : "helvetica"
            }
            onChange={(e) =>
              setBranding((b) => ({
                ...b,
                pdfFont: {
                  kind: "builtin",
                  builtinId: e.target.value as PdfBodyFontId,
                },
              }))
            }
          >
            {PDF_BODY_FONT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} — {o.description}
              </option>
            ))}
          </select>
        </div>
      ) : fontSourceTab === "catalog" ? (
        <div className="mt-3">
          <Label htmlFor="brand-font-catalog">Bibliothèque de polices</Label>
          <select
            id="brand-font-catalog"
            className="mt-1 flex h-9 w-full max-w-md rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm focus:outline-none"
            value={
              branding.pdfFont.kind === "catalog"
                ? branding.pdfFont.fontId
                : catalogFonts[0]?.id ?? "inter"
            }
            onChange={(e) =>
              setBranding((b) => ({
                ...b,
                pdfFont: {
                  kind: "catalog",
                  fontId: e.target.value as CatalogPdfFontId,
                },
              }))
            }
          >
            {catalogFonts.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} — {o.description}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            Ces polices sont prévues pour un flux identique desktop/tablette et
            peuvent être enrichies plus tard via la Marketplace.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {!isTauri() ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              L&apos;import d&apos;un fichier de police est disponible dans
              l&apos;application desktop (Tauri), pas en navigation web.
            </p>
          ) : (
            <WorkspacePdfFontsInstalledPanel
              workspace={workspace}
              branding={branding}
              setBranding={setBranding}
              fontImportError={fontImportError}
              setFontImportError={setFontImportError}
              fontImportBusy={fontImportBusy}
              setFontImportBusy={setFontImportBusy}
              ttcFaceIndex={ttcFaceIndex}
              setTtcFaceIndex={setTtcFaceIndex}
            />
          )}
        </div>
      )}
    </div>
  );
}
