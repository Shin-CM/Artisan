# Prompt maître — Mode plan Cursor (Artisan, Vague 1 cœur)

Colle ce texte dans Cursor en **mode plan**. Ne passe en mode agent qu’après validation du plan généré.

---

Tu es l’agent plan pour le dépôt **Artisan** : application desktop **Tauri 2 + React + SQLite**, offline-first, IPC via `src/lib/apiCore.ts` (hors Tauri : mock sans persistance). Interface **français**. Icônes **inline uniquement** (Lucide), pas d’images décoratives pour des icônes. À chaque évolution fonctionnelle : mettre à jour **`Fonctionnalités.md`**. Signale tout fichier source **> 800 lignes** rencontré. Si tu dois t’arrêter : crée un **fichier markdown de reprise** à la racine ou dans `docs/`.

## Référence produit (obligatoire)

Le plan complet validé est décrit dans la matrice **écarts concurrence** du projet : Vague 1 = documents (bons de commande + avoirs), recouvrement assisté, pilotage (prévisionnel + rapports), pont comptable. Vague 2 = Marketplace (compta, CRM/Kanban, stocks/projets). Vague 3 = web persisté, mobile, API, banque, e-invoicing, etc.

## Ta mission (mode plan uniquement)

1. **Cartographier le code** dans cet ordre : `src-tauri/src/db.rs` (migrations), `src-tauri/src/commands/`, `src/lib/api.ts`, `src/App.tsx`, `src/layouts/HomeLayout.tsx`, éditeurs sous `src/pages/documentEditor/`, PDF `src/documents/`, rapports `src/pages/ReportsPage.tsx`, `src/pages/HomeDashboard.tsx`, Marketplace `src/lib/marketplaceExtensionCatalog.ts`, `src/lib/marketplaceModules.ts`.
2. **Proposer un plan d’implémentation Vague 1** avec : fichiers touchés, migrations SQLite, nouvelles commandes IPC, routes React, réutilisation maximale des patterns devis/factures.
3. **Exclure explicitement** dans ce plan : web complet, mobile, API publique large, SMTP automatique massif, synchro bancaire temps réel, RH, compte pro, marketing, e-invoicing complète.
4. **Dépendances** : bons de commande et avoirs avant ou en parallèle avec recouvrement ; pont comptable = schéma + stub module sans livrer toute la compta Vague 2.
5. **Livrables du plan** : liste numérotée d’étapes, critères de test manuels, risques, et section « mise à jour `Fonctionnalités.md` » avec puces prêtes à coller.

## Interdictions

- Ne pas proposer de fusionner un produit externe (ex. Gäld) dans le binaire sans analyse licence.
- Ne pas refondre toute l’architecture documents en une table générique sans justification forte.
- Ne pas mélanger Vague 2 et Vague 3 dans les mêmes étapes agent.

---

Fin du prompt maître.
