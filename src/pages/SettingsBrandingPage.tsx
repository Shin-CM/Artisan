import * as React from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BrandingLogoHeaderCard,
} from "@/components/settings/branding/BrandingLogoHeaderCard";
import {
  SettingsBrandingPdfFontSection,
  type FontSourceTab,
} from "@/components/settings/branding/SettingsBrandingPdfFontSection";
import { useBrandingLogoPreview } from "@/hooks/useBrandingLogoPreview";
import {
  mergeBrandingIntoProfile,
  parseBranding,
  type BrandingState,
} from "@/lib/documentOptions";
import { getPdfFontCatalog } from "@/lib/pdfFontCatalog";
import { formatFontImportError } from "@/lib/pdfFontImportError";
import { resolvePdfExportBodyFontFamily } from "@/lib/pdfFontResolve";

export function SettingsBrandingPage() {
  const { active, refresh, refreshActiveWorkspace } = useWorkspace();
  const [branding, setBranding] = React.useState<BrandingState>({
    documentTitle: "",
    tagline: "",
    logoRelativePath: "",
    logoAlignment: "left",
    pdfFont: { kind: "builtin", builtinId: "helvetica" },
    importedWorkspaceFonts: [],
  });
  const [fontSourceTab, setFontSourceTab] =
    React.useState<FontSourceTab>("builtin");
  const [fontImportBusy, setFontImportBusy] = React.useState(false);
  const [fontImportError, setFontImportError] = React.useState<string | null>(
    null,
  );
  const [ttcFaceIndex, setTtcFaceIndex] = React.useState(0);
  const catalogFonts = React.useMemo(() => getPdfFontCatalog(), []);
  const logoPreviewDataUrl = useBrandingLogoPreview(
    active?.id,
    branding.logoRelativePath,
  );

  React.useEffect(() => {
    if (!active) return;
    const parsed = parseBranding(active.profileJson);
    setBranding(parsed);
    const pf = parsed.pdfFont;
    if (pf.kind === "builtin") setFontSourceTab("builtin");
    else if (pf.kind === "catalog") setFontSourceTab("catalog");
    else setFontSourceTab("installed");
  }, [active]);

  async function saveBranding() {
    if (!active) return;
    const pdfFont = branding.pdfFont;
    if (pdfFont.kind === "workspace") {
      if (!pdfFont.relativePath.trim() || !pdfFont.displayFamily.trim()) {
        toast.error("Import de police incomplet.");
        return;
      }
    }
    if (pdfFont.kind === "system") {
      toast.error(
        "Cette configuration utilise encore un chemin système. Importez un fichier de police pour le copier dans l’espace, puis enregistrez.",
      );
      return;
    }
    if (
      pdfFont.kind === "catalog" &&
      !catalogFonts.some((f) => f.id === pdfFont.fontId)
    ) {
      toast.error("Police de bibliothèque invalide.");
      return;
    }
    try {
      await resolvePdfExportBodyFontFamily(pdfFont, active.id);
    } catch (e) {
      toast.error(formatFontImportError(e));
      return;
    }
    let base: Record<string, unknown> = {};
    try {
      base = JSON.parse(active.profileJson || "{}") as Record<
        string,
        unknown
      >;
    } catch {
      base = {};
    }
    const profile = mergeBrandingIntoProfile(base, branding);
    try {
      await api.updateWorkspace(active.id, {
        name: active.name,
        entityType: active.entityType,
        countryCode: active.countryCode,
        baseCurrency: active.baseCurrency,
        pdfOutputDir: active.pdfOutputDir,
        profileJson: profile,
      });
      await refresh();
      await refreshActiveWorkspace();
      toast.success("Branding enregistré");
    } catch (e) {
      toast.error(String(e));
    }
  }

  if (!active) return null;

  return (
    <div className="h-full min-h-0 w-full min-w-0 space-y-6 overflow-y-auto">
      <div>
        <PageTitleWithInfo
          description="Logo, titre, slogan et police des PDF. Distinct de la mise en page (modèle, interrupteurs, textes enregistrés)."
        >
          <h1 className="text-xl font-semibold">Branding</h1>
        </PageTitleWithInfo>
      </div>

      <SettingsBrandingPdfFontSection
        workspace={active}
        branding={branding}
        setBranding={setBranding}
        fontSourceTab={fontSourceTab}
        setFontSourceTab={setFontSourceTab}
        fontImportError={fontImportError}
        setFontImportError={setFontImportError}
        fontImportBusy={fontImportBusy}
        setFontImportBusy={setFontImportBusy}
        ttcFaceIndex={ttcFaceIndex}
        setTtcFaceIndex={setTtcFaceIndex}
      />

      <BrandingLogoHeaderCard
        workspace={active}
        branding={branding}
        setBranding={setBranding}
        logoPreviewDataUrl={logoPreviewDataUrl}
      />

      <Button type="button" onClick={() => void saveBranding()}>
        Enregistrer
      </Button>
    </div>
  );
}
