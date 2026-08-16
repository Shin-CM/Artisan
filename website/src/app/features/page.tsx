import type { Metadata } from "next";
import { FeatureSections } from "@/components/features/feature-sections";
import { FeaturesHero } from "@/components/features/features-hero";

export const metadata: Metadata = {
  title: "Fonctionnalités",
  description:
    "Découvrez toutes les fonctionnalités d'Artisan : devis, factures, export PDF, catalogue produits, tableau de bord, Data Manager et plus encore.",
};

export default function FeaturesPage() {
  return (
    <>
      <FeaturesHero />
      <FeatureSections />
    </>
  );
}
