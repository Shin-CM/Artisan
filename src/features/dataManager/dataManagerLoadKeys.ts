/** Clés de chargement IPC (une liste API par clé). */
export type DataManagerLoadKey =
  | "clients"
  | "articles"
  | "categories"
  | "quotes"
  | "invoices"
  | "projects"
  | "taxRates"
  | "presets"
  | "snippets"
  | "history";

const ALL_LOAD_KEYS: DataManagerLoadKey[] = [
  "clients",
  "articles",
  "categories",
  "quotes",
  "invoices",
  "projects",
  "taxRates",
  "presets",
  "snippets",
  "history",
];

export function allDataManagerLoadKeys(): readonly DataManagerLoadKey[] {
  return ALL_LOAD_KEYS;
}

/** Mappe un `selectionId` / scope sidebar vers la clé de fetch unique. */
export function loadKeyForSidebarScope(scope: string): DataManagerLoadKey | null {
  if (scope === "history") return "history";
  if (scope === "clients") return "clients";
  if (scope === "categories") return "categories";
  if (scope === "quotes") return "quotes";
  if (scope === "invoices") return "invoices";
  if (scope === "projects") return "projects";
  if (scope === "tax-rates") return "taxRates";
  if (scope === "discount-presets") return "presets";
  if (scope === "snippets") return "snippets";
  if (
    scope === "articles:all" ||
    scope === "articles:uncat" ||
    scope.startsWith("articles:cat:")
  ) {
    return "articles";
  }
  return null;
}
