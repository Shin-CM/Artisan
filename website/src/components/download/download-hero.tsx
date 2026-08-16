"use client";

import { FadeIn } from "@/components/motion-wrapper";

export function DownloadHero() {
  return (
    <section className="relative pt-32 pb-8 sm:pt-40 sm:pb-12 overflow-hidden">
      <div className="absolute inset-0 bg-grid animate-grid-fade" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-primary/[0.08] blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Téléchargez{" "}
            <span className="gradient-text">Artisan</span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Disponible sur Windows et macOS. Installation en quelques secondes,
            aucun compte requis pour commencer.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
