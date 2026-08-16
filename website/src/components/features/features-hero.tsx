"use client";

import { FadeIn } from "@/components/motion-wrapper";

export function FeaturesHero() {
  return (
    <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-grid animate-grid-fade" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-neon-cyan/[0.06] blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Toutes les{" "}
            <span className="gradient-text-reverse">fonctionnalités</span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Un tour d&apos;horizon complet de tout ce qu&apos;Artisan peut
            faire pour votre activité de facturation.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
