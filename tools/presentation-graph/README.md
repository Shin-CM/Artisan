# Graphe de présentation (hors app Artisan)

Mini-site **Vite + React** pour deux vues sur `localhost` :

1. **Présentation** (`/pitch`) — graphe métier (React Flow + ELK), données dans `src/data/investor-graph.json`.
2. **Technique** (`/tech`) — iframe pointant vers `public/cgc/viz.html` (export CodeGraphContext à y placer).

## Prérequis

- Node.js récent (aligné sur le reste du dépôt).

## Commandes

```bash
cd tools/presentation-graph
npm install
npm run dev
```

Le serveur démarre par défaut sur le port **5199** (voir `vite.config.ts`).

## CodeGraphContext (optionnel)

Installation Python (voir le dépôt officiel), puis indexation du dépôt Artisan et génération d’une visualisation `--viz`. Copiez le fichier HTML résultant dans **`public/cgc/viz.html`** pour l’afficher dans la vue Technique.

## Build statique

```bash
npm run build
npm run preview
```
