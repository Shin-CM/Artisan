import { Warehouse } from "lucide-react";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { MarketplaceExtensionCatalog } from "@/components/marketplace/MarketplaceExtensionCatalog";
import { StockRoadmapMarketplaceCard } from "@/components/marketplace/StockRoadmapMarketplaceCard";
import { STOCK_SOLUTION_ROADMAP } from "@/features/stock/stockBridge";
import { marketplaceExtensionCatalogForStock } from "@/lib/marketplaceExtensionCatalog";

export function MarketplaceStockPage() {
  const catalog = marketplaceExtensionCatalogForStock();

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-6 pb-2">
      <header className="flex w-full min-w-0 items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2">
          <Warehouse className="h-5 w-5 text-[var(--color-muted-foreground)]" />
        </div>
        <div className="min-w-0 flex-1">
          <PageTitleWithInfo
            description="Le module Stock Manager regroupe quantités, mouvements, seuils et alertes. Les extensions listées ci-dessous compléteront ce socle à terme."
          >
            <h1 className="text-xl font-semibold">Stock & inventaire</h1>
          </PageTitleWithInfo>
        </div>
      </header>

      <section className="w-full min-w-0 space-y-3">
        <h2 className="text-sm font-medium text-[var(--color-foreground)]">
          Module disponible
        </h2>
        <MarketplaceExtensionCatalog entries={catalog} />
      </section>

      <section className="w-full min-w-0 space-y-3">
        <h2 className="text-sm font-medium text-[var(--color-foreground)]">
          À venir
        </h2>
        <p className="max-w-3xl text-sm text-[var(--color-muted-foreground)]">
          Extensions prévues sur le même modèle Marketplace. Elles pourront se
          combiner avec les solutions ci-dessus selon les règles indiquées dans
          chaque fiche.
        </p>
        <div
          className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          role="list"
        >
          {STOCK_SOLUTION_ROADMAP.map((entry) => (
            <div
              key={entry.manifestId}
              className="flex w-full min-w-0 items-center justify-center"
              role="listitem"
            >
              <StockRoadmapMarketplaceCard entry={entry} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
