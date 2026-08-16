import { Archive, Trash2 } from "lucide-react";
import type * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  formatQuoteDayHeading,
  type QuoteDayGroup,
} from "@/pages/documentEditor/quoteListGrouping";

type QuotesSidebarProps = {
  quoteGroups: QuoteDayGroup[];
  selectedId: string | null | undefined;
  fmt: (amount: number) => string;
  onNew: () => void;
  onSelect: (q: api.Quote) => void;
  onArchiveFromList: (q: api.Quote) => void;
  onDelete: (quoteId: string) => void;
  /** Défaut : « Devis ». */
  sidebarTitle?: string;
};

export function QuotesSidebar({
  quoteGroups,
  selectedId,
  fmt,
  onNew,
  onSelect,
  onArchiveFromList,
  onDelete,
  sidebarTitle = "Devis",
}: QuotesSidebarProps) {
  return (
    <div className="w-[12rem] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-muted)]/20 p-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{sidebarTitle}</span>
        <Button size="sm" variant="outline" onClick={onNew}>
          +
        </Button>
      </div>
      <div className="max-h-[70vh] space-y-3 overflow-auto text-xs leading-snug">
        {quoteGroups.map(({ day, items }) => (
          <div key={day}>
            <div className="sticky top-0 z-[1] border-b border-[var(--color-border)] bg-[var(--color-muted)]/50 px-1 py-1 text-xs font-semibold capitalize text-[var(--color-muted-foreground)]">
              {formatQuoteDayHeading(day)}
            </div>
            <ul className="space-y-1 pt-1">
              {items.map((q) => (
                <li
                  key={q.id}
                  className={cn(
                    "flex items-stretch gap-0.5 rounded-md",
                    selectedId === q.id && "bg-[var(--color-muted)]/80",
                  )}
                >
                  <button
                    type="button"
                    className={cn(
                      "min-w-0 flex-1 rounded-l px-2 py-1.5 text-left hover:bg-[var(--color-muted)]/60",
                      selectedId === q.id && "font-medium",
                    )}
                    onClick={() => onSelect(q)}
                  >
                    <span className="block leading-tight">
                      {q.title.trim() || "Sans titre"}
                    </span>
                    <span className="mt-0.5 block text-xs leading-tight text-[var(--color-muted-foreground)]">
                      {q.number} · {fmt(q.total)}
                    </span>
                  </button>
                  <div className="flex shrink-0 flex-col justify-center gap-0.5 py-0.5 pr-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                          aria-label="Archiver le devis"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void onArchiveFromList(q);
                          }}
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Archiver</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-[var(--color-muted-foreground)] hover:text-destructive"
                          aria-label="Supprimer le devis"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void onDelete(q.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Supprimer</TooltipContent>
                    </Tooltip>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
