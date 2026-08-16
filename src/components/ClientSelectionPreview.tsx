import type { Client } from "@/lib/api";
import { getClientPreviewBlock } from "@/lib/clientDetails";
import { cn } from "@/lib/utils";

export function ClientSelectionPreview({
  client,
  baseCurrency,
  variant = "document",
  className,
}: {
  client: Client;
  baseCurrency: string;
  variant?: "document" | "card";
  className?: string;
}) {
  const block = getClientPreviewBlock(client, baseCurrency);
  const hasDetail =
    block.contactLine ||
    block.billingLines.length > 0 ||
    block.email ||
    block.phone;

  const wrap = cn(
    "text-xs text-[var(--color-muted-foreground)]",
    variant === "document"
      ? "mt-1 space-y-0.5 border-l-2 border-[var(--color-border)] pl-2"
      : "mt-2 space-y-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/20 px-2 py-1.5",
    className,
  );

  if (!hasDetail) {
    return (
      <div className={wrap}>
        <p className="font-medium text-[var(--color-foreground)]">{block.fallbackName}</p>
      </div>
    );
  }

  return (
    <div className={wrap}>
      {block.contactLine ? (
        <p className="text-[var(--color-foreground)]">{block.contactLine}</p>
      ) : null}
      {block.billingLines.length > 0 ? (
        <div className="space-y-0.5 pt-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Adresse de facturation
          </p>
          {block.billingLines.map((line, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {line}
            </p>
          ))}
        </div>
      ) : null}
      {block.email ? <p>{block.email}</p> : null}
      {block.phone ? <p className="tabular-nums">{block.phone}</p> : null}
    </div>
  );
}
