"use client";

import { Shield, WifiOff, RefreshCcw, HardDrive } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion-wrapper";

const infoItems = [
  {
    icon: Shield,
    title: "Installation sécurisée",
    description:
      "L'installateur est signé et vérifié. Aucune donnée n'est collectée pendant l'installation.",
  },
  {
    icon: WifiOff,
    title: "Fonctionne hors ligne",
    description:
      "Dès l'installation terminée, Artisan fonctionne sans connexion internet.",
  },
  {
    icon: RefreshCcw,
    title: "Mises à jour",
    description:
      "Les nouvelles versions sont disponibles sur cette page. Vos données restent sur votre machine entre les mises à jour.",
  },
  {
    icon: HardDrive,
    title: "Données locales",
    description:
      "Vos données sont stockées dans le dossier de données local de l'application (SQLite).",
  },
];

export function DownloadInfo() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Bon à savoir
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Tout ce qu&apos;il faut savoir avant et après l&apos;installation.
          </p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {infoItems.map((item) => (
            <StaggerItem key={item.title}>
              <div className="text-center p-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
