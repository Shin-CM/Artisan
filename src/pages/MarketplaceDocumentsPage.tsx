import { FileStack } from "lucide-react";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { MarketplaceExtensionCatalog } from "@/components/marketplace/MarketplaceExtensionCatalog";
import { marketplaceExtensionCatalogForDocuments } from "@/lib/marketplaceExtensionCatalog";

export function MarketplaceDocumentsPage() {
  const catalog = marketplaceExtensionCatalogForDocuments();

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-6 pb-2">
      <header className="flex w-full min-w-0 items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2">
          <FileStack className="h-5 w-5 text-[var(--color-muted-foreground)]" />
        </div>
        <div className="min-w-0 flex-1">
          <PageTitleWithInfo
            description="Types de documents optionnels (bons de commande, avoirs, etc.) activables par espace. Ils s’intègrent à l’accueil et aux flux de conversion une fois activés."
          >
            <h1 className="text-xl font-semibold">Documents métier</h1>
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
