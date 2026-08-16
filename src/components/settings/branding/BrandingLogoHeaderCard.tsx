import type { Dispatch, SetStateAction } from "react";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import type { Workspace } from "@/lib/api";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type {
  BrandingLogoAlignment,
  BrandingState,
} from "@/lib/documentOptions";

export type BrandingLogoHeaderCardProps = {
  workspace: Workspace;
  branding: BrandingState;
  setBranding: Dispatch<SetStateAction<BrandingState>>;
  logoPreviewDataUrl: string | null;
};

export function BrandingLogoHeaderCard({
  workspace,
  branding,
  setBranding,
  logoPreviewDataUrl,
}: BrandingLogoHeaderCardProps) {
  const logoPositionChoices: {
    value: BrandingLogoAlignment;
    label: string;
    Icon: typeof AlignLeft;
  }[] = [
    { value: "left", label: "Gauche", Icon: AlignLeft },
    { value: "center", label: "Centre", Icon: AlignCenter },
    { value: "right", label: "Droite", Icon: AlignRight },
  ];

  return (
    <div className="rounded-lg border border-[var(--color-border)] p-4">
      <h2 className="text-sm font-semibold">Logo et en-tête</h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        Facultatif. Le logo est copié dans les données de l&apos;application.
      </p>
      <div className="mt-3 space-y-3">
        <div>
          <Label htmlFor="brand-dt">Titre sur les documents</Label>
          <Input
            id="brand-dt"
            className="mt-1"
            value={branding.documentTitle}
            onChange={(e) =>
              setBranding((b) => ({ ...b, documentTitle: e.target.value }))
            }
            placeholder="Ex. Raison sociale ou nom commercial"
          />
        </div>
        <div>
          <Label htmlFor="brand-tg">Sous-titre / slogan</Label>
          <Input
            id="brand-tg"
            className="mt-1"
            value={branding.tagline}
            onChange={(e) =>
              setBranding((b) => ({ ...b, tagline: e.target.value }))
            }
          />
        </div>
        <div className="flex flex-wrap items-start gap-3">
          {logoPreviewDataUrl ? (
            <div
              className="flex h-16 min-w-[4rem] max-w-[11rem] items-center justify-center rounded-md border border-[var(--color-border)] bg-white p-2 shadow-sm dark:bg-zinc-200 dark:ring-1 dark:ring-inset dark:ring-zinc-400/40"
              title="Aperçu du logo"
            >
              <img
                src={logoPreviewDataUrl}
                alt=""
                className="max-h-full w-auto max-w-full object-contain"
              />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                const src = await api.pickLogoFilePath();
                if (!src) {
                  toast.message("Aucun fichier choisi");
                  return;
                }
                try {
                  const rel = await api.copyWorkspaceLogoFromPath(
                    workspace.id,
                    src,
                  );
                  setBranding((b) => ({ ...b, logoRelativePath: rel }));
                  toast.success("Logo enregistré");
                } catch (e) {
                  toast.error(String(e));
                }
              }}
            >
              Choisir un logo
            </Button>
            {branding.logoRelativePath ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setBranding((b) => ({ ...b, logoRelativePath: "" }))
                }
              >
                Retirer le logo
              </Button>
            ) : null}
          </div>
        </div>
        <div>
          <Label>Position du logo sur le PDF</Label>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Le titre et le slogan restent alignés à gauche sous le logo.
          </p>
          <div
            className="mt-2 flex flex-wrap gap-1.5"
            role="group"
            aria-label="Position du logo sur le PDF"
          >
            {logoPositionChoices.map(({ value, label, Icon }) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={
                  branding.logoAlignment === value ? "default" : "outline"
                }
                className="gap-1.5"
                aria-pressed={branding.logoAlignment === value}
                onClick={() =>
                  setBranding((b) => ({ ...b, logoAlignment: value }))
                }
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
