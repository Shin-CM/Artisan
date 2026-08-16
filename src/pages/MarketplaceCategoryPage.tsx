import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { FileBarChart2, Plug, Sparkles } from "lucide-react";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";

export const MARKETPLACE_CATEGORY_COPY = {
  integrations: {
    title: "Intégrations & connecteurs",
    description:
      "Connecteurs vers vos outils (comptabilité, e-commerce, CRM) et synchronisations planifiées. Les offres apparaîtront ici lorsque le catalogue sera ouvert.",
  },
  reports: {
    title: "Rapports & exports",
    description:
      "Extensions dédiées aux exports réglementaires, tableaux de bord avancés et jeux d’indicateurs personnalisés. Cette section accueillera les modules correspondants.",
  },
  "sur-mesure": {
    title: "Extensions sur mesure",
    description:
      "Besoin d’un flux métier spécifique, d’une intégration privée ou d’un module à votre image ? Décrivez votre projet : nous pourrons vous proposer une extension dédiée et une mise en œuvre adaptée.",
  },
} as const;

const CATEGORY_ICONS: Record<keyof typeof MARKETPLACE_CATEGORY_COPY, LucideIcon> =
  {
    integrations: Plug,
    reports: FileBarChart2,
    "sur-mesure": Sparkles,
  };

export type MarketplaceCategoryKey = keyof typeof MARKETPLACE_CATEGORY_COPY;

export function MarketplaceCategoryPage({
  categoryKey,
}: {
  categoryKey: MarketplaceCategoryKey;
}) {
  const { title, description } = MARKETPLACE_CATEGORY_COPY[categoryKey];
  const Icon = CATEGORY_ICONS[categoryKey];

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-6 pb-2">
      <header className="flex w-full min-w-0 items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2">
          <Icon className="h-5 w-5 text-[var(--color-muted-foreground)]" />
        </div>
        <div className="min-w-0 flex-1">
          <PageTitleWithInfo description={description}>
            <h1 className="text-xl font-semibold">{title}</h1>
          </PageTitleWithInfo>
        </div>
      </header>
      <div className="w-full min-w-0 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/50 px-6 py-10">
        <p className="text-sm font-medium text-[var(--color-foreground)]">
          Bientôt disponible
        </p>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
          Aucune extension n’est publiée dans cette catégorie pour le moment.
          Revenez plus tard ou explorez l’onglet Sur mesure pour un besoin
          spécifique.
        </p>
        {categoryKey !== "sur-mesure" && (
          <Link
            to="/marketplace/sur-mesure"
            className="mt-4 inline-block text-sm font-medium text-[var(--color-foreground)] underline-offset-4 hover:underline"
          >
            Demander une extension sur mesure
          </Link>
        )}
      </div>
    </div>
  );
}
