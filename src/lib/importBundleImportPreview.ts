/**
 * Aperçu détaillé + sélection par ligne pour import paquet workspace / mono-kind.
 */
import type { Client } from "@/lib/api";
import {
  computeListName,
  getClientPreviewBlock,
  parseClientDetails,
} from "@/lib/clientDetails";
import type { GenericPayload } from "@/lib/importExportKinds";
import {
  isWorkspaceBundlePayload,
  WORKSPACE_MODULE_KINDS,
  type WorkspaceBundlePayload,
} from "@/lib/workspaceBundle";

export type ImportPreviewRow = {
  key: string;
  kind: string;
  index: number;
  title: string;
  lines: string[];
};

export type ImportPreviewSection = {
  kind: string;
  label: string;
  rows: ImportPreviewRow[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function detailsJsonToString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}

function clientFromImportRecord(raw: Record<string, unknown>): Client {
  return {
    id: str(raw.id) || "—",
    workspaceId: "",
    name: str(raw.name) || "—",
    email: raw.email != null ? str(raw.email) || null : null,
    phone: raw.phone != null ? str(raw.phone) || null : null,
    addressJson:
      typeof raw.addressJson === "string"
        ? raw.addressJson
        : raw.addressJson != null
          ? JSON.stringify(raw.addressJson)
          : null,
    notes: raw.notes != null ? str(raw.notes) || null : null,
    detailsJson: detailsJsonToString(raw.detailsJson),
    createdAt: "",
    updatedAt: "",
  };
}

function previewClientRecord(
  raw: unknown,
  baseCurrency: string,
): { title: string; lines: string[] } {
  if (!isRecord(raw)) return { title: "—", lines: [] };
  const c = clientFromImportRecord(raw);
  const d = parseClientDetails(c.detailsJson, baseCurrency);
  const listName = computeListName(d, c.email);
  const title = listName.trim() || c.name.trim() || "—";
  const block = getClientPreviewBlock(c, baseCurrency);
  const lines: string[] = [];
  if (block.contactLine) lines.push(block.contactLine);
  if (block.billingLines.length) {
    lines.push("Adresse : " + block.billingLines.join(" · "));
  }
  if (block.email) lines.push(block.email);
  if (block.phone) lines.push(block.phone);
  if (!lines.length && block.fallbackName && block.fallbackName !== title) {
    lines.push(block.fallbackName);
  }
  return { title, lines };
}

function rowKey(kind: string, index: number): string {
  return `${kind}:${index}`;
}

function previewRowForRecord(
  kind: string,
  index: number,
  raw: unknown,
  baseCurrency: string,
): ImportPreviewRow {
  const key = rowKey(kind, index);
  if (!isRecord(raw)) {
    return { key, kind, index, title: "—", lines: [] };
  }
  switch (kind) {
    case "clients": {
      const { title, lines } = previewClientRecord(raw, baseCurrency);
      return { key, kind, index, title, lines };
    }
    case "categories": {
      const name = str(raw.name) || "—";
      const pid = raw.parentId;
      const parent =
        pid == null || pid === ""
          ? "Racine"
          : `Parent : ${String(pid)}`;
      return { key, kind, index, title: name, lines: [parent] };
    }
    case "articles": {
      const name = str(raw.name) || "—";
      const cat = raw.categoryId != null ? `Catégorie : ${String(raw.categoryId)}` : "Sans catégorie";
      const price = raw.basePrice != null ? `Prix HT : ${String(raw.basePrice)}` : "";
      return {
        key,
        kind,
        index,
        title: name,
        lines: [cat, price].filter(Boolean),
      };
    }
    case "tax-rates": {
      return {
        key,
        kind,
        index,
        title: str(raw.name) || "—",
        lines: [`Taux : ${str(raw.rate)} %`],
      };
    }
    case "snippets": {
      const body = str(raw.body);
      return {
        key,
        kind,
        index,
        title: str(raw.name) || "—",
        lines: body ? [body.slice(0, 120) + (body.length > 120 ? "…" : "")] : [],
      };
    }
    case "discount-presets": {
      return {
        key,
        kind,
        index,
        title: str(raw.name) || "—",
        lines: [`${str(raw.kind)} · ${str(raw.value)}`],
      };
    }
    case "projects": {
      const name = str(raw.name) || "—";
      const code = str(raw.code);
      const st = str(raw.status);
      const lines = [
        code ? `Code : ${code}` : "",
        st ? `Statut : ${st}` : "",
        raw.clientId != null && str(raw.clientId)
          ? `Client : ${str(raw.clientId)}`
          : "",
      ].filter(Boolean);
      return { key, kind, index, title: name, lines };
    }
    case "quotes": {
      const num = str(raw.number) || str(raw.title) || str(raw.id) || "—";
      const client = raw.clientId != null ? `Client : ${String(raw.clientId)}` : "Sans client";
      const lines = raw.lines && Array.isArray(raw.lines) ? `${raw.lines.length} ligne(s)` : "";
      return {
        key,
        kind,
        index,
        title: `Devis ${num}`,
        lines: [client, lines].filter(Boolean),
      };
    }
    case "invoices": {
      const num = str(raw.number) || str(raw.id) || "—";
      const client = raw.clientId != null ? `Client : ${String(raw.clientId)}` : "Sans client";
      const lines = raw.lines && Array.isArray(raw.lines) ? `${raw.lines.length} ligne(s)` : "";
      return {
        key,
        kind,
        index,
        title: `Facture ${num}`,
        lines: [client, lines].filter(Boolean),
      };
    }
    default: {
      const id = str(raw.id);
      return {
        key,
        kind,
        index,
        title: id || `#${index + 1}`,
        lines: [],
      };
    }
  }
}

/** Compte toutes les lignes d’aperçu (pour progression). */
export function countImportPreviewRows(decoded: unknown): number {
  if (isWorkspaceBundlePayload(decoded)) {
    let n = 0;
    for (const k of WORKSPACE_MODULE_KINDS) {
      const recs = decoded.modules[k]?.records;
      if (Array.isArray(recs)) n += recs.length;
    }
    return n;
  }
  if (
    decoded &&
    typeof decoded === "object" &&
    "kind" in decoded &&
    "records" in decoded &&
    Array.isArray((decoded as GenericPayload).records)
  ) {
    return (decoded as GenericPayload).records!.length;
  }
  return 0;
}

const MODULE_LABEL_FR: Record<string, string> = {
  categories: "Catégories",
  "tax-rates": "Taux TVA",
  snippets: "Textes enregistrés",
  "discount-presets": "Modèles de réduction",
  articles: "Articles",
  clients: "Clients",
  projects: "Projets",
  quotes: "Devis",
  invoices: "Factures",
};

function workspaceSectionForKind(
  payload: WorkspaceBundlePayload,
  kind: (typeof WORKSPACE_MODULE_KINDS)[number],
  baseCurrency: string,
): ImportPreviewSection | null {
  const mod = payload.modules[kind];
  const records = mod?.records;
  if (!Array.isArray(records) || records.length === 0) return null;
  const label = MODULE_LABEL_FR[kind] ?? kind;
  const rows: ImportPreviewRow[] = records.map((raw, index) =>
    previewRowForRecord(kind, index, raw, baseCurrency),
  );
  return { kind, label, rows };
}

/**
 * Construit l’aperçu (synchrone).
 */
export function buildImportPreviewSections(
  decoded: unknown,
  baseCurrency: string,
): ImportPreviewSection[] {
  const out: ImportPreviewSection[] = [];
  if (isWorkspaceBundlePayload(decoded)) {
    for (const kind of WORKSPACE_MODULE_KINDS) {
      const s = workspaceSectionForKind(decoded, kind, baseCurrency);
      if (s) out.push(s);
    }
    return out;
  }
  const mono = decoded as GenericPayload;
  if (
    mono &&
    typeof mono === "object" &&
    typeof mono.kind === "string" &&
    Array.isArray(mono.records)
  ) {
    const kind = mono.kind;
    const records = mono.records;
    const rows: ImportPreviewRow[] = records.map((raw, index) =>
      previewRowForRecord(kind, index, raw, baseCurrency),
    );
    out.push({
      kind,
      label: MODULE_LABEL_FR[kind] ?? kind,
      rows,
    });
  }
  return out;
}

/** Aperçu module par module (yield au navigateur entre chaque module). */
export async function buildImportPreviewSectionsAsync(
  decoded: unknown,
  baseCurrency: string,
  onProgress: (msg: string) => void,
): Promise<ImportPreviewSection[]> {
  const out: ImportPreviewSection[] = [];
  if (isWorkspaceBundlePayload(decoded)) {
    for (const kind of WORKSPACE_MODULE_KINDS) {
      onProgress(`Lecture « ${MODULE_LABEL_FR[kind] ?? kind} »…`);
      await new Promise<void>((r) => setTimeout(r, 0));
      const s = workspaceSectionForKind(decoded, kind, baseCurrency);
      if (s) out.push(s);
    }
    return out;
  }
  onProgress("Lecture du paquet…");
  await new Promise<void>((r) => setTimeout(r, 0));
  return buildImportPreviewSections(decoded, baseCurrency);
}

export function collectAllImportKeys(sections: ImportPreviewSection[]): string[] {
  const keys: string[] = [];
  for (const s of sections) {
    for (const r of s.rows) keys.push(r.key);
  }
  return keys;
}

export function filterWorkspaceBundleBySelection(
  payload: WorkspaceBundlePayload,
  selected: Set<string>,
): WorkspaceBundlePayload {
  const modules: WorkspaceBundlePayload["modules"] = { ...payload.modules };
  for (const kind of WORKSPACE_MODULE_KINDS) {
    const mod = modules[kind];
    if (!mod?.records?.length) continue;
    const filtered = mod.records.filter((_, i) =>
      selected.has(rowKey(kind, i)),
    );
    if (filtered.length === 0) {
      delete modules[kind];
    } else {
      modules[kind] = { ...mod, records: filtered };
    }
  }
  return { ...payload, modules };
}

export function filterMonoPayloadBySelection(
  payload: GenericPayload,
  kind: string,
  selected: Set<string>,
): GenericPayload {
  const records = payload.records ?? [];
  const filtered = records.filter((_, i) => selected.has(rowKey(kind, i)));
  return { ...payload, records: filtered };
}

type CatRec = { id: string; parentId: string | null };

function categoryRecords(payload: WorkspaceBundlePayload): CatRec[] {
  const recs = payload.modules.categories?.records;
  if (!Array.isArray(recs)) return [];
  return recs.map((r) => {
    if (!isRecord(r)) return { id: "", parentId: null };
    const id = str(r.id);
    const p = r.parentId;
    const parentId =
      p == null || p === "" ? null : String(p);
    return { id, parentId };
  });
}

function categoryIndexById(
  cats: CatRec[],
): Map<string, number> {
  const m = new Map<string, number>();
  cats.forEach((c, i) => {
    if (c.id) m.set(c.id, i);
  });
  return m;
}

function descendantCategoryIds(cats: CatRec[], rootId: string): Set<string> {
  const children = new Map<string, string[]>();
  for (const c of cats) {
    const p = c.parentId ?? "__root__";
    if (!children.has(p)) children.set(p, []);
    if (c.id) children.get(p)!.push(c.id);
  }
  const out = new Set<string>();
  const walk = (id: string) => {
    if (out.has(id)) return;
    out.add(id);
    for (const ch of children.get(id) ?? []) walk(ch);
  };
  walk(rootId);
  return out;
}

function ancestorCategoryIds(cats: CatRec[], id: string): string[] {
  const byId = new Map(cats.map((c) => [c.id, c] as const));
  const out: string[] = [];
  let cur = byId.get(id);
  while (cur?.parentId) {
    out.push(cur.parentId);
    cur = byId.get(cur.parentId);
  }
  return out;
}

function applyToggleWorkspace(
  payload: WorkspaceBundlePayload,
  key: string,
  checked: boolean,
  sel: Set<string>,
): Set<string> {
  const next = new Set(sel);
  const [kind, idxStr] = key.split(":");
  const idx = Number(idxStr);
  if (!kind || Number.isNaN(idx)) return next;

  const cats = categoryRecords(payload);
  const catIdxById = categoryIndexById(cats);

  if (checked) {
    next.add(key);
    if (kind === "categories" && cats[idx]?.id) {
      const id = cats[idx].id;
      for (const aid of ancestorCategoryIds(cats, id)) {
        const j = catIdxById.get(aid);
        if (j !== undefined) next.add(rowKey("categories", j));
      }
    }
    if (kind === "articles") {
      const rec = payload.modules.articles?.records?.[idx];
      if (isRecord(rec)) {
        const cid = rec.categoryId != null ? str(rec.categoryId) : "";
        if (cid) {
          const j = catIdxById.get(cid);
          if (j !== undefined) {
            next.add(rowKey("categories", j));
            const catId = cats[j]?.id;
            if (catId) {
              for (const aid of ancestorCategoryIds(cats, catId)) {
                const aj = catIdxById.get(aid);
                if (aj !== undefined) next.add(rowKey("categories", aj));
              }
            }
          }
        }
      }
    }
    if (kind === "quotes") {
      const rec = payload.modules.quotes?.records?.[idx];
      if (isRecord(rec) && rec.clientId != null) {
        const clientId = str(rec.clientId);
        const clients = payload.modules.clients?.records ?? [];
        clients.forEach((cr, j) => {
          if (isRecord(cr) && str(cr.id) === clientId) {
            next.add(rowKey("clients", j));
          }
        });
      }
    }
    if (kind === "invoices") {
      const rec = payload.modules.invoices?.records?.[idx];
      if (isRecord(rec) && rec.clientId != null) {
        const clientId = str(rec.clientId);
        const clients = payload.modules.clients?.records ?? [];
        clients.forEach((cr, j) => {
          if (isRecord(cr) && str(cr.id) === clientId) {
            next.add(rowKey("clients", j));
          }
        });
      }
    }
    return next;
  }

  next.delete(key);
  if (kind === "categories" && cats[idx]?.id) {
    const id = cats[idx].id;
    const desc = descendantCategoryIds(cats, id);
    cats.forEach((c, j) => {
      if (c.id && desc.has(c.id)) next.delete(rowKey("categories", j));
    });
    const arts = payload.modules.articles?.records ?? [];
    arts.forEach((ar, j) => {
      if (!isRecord(ar)) return;
      const cid = ar.categoryId != null ? str(ar.categoryId) : "";
      if (cid && desc.has(cid)) next.delete(rowKey("articles", j));
    });
  }
  if (kind === "clients") {
    const rec = payload.modules.clients?.records?.[idx];
    const clientId = isRecord(rec) ? str(rec.id) : "";
    if (clientId) {
      const quotes = payload.modules.quotes?.records ?? [];
      quotes.forEach((qr, j) => {
        if (isRecord(qr) && str(qr.clientId) === clientId) {
          next.delete(rowKey("quotes", j));
        }
      });
      const invs = payload.modules.invoices?.records ?? [];
      invs.forEach((ir, j) => {
        if (isRecord(ir) && str(ir.clientId) === clientId) {
          next.delete(rowKey("invoices", j));
        }
      });
    }
  }
  return next;
}

/** Applique une case à cocher + règles de dépendances (workspace). */
export function applyImportSelectionToggle(
  decoded: unknown,
  key: string,
  checked: boolean,
  current: Set<string>,
): Set<string> {
  if (isWorkspaceBundlePayload(decoded)) {
    return applyToggleWorkspace(decoded, key, checked, current);
  }
  const mono = decoded as GenericPayload;
  if (mono?.kind && Array.isArray(mono.records)) {
    const next = new Set(current);
    if (checked) next.add(key);
    else next.delete(key);
    return next;
  }
  return new Set(current);
}

export function totalSelectedRecords(
  payload: WorkspaceBundlePayload,
  selected: Set<string>,
): number {
  let n = 0;
  for (const kind of WORKSPACE_MODULE_KINDS) {
    const recs = payload.modules[kind]?.records;
    if (!Array.isArray(recs)) continue;
    for (let i = 0; i < recs.length; i++) {
      if (selected.has(rowKey(kind, i))) n++;
    }
  }
  return n;
}

/** Nombre d’enregistrements mono-kind cochés. */
export function totalMonoSelectedRecords(
  payload: GenericPayload,
  selected: Set<string>,
): number {
  const kind = payload.kind;
  if (!kind || !Array.isArray(payload.records)) return 0;
  let n = 0;
  for (let i = 0; i < payload.records.length; i++) {
    if (selected.has(rowKey(kind, i))) n++;
  }
  return n;
}
