import { Hero } from "@/components/home/hero";
import { FeaturesOverview } from "@/components/home/features-overview";
import { Stats } from "@/components/home/stats";
import { WhyArtisan } from "@/components/home/why-artisan";
import { CtaSection } from "@/components/home/cta-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturesOverview />
      <Stats />
      <WhyArtisan />
      <CtaSection />
    </>
  );
}
