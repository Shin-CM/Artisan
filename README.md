# Artisan

**English** | [Français](README.fr.md)

Artisan is an **offline-first** desktop app for artisans and small businesses, built with **Tauri**, **React**, and **SQLite**.

It helps you manage **quotes**, **invoices**, **clients**, **products**, **reminders**, **calendar**, **reports**, and related business modules, without a mandatory subscription or a required remote service.

The application interface is currently in French. A [French README](README.fr.md) is also available.

## Why Artisan exists

Artisan started from a very concrete need: reducing the administrative load of an artisan so she could spend more time on her craft.

The original goal was simple: spend less time jumping between Excel, Word, client follow-ups, quotes, invoices, and scattered information. The project then grew with automations, finer catalog management, and an organization better suited to the day-to-day work of an independent.

The full origin story and the author's intent are available in French in [`docs/Histoire-du-projet.md`](docs/Histoire-du-projet.md).

## Why the project is open source

Artisan is now published as **open source** under the **MIT** license.

The point is not only to share code, but to let the project keep living, even if its creators can no longer evolve it alone. If other artisans, developers, or small businesses can use it, improve it, or grow it, then the project will have kept its meaning.

## What Artisan does

- **Quotes**, **invoices**, **credit notes**, and **purchase orders**
- **Clients**, **product catalog**, and **variants / modifiers**
- Business **calendar**, reminders, and event tracking
- **CRM**, **client follow-up**, **collections**, and **projects** via modules
- **PDF exports**, **Data Manager**, **reports**, and planning tools
- **Tablet PWA** and **local API** for workshop / LAN use
- **Internal marketplace** to enable optional modules per workspace

For the detailed, up-to-date product and technical description (in French), see [`Fonctionnalités.md`](Fonctionnalités.md).

## Quick start

### Main application

```bash
npm install
npm run tauri dev
```

To run only the local web frontend:

```bash
npm run dev
```

### Marketing website

```bash
cd website
npm install
npm run dev
```

### Presentation graph

```bash
cd tools/presentation-graph
npm install
npm run dev
```

Local docs: [`tools/presentation-graph/README.md`](tools/presentation-graph/README.md)

## Documentation

- [French README](README.fr.md)
- [`Fonctionnalités.md`](Fonctionnalités.md): detailed product and technical documentation (French)
- [`docs/Histoire-du-projet.md`](docs/Histoire-du-projet.md): project history, open-source decision, and the creator's wishes (French)
- [`tools/presentation-graph/README.md`](tools/presentation-graph/README.md): local graph tool for demos and product mapping

## License

Artisan is distributed under the **MIT** license. See [`LICENSE`](LICENSE).

The license gives broad freedom to use, modify, and redistribute. The wish expressed in the project history about keeping the tool affordable for artisans is a moral request from the creator, not an extra legal condition.

## Thanks

Thanks to everyone who uses Artisan, fixes a bug, suggests an idea, improves the docs, or continues its development.

A tool created for one artisan, now free to serve all artisans.
