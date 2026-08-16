import { isTauri } from "@tauri-apps/api/core";
import * as api from "@/lib/api";
import { detailsToJsonRecord, type ClientDetails } from "@/lib/clientDetails";
import { serializeArticleOptionsV1 } from "@/lib/articleOptions";

/**
 * Données de démo : uniquement en build dev (`import.meta.env.DEV`).
 * - **Tauri** (`tauri dev`) : toujours actif (hostname du WebView peut varier).
 * - **Navigateur** : localhost / 127.0.0.1 / ::1 uniquement.
 * La build prod (`vite build`, app packagée) a `DEV === false` → jamais affiché.
 */
export function isLocalhostDevDemoSeedAvailable(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;
  if (isTauri()) return true;
  const h = window.location.hostname.toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "[::1]" ||
    h === "::1"
  );
}

export const DEMO_SEED_MARKER_CLIENT_NAME = "[Démo] Atelier Lumière SA";

const emptyOpts = () => serializeArticleOptionsV1({ version: 1, variants: [] });

const variants = (
  defs: { id: string; label: string; priceDeltaHt: number }[],
): Record<string, unknown> =>
  serializeArticleOptionsV1({ version: 1, variants: defs });

export type DemoSeedResult = {
  clients: number;
  categories: number;
  articles: number;
  skipped: boolean;
};

type ArticleDef = {
  name: string;
  categoryName: string | null;
  basePrice: number;
  description?: string | null;
  flatPrice?: number | null;
  hourlyRate?: number | null;
  productionCost?: number | null;
  optionsJson?: Record<string, unknown>;
};

const CATEGORY_NAMES = [
  "[Démo] Viennoiseries",
  "[Démo] Boissons",
  "[Démo] Prestations",
  "[Démo] Matériel",
] as const;

function buildArticleDefs(): ArticleDef[] {
  return [
    {
      name: "[Démo] Croissant",
      categoryName: CATEGORY_NAMES[0],
      basePrice: 1.2,
      description: "Prix de base ; variantes pour options.",
      productionCost: 0.35,
      optionsJson: variants([
        { id: "demo-croissant-beurre", label: "— pur beurre", priceDeltaHt: 0.15 },
        { id: "demo-croissant-amandes", label: "— aux amandes", priceDeltaHt: 0.95 },
      ]),
    },
    {
      name: "[Démo] Pain au chocolat",
      categoryName: CATEGORY_NAMES[0],
      basePrice: 1.5,
      productionCost: 0.42,
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Brioche tressée",
      categoryName: CATEGORY_NAMES[0],
      basePrice: 4.5,
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Chausson aux pommes",
      categoryName: CATEGORY_NAMES[0],
      basePrice: 2.1,
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Tartelettes fruits (x4)",
      categoryName: CATEGORY_NAMES[0],
      basePrice: 0,
      flatPrice: 12,
      description: "Forfait boîte de 4 tartelettes.",
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Biscuits sablés (sachet)",
      categoryName: CATEGORY_NAMES[0],
      basePrice: 5.5,
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Café espresso",
      categoryName: CATEGORY_NAMES[1],
      basePrice: 2,
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Café allongé",
      categoryName: CATEGORY_NAMES[1],
      basePrice: 2.4,
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Thé / infusion",
      categoryName: CATEGORY_NAMES[1],
      basePrice: 2.8,
      optionsJson: variants([
        { id: "demo-the-earl", label: "Earl Grey", priceDeltaHt: 0 },
        { id: "demo-the-vert", label: "Vert jasmin", priceDeltaHt: 0 },
        { id: "demo-the-rooibos", label: "Rooibos", priceDeltaHt: 0.35 },
      ]),
    },
    {
      name: "[Démo] Jus d’orange 25 cl",
      categoryName: CATEGORY_NAMES[1],
      basePrice: 3.5,
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Eau plate 50 cl",
      categoryName: CATEGORY_NAMES[1],
      basePrice: 2,
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Conseil stratégique",
      categoryName: CATEGORY_NAMES[2],
      basePrice: 0,
      hourlyRate: 95,
      description: "Tarif horaire HT — tester mode « à l’heure ».",
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Forfait audit documentaire",
      categoryName: CATEGORY_NAMES[2],
      basePrice: 0,
      flatPrice: 1200,
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Rapport rédigé (10 p.)",
      categoryName: CATEGORY_NAMES[2],
      basePrice: 0,
      flatPrice: 350,
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Mise en page PDF",
      categoryName: CATEGORY_NAMES[2],
      basePrice: 55,
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Carte mémoire 64 Go",
      categoryName: CATEGORY_NAMES[3],
      basePrice: 24.9,
      productionCost: 14,
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Câble USB-C 2 m",
      categoryName: CATEGORY_NAMES[3],
      basePrice: 12.5,
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Souris ergonomique",
      categoryName: CATEGORY_NAMES[3],
      basePrice: 45,
      optionsJson: variants([
        { id: "demo-souris-gaucher", label: "— version gaucher", priceDeltaHt: 0 },
        { id: "demo-souris-silent", label: "— clics silencieux", priceDeltaHt: 5 },
      ]),
    },
    {
      name: "[Démo] Article sans catégorie A",
      categoryName: null,
      basePrice: 10,
      description: "Pour tester « Sans catégorie » dans le catalogue.",
      optionsJson: emptyOpts(),
    },
    {
      name: "[Démo] Article sans catégorie B (lots)",
      categoryName: null,
      basePrice: 15,
      optionsJson: variants([
        { id: "demo-lot-x5", label: "Lot ×5", priceDeltaHt: 55 },
        { id: "demo-lot-x10", label: "Lot ×10", priceDeltaHt: 120 },
      ]),
    },
  ];
}

/**
 * Crée ou complète 3 clients et 20 articles (catégories, variantes, forfait, horaire, sans catégorie).
 * Idempotent : ne recrée pas un client / article / catégorie déjà présent sous le même nom.
 */
export async function seedLocalhostDemoData(
  workspaceId: string,
  baseCurrency: string,
): Promise<DemoSeedResult> {
  let categoriesCreated = 0;
  let clientsCreated = 0;
  let articlesCreated = 0;

  let categories = await api.listCategories(workspaceId);
  const byName = (n: string) =>
    categories.find((c) => c.name === n && c.parentId === null);

  for (const name of CATEGORY_NAMES) {
    if (!byName(name)) {
      const c = await api.createCategory(workspaceId, name, null);
      categories = [...categories, c];
      categoriesCreated += 1;
    }
  }

  const articleDefs = buildArticleDefs();

  const catIdFor = (n: string | null) =>
    n == null ? null : (byName(n)?.id ?? null);

  const clientsBefore = await api.listClients(workspaceId);
  const clientNameSet = new Set(clientsBefore.map((c) => c.name));

  const articlesBefore = await api.listArticles(workspaceId);
  const articleNameSet = new Set(articlesBefore.map((a) => a.name));

  const demoClientNames = [
    DEMO_SEED_MARKER_CLIENT_NAME,
    "[Démo] Comptoir du Marché",
    "[Démo] Claire Fontaine",
  ] as const;

  const allDemoThere =
    demoClientNames.every((n) => clientNameSet.has(n)) &&
    articleDefs.every((a) => articleNameSet.has(a.name));

  if (allDemoThere) {
    return {
      clients: 0,
      categories: 0,
      articles: 0,
      skipped: true,
    };
  }

  const cur = baseCurrency.trim() || "EUR";

  if (!clientNameSet.has(DEMO_SEED_MARKER_CLIENT_NAME)) {
    const c1: ClientDetails = {
      clientType: "company",
      companyName: "Atelier Lumière SA",
      displayName: DEMO_SEED_MARKER_CLIENT_NAME,
      salutation: "Mme",
      firstName: "Sophie",
      lastName: "Bernard",
      currency: cur,
      website: "https://demo.localhost",
      billing: {
        street1: "12 rue du Commerce",
        city: "Lyon",
        zip: "69001",
        country: "France",
      },
    };
    await api.createClient(workspaceId, {
      name: DEMO_SEED_MARKER_CLIENT_NAME,
      email: "contact@atelier-lumiere.demo",
      phone: "+33 4 11 22 33 44",
      notes: "Client fictif — seed localhost uniquement.",
      detailsJson: detailsToJsonRecord(c1),
    });
    clientsCreated += 1;
  }

  if (!clientNameSet.has("[Démo] Comptoir du Marché")) {
    const c2: ClientDetails = {
      clientType: "company",
      companyName: "Comptoir du Marché SARL",
      displayName: "[Démo] Comptoir du Marché",
      salutation: "M.",
      firstName: "Julien",
      lastName: "Morel",
      currency: cur,
      billing: {
        street1: "8 place des Halles",
        city: "Nantes",
        zip: "44000",
        country: "France",
      },
    };
    await api.createClient(workspaceId, {
      name: "[Démo] Comptoir du Marché",
      email: "commandes@comptoir-marche.demo",
      phone: "+33 2 40 00 00 01",
      notes: "Client fictif — TVA et devis.",
      detailsJson: detailsToJsonRecord(c2),
    });
    clientsCreated += 1;
  }

  if (!clientNameSet.has("[Démo] Claire Fontaine")) {
    const c3: ClientDetails = {
      clientType: "individual",
      displayName: "Claire Fontaine",
      salutation: "Mme",
      firstName: "Claire",
      lastName: "Fontaine",
      currency: cur,
      billing: {
        street1: "3 impasse des Lilas",
        city: "Annecy",
        zip: "74000",
        country: "France",
      },
    };
    await api.createClient(workspaceId, {
      name: "[Démo] Claire Fontaine",
      email: "claire.fontaine@particulier.demo",
      phone: "+33 6 12 34 56 78",
      notes: "Client fictif — particulier.",
      detailsJson: detailsToJsonRecord(c3),
    });
    clientsCreated += 1;
  }

  for (const a of articleDefs) {
    if (articleNameSet.has(a.name)) continue;
    await api.createArticle(workspaceId, {
      name: a.name,
      description: a.description ?? null,
      categoryId: catIdFor(a.categoryName),
      basePrice: a.basePrice,
      flatPrice: a.flatPrice ?? null,
      hourlyRate: a.hourlyRate ?? null,
      productionCost: a.productionCost ?? null,
      optionsJson: a.optionsJson ?? emptyOpts(),
    });
    articleNameSet.add(a.name);
    articlesCreated += 1;
  }

  return {
    clients: clientsCreated,
    categories: categoriesCreated,
    articles: articlesCreated,
    skipped: false,
  };
}
