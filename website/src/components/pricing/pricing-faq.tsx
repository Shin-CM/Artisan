"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion-wrapper";

const faqs = [
  {
    question: "Mes données sont-elles envoyées sur un serveur ?",
    answer:
      "Non. Artisan fonctionne à 100 % hors ligne. Toutes vos données sont stockées localement dans une base SQLite sur votre ordinateur. Aucun compte cloud ni abonnement n’est requis.",
  },
  {
    question: "Puis-je utiliser Artisan sur plusieurs ordinateurs ?",
    answer:
      "Oui. Vous pouvez installer Artisan sur autant de machines que vous le souhaitez. Les données restent locales à chaque poste (export / import via le Data Manager si vous voulez les dupliquer).",
  },
  {
    question: "Y a-t-il un abonnement ou des plafonds ?",
    answer:
      "Non. Le projet est libre (licence MIT). Toutes les fonctions métier sont disponibles. Les modules optionnels (BDC, stock, CRM, tablette…) s’activent dans la Marketplace, sans paiement.",
  },
  {
    question: "Quelle est la licence du code ?",
    answer:
      "MIT : vous pouvez utiliser, modifier, distribuer et lancer des forks, y compris dans un cadre commercial, en conservant l’avis de copyright et de licence.",
  },
  {
    question: "Quels systèmes d'exploitation sont supportés ?",
    answer:
      "Artisan est disponible pour Windows (installateur NSIS) et macOS (image DMG). L'application est construite avec Tauri pour des performances natives sur chaque plateforme.",
  },
  {
    question: "Puis-je exporter mes données ?",
    answer:
      "Oui, le Data Manager vous permet d'exporter l'intégralité de votre espace de travail en un paquet JSON compressé. Vous pouvez aussi exporter module par module (clients, articles, devis, factures…).",
  },
];

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left group"
      >
        <span className="text-base font-medium text-white group-hover:text-primary transition-colors pr-4">
          {question}
        </span>
        <ChevronDown
          className={cn(
            "h-4.5 w-4.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-muted-foreground leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PricingFaq() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground text-lg">
            Tout ce que vous devez savoir avant de vous lancer.
          </p>
        </FadeIn>

        <StaggerContainer className="rounded-2xl border border-white/[0.06] bg-surface/50 px-6 sm:px-8">
          {faqs.map((faq) => (
            <StaggerItem key={faq.question}>
              <FaqItem {...faq} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
