import type { Metadata } from "next";
import { PricingHero } from "@/components/pricing/pricing-hero";
import { ComparisonTable } from "@/components/pricing/comparison-table";
import { PricingFaq } from "@/components/pricing/pricing-faq";

export const metadata: Metadata = {
  title: "Libre",
  description:
    "Artisan est un logiciel libre sous licence MIT : toutes les fonctions sont disponibles, hors ligne, sans abonnement.",
};

export default function LibrePage() {
  return (
    <>
      <PricingHero />
      <ComparisonTable />
      <PricingFaq />
    </>
  );
}
