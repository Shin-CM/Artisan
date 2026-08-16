# Prompt-lot — Documents : bons de commande + avoirs (mode plan)

Colle dans Cursor en **mode plan**. Un seul sujet : **bons de commande** et **avoirs / factures d’avoir**.

---

Contexte : Artisan a déjà **devis** et **factures** avec lignes, TVA, remises, compléments, PDF, archivage, conversion devis → facture.

## Objectif

1. **Bons de commande** : document métier proche du devis (client, lignes, totaux, PDF, numérotation dédiée ex. `BDC-xxxxx`), statuts cohérents, archivage optionnel aligné sur le reste.
2. **Avoirs** : corriger / annuler partiellement une facture ; lien optionnel vers la facture d’origine ; PDF titre « Avoir » ; numérotation dédiée ex. `AVC-xxxxx` ; compatibilité avec les totaux et la TVA existants.

## Contraintes

- Réutiliser au maximum : calculs `documentMath`, composants éditeur, `QuoteInvoicePdf` ou équivalent paramétré.
- SQLite : migrations dans `db.rs` (pattern `migrate_*` + `column_exists`).
- Rust : commandes dans `src-tauri/src/commands/`, enregistrement dans `lib.rs`.
- Front : routes dans `App.tsx`, entrées menu `HomeLayout.tsx`, API dans `src/lib/api.ts`, mock dans `src/lib/apiMock/` si nécessaire.
- Mettre à jour **`Fonctionnalités.md`**.

## Livrables du plan (sortie attendue)

- Schéma SQL proposé (tables ou colonnes).
- Liste des commandes IPC nouvelles ou modifiées.
- Liste des pages/composants React (nouveaux vs fork).
- Règles métier : conversion BC → facture si applicable ; avoir partiel vs total.
- Cas limites : facture déjà payée, avoir supérieur au reste dû, archivage.
- Tests : Vitest ciblés si logique nouvelle isolable.

## Exclusions

- Pas de facturation électronique réglementaire.
- Pas de signature électronique dans ce lot.

---

Fin du prompt-lot Documents.
