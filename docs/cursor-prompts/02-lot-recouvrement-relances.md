# Prompt-lot — Recouvrement : relances assistées (mode plan)

Colle dans Cursor en **mode plan**. Un seul sujet : **impayés** et **relances assistées** (pas d’envoi SMTP automatique obligatoire en V1).

---

## Objectif

- Vue des factures **en retard** (échéance < aujourd’hui, statuts non payés / partiels).
- Filtres par **ancienneté** (ex. 0–30, 31–60, 60+ jours).
- **Modèles de relance** : réutiliser ou étendre `text_snippets`, ou table dédiée `dunning_templates` si nécessaire.
- Actions : **copier** le texte, **pré-remplir** courriel (mailto:) si pertinent, ou export liste CSV léger depuis l’écran rapports — à trancher dans le plan.
- Pas de file d’attente d’emails ni de cron : V1 **assistée** uniquement.

## Contraintes

- Données : `invoices.due_date`, `status`, `amount_paid`, `total`, `client_id`.
- UI française, icônes Lucide inline.
- Mettre à jour **`Fonctionnalités.md`**.

## Livrables du plan

- Route(s) proposée(s) : ex. `/home/recovery` ou section dans Rapports.
- Requêtes SQLite ou fonctions Rust agrégées (performance).
- Wireframes textuels des écrans.
- Politique de calcul du « reste à payer » alignée sur l’existant factures.

## Exclusions

- Relances **automatiques** planifiées, webhooks, fournisseurs email tiers.

---

Fin du prompt-lot Recouvrement.
