import type { Workspace } from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { now, rid, store } from "@/lib/apiMock/store";
import { defaultTaxRatesForCountry } from "@/lib/workspaceDefaultTaxRates";

export const workspaceHandlers: Record<string, MockHandler> = {
  list_workspaces: () =>
    [...store.workspaces].sort((a, b) => a.name.localeCompare(b.name)),

  get_workspace: (args) => {
    const id = args.id as string;
    const w = store.workspaces.find((x) => x.id === id);
    if (!w) throw new Error("Workspace introuvable");
    return w;
  },

  create_workspace: (args) => {
    const input = args.input as {
      name: string;
      entityType?: string;
      countryCode?: string;
      profileJson?: Record<string, unknown>;
      baseCurrency?: string;
      pdfOutputDir?: string | null;
    };
    const t = now();
    const w: Workspace = {
      id: rid(),
      name: input.name.trim(),
      entityType: input.entityType ?? "company",
      countryCode: (input.countryCode ?? "FR").toUpperCase(),
      profileJson: JSON.stringify(input.profileJson ?? {}),
      baseCurrency: (input.baseCurrency ?? "EUR").toUpperCase(),
      theme: "system",
      pdfOutputDir: input.pdfOutputDir ?? null,
      createdAt: t,
      updatedAt: t,
    };
    store.workspaces.push(w);
    store.quoteSeq[w.id] = 0;
    store.invoiceSeq[w.id] = 0;
    for (const r of defaultTaxRatesForCountry(w.countryCode)) {
      store.taxRates.push({
        id: rid(),
        workspaceId: w.id,
        name: r.name,
        rate: r.rate,
        isDefault: false,
      });
    }
    return w;
  },

  update_workspace: (args) => {
    const id = args.id as string;
    const input = args.input as {
      name: string;
      entityType?: string;
      countryCode?: string;
      profileJson?: Record<string, unknown>;
      baseCurrency?: string;
      pdfOutputDir?: string | null;
    };
    const w = store.workspaces.find((x) => x.id === id);
    if (!w) throw new Error("Workspace introuvable");
    w.name = input.name.trim();
    if (input.entityType != null) w.entityType = input.entityType;
    if (input.countryCode != null)
      w.countryCode = input.countryCode.toUpperCase();
    if (input.profileJson != null)
      w.profileJson = JSON.stringify(input.profileJson);
    if (input.baseCurrency != null)
      w.baseCurrency = input.baseCurrency.toUpperCase();
    if (input.pdfOutputDir !== undefined) w.pdfOutputDir = input.pdfOutputDir;
    w.updatedAt = now();
    return w;
  },

  delete_workspace: (args) => {
    const id = args.id as string;
    store.workspaces = store.workspaces.filter((x) => x.id !== id);
    store.clients = store.clients.filter((c) => c.workspaceId !== id);
    store.categories = store.categories.filter((c) => c.workspaceId !== id);
    store.articles = store.articles.filter((a) => a.workspaceId !== id);
    store.quotes = store.quotes.filter((q) => q.workspaceId !== id);
    store.invoices = store.invoices.filter((i) => i.workspaceId !== id);
    store.importHistory = store.importHistory.filter(
      (h) => h.workspaceId !== id,
    );
    store.plugins = store.plugins.filter((p) => p.workspaceId !== id);
    store.taxRates = store.taxRates.filter((r) => r.workspaceId !== id);
    store.textSnippets = store.textSnippets.filter((s) => s.workspaceId !== id);
    delete store.quoteSeq[id];
    delete store.invoiceSeq[id];
    return undefined;
  },

  update_workspace_theme: (args) => {
    const id = args.id as string;
    const theme = args.theme as string;
    const w = store.workspaces.find((x) => x.id === id);
    if (w) {
      w.theme = theme;
      w.updatedAt = now();
    }
    return undefined;
  },
};
