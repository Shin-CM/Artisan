# Prompt-lot — Pilotage : prévisionnel + rapports avancés (mode plan)

Colle dans Cursor en **mode plan**. Un seul sujet : **prévisionnel de trésorerie simple** et **rapports analytiques** liés à la facturation.

---

## Objectif prévisionnel

- À partir des factures : **échéances**, **statuts**, **montants payés**, estimer les **encaissements attendus** par période (semaine ou mois).
- **Sans** import bancaire ni synchro : données internes uniquement.
- Affichage : graphique ou tableau dans `ReportsPage` ou sous-page dédiée.

## Objectif rapports

- Enrichir `ReportsPage` / tableau de bord : **aging créances**, **top clients**, **répartition impayés**, éventuellement marge si données coût déjà en catalogue — seulement si faible coût.

## Contraintes

- Réutiliser **Recharts** déjà présent.
- Toutes les fonctions sont disponibles (projet libre, sans palier payant).
- Mettre à jour **`Fonctionnalités.md`**.

## Livrables du plan

- Formules de calcul documentées (timezone, devise).
- Composants React proposés.
- Commandes IPC si agrégation côté Rust nécessaire (`dashboard.rs` ou nouveau module).

## Exclusions

- Multi-devises avancées, trésorerie fournisseurs, prévisionnel sur devis non facturés (sauf mention explicite et justifiée).

---

Fin du prompt-lot Pilotage.
