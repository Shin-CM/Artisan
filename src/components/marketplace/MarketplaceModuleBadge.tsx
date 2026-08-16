import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Pastille discrète : indique que la zone dépend d’un module Marketplace ;
 * le clic ouvre la page Marketplace (ancre fiche module si fournie dans `to`).
 */
export function MarketplaceModuleBadge({
  to,
  className,
}: {
  to: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={to}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
            className,
          )}
          aria-label="Ouvrir la fiche du module dans la Marketplace"
        >
          <Store className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="left">Marketplace — fiche du module</TooltipContent>
    </Tooltip>
  );
}
