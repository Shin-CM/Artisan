"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion-wrapper";
import {
  Tablet,
  Wifi,
  QrCode,
  ShieldCheck,
  Download,
  ArrowRight,
  Monitor,
  Smartphone,
} from "lucide-react";

const steps = [
  {
    icon: Download,
    title: "1. Installez Artisan sur votre bureau",
    description:
      "Téléchargez et installez l'application desktop sur Windows ou macOS.",
  },
  {
    icon: Wifi,
    title: "2. Activez l'API tablette",
    description:
      "Dans Paramètres → API tablette, activez le serveur local et configurez le port si besoin.",
  },
  {
    icon: QrCode,
    title: "3. Scannez le QR code ou saisissez le mot de passe",
    description:
      "Lancez le pairing depuis l'app desktop. Un QR code s'affiche, valable 5 minutes.",
  },
  {
    icon: Tablet,
    title: "4. Installez la PWA sur votre tablette",
    description:
      "Ouvrez l'adresse locale dans le navigateur de la tablette, puis ajoutez-la à l'écran d'accueil.",
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: "100 % local, 0 % cloud",
    description:
      "Vos données ne quittent jamais votre réseau. Aucun serveur distant, aucune inscription.",
  },
  {
    icon: Smartphone,
    title: "Clients & devis en mobilité",
    description:
      "Consultez vos clients, créez et modifiez vos devis directement depuis la tablette.",
  },
  {
    icon: Monitor,
    title: "Synchronisation instantanée",
    description:
      "Les modifications sur la tablette sont immédiatement visibles sur l'app desktop, et inversement.",
  },
];

export default function TablettePage() {
  return (
    <main className="relative">
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />

      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Tablet className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              Artisan sur{" "}
              <span className="gradient-text">tablette</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Accédez à vos clients et devis depuis une tablette sur votre réseau local.
              Sans cloud, sans inscription — tout reste chez vous.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/download"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-primary hover:bg-primary/90 text-white glow-sm hover:glow-md transition-shadow"
                )}
              >
                Télécharger Artisan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/features#tablet"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-white/10 text-white hover:bg-white/[0.06]"
                )}
              >
                Voir les fonctionnalités
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Étapes */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Mise en route en{" "}
              <span className="text-primary">4 étapes</span>
            </h2>
            <p className="text-muted-foreground">
              De l&apos;installation au premier devis sur tablette en quelques minutes.
            </p>
          </FadeIn>

          <StaggerContainer className="grid gap-4 sm:grid-cols-2">
            {steps.map((step) => (
              <StaggerItem key={step.title}>
                <div className="group flex gap-4 rounded-xl border border-white/[0.06] bg-surface/50 p-5 backdrop-blur-sm hover:border-primary/20 transition-all">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Avantages */}
      <section className="relative py-16 sm:py-24">
        <div className="absolute inset-0 bg-dot-grid opacity-15 pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Pourquoi la PWA tablette ?
            </h2>
          </FadeIn>

          <StaggerContainer className="grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <StaggerItem key={f.title}>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Instructions détaillées */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-2xl border border-white/[0.06] bg-surface/50 p-6 sm:p-8 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white mb-4">
                Installation sur tablette
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span className="font-semibold text-white shrink-0">Android (Chrome) :</span>
                  <span>Menu ⋮ puis « Installer l&apos;application » ou « Ajouter à l&apos;écran d&apos;accueil ».</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-white shrink-0">iPad / iPhone (Safari) :</span>
                  <span>Bouton Partager puis « Sur l&apos;écran d&apos;accueil ».</span>
                </div>
              </div>
              <div className="mt-6 rounded-lg bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-white">Bon à savoir :</span>{" "}
                  la tablette et l&apos;ordinateur doivent être sur le même réseau Wi-Fi.
                  L&apos;adresse à ouvrir est indiquée dans Paramètres → API tablette de l&apos;application desktop.
                  Le port par défaut est <span className="font-mono text-primary">3847</span>.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
