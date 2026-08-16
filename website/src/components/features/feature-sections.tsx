"use client";

import {
  FileText,
  Package,
  Users,
  FileOutput,
  BarChart3,
  FolderInput,
  Store,
  Layers,
  FolderKanban,
  Tablet,
  ShieldAlert,
  Warehouse,
} from "lucide-react";
import { FeatureSection } from "./feature-section";

const sections = [
  {
    id: "devis-factures",
    icon: FileText,
    subtitle: "Documents",
    title: "Devis, Factures, BDC & Avoirs",
    description:
      "Un éditeur intuitif pour créer vos devis, factures, bons de commande et avoirs avec toutes les options professionnelles.",
    details: [
      { text: "Lignes d'articles depuis le catalogue avec variantes et 3 modes de facturation (unitaire, forfait, horaire)" },
      { text: "Bons de commande (module Marketplace) : numérotation BDC-xxxxx, conversion devis → BDC → facture" },
      { text: "Avoirs / notes de crédit (module Marketplace) : préfixe AVC-xxxxx, lien vers la facture d'origine" },
      { text: "Remises par ligne et réduction commerciale globale, modèles de réduction nommés" },
      { text: "Références personnalisées avec jetons ({AUTO}, {PREFIX}, {YYYY}…) ou numérotation automatique" },
      { text: "Compléments d'information, notes internes non imprimées, et textes enregistrés réutilisables" },
    ],
    accentColor: "violet" as const,
  },
  {
    id: "catalogue",
    icon: Package,
    subtitle: "Catalogue",
    title: "Catalogue produits avancé",
    description:
      "Organisez vos articles dans une arborescence illimitée avec variantes, fournisseurs et gestion des stocks.",
    details: [
      { text: "Arborescence catégories / sous-catégories illimitée avec réordonnancement drag-and-drop" },
      { text: "Trois tarifs HT par article : prix unitaire, forfait et tarif horaire" },
      { text: "Variantes catalogue avec libellé et supplément HT par option" },
      { text: "Fournisseur et référence fournisseur sur chaque article" },
      { text: "Coût de production interne pour le suivi de marge" },
      { text: "Déplacement d'articles entre catégories par glisser-déposer" },
    ],
    reversed: true,
    accentColor: "cyan" as const,
  },
  {
    id: "stock",
    icon: Warehouse,
    subtitle: "Stock",
    title: "Stock Manager",
    description:
      "Quantités par article, mouvements, seuils minimum et alertes, le tout lié au catalogue.",
    details: [
      { text: "Module Marketplace Stock Manager : tableau aligné sur le catalogue (catégories, articles, quantités, seuils)" },
      { text: "Mouvements d'entrée et de sortie avec historique complet" },
      { text: "Fournisseur et référence fournisseur visibles sur le tableau stock" },
      { text: "Ajout rapide depuis l'accueil ou les bases de données" },
      { text: "Effacement du surcouche stock sans toucher au catalogue" },
    ],
    accentColor: "violet" as const,
  },
  {
    id: "clients",
    icon: Users,
    subtitle: "Base de données",
    title: "Gestion clients complète",
    description:
      "Des fiches clients structurées pour entreprises et particuliers, avec toutes les informations nécessaires.",
    details: [
      { text: "Fiches entreprise ou individuel avec contacts, formule de politesse, adresses" },
      { text: "Taux de TVA par défaut et devise personnalisée par client" },
      { text: "Ordre personnalisable avec poignée de drag-and-drop" },
      { text: "Panneau d'aide contextuel avec description de chaque champ" },
      { text: "Création rapide depuis l'éditeur de devis ou facture" },
    ],
    reversed: true,
    accentColor: "cyan" as const,
  },
  {
    id: "crm",
    icon: ShieldAlert,
    subtitle: "Clients & CRM",
    title: "Pipeline CRM & Recouvrement",
    description:
      "Suivez vos opportunités commerciales en Kanban et gérez le recouvrement de vos factures en retard.",
    details: [
      { text: "Pipeline CRM (module Marketplace) : colonnes Lead, Qualifié, Proposition, Gagné, Perdu avec drag-and-drop" },
      { text: "Liaison opportunité → client, devis et projet pour un suivi complet" },
      { text: "Recouvrement (module Marketplace) : factures en retard par tranche (1–30 j, 31–60 j, 61–90 j, 90+ j)" },
      { text: "Modèles de texte de relance avec jetons dynamiques (client, numéro, montant, reste, échéance)" },
      { text: "Actions copier et e-mail (mailto:) pour relancer rapidement" },
      { text: "Échéancier des 30 prochains jours pour anticiper les impayés" },
    ],
    accentColor: "violet" as const,
  },
  {
    id: "projets",
    icon: FolderKanban,
    subtitle: "Projets",
    title: "Gestion de projets intégrée",
    description:
      "Organisez vos projets avec un espace dédié, un suivi du temps et une synthèse financière automatique.",
    details: [
      { text: "Module Marketplace : espace projet dédié avec sidebar (tableau de bord, fiche, devis, factures, BDC)" },
      { text: "Suivi du temps passé en minutes, avec liaison optionnelle vers une ligne de facture à l'heure" },
      { text: "Synthèse financière par projet : budget HT, facturé TTC, avoirs, devis acceptés, BDC" },
      { text: "Chronologie jalons + documents, et création de documents liés au projet" },
      { text: "Colonne « Gagné » du CRM : bouton pour créer un projet directement depuis une opportunité" },
    ],
    reversed: true,
    accentColor: "cyan" as const,
  },
  {
    id: "pdf",
    icon: FileOutput,
    subtitle: "Export",
    title: "Export PDF professionnel",
    description:
      "Générez des documents PDF impeccables avec votre identité visuelle et le modèle de votre choix.",
    details: [
      { text: "5 modèles PDF : Classique, Moderne, Bandeau, Studio, Compact" },
      { text: "Branding personnalisé : titre, slogan, logo avec position configurable (gauche, centre, droite)" },
      { text: "Import de polices personnalisées avec bibliothèque organisée en dossiers" },
      { text: "Typographie par blocs (module Marketplace) pour un contrôle fin de chaque zone du PDF" },
      { text: "Pied de page légal, détail TVA, numéro de document optionnels" },
    ],
    accentColor: "violet" as const,
  },
  {
    id: "dashboard",
    icon: BarChart3,
    subtitle: "Rapports",
    title: "Tableau de bord & rapports",
    description:
      "Suivez votre activité en temps réel avec des indicateurs clés, du prévisionnel et une vue d'ancienneté des créances.",
    details: [
      { text: "KPI temps réel : CA du mois, devis en cours, factures payées" },
      { text: "Évolution du CA sur plusieurs années avec impact des avoirs (jusqu'à 6 ans)" },
      { text: "Prévisionnel d'encaissement sur 8 semaines (restes dûs par semaine d'échéance)" },
      { text: "Ancienneté des créances par tranches (0 / 1–30 / 31–60 / 61–90 / 90+ jours)" },
      { text: "Top clients par CA TTC facturé sur la période" },
      { text: "CA saisi manuellement par mois avec fusion automatique" },
    ],
    reversed: true,
    accentColor: "cyan" as const,
  },
  {
    id: "tablet",
    icon: Tablet,
    subtitle: "Mobilité",
    title: "PWA tablette (réseau local)",
    description:
      "Accédez à vos données depuis une tablette sur le même réseau, sans cloud et sans inscription.",
    details: [
      { text: "Serveur local intégré à l'application, activable depuis les paramètres sur un port configurable" },
      { text: "Appairage par QR code sécurisé (5 min, usage unique) ou mot de passe opérateur" },
      { text: "Sessions sécurisées et révocables depuis l'application desktop" },
      { text: "Consultation des clients et devis, création client, création et édition de devis depuis la tablette" },
      { text: "Fonctionne sans connexion internet — tout reste sur votre réseau" },
    ],
    accentColor: "violet" as const,
  },
  {
    id: "data-manager",
    icon: FolderInput,
    subtitle: "Import / Export",
    title: "Data Manager puissant",
    description:
      "Importez et exportez vos données dans tous les formats, avec un contrôle total sur la sélection.",
    details: [
      { text: "Export multi-modules en paquet workspace (JSON compressé gzip + Base64)" },
      { text: "Import CSV et Excel pour les clients avec aperçu et sélection par ligne" },
      { text: "Sidebar hiérarchique avec cases à cocher par enregistrement" },
      { text: "Vue détaillée et résumé intégrés pour visualiser les données exportées" },
      { text: "Journal d'import / export avec historique par module" },
    ],
    reversed: true,
    accentColor: "cyan" as const,
  },
  {
    id: "marketplace",
    icon: Store,
    subtitle: "Extensions",
    title: "Marketplace de modules",
    description:
      "Étendez les fonctionnalités d'Artisan avec des modules activables depuis la Marketplace dédiée.",
    details: [
      { text: "Bons de commande, Avoirs, CRM, Recouvrement, Projets, Stock : modules activables indépendamment" },
      { text: "Typographie PDF par blocs et Data Manager avec chargement à la demande" },
      { text: "Catalogue organisé par onglets : Découvrir, Documents, Clients, Données, Polices, Sur mesure" },
      { text: "Activation / désactivation en un clic, état persisté entre les sessions" },
      { text: "Route dédiée /marketplace avec topbar et galerie pleine largeur" },
    ],
    accentColor: "violet" as const,
  },
  {
    id: "workspaces",
    icon: Layers,
    subtitle: "Organisation",
    title: "Multi-workspaces",
    description:
      "Créez plusieurs espaces de travail indépendants pour séparer vos activités ou vos structures.",
    details: [
      { text: "Profils adaptés par pays : France (SIRET, TVA 20/10/5.5 %), Suisse (IDE, TVA 8.1/2.6/3.7 %)" },
      { text: "Devise, ville et identifiants d'entreprise par espace" },
      { text: "Thème clair / sombre / système persisté par workspace" },
      { text: "Dossier de sortie PDF configurable par espace" },
      { text: "Passage d'un espace à l'autre depuis le menu profil" },
    ],
    reversed: true,
    accentColor: "cyan" as const,
  },
];

export function FeatureSections() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
      {sections.map((section) => (
        <FeatureSection key={section.id} {...section} />
      ))}
    </div>
  );
}
