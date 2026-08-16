import type { MarketplaceCatalogEntry } from "@/lib/marketplaceExtensionCatalog";
import { DataManagerLazyLoadMarketplaceCard } from "@/components/marketplace/DataManagerLazyLoadMarketplaceCard";
import {
  ClientFollowupMarketplaceCard,
  CrmPipelineMarketplaceCard,
  DocumentCreditNotesMarketplaceCard,
  DocumentProjectsMarketplaceCard,
  DocumentPurchaseOrdersMarketplaceCard,
  LocalTabletApiMarketplaceCard,
  RecoveryAssistedMarketplaceCard,
  StockManagerMarketplaceCard,
} from "@/components/marketplace/DocumentFeatureMarketplaceCard";
import { PdfTypographyMarketplaceCard } from "@/components/marketplace/PdfTypographyMarketplaceCard";
import {
  marketplaceEmptySlotClass,
  marketplaceGalleryGridGapClass,
} from "@/components/marketplace/marketplaceLuxuryClasses";
import { cn } from "@/lib/utils";

function ExtensionRow({ entry }: { entry: MarketplaceCatalogEntry }) {
  switch (entry.id) {
    case "pdf-typography":
      return <PdfTypographyMarketplaceCard />;
    case "data-manager-lazy":
      return <DataManagerLazyLoadMarketplaceCard />;
    case "stock-manager":
      return <StockManagerMarketplaceCard />;
    case "document-purchase-orders":
      return <DocumentPurchaseOrdersMarketplaceCard />;
    case "document-credit-notes":
      return <DocumentCreditNotesMarketplaceCard />;
    case "document-projects":
      return <DocumentProjectsMarketplaceCard />;
    case "crm-pipeline":
      return <CrmPipelineMarketplaceCard />;
    case "recovery-assisted":
      return <RecoveryAssistedMarketplaceCard />;
    case "client-followup":
      return <ClientFollowupMarketplaceCard />;
    case "local-tablet-api":
      return <LocalTabletApiMarketplaceCard />;
    default:
      return null;
  }
}

/** Emplacement vide pour compléter les rangées (2 col. sm / 4 col. lg). */
function ExtensionGalleryEmptySlot({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(marketplaceEmptySlotClass, className)}
      aria-hidden
    />
  );
}

/**
 * Galerie d’extensions : grille responsive (1 / 2 / 4 colonnes), emplacements
 * vides pour combler la dernière rangée sans inventer de modules.
 */
export function MarketplaceExtensionCatalog({
  entries,
}: {
  entries: MarketplaceCatalogEntry[];
}) {
  if (entries.length === 0) {
    return (
      <div className="w-full min-w-0">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Aucune extension dans cette vue pour le moment.
        </p>
      </div>
    );
  }

  const n = entries.length;
  const fillersSm = (2 - (n % 2)) % 2;
  const fillersLg = (4 - (n % 4)) % 4;

  return (
    <div
      className={cn(
        "grid w-full min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        marketplaceGalleryGridGapClass,
      )}
      role="list"
    >
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex w-full min-w-0 items-center justify-center"
          role="listitem"
        >
          <ExtensionRow entry={entry} />
        </div>
      ))}
      {Array.from({ length: fillersSm }).map((_, i) => (
        <ExtensionGalleryEmptySlot
          key={`slot-sm-${i}`}
          className="hidden sm:block lg:hidden"
        />
      ))}
      {Array.from({ length: fillersLg }).map((_, i) => (
        <ExtensionGalleryEmptySlot key={`slot-lg-${i}`} className="hidden lg:block" />
      ))}
    </div>
  );
}
