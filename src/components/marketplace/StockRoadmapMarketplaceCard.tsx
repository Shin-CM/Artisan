import * as React from "react";
import { ChevronRight, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StockSolutionRoadmapEntry } from "@/features/stock/stockBridge";
import {
  marketplaceCardArticleClass,
  marketplaceCardButtonClass,
  marketplaceCardIconFrameClass,
  marketplaceCardTitleClass,
  marketplaceChevronClass,
  marketplaceDialogBodyClass,
  marketplaceDialogContentClass,
  marketplaceDialogHeroClass,
  marketplaceDialogLeadClass,
  marketplaceDialogTitleClass,
  marketplaceModalIconFrameClass,
} from "@/components/marketplace/marketplaceLuxuryClasses";

export function StockRoadmapMarketplaceCard({
  entry,
}: {
  entry: StockSolutionRoadmapEntry;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        className={marketplaceCardButtonClass}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <article className={marketplaceCardArticleClass}>
          <div className={marketplaceCardIconFrameClass}>
            <Package className="h-4 w-4 text-[var(--color-muted-foreground)]" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <h3 className={marketplaceCardTitleClass}>{entry.displayName}</h3>
          </div>
          <ChevronRight className={marketplaceChevronClass} aria-hidden />
        </article>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={marketplaceDialogContentClass}>
          <div className={marketplaceDialogHeroClass}>
            <div className={marketplaceModalIconFrameClass}>
              <Package className="h-5 w-5" />
            </div>
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className={marketplaceDialogTitleClass}>
                {entry.displayName}
              </DialogTitle>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Prévu — {entry.waveLabel}
              </p>
            </DialogHeader>
          </div>
          <div className={marketplaceDialogBodyClass}>
            <p className={marketplaceDialogLeadClass}>{entry.summary}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {entry.detail}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Cette solution n’est pas encore activable depuis la Marketplace.
              Elle sera proposée comme extension distincte, cumulable avec les
              solutions de quantité déjà disponibles.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
