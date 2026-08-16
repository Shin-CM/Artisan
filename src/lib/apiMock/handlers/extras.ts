import type {
  ImportHistoryRow,
  PluginRow,
  RevenueComparison,
  TextSnippet,
} from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { openBrowserImageDataUrl } from "@/lib/apiMock/browserLogo";
import { exportPayloadToString, importStringToPayload } from "@/lib/dataCodec";
import {
  MOCK_LOGO_PICK_SENTINEL,
  now,
  rid,
  store,
} from "@/lib/apiMock/store";

const MOCK_FONT_PICK_SENTINEL = "__invoicies_mock_font_pick__";

let mockPdfFontDataUrlCache: string | null = null;

async function ensureMockPdfFontDataUrl(): Promise<string> {
  if (mockPdfFontDataUrlCache) return mockPdfFontDataUrlCache;
  const url =
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/Inter-Regular.ttf";
  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(
      "Mock : impossible de télécharger une police de secours (réseau).",
    );
  }
  const buf = await r.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, Math.min(i + step, bytes.length)) as unknown as number[],
    );
  }
  mockPdfFontDataUrlCache = `data:font/ttf;base64,${btoa(binary)}`;
  return mockPdfFontDataUrlCache;
}

async function mockImportWorkspaceFont(workspaceId: string): Promise<string> {
  const dataUrl = await ensureMockPdfFontDataUrl();
  const rel = `workspace_assets/${workspaceId}/fonts/${rid()}.ttf`;
  store.workspaceFontDataUrls[`${workspaceId}::${rel}`] = dataUrl;
  return rel;
}

export const extraHandlers: Record<string, MockHandler> = {
  read_font_file_base64: () => {
    throw new Error(
      "Lecture de police système : disponible uniquement dans l’application Tauri.",
    );
  },

  get_dashboard_stats: (args) => {
    const workspaceId = args.workspaceId as string;
    const inv = store.invoices.filter(
      (i) => i.workspaceId === workspaceId && i.status === "paid",
    );
    const revenueTotal = inv.reduce((s, i) => s + i.total, 0);
    const ym = new Date().toISOString().slice(0, 7);
    const y = new Date().getFullYear().toString();
    const revenueMonth = inv
      .filter((i) => i.issueDate.startsWith(ym))
      .reduce((s, i) => s + i.total, 0);
    const revenueYear = inv
      .filter((i) => i.issueDate.startsWith(y))
      .reduce((s, i) => s + i.total, 0);
    const outstanding = store.invoices.filter(
      (i) => i.workspaceId === workspaceId && i.status !== "paid",
    ).length;
    const paid = inv.length;
    return {
      revenueTotal,
      revenueMonth,
      revenueYear,
      invoicesOutstanding: outstanding,
      invoicesPaid: paid,
    };
  },

  get_revenue_comparison: (args) => {
    const workspaceId = args.workspaceId as string;
    let yearCount = Math.min(6, Math.max(1, Number(args.yearCount) || 1));
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - yearCount + 1;
    const revenueStatuses = new Set([
      "paid",
      "partially_paid",
      "partial",
      "sent",
      "issued",
    ]);
    const grid = new Map<string, number>();
    for (const i of store.invoices) {
      if (i.workspaceId !== workspaceId) continue;
      if (!revenueStatuses.has(i.status)) continue;
      const d = i.issueDate.slice(0, 10);
      const y = parseInt(d.slice(0, 4), 10);
      const m = parseInt(d.slice(5, 7), 10);
      if (y < minYear || Number.isNaN(y) || Number.isNaN(m)) continue;
      const k = `${y}-${m}`;
      grid.set(k, (grid.get(k) ?? 0) + i.total);
    }
    for (const e of store.manualRevenueEntries) {
      if (e.workspaceId !== workspaceId) continue;
      if (e.year < minYear || e.year > currentYear) continue;
      grid.set(`${e.year}-${e.month}`, e.amount);
    }
    const years: number[] = [];
    for (let y = currentYear; y >= minYear; y--) years.push(y);
    const monthLabels = [
      "janv.",
      "févr.",
      "mars",
      "avr.",
      "mai",
      "juin",
      "juil.",
      "août",
      "sept.",
      "oct.",
      "nov.",
      "déc.",
    ];
    const months = monthLabels.map((monthLabel, idx) => {
      const mm = idx + 1;
      const amounts: Record<string, number> = {};
      for (let y = minYear; y <= currentYear; y++) {
        amounts[String(y)] = grid.get(`${y}-${mm}`) ?? 0;
      }
      return {
        month: String(mm).padStart(2, "0"),
        monthLabel,
        amounts,
      };
    });
    return { years, months } satisfies RevenueComparison;
  },

  data_export_string: (args) => {
    const json = args.json as string;
    return exportPayloadToString(JSON.parse(json));
  },

  data_import_string: (args) => {
    const encoded = args.encoded as string;
    return JSON.stringify(importStringToPayload(encoded));
  },

  log_import_history: (args) => {
    const workspaceId = args.workspaceId as string;
    const row: ImportHistoryRow = {
      id: rid(),
      workspaceId,
      sourceType: args.sourceType as string,
      module: args.module as string,
      fileName: (args.fileName as string | null) ?? null,
      recordCount: args.recordCount as number,
      status: args.status as string,
      createdAt: now(),
    };
    store.importHistory.push(row);
    return undefined;
  },

  list_import_history: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.importHistory
      .filter((h) => h.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  list_plugins: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.plugins.filter((p) => p.workspaceId === workspaceId);
  },

  register_plugin_manifest: (args) => {
    const workspaceId = args.workspaceId as string;
    const manifestJson = args.manifestJson as string;
    const p: PluginRow = {
      id: rid(),
      workspaceId,
      manifestJson,
      enabled: true,
    };
    store.plugins.push(p);
    return p;
  },

  set_plugin_enabled: (args) => {
    const pluginId = args.pluginId as string;
    const enabled = args.enabled === true;
    const p = store.plugins.find((x) => x.id === pluginId);
    if (!p) throw new Error("Extension introuvable");
    p.enabled = enabled;
    return undefined;
  },

  list_text_snippets: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.textSnippets
      .filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  create_text_snippet: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as { name: string; body: string };
    const t = now();
    const s: TextSnippet = {
      id: rid(),
      workspaceId,
      name: input.name.trim(),
      body: input.body,
      createdAt: t,
    };
    store.textSnippets.push(s);
    return s;
  },

  update_text_snippet: (args) => {
    const id = args.id as string;
    const input = args.input as { name: string; body: string };
    const s = store.textSnippets.find((x) => x.id === id);
    if (!s) throw new Error("Texte introuvable");
    s.name = input.name.trim();
    s.body = input.body;
    return s;
  },

  delete_text_snippet: (args) => {
    const id = args.id as string;
    store.textSnippets = store.textSnippets.filter((s) => s.id !== id);
    return undefined;
  },

  pick_logo_file_path: async () => {
    const dataUrl = await openBrowserImageDataUrl();
    store.mockPendingLogoDataUrl = dataUrl;
    return dataUrl ? MOCK_LOGO_PICK_SENTINEL : null;
  },

  pick_pdf_output_dir: async () => {
    if (typeof window === "undefined") return null;
    const p = window.prompt(
      "Aperçu navigateur : saisir un chemin de dossier fictif pour les PDF exportés (ex. /tmp/invoicies-pdf) :",
      "/tmp/invoicies-pdf",
    );
    const t = p?.trim();
    return t ? t : null;
  },

  pick_pdf_font_file_path: async () => MOCK_FONT_PICK_SENTINEL,

  pick_pdf_font_folder_path: async () => "/tmp/invoicies-mock-fonts",

  import_workspace_pdf_font_from_path: async (args) => {
    const workspaceId = args.workspaceId as string;
    return mockImportWorkspaceFont(workspaceId);
  },

  import_workspace_pdf_fonts_from_folder: async (args) => {
    const workspaceId = args.workspaceId as string;
    const dataUrl = await ensureMockPdfFontDataUrl();
    const relA = `workspace_assets/${workspaceId}/fonts/Mock_pack/${rid()}.ttf`;
    const relB = `workspace_assets/${workspaceId}/fonts/Mock_pack/Nested/${rid()}.ttf`;
    store.workspaceFontDataUrls[`${workspaceId}::${relA}`] = dataUrl;
    store.workspaceFontDataUrls[`${workspaceId}::${relB}`] = dataUrl;
    const relRoot = await mockImportWorkspaceFont(workspaceId);
    return [
      { relativePath: relA, label: "Mock police A" },
      { relativePath: relB, label: "Mock police B" },
      { relativePath: relRoot, label: "Mock racine" },
    ];
  },

  delete_workspace_pdf_fonts: async (args) => {
    const workspaceId = args.workspaceId as string;
    const paths = args.relativePaths as string[];
    for (const rel of paths) {
      delete store.workspaceFontDataUrls[`${workspaceId}::${rel}`];
    }
  },

  rename_workspace_pdf_font_folder: async (args) => {
    const workspaceId = args.workspaceId as string;
    const fromKey = (args.fromKey as string).trim();
    const toKey = (args.toKey as string).trim();
    const oldP = `workspace_assets/${workspaceId}/fonts/${fromKey}/`;
    const newP = `workspace_assets/${workspaceId}/fonts/${toKey}/`;
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(store.workspaceFontDataUrls)) {
      if (!k.startsWith(`${workspaceId}::`)) {
        next[k] = v;
        continue;
      }
      const rel = k.slice(workspaceId.length + 2);
      if (rel.startsWith(oldP)) {
        next[`${workspaceId}::${newP + rel.slice(oldP.length)}`] = v;
      } else {
        next[k] = v;
      }
    }
    store.workspaceFontDataUrls = next;
    return { fromKey, toKey };
  },

  move_workspace_pdf_fonts_to_folder: (args) => {
    const workspaceId = args.workspaceId as string;
    const relativePaths = args.relativePaths as string[];
    const targetKey = (args.targetFolderKey as string).trim();
    const prefix = `workspace_assets/${workspaceId}/fonts/`;
    const rows: { oldRelativePath: string; newRelativePath: string }[] = [];
    const next: Record<string, string> = { ...store.workspaceFontDataUrls };
    for (const oldRel of relativePaths) {
      if (!oldRel.startsWith(prefix)) continue;
      const tail = oldRel.slice(prefix.length);
      const idx = tail.lastIndexOf("/");
      const file = idx >= 0 ? tail.slice(idx + 1) : tail;
      const parent = idx >= 0 ? tail.slice(0, idx) : "";
      if (parent === targetKey) continue;
      const newTail = targetKey ? `${targetKey}/${file}` : file;
      const newRel = `${prefix}${newTail}`;
      const fkOld = `${workspaceId}::${oldRel}`;
      if (next[fkOld]) {
        next[`${workspaceId}::${newRel}`] = next[fkOld]!;
        delete next[fkOld];
      }
      rows.push({ oldRelativePath: oldRel, newRelativePath: newRel });
    }
    if (rows.length === 0) {
      throw new Error(
        "Les polices sélectionnées sont déjà dans ce dossier.",
      );
    }
    store.workspaceFontDataUrls = next;
    return rows;
  },

  copy_workspace_logo_from_path: (args) => {
    const workspaceId = args.workspaceId as string;
    const sourcePath = args.sourcePath as string;
    if (
      sourcePath === MOCK_LOGO_PICK_SENTINEL &&
      store.mockPendingLogoDataUrl
    ) {
      store.workspaceLogoDataUrls[workspaceId] =
        store.mockPendingLogoDataUrl;
      store.mockPendingLogoDataUrl = null;
    }
    return `workspace_assets/${workspaceId}/logo.png`;
  },

  read_workspace_asset_base64: async (args) => {
    const workspaceId = args.workspaceId as string;
    const relativePath = args.relativePath as string;
    const fk = `${workspaceId}::${relativePath}`;
    if (store.workspaceFontDataUrls[fk]) {
      return store.workspaceFontDataUrls[fk];
    }
    return store.workspaceLogoDataUrls[workspaceId] ?? null;
  },

  /** Détection des clients mailto/tel : réservée au binaire Tauri ; mock vide. */
  list_url_handler_apps: () => [],

  write_pdf_file: () => undefined,

  write_pdf_preview_temp: () => {
    throw new Error(
      "L’aperçu PDF via fichier temporaire est réservé à l’application Tauri.",
    );
  },
};
