import { Database } from "lucide-react";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { MarketplaceExtensionCatalog } from "@/components/marketplace/MarketplaceExtensionCatalog";
import { marketplaceExtensionCatalogForDonnees } from "@/lib/marketplaceExtensionCatalog";

export function MarketplaceDonneesPage() {
  const catalog = marketplaceExtensionCatalogForDonnees();

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-6 pb-2">
      <header className="flex w-full min-w-0 items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2">
          <Database className="h-5 w-5 text-[var(--color-muted-foreground)]" />
        </div>
        <div className="min-w-0 flex-1">
          <PageTitleWithInfo
            description="Modules liés au chargement et à l’exploitation des données (Data Manager, imports, vues lourdes). Les solutions stock sont dans l’onglet Stock."
          >
            <h1 className="text-xl font-semibold">Données & bases</h1>
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
