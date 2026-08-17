# Artisan

[English](README.md) | **Français**

Artisan est une application desktop **offline-first** pour les artisans et les petites structures, construite avec **Tauri**, **React** et **SQLite**.

Le projet aide à gérer les **devis**, **factures**, **clients**, **produits**, **rappels**, **calendrier**, **rapports** et modules métier associés, sans abonnement obligatoire ni dépendance à un service distant.

La vitrine GitHub du dépôt est en [anglais](README.md). L'interface de l'application est actuellement en français.

## Pourquoi Artisan existe

Artisan est né d'un besoin très concret : réduire la charge administrative d'une artisane afin qu'elle puisse consacrer plus de temps à son métier.

Au départ, l'objectif était simple : éviter de passer trop de temps entre Excel, Word, les relances clients, les devis, les factures et les informations dispersées. Le projet a ensuite grandi avec des automatisations, une gestion plus fine du catalogue et une organisation plus adaptée au quotidien d'un indépendant.

Le texte complet sur l'origine du projet et l'intention de son auteur est disponible dans [`docs/Histoire-du-projet.md`](docs/Histoire-du-projet.md).

## Pourquoi le projet est open source

Artisan est aujourd'hui publié en **open source** sous licence **MIT**.

L'idée n'est pas seulement de partager du code, mais de permettre au projet de continuer à vivre, même si ses créateurs ne sont plus en mesure de le faire évoluer seuls. Si d'autres artisans, développeurs ou petites structures peuvent s'en servir, l'améliorer ou le faire grandir, alors le projet aura conservé son sens.

## Ce que fait Artisan

- Gestion de **devis**, **factures**, **avoirs** et **bons de commande**
- Gestion **clients**, **catalogue produits** et **variantes / modificateurs**
- **Calendrier** métier, rappels et suivi d'événements
- **CRM**, **suivi clients**, **recouvrement** et **projets** via modules
- **Exports PDF**, **Data Manager**, **rapports** et outils de pilotage
- **PWA tablette** et **API locale** pour usages réseau / atelier
- **Marketplace interne** pour activer des modules optionnels par espace

Pour la description détaillée et à jour des fonctionnalités, voir [`Fonctionnalités.md`](Fonctionnalités.md).

## Démarrage rapide

### Application principale

```bash
npm install
npm run tauri dev
```

Pour lancer uniquement le front web local :

```bash
npm run dev
```

### Site vitrine

```bash
cd website
npm install
npm run dev
```

### Graphe de présentation

```bash
cd tools/presentation-graph
npm install
npm run dev
```

Documentation locale : [`tools/presentation-graph/README.md`](tools/presentation-graph/README.md)

## Documentation

- [README anglais](README.md) (page d'accueil GitHub)
- [`Fonctionnalités.md`](Fonctionnalités.md) : documentation produit et technique détaillée
- [`docs/Histoire-du-projet.md`](docs/Histoire-du-projet.md) : histoire du projet, passage en open source et souhaits du créateur
- [`tools/presentation-graph/README.md`](tools/presentation-graph/README.md) : outil local de graphe pour démos et cartographie produit

## Licence

Artisan est distribué sous licence **MIT**. Voir [`LICENSE`](LICENSE).

La licence donne une grande liberté d'utilisation, de modification et de redistribution. Le souhait exprimé dans l'histoire du projet concernant l'accessibilité pour les artisans est un souhait moral du créateur, pas une condition juridique supplémentaire.

## Merci

Merci aux personnes qui utiliseront Artisan, corrigeront un bug, proposeront une idée, amélioreront la documentation ou poursuivront son développement.

Un outil créé pour une artisane, aujourd'hui libre de servir tous les artisans.
