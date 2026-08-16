"use client";

import {
  FileText,
  Package,
  Users,
  FileOutput,
  BarChart3,
  FolderKanban,
  Store,
  Tablet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/motion-wrapper";
import { FadeIn } from "@/components/motion-wrapper";

const features = [
  {
    icon: FileText,
    title: "Devis, Factures, BDC & Avoirs",
    description:
      "Éditeur complet avec lignes, variantes, remises, conversion devis → facture / BDC, et avoirs liés.",
  },
  {
    icon: Package,
    title: "Catalogue & Stock",
    description:
      "Arborescence illimitée, variantes, 3 tarifications, fournisseurs, et Stock Manager.",
  },
  {
    icon: Users,
    title: "Clients, CRM & Recouvrement",
    description:
      "Fiches structurées, pipeline CRM Kanban, relances factures impayées et échéancier intégré.",
  },
  {
    icon: FolderKanban,
    title: "Projets & Temps",
    description:
      "Espace projet dédié, suivi du temps, synthèse financière, liaison temps → ligne de facture.",
  },
  {
    icon: FileOutput,
    title: "Export PDF",
    description:
      "5 modèles Pro, branding personnalisé, polices importées, typographie par blocs et logo positionnable.",
  },
  {
    icon: BarChart3,
    title: "Rapports avancés",
    description:
      "CA multi-années, prévisionnel d'encaissement, ancienneté des créances, top clients et CA manuel fusionné.",
  },
  {
    icon: Store,
    title: "Marketplace modulaire",
    description:
      "BDC, Avoirs, CRM, Recouvrement, Projets, Stock : activez uniquement ce dont vous avez besoin.",
  },
  {
    icon: Tablet,
    title: "PWA tablette (LAN)",
    description:
      "Accès tablette via réseau local, appairage QR code sécurisé, sans cloud ni inscription.",
  },
];

export function FeaturesOverview() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Tout ce dont vous avez besoin,{" "}
            <span className="gradient-text">rien de superflu</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Un outil complet pour gérer votre activité de facturation, conçu
            pour fonctionner hors ligne et respecter votre vie privée.
          </p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <Card className="group h-full border-white/[0.06] bg-surface/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:glow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
