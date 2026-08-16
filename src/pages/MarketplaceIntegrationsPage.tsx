import { Plug } from "lucide-react";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { MarketplaceExtensionCatalog } from "@/components/marketplace/MarketplaceExtensionCatalog";
import { marketplaceExtensionCatalogForIntegrations } from "@/lib/marketplaceExtensionCatalog";

export function MarketplaceIntegrationsPage() {
  const catalog = marketplaceExtensionCatalogForIntegrations();

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-6 pb-2">
      <header className="flex w-full min-w-0 items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2">
          <Plug className="h-5 w-5 text-[var(--color-muted-foreground)]" />
        </div>
        <div className="min-w-0 flex-1">
          <PageTitleWithInfo
            description="Connecteurs et services optionnels : activez uniquement les modules utiles à votre espace. Les extensions expérimentales sont signalées sur leur fiche."
          >
            <h1 className="text-xl font-semibold">Intégrations & connecteurs</h1>
          </PageTitleWithInfo>
        </div>
      </header>

      <section className="w-full min-w-0 space-y-3">
        <h2 className="text-sm font-medium text-[var(--color-foreground)]">
          Extensions
        </h2>
        <MarketplaceExtensionCatalog entries={catalog} />
      </section>
    </div>
  );
}
