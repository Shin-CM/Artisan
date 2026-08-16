import type { Client } from "@/lib/api";
import { ClientSelectionPreview } from "@/components/ClientSelectionPreview";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function quoteStatusLabelFr(status: string): string {
  const m: Record<string, string> = {
    draft: "Brouillon",
    sent: "Envoyé",
    accepted: "Accepté",
    rejected: "Refusé",
  };
  return m[status] ?? status;
}

function formatPreviewDate(iso: string): string {
  const t = iso.trim();
  if (!t) return "—";
  const d = new Date(t.includes("T") ? t : `${t}T12:00:00`);
  if (Number.isNaN(d.getTime())) return t;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export type QuotePdfImportMetaPreviewProps = {
  client: Client | null;
  baseCurrency: string;
  issueDate: string;
  status: string;
  subject: string;
  validUntil?: string | null;
  className?: string;
};

export function QuotePdfImportMetaPreview({
  client,
  baseCurrency,
  issueDate,
  status,
  subject,
  validUntil,
  className,
}: QuotePdfImportMetaPreviewProps) {
  const vu = validUntil?.trim();
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      <div className="space-y-2">
        <Label className="text-xs text-[var(--color-muted-foreground)]">
          Client
        </Label>
        {client ? (
          <ClientSelectionPreview
            client={client}
            baseCurrency={baseCurrency}
            variant="document"
          />
        ) : (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Aucun client associé
          </p>
        )}
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
          <div className="space-y-1">
            <Label className="text-xs text-[var(--color-muted-foreground)]">
              Date
            </Label>
            <p className="text-sm text-[var(--color-foreground)]">
              {formatPreviewDate(issueDate)}
            </p>
          </div>
          {vu ? (
            <div className="space-y-1">
              <Label className="text-xs text-[var(--color-muted-foreground)]">
                Valable jusqu’au
              </Label>
              <p className="text-sm text-[var(--color-foreground)]">
                {formatPreviewDate(vu)}
              </p>
            </div>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-[var(--color-muted-foreground)]">
            Statut
          </Label>
          <p className="text-sm text-[var(--color-foreground)]">
            {quoteStatusLabelFr(status)}
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-[var(--color-muted-foreground)]">
            Objet
          </Label>
          <p className="break-words text-sm text-[var(--color-foreground)]">
            {subject.trim() || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
