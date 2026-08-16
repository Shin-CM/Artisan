import type { Article, Category, TaxRate } from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { optsJson } from "@/lib/apiMock/documentBuilders";
import { now, rid, store } from "@/lib/apiMock/store";

export const catalogHandlers: Record<string, MockHandler> = {
  list_categories: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.categories.filter((c) => c.workspaceId === workspaceId);
  },

  create_category: (args) => {
    const workspaceId = args.workspaceId as string;
    const name = args.name as string;
    const parentId = args.parentId as string | null;
    const maxOrder = store.categories
      .filter((c) => c.workspaceId === workspaceId)
      .reduce((m, c) => Math.max(m, c.sortOrder), -1);
    const cat: Category = {
      id: rid(),
      workspaceId,
      parentId,
      name: name.trim(),
      sortOrder: maxOrder + 1,
    };
    store.categories.push(cat);
    return cat;
  },

  update_category: (args) => {
    const workspaceId = args.workspaceId as string;
    const id = args.id as string;
    const name = (args.name as string).trim();
    if (!name) throw new Error("Indiquez un nom de catégorie.");
    const c = store.categories.find(
      (x) => x.id === id && x.workspaceId === workspaceId,
    );
    if (!c) throw new Error("Catégorie introuvable.");
    c.name = name;
    return c;
  },

  delete_category: (args) => {
    const workspaceId = args.workspaceId as string;
    const id = args.id as string;
    const cat = store.categories.find(
      (x) => x.id === id && x.workspaceId === workspaceId,
    );
    if (!cat) throw new Error("Catégorie introuvable.");
    const parentId = cat.parentId;
    const children = store.categories
      .filter((x) => x.parentId === id && x.workspaceId === workspaceId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const siblings = store.categories.filter(
      (x) =>
        x.workspaceId === workspaceId &&
        (parentId == null ? x.parentId == null : x.parentId === parentId) &&
        x.id !== id,
    );
    let next = siblings.reduce((m, x) => Math.max(m, x.sortOrder), -1) + 1;
    for (const ch of children) {
      ch.parentId = parentId;
      ch.sortOrder = next;
      next += 1;
    }
    for (const a of store.articles) {
      if (a.workspaceId === workspaceId && a.categoryId === id) {
        a.categoryId = null;
        a.updatedAt = now();
      }
    }
    store.categories = store.categories.filter((c) => c.id !== id);
    return undefined;
  },

  list_articles: (args) => {
    const workspaceId = args.workspaceId as string;
    const list = store.articles.filter((a) => a.workspaceId === workspaceId);
    return [...list].sort((a, b) => {
      const ac = a.categoryId;
      const bc = b.categoryId;
      const aNull = ac == null ? 1 : 0;
      const bNull = bc == null ? 1 : 0;
      if (aNull !== bNull) return aNull - bNull;
      if (ac !== bc) return String(ac).localeCompare(String(bc));
      const ao = a.sortOrder ?? 0;
      const bo = b.sortOrder ?? 0;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name, "fr");
    });
  },

  create_article: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as {
      name: string;
      description?: string | null;
      categoryId?: string | null;
      basePrice: number;
      flatPrice?: number | null;
      hourlyRate?: number | null;
      productionCost?: number | null;
      optionsJson?: unknown;
      supplierName?: string | null;
      supplierReference?: string | null;
    };
    const t = now();
    const catId = input.categoryId ?? null;
    const sameCat = store.articles.filter(
      (x) => x.workspaceId === workspaceId && x.categoryId === catId,
    );
    const nextOrder =
      sameCat.reduce((m, x) => Math.max(m, x.sortOrder ?? 0), -1) + 1;
    const a: Article = {
      id: rid(),
      workspaceId,
      categoryId: catId,
      name: input.name.trim(),
      description: input.description ?? null,
      basePrice: input.basePrice,
      flatPrice:
        input.flatPrice != null && Number.isFinite(input.flatPrice)
          ? input.flatPrice
          : null,
      hourlyRate:
        input.hourlyRate != null && Number.isFinite(input.hourlyRate)
          ? input.hourlyRate
          : null,
      productionCost: input.productionCost ?? null,
      optionsJson: optsJson(input.optionsJson),
      sortOrder: nextOrder,
      supplierName: input.supplierName?.trim() || null,
      supplierReference: input.supplierReference?.trim() || null,
      createdAt: t,
      updatedAt: t,
    };
    store.articles.push(a);
    return a;
  },

  update_article: (args) => {
    const id = args.id as string;
    const input = args.input as {
      name: string;
      description?: string | null;
      categoryId?: string | null;
      basePrice: number;
      flatPrice?: number | null;
      hourlyRate?: number | null;
      productionCost?: number | null;
      optionsJson?: unknown;
      sortOrder?: number;
      supplierName?: string | null;
      supplierReference?: string | null;
    };
    const a = store.articles.find((x) => x.id === id);
    if (!a) throw new Error("Article introuvable");
    a.name = input.name.trim();
    a.description = input.description ?? null;
    a.categoryId = input.categoryId ?? null;
    a.basePrice = input.basePrice;
    a.flatPrice =
      input.flatPrice != null && Number.isFinite(input.flatPrice)
        ? input.flatPrice
        : null;
    a.hourlyRate =
      input.hourlyRate != null && Number.isFinite(input.hourlyRate)
        ? input.hourlyRate
        : null;
    a.productionCost = input.productionCost ?? null;
    a.optionsJson = optsJson(input.optionsJson);
    a.supplierName = input.supplierName?.trim() || null;
    a.supplierReference = input.supplierReference?.trim() || null;
    if (typeof input.sortOrder === "number") a.sortOrder = input.sortOrder;
    a.updatedAt = now();
    return a;
  },

  reorder_articles: (args) => {
    const workspaceId = args.workspaceId as string;
    const items = args.items as {
      id: string;
      categoryId: string | null;
      sortOrder: number;
    }[];
    for (const it of items) {
      const a = store.articles.find(
        (x) => x.id === it.id && x.workspaceId === workspaceId,
      );
      if (!a) throw new Error(`Article introuvable : ${it.id}`);
      a.categoryId = it.categoryId;
      a.sortOrder = it.sortOrder;
      a.updatedAt = now();
    }
    return undefined;
  },

  reorder_categories: (args) => {
    const workspaceId = args.workspaceId as string;
    const parentId = args.parentId as string | null;
    const orderedIds = args.orderedIds as string[];
    orderedIds.forEach((id, i) => {
      const c = store.categories.find(
        (x) =>
          x.id === id &&
          x.workspaceId === workspaceId &&
          (parentId == null ? x.parentId == null : x.parentId === parentId),
      );
      if (!c) throw new Error(`Catégorie introuvable : ${id}`);
      c.sortOrder = i;
    });
    return undefined;
  },

  delete_article: (args) => {
    const id = args.id as string;
    store.articles = store.articles.filter((a) => a.id !== id);
    return undefined;
  },

  list_tax_rates: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.taxRates
      .filter((r) => r.workspaceId === workspaceId)
      .sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name));
  },

  create_tax_rate: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as { name: string; rate: number };
    const name = input.name.trim();
    if (!name) throw new Error("Indiquez un libellé pour le taux.");
    if (
      !Number.isFinite(input.rate) ||
      input.rate < 0 ||
      input.rate > 100
    ) {
      throw new Error("Le taux doit être un pourcentage entre 0 et 100.");
    }
    const tr: TaxRate = {
      id: rid(),
      workspaceId,
      name,
      rate: input.rate,
      isDefault: false,
    };
    store.taxRates.push(tr);
    return tr;
  },

  delete_tax_rate: (args) => {
    const id = args.id as string;
    const workspaceId = args.workspaceId as string;
    const before = store.taxRates.length;
    store.taxRates = store.taxRates.filter(
      (r) => !(r.id === id && r.workspaceId === workspaceId),
    );
    if (store.taxRates.length === before) throw new Error("Taux introuvable.");
    return undefined;
  },
};
