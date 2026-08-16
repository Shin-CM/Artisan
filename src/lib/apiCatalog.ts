import { ipc } from "@/lib/apiCore";

export type Client = {
  id: string;
  workspaceId: string;
  name: string;
  email: string | null;
  phone: string | null;
  addressJson: string | null;
  notes: string | null;
  detailsJson: string | null;
  /** Ordre dans la liste clients. */
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
};

export async function listClients(workspaceId: string): Promise<Client[]> {
  return ipc("list_clients", { workspaceId });
}

export async function createClient(
  workspaceId: string,
  input: {
    name: string;
    email?: string | null;
    phone?: string | null;
    addressJson?: Record<string, unknown> | null;
    notes?: string | null;
    detailsJson?: Record<string, unknown> | null;
  },
): Promise<Client> {
  return ipc("create_client", { workspaceId, input });
}

export async function updateClient(
  id: string,
  input: {
    name: string;
    email?: string | null;
    phone?: string | null;
    addressJson?: Record<string, unknown> | null;
    notes?: string | null;
    detailsJson?: Record<string, unknown> | null;
  },
): Promise<Client> {
  return ipc("update_client", { id, input });
}

export async function deleteClient(id: string): Promise<void> {
  return ipc("delete_client", { id });
}

export type Category = {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
};

export async function listCategories(
  workspaceId: string,
): Promise<Category[]> {
  return ipc("list_categories", { workspaceId });
}

export async function createCategory(
  workspaceId: string,
  name: string,
  parentId: string | null,
): Promise<Category> {
  return ipc("create_category", { workspaceId, name, parentId });
}

export async function updateCategory(
  workspaceId: string,
  id: string,
  name: string,
): Promise<Category> {
  return ipc("update_category", { workspaceId, id, name });
}

export async function deleteCategory(
  workspaceId: string,
  id: string,
): Promise<void> {
  return ipc("delete_category", { workspaceId, id });
}

export type Article = {
  id: string;
  workspaceId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  /** Prix unitaire HT (quantité × PU). */
  basePrice: number;
  /** Montant forfait HT (catalogue). */
  flatPrice: number | null;
  /** Tarif horaire HT (catalogue). */
  hourlyRate: number | null;
  productionCost: number | null;
  optionsJson: string;
  /** Ordre dans la catégorie (catalogue / listes). */
  sortOrder?: number;
  /** Fournisseur (achat / stock). */
  supplierName?: string | null;
  /** Référence chez le fournisseur. */
  supplierReference?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listArticles(workspaceId: string): Promise<Article[]> {
  return ipc("list_articles", { workspaceId });
}

export async function createArticle(
  workspaceId: string,
  input: {
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
  },
): Promise<Article> {
  return ipc("create_article", { workspaceId, input });
}

export async function updateArticle(
  id: string,
  input: {
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
  },
): Promise<Article> {
  return ipc("update_article", { id, input });
}

export async function deleteArticle(id: string): Promise<void> {
  return ipc("delete_article", { id });
}

export type ArticleReorderItem = {
  id: string;
  categoryId: string | null;
  sortOrder: number;
};

export async function reorderArticles(
  workspaceId: string,
  items: ArticleReorderItem[],
): Promise<void> {
  return ipc("reorder_articles", { workspaceId, items });
}

export async function reorderCategories(
  workspaceId: string,
  parentId: string | null,
  orderedIds: string[],
): Promise<void> {
  return ipc("reorder_categories", { workspaceId, parentId, orderedIds });
}

export async function reorderClients(
  workspaceId: string,
  orderedIds: string[],
): Promise<void> {
  return ipc("reorder_clients", { workspaceId, orderedIds });
}

export type TaxRate = {
  id: string;
  workspaceId: string;
  name: string;
  rate: number;
  isDefault: boolean;
};

export async function listTaxRates(workspaceId: string): Promise<TaxRate[]> {
  return ipc("list_tax_rates", { workspaceId });
}

export async function createTaxRate(
  workspaceId: string,
  input: { name: string; rate: number },
): Promise<TaxRate> {
  return ipc("create_tax_rate", { workspaceId, input });
}

export async function deleteTaxRate(
  id: string,
  workspaceId: string,
): Promise<void> {
  return ipc("delete_tax_rate", { id, workspaceId });
}

/** Modèle de réduction réutilisable (pourcentage ou montant HT fixe). */
export type DiscountPreset = {
  id: string;
  workspaceId: string;
  name: string;
  /** `percent` | `fixed` */
  kind: string;
  value: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export async function listDiscountPresets(
  workspaceId: string,
): Promise<DiscountPreset[]> {
  return ipc("list_discount_presets", { workspaceId });
}

export async function createDiscountPreset(
  workspaceId: string,
  input: { name: string; kind: string; value: number },
): Promise<DiscountPreset> {
  return ipc("create_discount_preset", { workspaceId, input });
}

export async function updateDiscountPreset(
  id: string,
  workspaceId: string,
  input: { name: string; kind: string; value: number },
): Promise<DiscountPreset> {
  return ipc("update_discount_preset", { id, workspaceId, input });
}

export async function deleteDiscountPreset(
  id: string,
  workspaceId: string,
): Promise<void> {
  return ipc("delete_discount_preset", { id, workspaceId });
}
