import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  mergeDocumentOnboardingMuted,
  parseDocumentOnboardingMuted,
} from "@/lib/documentOptions";

export function DocumentSetupBanner() {
  const { active, refresh, refreshActiveWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [dismissing, setDismissing] = React.useState(false);

  if (!active || parseDocumentOnboardingMuted(active.profileJson)) {
    return null;
  }

  async function dismiss() {
    if (!active) return;
    setDismissing(true);
    try {
      let prev: Record<string, unknown> = {};
      try {
        prev = JSON.parse(active.profileJson || "{}") as Record<
          string,
          unknown
        >;
      } catch {
        prev = {};
      }
      const profileJson = mergeDocumentOnboardingMuted(prev);
      await api.updateWorkspace(active.id, {
        name: active.name,
        entityType: active.entityType,
        countryCode: active.countryCode,
        baseCurrency: active.baseCurrency,
        pdfOutputDir: active.pdfOutputDir,
        profileJson,
      });
      await refresh();
      await refreshActiveWorkspace();
    } finally {
      setDismissing(false);
    }
  }

  return (
    <div
      role="status"
      className="mb-4 flex shrink-0 flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-[var(--color-foreground)]">
        <span className="font-medium">Personnalisez vos documents :</span>{" "}
        branding (logo, titres, police PDF), mise en page et textes
        réutilisables.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => void navigate("/settings/branding")}
        >
          Branding
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => void navigate("/settings/template")}
        >
          Mise en page PDF
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={dismissing}
          onClick={() => void dismiss()}
        >
          Masquer
        </Button>
      </div>
    </div>
  );
}
