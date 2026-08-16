import { Archive, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HistorySection } from "./historyUtils";

export function HistorySidebar({
  section,
  onSectionChange,
}: {
  section: HistorySection;
  onSectionChange: (s: HistorySection) => void;
}) {
  return (
    <aside className="flex min-h-0 w-52 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-muted)]/20 p-2">
      <div className="mb-2 px-1 text-xs font-medium text-[var(--color-muted-foreground)]">
        Historique
      </div>
      <button
        type="button"
        onClick={() => onSectionChange("archives")}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
          section === "archives"
            ? "bg-[var(--color-muted)] font-medium"
            : "hover:bg-[var(--color-muted)]/60",
        )}
      >
        <Archive className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
        Archives
      </button>
      <button
        type="button"
        onClick={() => onSectionChange("manual")}
        className={cn(
          "mt-0.5 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
          section === "manual"
            ? "bg-[var(--color-muted)] font-medium"
            : "hover:bg-[var(--color-muted)]/60",
        )}
      >
        <TrendingUp className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
        CA manuel
      </button>
    </aside>
  );
}
