import { Link } from "react-router-dom";
import { PlaceholderPage } from "@/pages/PlaceholderPage";

/** Rappel depuis la Marketplace : le CRM actif est sous Accueil. */
export function MarketplaceCrmRoadmapPage() {
  return (
    <div className="w-full min-w-0 space-y-3 pb-2">
      <PlaceholderPage
        title="CRM léger & pipeline (Kanban)"
        description="Les opportunités sont enregistrées dans votre espace (SQLite). Ouvrez le tableau Kanban depuis l’accueil pour les gérer."
      />
      <p className="text-sm">
        <Link
          to="/marketplace/clients#module-crm-pipeline"
          className="text-[var(--color-primary)] underline-offset-2 hover:underline"
        >
          Activer ou ouvrir le pipeline CRM (Marketplace) →
        </Link>
      </p>
    </div>
  );
}

/** Fiche roadmap — Comptabilité Essentials (exports, journaux, balance). */
export function MarketplaceAccountingRoadmapPage() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="max-w-2xl">
        <PlaceholderPage
          title="Comptabilité Essentials"
          description="Chantier Vague 2 : pré-compta, exports cabinet (CSV / XLSX), journaux et balance simple après le pont métier défini dans le code (`features/accounting/accountingBridge.ts`, id plugin invoicies.accounting-essentials)."
        />
      </div>
    </div>
  );
}

/** Fiche roadmap — renvoi vers le hub Stock & inventaire et Projets. */
export function MarketplaceStocksProjectsRoadmapPage() {
  return (
    <div className="w-full min-w-0 space-y-3 pb-2">
      <PlaceholderPage
        title="Stock & inventaire / Projets"
        description="La Vague 2 livre le stock par article (mouvements, seuils et alertes) et les projets avec temps facturable. Les solutions stock sont regroupées dans la Marketplace ; les extensions complémentaires y sont listées comme « À venir »."
      />
      <p className="text-sm">
        <Link
          to="/marketplace/stock"
          className="text-[var(--color-primary)] underline-offset-2 hover:underline"
        >
          Hub Stock & inventaire (Marketplace) →
        </Link>
      </p>
      <p className="text-sm">
        <Link
          to="/marketplace/documents#module-document-projects"
          className="text-[var(--color-primary)] underline-offset-2 hover:underline"
        >
          Module Projets (temps + documents liés) →
        </Link>
      </p>
    </div>
  );
}
