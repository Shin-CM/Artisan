# Prompt-lot — Pont comptable + stub Marketplace « Comptabilité Essentials » (mode plan)

Colle dans Cursor en **mode plan**. Un seul sujet : **préparer** la comptabilité sans livrer la Vague 2 complète.

---

## Objectif

1. **Décisions d’architecture** : tables dédiées type `accounting_*` (plan minimal, journaux, lignes d’écriture) **ou** documenter pourquoi reporter — mais au minimum **schéma cible** et stratégie de génération d’écritures depuis factures / avoirs / paiements.
2. **Module Marketplace** : manifeste interne stable `invoicies.accounting-essentials` (ou nom choisi et justifié), enregistré comme les modules existants (`pdf-typography`, `data-manager-lazy`), **désactivé par défaut** ou **stub** sans UI lourde.
3. **Catalogue Marketplace** : entrée dans `marketplaceExtensionCatalog.ts` + fiche Découvrir / catégorie Rapports & exports si cohérent.
4. Aucune obligation d’implémenter grand livre, balance, exports FEC dans ce lot — **pont uniquement**.

## Contraintes

- Pas de dépendance à un logiciel externe AGPL embarqué.
- Capabilities Tauri : n’ajouter de permission que si commande réelle.
- Mettre à jour **`Fonctionnalités.md`**.

## Livrables du plan

- Schéma SQL proposé (même si migration différée).
- Mapping événements métier → écritures (pseudo-code).
- Fichiers TS/Rust exacts à toucher pour le manifeste et le catalogue.
- Critères : module visible dans Marketplace, activation sans casser l’app.

---

Fin du prompt-lot Pont comptable.
