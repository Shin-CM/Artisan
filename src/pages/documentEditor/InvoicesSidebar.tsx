import type * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  invoices: api.Invoice[];
  selectedId: string | null | undefined;
  fmt: (amount: number) => string;
  onNew: () => void;
  onSelect: (inv: api.Invoice) => void;
  /** Défaut : « Factures ». */
  sidebarTitle?: string;
};

export function InvoicesSidebar({
  invoices,
  selectedId,
  fmt,
  onNew,
  onSelect,
  sidebarTitle = "Factures",
}: Props) {
  return (
    <div className="w-[12rem] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-muted)]/20 p-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{sidebarTitle}</span>
        <Button size="sm" variant="outline" onClick={onNew}>
          +
        </Button>
      </div>
      <ul className="max-h-[70vh] space-y-1 overflow-auto text-sm">
        {invoices.map((inv) => (
          <li key={inv.id}>
            <button
              type="button"
              className={cn(
                "w-full rounded px-2 py-1.5 text-left hover:bg-[var(--color-muted)]",
                selectedId === inv.id && "bg-[var(--color-muted)] font-medium",
              )}
              onClick={() => onSelect(inv)}
            >
              {inv.number} · {fmt(inv.total)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
