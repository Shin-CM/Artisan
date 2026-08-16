import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DocumentActionItem = { id: string; label: string };

type Props = {
  items: DocumentActionItem[];
  onSelect: (id: string) => void;
  disabled?: boolean;
  align?: "start" | "center" | "end";
};

export function DocumentActionsMenu({
  items,
  onSelect,
  disabled,
  align = "end",
}: Props) {
  const [open, setOpen] = React.useState(false);
  if (items.length === 0) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="outline" disabled={disabled}>
          <MoreHorizontal className="mr-1 h-4 w-4" aria-hidden />
          Actions
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-[min(18rem,calc(100vw-2rem))] p-1"
      >
        <div role="menu" className="flex flex-col gap-0.5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={cn(
                "rounded-sm px-2 py-1.5 text-left text-sm text-[var(--color-foreground)]",
                "outline-none transition-colors hover:bg-[var(--color-muted)]/50",
                "focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
              )}
              onClick={() => {
                onSelect(item.id);
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
