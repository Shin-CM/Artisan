import * as React from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Titre de page avec aide : icône seule à droite du titre, texte dans une tooltip
 * (survol et focus clavier via Radix).
 */
export function PageTitleWithInfo({
  children,
  description,
  className,
  /** Libellé vocal du bouton d’information */
  infoAriaLabel = "Informations sur cette page",
}: {
  children: React.ReactNode;
  description: React.ReactNode;
  className?: string;
  infoAriaLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0",
        className,
      )}
    >
      {children}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            aria-label={infoAriaLabel}
          >
            <Info className="h-4 w-4" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          className="max-w-sm text-left font-normal leading-relaxed"
        >
          {description}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
