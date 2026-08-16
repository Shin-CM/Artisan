# Graphe de présentation — outil 100 % local (nouveau projet)

Ce document sert de **référence transportable** : copie-le dans un nouveau dépôt (ex. `docs/PresentationGraph-OutilLocal-NouveauProjet.md`) pour garder la même convention sans dépendre d’une intégration magique avec Cursor.

## Principe

- **100 % local** : l’outil est un mini-site **Vite + React** sous `tools/presentation-graph/`, servi par `npm run dev` (ex. `localhost:5199`).
- **Lecture disque uniquement** : la vue **Présentation** lit `src/data/investor-graph.json` dans ce dossier. Cursor ou l’éditeur ne fait qu’**éditer des fichiers** ; le navigateur rechargé affiche le graphe.
- **Pas de canal propriétaire** Cursor → appli : pas besoin de MCP ni de crédits pour **consulter** le graphe une fois le serveur lancé.

## Ce que tu dois avoir dans le dépôt

```
tools/presentation-graph/
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  README.md
  public/cgc/README.md
  public/cgc/viz.html          # placeholder ; remplacer par export CodeGraphContext si besoin
  src/
    main.tsx
    App.tsx
    index.css
    data/investor-graph.json   # nœuds + arêtes + champ group par nœud
    components/…
    lib/…
```

## Contenu minimal de `investor-graph.json`

- **`nodes`** : `id`, `label`, `group` — `group` sert aux couleurs (domaines métier).
- **`edges`** : `id`, `source`, `target`.

Aligner le contenu avec **`Fonctionnalités.md`** (ou équivalent) : à chaque évolution produit notable, **mets à jour les deux**.

## Commandes

```bash
cd tools/presentation-graph
npm install
npm run dev
```

Ouvre l’URL indiquée par Vite ; vues **Présentation** (`/pitch`) et **Technique** (`/tech`, iframe sur `/cgc/viz.html`).

## Rappels UX (référence)

- **ELK** pour le layout ; bouton **Espacer la vue** (modes d’espacement) + **Recadrer**.
- Arêtes **step** (orthogonal), **sous** les nœuds (`elevateEdgesOnSelect={false}`, `zIndex` nœuds > arêtes), fonds de nœuds opaques.
- **Clic** sur un nœud : surbrillance des arêtes liées ; **clic sur le fond** : reset.

## Réutiliser sans tout recréer

1. **Copier** le dossier `tools/presentation-graph/` depuis un dépôt modèle (ou une release GitHub en `.zip`).
2. Adapter **`investor-graph.json`** et une section dans **`Fonctionnalités.md`** (ex. « Outils dépôt »).
3. Ne pas fusionner ce code dans le `src/` du produit principal si tu veux garder le build principal isolé.

## Règle Cursor associée

Dans ce dépôt, la règle d’amorçage pour l’agent est : [`.cursor/rules/presentation-graph-bootstrap.mdc`](../.cursor/rules/presentation-graph-bootstrap.mdc). Dans un autre dépôt, copie ce fichier dans `.cursor/rules/` ou fusionne son contenu avec tes règles existantes.
