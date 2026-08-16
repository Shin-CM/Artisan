"use client";

import { Fragment } from "react";
import { Check, X, Minus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/motion-wrapper";

type CellValue = true | false | string | "partial";

interface FeatureRow {
  feature: string;
  artisan: CellValue;
  pennylane: CellValue;
  axonaut: CellValue;
  sellsy: CellValue;
}

interface FeatureGroup {
  category: string;
  rows: FeatureRow[];
}

const columns: readonly {
  key: keyof Omit<FeatureRow, "feature">;
  name: string;
  sub?: string;
  highlight?: boolean;
  price?: string;
}[] = [
  { key: "artisan", name: "Artisan", sub: "Libre", highlight: true, price: "MIT · 0 €" },
  { key: "pennylane", name: "Pennylane", price: "dès 14 €/mois" },
  { key: "axonaut", name: "Axonaut", price: "dès 69,99 €/mois" },
  { key: "sellsy", name: "Sellsy", price: "dès 29 €/mois/user" },
];

const data: FeatureGroup[] = [
  {
    category: "Général",
    rows: [
      { feature: "Application desktop", artisan: true, pennylane: false, axonaut: false, sellsy: false },
      { feature: "Fonctionne hors ligne", artisan: true, pennylane: false, axonaut: false, sellsy: false },
      { feature: "Accès tablette (PWA réseau local)", artisan: true, pennylane: false, axonaut: false, sellsy: false },
      { feature: "Application mobile", artisan: false, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Accès navigateur web (cloud)", artisan: false, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Données stockées localement", artisan: true, pennylane: false, axonaut: false, sellsy: false },
      { feature: "Multi-workspaces", artisan: true, pennylane: "Premium", axonaut: false, sellsy: "Enterprise" },
      { feature: "Licence open source", artisan: "MIT", pennylane: false, axonaut: false, sellsy: false },
    ],
  },
  {
    category: "Devis & Factures",
    rows: [
      { feature: "Devis et factures", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Bons de commande", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Avoirs / notes de crédit", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Conversion devis → facture / BDC", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Remises par ligne d'article", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Réduction commerciale document", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Modèles de réduction nommés", artisan: true, pennylane: false, axonaut: false, sellsy: false },
      { feature: "Compléments d'information", artisan: true, pennylane: "partial", axonaut: "partial", sellsy: "partial" },
      { feature: "Notes internes (non imprimées)", artisan: true, pennylane: true, axonaut: "partial", sellsy: true },
      { feature: "Références personnalisées", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "3 modes de facturation / ligne", artisan: true, pennylane: false, axonaut: false, sellsy: false },
    ],
  },
  {
    category: "Catalogue & stock",
    rows: [
      { feature: "Catalogue d'articles", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Catégories & sous-catégories", artisan: true, pennylane: false, axonaut: "partial", sellsy: true },
      { feature: "Variantes d'articles", artisan: true, pennylane: false, axonaut: false, sellsy: "partial" },
      { feature: "Modes de tarification multiples", artisan: true, pennylane: false, axonaut: false, sellsy: false },
      { feature: "Coût de production interne", artisan: true, pennylane: false, axonaut: "partial", sellsy: true },
      { feature: "Fournisseur / réf. fournisseur", artisan: true, pennylane: false, axonaut: true, sellsy: true },
      { feature: "Réordonnancement drag-and-drop", artisan: true, pennylane: false, axonaut: false, sellsy: false },
      { feature: "Stock Manager", artisan: true, pennylane: false, axonaut: true, sellsy: true },
    ],
  },
  {
    category: "Export PDF",
    rows: [
      { feature: "Export / aperçu PDF", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Modèles PDF multiples", artisan: "5 modèles", pennylane: "partial", axonaut: "partial", sellsy: true },
      { feature: "Branding (logo, titre, slogan)", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Polices PDF personnalisées", artisan: true, pennylane: false, axonaut: false, sellsy: false },
      { feature: "Typographie par blocs (PDF)", artisan: true, pennylane: false, axonaut: false, sellsy: false },
    ],
  },
  {
    category: "Clients & CRM",
    rows: [
      { feature: "Fiches clients structurées", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Pipeline CRM (Kanban)", artisan: true, pennylane: false, axonaut: true, sellsy: true },
      { feature: "Recouvrement / relances", artisan: true, pennylane: "Essentiel+", axonaut: true, sellsy: true },
      { feature: "TVA par défaut par client", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Devise par client", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Ordre personnalisable (DnD)", artisan: true, pennylane: false, axonaut: false, sellsy: false },
    ],
  },
  {
    category: "Projets",
    rows: [
      { feature: "Gestion de projets", artisan: true, pennylane: false, axonaut: true, sellsy: "partial" },
      { feature: "Espace projet dédié", artisan: true, pennylane: false, axonaut: false, sellsy: false },
      { feature: "Suivi du temps passé", artisan: true, pennylane: false, axonaut: true, sellsy: "partial" },
      { feature: "Synthèse financière par projet", artisan: true, pennylane: false, axonaut: "partial", sellsy: "partial" },
      { feature: "Liaison temps → ligne de facture", artisan: true, pennylane: false, axonaut: false, sellsy: false },
    ],
  },
  {
    category: "Rapports & tableau de bord",
    rows: [
      { feature: "Tableau de bord KPI", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Évolution CA multi-années", artisan: "Jusqu'à 6 ans", pennylane: true, axonaut: true, sellsy: true },
      { feature: "Prévisionnel d'encaissement", artisan: true, pennylane: "Essentiel+", axonaut: true, sellsy: true },
      { feature: "Ancienneté des créances", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Top clients", artisan: true, pennylane: true, axonaut: true, sellsy: true },
    ],
  },
  {
    category: "Import / Export de données",
    rows: [
      { feature: "Export workspace complet (JSON)", artisan: true, pennylane: false, axonaut: false, sellsy: false },
      { feature: "Import CSV clients", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Import Excel", artisan: true, pennylane: true, axonaut: true, sellsy: true },
      { feature: "Export comptable", artisan: false, pennylane: true, axonaut: true, sellsy: true },
      { feature: "API locale (réseau LAN)", artisan: true, pennylane: false, axonaut: false, sellsy: false },
      { feature: "API cloud / intégrations", artisan: false, pennylane: true, axonaut: true, sellsy: true },
    ],
  },
  {
    category: "Extensibilité",
    rows: [
      { feature: "Marketplace de modules", artisan: true, pennylane: false, axonaut: false, sellsy: false },
      { feature: "Multi-pays (FR, CH…)", artisan: true, pennylane: false, axonaut: false, sellsy: "partial" },
    ],
  },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <div className="flex items-center justify-center">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15">
          <Check className="h-3 w-3 text-green-400" />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex items-center justify-center">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.04]">
          <X className="h-3 w-3 text-muted-foreground/40" />
        </div>
      </div>
    );
  }
  if (value === "partial") {
    return (
      <div className="flex items-center justify-center">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/15">
          <Minus className="h-3 w-3 text-yellow-400" />
        </div>
      </div>
    );
  }
  return (
    <span className="text-xs text-muted-foreground text-center block leading-tight">
      {value}
    </span>
  );
}

export function ComparisonTable() {
  const colCount = columns.length + 1;

  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Comparatif avec les{" "}
            <span className="gradient-text">leaders du marché</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            Artisan est un logiciel desktop hors ligne, libre et sans
            abonnement. Voici un comparatif avec des solutions SaaS payantes
            connues en France.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="rounded-2xl border border-white/[0.06] bg-surface/50 overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-sm font-medium text-muted-foreground p-4 w-[28%]">
                      Fonctionnalité
                    </th>
                    {columns.map((c) => (
                      <th
                        key={c.key}
                        className={cn(
                          "text-center text-xs sm:text-sm font-semibold p-3 sm:p-4",
                          c.highlight ? "text-primary" : "text-white"
                        )}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {c.highlight && (
                            <Zap className="h-3 w-3 text-primary" />
                          )}
                          <span>{c.sub || c.name}</span>
                        </div>
                        {c.highlight && (
                          <span className="text-[10px] font-normal text-primary/50 block mt-0.5">
                            {c.name}
                          </span>
                        )}
                        {!c.highlight && (
                          <span className="text-[10px] font-normal text-muted-foreground/50 block mt-0.5">
                            SaaS · En ligne
                          </span>
                        )}
                        {c.price && (
                          <span
                            className={cn(
                              "text-[10px] font-medium block mt-1",
                              c.highlight
                                ? "text-primary/70"
                                : "text-muted-foreground/40"
                            )}
                          >
                            {c.price}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((group) => (
                    <Fragment key={group.category}>
                      <tr>
                        <td
                          colSpan={colCount}
                          className="bg-white/[0.02] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-white/[0.04]"
                        >
                          {group.category}
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr
                          key={row.feature}
                          className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-foreground/80">
                            {row.feature}
                          </td>
                          {columns.map((c) => (
                            <td
                              key={c.key}
                              className={cn(
                                "px-2 sm:px-4 py-3",
                                c.highlight && "bg-primary/[0.03]"
                              )}
                            >
                              <CellContent value={row[c.key]} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/60 text-center mt-4 max-w-2xl mx-auto leading-relaxed">
            Comparaison établie sur la base des offres publiques en avril 2026.
            Les fonctionnalités varient selon le plan choisi chez chaque
            éditeur. Artisan est un logiciel desktop hors ligne sous licence
            MIT ; Pennylane, Axonaut et Sellsy sont des solutions SaaS en ligne.
            Les modules Artisan (BDC, stock, CRM…) s’activent dans la
            Marketplace, sans paiement.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
