import type { ReactNode } from "react";
import { HelpAsidePanel } from "@/components/HelpAsidePanel";

/** Panneau d’aide latéral — page Paramètres → Espace de travail (cible tablette+). */

const SECTIONS: {
  title: string;
  items: { label: string; body: ReactNode }[];
}[] = [
  {
    title: "Identité et localisation",
    items: [
      {
        label: "Nom affiché",
        body: "Nom de l’espace tel qu’il peut apparaître dans l’application.",
      },
      {
        label: "Type, pays, devise, ville",
        body: "Mêmes règles qu’à la création du workspace. La ville peut être saisie librement si elle n’est pas dans la liste.",
      },
      {
        label: "SIRET / IDE / TVA",
        body: "Affichés selon le pays et le type (entreprise France, Suisse). Utilisés pour les mentions légales sur les PDF si configurées.",
      },
    ],
  },
  {
    title: "Références devis et factures",
    items: [
      {
        label: "À quoi sert la référence ?",
        body: "Elle figure sur le PDF et dans les listes de devis ou de factures.",
      },
      {
        label: "Numéro automatique",
        body: (
          <>
            Si le champ reste vide à l’enregistrement, le prochain numéro du type{" "}
            <code className="text-[11px] text-[var(--color-foreground)]">
              DEV-xxxxx
            </code>{" "}
            (devis) ou{" "}
            <code className="text-[11px] text-[var(--color-foreground)]">
              FAC-xxxxx
            </code>{" "}
            (facture) est attribué.
          </>
        ),
      },
      {
        label: "Texte libre",
        body: "Vous pouvez saisir votre propre référence ; elle doit être unique dans cet espace de travail pour le type de document concerné.",
      },
      {
        label: "Modèle (optionnel)",
        body: (
          <>
            Morceaux fixes + emplacements :{" "}
            <code className="text-[11px]">{"{AUTO}"}</code> = prochain numéro
            séquentiel, <code className="text-[11px]">{"{PREFIX}"}</code> = code
            court défini ci-contre,{" "}
            <code className="text-[11px]">{"{YYYY}"}</code> /{" "}
            <code className="text-[11px]">{"{YY}"}</code> /{" "}
            <code className="text-[11px]">{"{MM}"}</code> /{" "}
            <code className="text-[11px]">{"{DD}"}</code> = date d’émission du
            document. Modèle vide : saisissez la référence librement ou laissez le
            numéro automatique.
          </>
        ),
      },
      {
        label: "Texte prérempli",
        body: "Remplit le champ référence à l’ouverture d’un nouveau devis ou d’une nouvelle facture (selon ce que vous avez enregistré ici).",
      },
      {
        label: "Verrouiller les factures émises",
        body: "Activé par défaut. Dès qu’une facture n’est plus en brouillon, son contenu est en lecture seule (lignes, client, dates, notes). Vous pouvez encore changer le statut, le montant payé et archiver. Pour corriger une facture émise, créez un avoir. Désactivez l’option pour modifier à nouveau les factures déjà émises.",
      },
      {
        label: "PDF",
        body: "Dans Paramètres → Mise en page PDF, l’option « Afficher le numéro » peut masquer le numéro automatique sur le PDF, mais une référence personnalisée reste en général visible.",
      },
    ],
  },
  {
    title: "Prix unitaire HT sur les lignes",
    items: [
      {
        label: "Décimales",
        body: "Nombre de chiffres après la virgule pour le prix unitaire HT des lignes de devis et de facture : arrondi lors du choix d’un article ou d’une variante, affichage du champ et normalisation à la sortie du champ. Les montants totaux sur les PDF restent en général formatés avec deux décimales pour la devise.",
      },
    ],
  },
  {
    title: "Dossier de sortie PDF",
    items: [
      {
        label: "Chemin d’export",
        body: "Les PDF enregistrés depuis un devis ou une facture sont écrits dans ce dossier. Utilisez un chemin absolu ou le bouton pour ouvrir le sélecteur système.",
      },
    ],
  },
];

export function WorkspaceSettingsHelpAside() {
  return (
    <HelpAsidePanel ariaLabel="Aide — espace de travail" sections={SECTIONS} />
  );
}
