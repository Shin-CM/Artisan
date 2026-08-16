"use client";

import Link from "next/link";
import { FadeIn } from "@/components/motion-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PricingHero() {
  return (
    <section className="relative pt-28 pb-8 sm:pt-40 sm:pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-grid animate-grid-fade" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-primary/[0.06] blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Libre,{" "}
            <span className="gradient-text">open source, MIT</span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Artisan n’a plus d’abonnement. Toutes les fonctions sont
            disponibles, les données restent sur votre machine, le code est
            publié sous licence MIT.
          </p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/download"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-primary hover:bg-primary/90 text-white glow-md hover:glow-lg transition-all text-base px-8 h-12"
              )}
            >
              Télécharger
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
