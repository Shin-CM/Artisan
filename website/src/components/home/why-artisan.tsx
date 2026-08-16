"use client";

import {
  WifiOff,
  Shield,
  Zap,
  Globe,
} from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion-wrapper";

const reasons = [
  {
    icon: WifiOff,
    title: "100 % hors ligne",
    description:
      "Vos données sont stockées localement dans une base SQLite. Pas besoin de connexion internet pour travailler.",
    gradient: "from-primary to-purple-400",
  },
  {
    icon: Shield,
    title: "Vie privée respectée",
    description:
      "Aucune donnée n'est envoyée sur un serveur distant. Vos factures et données clients restent sur votre machine.",
    gradient: "from-neon-cyan to-cyan-300",
  },
  {
    icon: Zap,
    title: "Rapide et léger",
    description:
      "Construit avec Tauri et React, Artisan démarre instantanément et utilise très peu de ressources système.",
    gradient: "from-primary to-neon-cyan",
  },
  {
    icon: Globe,
    title: "Multi-pays",
    description:
      "Profils adaptés par pays (France, Suisse…) avec taux de TVA, identifiants d'entreprise et devises locales.",
    gradient: "from-neon-cyan to-primary",
  },
];

export function WhyArtisan() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-neon-cyan/[0.04] blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Pourquoi choisir{" "}
            <span className="gradient-text-reverse">Artisan</span> ?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Un logiciel pensé pour la simplicité, la confidentialité et la
            performance au quotidien.
          </p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reasons.map((reason) => (
            <StaggerItem key={reason.title}>
              <div className="group relative rounded-xl border border-white/[0.06] bg-surface/50 p-8 hover:border-primary/20 transition-all duration-300">
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${reason.gradient} opacity-80`}
                >
                  <reason.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {reason.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {reason.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
