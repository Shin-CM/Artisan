"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/motion-wrapper";

export function CtaSection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/[0.08] blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-neon-cyan/[0.03] p-10 sm:p-16 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-neon-cyan/10 blur-[60px] pointer-events-none" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                Prêt à simplifier
                <br />
                <span className="gradient-text">votre facturation ?</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                Téléchargez Artisan gratuitement et commencez à créer vos
                devis et factures dès maintenant.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/download"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "bg-primary hover:bg-primary/90 text-white glow-md hover:glow-lg transition-all text-base px-8 h-12"
                  )}
                >
                  Télécharger maintenant
                </Link>
                <Link
                  href="/libre"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-white text-base px-8 h-12"
                  )}
                >
                  Le projet est libre
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
