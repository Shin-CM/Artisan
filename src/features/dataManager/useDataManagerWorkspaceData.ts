import * as React from "react";
import * as api from "@/lib/api";
import {
  allDataManagerLoadKeys,
  type DataManagerLoadKey,
  loadKeyForSidebarScope,
} from "@/features/dataManager/dataManagerLoadKeys";

export type DataManagerBundle = {
  clients: api.Client[];
  categories: api.Category[];
  articles: api.Article[];
  quotes: api.Quote[];
  invoices: api.Invoice[];
  taxRates: api.TaxRate[];
  snippets: api.TextSnippet[];
  presets: api.DiscountPreset[];
  projects: api.Project[];
};

const emptyBundle: DataManagerBundle = {
  clients: [],
  categories: [],
  articles: [],
  quotes: [],
  invoices: [],
  taxRates: [],
  snippets: [],
  presets: [],
  projects: [],
};

async function fetchKey(
  workspaceId: string,
  key: DataManagerLoadKey,
): Promise<Partial<DataManagerBundle> | { history: api.ImportHistoryRow[] }> {
  switch (key) {
    case "clients":
      return { clients: await api.listClients(workspaceId) };
    case "articles":
      return { articles: await api.listArticles(workspaceId) };
    case "categories":
      return { categories: await api.listCategories(workspaceId) };
    case "quotes":
      return { quotes: await api.listQuotes(workspaceId) };
    case "invoices":
      return { invoices: await api.listInvoices(workspaceId) };
    case "taxRates":
      return { taxRates: await api.listTaxRates(workspaceId) };
    case "presets":
      return { presets: await api.listDiscountPresets(workspaceId) };
    case "snippets":
      return { snippets: await api.listTextSnippets(workspaceId) };
    case "projects":
      return { projects: await api.listProjects(workspaceId) };
    case "history":
      return { history: await api.listImportHistory(workspaceId) };
    default:
      return {};
  }
}

export function useDataManagerWorkspaceData(
  workspaceId: string | null,
  options?: { lazyLoad?: boolean },
) {
  const lazyLoad = options?.lazyLoad === true;
  const [bundle, setBundle] = React.useState<DataManagerBundle>(emptyBundle);
  const [history, setHistory] = React.useState<api.ImportHistoryRow[]>([]);
  const [loadedKeys, setLoadedKeys] = React.useState<Set<DataManagerLoadKey>>(
    () => new Set(),
  );
  const [loadingKey, setLoadingKey] = React.useState<DataManagerLoadKey | null>(
    null,
  );
  const loadedRef = React.useRef<Set<DataManagerLoadKey>>(new Set());
  const inFlightRef = React.useRef<Set<DataManagerLoadKey>>(new Set());

  const mergeBundle = React.useCallback((patch: Partial<DataManagerBundle>) => {
    setBundle((b) => ({ ...b, ...patch }));
  }, []);

  const refresh = React.useCallback(async () => {
    if (!workspaceId) return;
    if (!lazyLoad) {
      const [
        clients,
        articles,
        categories,
        quotes,
        invoices,
        taxRates,
        presets,
        snippets,
        projects,
        hist,
      ] = await Promise.all([
        api.listClients(workspaceId),
        api.listArticles(workspaceId),
        api.listCategories(workspaceId),
        api.listQuotes(workspaceId),
        api.listInvoices(workspaceId),
        api.listTaxRates(workspaceId),
        api.listDiscountPresets(workspaceId),
        api.listTextSnippets(workspaceId),
        api.listProjects(workspaceId),
        api.listImportHistory(workspaceId),
      ]);
      setBundle({
        clients,
        articles,
        categories,
        quotes,
        invoices,
        taxRates,
        presets,
        snippets,
        projects,
      });
      setHistory(hist);
      const full = new Set(allDataManagerLoadKeys());
      loadedRef.current = full;
      setLoadedKeys(full);
    } else {
      setBundle(emptyBundle);
      const hist = await api.listImportHistory(workspaceId);
      setHistory(hist);
      const h = new Set<DataManagerLoadKey>(["history"]);
      loadedRef.current = h;
      setLoadedKeys(h);
    }
  }, [workspaceId, lazyLoad]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const ensureLoadedForScope = React.useCallback(
    async (sidebarScope: string) => {
      if (!workspaceId || !lazyLoad) return;
      const key = loadKeyForSidebarScope(sidebarScope);
      if (!key) return;
      if (loadedRef.current.has(key)) return;
      if (inFlightRef.current.has(key)) return;
      inFlightRef.current.add(key);
      setLoadingKey(key);
      try {
        const data = await fetchKey(workspaceId, key);
        if ("history" in data && Array.isArray(data.history)) {
          setHistory(data.history);
        } else {
          mergeBundle(data as Partial<DataManagerBundle>);
        }
        loadedRef.current.add(key);
        setLoadedKeys((s) => new Set(s).add(key));
      } finally {
        inFlightRef.current.delete(key);
        setLoadingKey(null);
      }
    },
    [workspaceId, lazyLoad, mergeBundle],
  );

  const isKeyLoaded = React.useCallback(
    (key: DataManagerLoadKey) => loadedKeys.has(key),
    [loadedKeys],
  );

  const loadingForScope = React.useCallback(
    (sidebarScope: string) => {
      const key = loadKeyForSidebarScope(sidebarScope);
      return key !== null && loadingKey === key;
    },
    [loadingKey],
  );

  const countByKey = React.useMemo(() => {
    const m: Record<string, number> = {
      clients: bundle.clients.length,
      categories: bundle.categories.length,
      quotes: bundle.quotes.length,
      invoices: bundle.invoices.length,
      projects: bundle.projects.length,
      "tax-rates": bundle.taxRates.length,
      "discount-presets": bundle.presets.length,
      snippets: bundle.snippets.length,
      history: history.length,
      "articles:all": bundle.articles.length,
      "articles:uncat": bundle.articles.filter((a) => !a.categoryId).length,
    };
    for (const c of bundle.categories) {
      m[`articles:cat:${c.id}`] = bundle.articles.filter(
        (a) => a.categoryId === c.id,
      ).length;
    }
    return m;
  }, [bundle, history.length]);

  return {
    bundle,
    history,
    refresh,
    countByKey,
    lazyLoad,
    ensureLoadedForScope,
    isKeyLoaded,
    loadingForScope,
  };
}
