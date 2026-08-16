import * as React from "react";
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PdfTemplatePreviewThumb } from "@/components/PdfTemplatePreviewThumb";
import { cn, warningNoticeTextClassName } from "@/lib/utils";
import {
  PDF_TEMPLATE_VARIANTS,
  type PdfTemplateVariantId,
  isPdfTemplateVariantId,
} from "@/lib/pdfTemplateVariants";

/**
 * `value` : id de variante ou chaîne vide = utiliser le défaut de l’espace (`workspaceDefaultVariant`).
 */
export function DocumentPdfVariantPicker({
  value,
  onChange,
  workspaceDefaultVariant,
  allowVariantChoice = true,
  documentSurface = false,
}: {
  value: string;
  onChange: (next: string) => void;
  workspaceDefaultVariant: PdfTemplateVariantId;
  /** Offre gratuite : pas de choix, modèle Classique uniquement. */
  allowVariantChoice?: boolean;
  /** Intégré dans une feuille devis sans carte. */
  documentSurface?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const effectiveDefault: PdfTemplateVariantId = allowVariantChoice
    ? workspaceDefaultVariant
    : "classic";

  const defMeta = PDF_TEMPLATE_VARIANTS.find((x) => x.id === effectiveDefault);
  const defLabel = defMeta?.label ?? "Classique";

  const previewVariant: PdfTemplateVariantId =
    value.trim() && isPdfTemplateVariantId(value)
      ? value
      : effectiveDefault;

  const displayLabel =
    value.trim() === ""
      ? `Défaut espace (${defLabel})`
      : PDF_TEMPLATE_VARIANTS.find((x) => x.id === value)?.label ??
        defLabel;

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div
      className={
        documentSurface
          ? "border-t border-[var(--color-border)] py-3"
          : "rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/40 p-4"
      }
    >
      <Label className="text-sm font-medium">Modèle PDF pour ce document</Label>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        Le modèle s’applique à l’aperçu et à l’export PDF de{" "}
        <strong>ce document</strong> uniquement.
        {!allowVariantChoice && (
          <span className={cn(warningNoticeTextClassName, "mt-1 block text-xs")}>
            Offre gratuite : le rendu Classique est imposé.
          </span>
        )}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div
          className="flex shrink-0 items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          aria-live="polite"
        >
          <div className="w-[5.75rem] shrink-0">
            <PdfTemplatePreviewThumb
              variant={previewVariant}
              className="h-[4.25rem] w-full"
            />
          </div>
          <div className="min-w-0 max-w-[11rem]">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Modèle sélectionné
            </p>
            <p className="text-sm font-medium leading-snug text-[var(--color-foreground)]">
              {displayLabel}
            </p>
          </div>
        </div>

        {allowVariantChoice && (
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => setOpen(true)}
          >
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Choisir un modèle
          </Button>
        )}
      </div>

      <Dialog open={open && allowVariantChoice} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(32rem,90vh)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choisir un modèle PDF</DialogTitle>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Sélectionnez le rendu souhaité pour ce document. « Défaut de
              l’espace » reprend le réglage défini dans Paramètres → Mise en
              page PDF ({defLabel}).
            </p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => pick("")}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
                value === ""
                  ? "border-[var(--color-foreground)] bg-[var(--color-muted)] ring-2 ring-[var(--color-ring)] ring-offset-2"
                  : "border-[var(--color-border)] hover:bg-[var(--color-muted)]/50",
              )}
            >
              <span className="text-xs font-medium">Défaut de l’espace</span>
              <span className="text-[11px] text-[var(--color-muted-foreground)]">
                ({defLabel})
              </span>
              <PdfTemplatePreviewThumb variant={effectiveDefault} />
            </button>

            {PDF_TEMPLATE_VARIANTS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => pick(v.id)}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
                  value === v.id
                    ? "border-[var(--color-foreground)] bg-[var(--color-muted)] ring-2 ring-[var(--color-ring)] ring-offset-2"
                    : "border-[var(--color-border)] hover:bg-[var(--color-muted)]/50",
                )}
              >
                <span className="text-xs font-medium">{v.label}</span>
                <p className="line-clamp-2 text-[11px] text-[var(--color-muted-foreground)]">
                  {v.description}
                </p>
                <PdfTemplatePreviewThumb variant={v.id} />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
