import { Link } from "react-router-dom";
import { LayoutTemplate, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MarketplaceExtensionCatalog } from "@/components/marketplace/MarketplaceExtensionCatalog";
import { marketplaceExtensionCatalogForDiscover } from "@/lib/marketplaceExtensionCatalog";

export function MarketplaceDiscoverPage() {
  const catalog = marketplaceExtensionCatalogForDiscover();

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-8 pb-2">
      <header className="flex w-full min-w-0 items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2">
          <Store className="h-5 w-5 text-[var(--color-muted-foreground)]" />
        </div>
        <div className="min-w-0 flex-1">
          <PageTitleWithInfo
            description="Installez des modules optionnels pour enrichir Artisan : intégrations, rapports avancés et outils métiers. Les mises à jour et le support seront indiqués sur chaque fiche produit lorsque le catalogue sera ouvert."
          >
            <h1 className="text-xl font-semibold">Marketplace</h1>
          </PageTitleWithInfo>
        </div>
      </header>

      <section className="w-full min-w-0 space-y-3">
        <h2 className="text-sm font-medium text-[var(--color-foreground)]">
          Extensions disponibles
        </h2>
        <MarketplaceExtensionCatalog entries={catalog} />
      </section>

      <section className="w-full min-w-0 space-y-3">
        <h2 className="text-sm font-medium text-[var(--color-foreground)]">
          Feuille de route (aperçu)
        </h2>
        <p className="max-w-3xl text-sm text-[var(--color-muted-foreground)]">
          Ce qui n’est pas encore au catalogue comme module activable : orientations
          pour la suite. Les extensions déjà proposées (Projets, CRM, BDC, etc.)
          figurent dans la section « Extensions disponibles » ci-dessus.
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link
              to="/marketplace/accounting-essentials"
              className="text-[var(--color-primary)] underline-offset-2 hover:underline"
            >
              Comptabilité Essentials
            </Link>
            <span className="text-[var(--color-muted-foreground)]">
              {" "}
              — Vague 2
            </span>
          </li>
          <li>
            <Link
              to="/marketplace/stock"
              className="text-[var(--color-primary)] underline-offset-2 hover:underline"
            >
              Stock & inventaire (hub solutions)
            </Link>
            <span className="text-[var(--color-muted-foreground)]">
              {" "}
              — module Stock Manager ; extensions à venir
            </span>
          </li>
          <li>
            <Link
              to="/marketplace/stocks-projects"
              className="text-[var(--color-primary)] underline-offset-2 hover:underline"
            >
              Projets & temps (aperçu Vague 2)
            </Link>
            <span className="text-[var(--color-muted-foreground)]">
              {" "}
              — module Projets activable ci-dessus
            </span>
          </li>
          <li>
            <Link
              to="/marketplace/platform-roadmap"
              className="text-[var(--color-primary)] underline-offset-2 hover:underline"
            >
              Plateforme & conformité (Vague 3)
            </Link>
          </li>
        </ul>
      </section>

      <div className="w-full min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40">
              <LayoutTemplate className="h-5 w-5 text-[var(--color-muted-foreground)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                Catalogue tiers en construction
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                D’autres extensions certifiées seront listées ici dès leur mise en
                ligne.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex w-full sm:w-auto">
                  <Button type="button" disabled className="w-full sm:w-auto">
                    Parcourir le catalogue
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Bientôt disponible</TooltipContent>
            </Tooltip>
            <Button type="button" variant="outline" className="w-full sm:w-auto" asChild>
              <Link to="/marketplace/sur-mesure">
                Demander une extension sur mesure
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
