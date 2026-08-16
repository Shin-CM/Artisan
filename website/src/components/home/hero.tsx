"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Download, FileText, BarChart3, Package } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/motion-wrapper";

function FloatingIcon({
  icon: Icon,
  className,
  delay,
}: {
  icon: React.ElementType;
  className: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
        className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-surface-raised/80 backdrop-blur-sm"
      >
        <Icon className="h-5 w-5 text-neon-muted" />
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-20">
      <div className="absolute inset-0 bg-grid animate-grid-fade" />

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.08] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-neon-cyan/[0.05] blur-[100px] pointer-events-none" />

      <div className="hidden lg:block">
        <FloatingIcon icon={FileText} className="absolute top-[20%] left-[12%]" delay={0.4} />
        <FloatingIcon icon={BarChart3} className="absolute top-[30%] right-[10%]" delay={0.6} />
        <FloatingIcon icon={Package} className="absolute bottom-[30%] left-[8%]" delay={0.8} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-glow-pulse" />
            <span className="text-sm font-medium text-primary">
              Application desktop — 100 % hors ligne
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-white">Vos devis et factures,</span>
            <br />
            <span className="gradient-text">sans connexion.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10">
            Artisan est un logiciel de facturation desktop conçu pour les
            indépendants et petites entreprises. Créez, gérez et exportez vos
            documents en PDF — directement depuis votre ordinateur.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/download"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-primary hover:bg-primary/90 text-white glow-md hover:glow-lg transition-all text-base px-8 h-12"
              )}
            >
              <Download className="mr-2 h-4.5 w-4.5" />
              Télécharger gratuitement
            </Link>
            <Link
              href="/features"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-white text-base px-8 h-12"
              )}
            >
              Découvrir les fonctionnalités
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.5}>
          <div className="mt-20 relative mx-auto max-w-4xl">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/20 via-neon-cyan/10 to-primary/20 blur-xl opacity-60" />
            <div className="relative rounded-xl border border-white/[0.08] bg-surface/80 backdrop-blur-sm p-2">
              <div className="rounded-lg bg-background overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">
                    Artisan — Tableau de bord
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "CA ce mois", value: "12 450 €", color: "text-primary" },
                      { label: "Devis en cours", value: "8", color: "text-neon-cyan" },
                      { label: "Factures payées", value: "23", color: "text-green-400" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg border border-white/[0.06] bg-surface-raised p-4"
                      >
                        <p className="text-xs text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className={`text-xl font-bold mt-1 ${stat.color}`}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-20 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                      />
                    ))}
                  </div>
                  <div className="h-32 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-end p-4 gap-2">
                    {[40, 65, 45, 80, 60, 90, 75, 95, 70, 85, 55, 88].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-gradient-to-t from-primary/60 to-primary/20"
                          style={{ height: `${h}%` }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
