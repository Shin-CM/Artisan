# Artisan

Artisan est une application desktop **offline-first** pour les artisans et les petites structures, construite avec **Tauri**, **React** et **SQLite**.

Le projet aide a gerer les **devis**, **factures**, **clients**, **produits**, **rappels**, **calendrier**, **rapports** et modules metier associes, sans abonnement obligatoire ni dependance a un service distant.

## Pourquoi Artisan existe

Artisan est ne d'un besoin tres concret : reduire la charge administrative d'une artisane afin qu'elle puisse consacrer plus de temps a son metier.

Au depart, l'objectif etait simple : eviter de passer trop de temps entre Excel, Word, les relances clients, les devis, les factures et les informations dispersees. Le projet a ensuite grandi avec des automatisations, une gestion plus fine du catalogue et une organisation plus adaptee au quotidien d'un independant.

Le texte complet sur l'origine du projet et l'intention de son auteur est disponible dans [`docs/Histoire-du-projet.md`](docs/Histoire-du-projet.md).

## Pourquoi le projet est open source

Artisan est aujourd'hui publie en **open source** sous licence **MIT**.

L'idee n'est pas seulement de partager du code, mais de permettre au projet de continuer a vivre, meme si ses createurs ne sont plus en mesure de le faire evoluer seuls. Si d'autres artisans, developpeurs ou petites structures peuvent s'en servir, l'ameliorer ou le faire grandir, alors le projet aura conserve son sens.

## Ce que fait Artisan

- Gestion de **devis**, **factures**, **avoirs** et **bons de commande**
- Gestion **clients**, **catalogue produits** et **variantes / modificateurs**
- **Calendrier** metier, rappels et suivi d'evenements
- **CRM**, **suivi clients**, **recouvrement** et **projets** via modules
- **Exports PDF**, **Data Manager**, **rapports** et outils de pilotage
- **PWA tablette** et **API locale** pour usages reseau / atelier
- **Marketplace interne** pour activer des modules optionnels par espace

Pour la description detaillee et a jour des fonctionnalites, voir [`Fonctionnalites.md`](Fonctionnalités.md).

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

### Graphe de presentation

```bash
cd tools/presentation-graph
npm install
npm run dev
```

Documentation locale : [`tools/presentation-graph/README.md`](tools/presentation-graph/README.md)

## Documentation

- [`Fonctionnalités.md`](Fonctionnalités.md) : documentation produit et technique detaillee
- [`docs/Histoire-du-projet.md`](docs/Histoire-du-projet.md) : histoire du projet, passage en open source et souhaits du createur
- [`tools/presentation-graph/README.md`](tools/presentation-graph/README.md) : outil local de graphe pour demos et cartographie produit

## Licence

Artisan est distribue sous licence **MIT**. Voir [`LICENSE`](LICENSE).

La licence donne une grande liberte d'utilisation, de modification et de redistribution. Le souhait exprime dans l'histoire du projet concernant l'accessibilite pour les artisans est un souhait moral du createur, pas une condition juridique supplementaire.

## GitHub

Si tu publies ce depot sur GitHub, la presentation recommandee est :

- **Description courte** : `Logiciel libre offline-first pour devis, factures et gestion artisanale.`
- **Topics** : `artisan`, `invoicing`, `billing`, `quotes`, `tauri`, `react`, `sqlite`, `offline-first`, `open-source`

## Merci

Merci aux personnes qui utiliseront Artisan, corrigeront un bug, proposeront une idee, amelioreront la documentation ou poursuivront son developpement.

Un outil cree pour une artisane, aujourd'hui libre de servir tous les artisans.
