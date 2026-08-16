import type {
  StockArticleSettingInput,
  StockArticleSettingRow,
  StockLevelRow,
  StockLowAlertRow,
  StockMovementInput,
  StockMovementRow,
} from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { now, rid, store } from "@/lib/apiMock/store";

function stockQuantity(workspaceId: string, articleId: string): number {
  return store.stockMovements
    .filter((m) => m.workspaceId === workspaceId && m.articleId === articleId)
    .reduce((s, m) => s + m.quantityDelta, 0);
}

function lastMovementAt(
  workspaceId: string,
  articleId: string,
): string | null {
  const list = store.stockMovements.filter(
    (m) => m.workspaceId === workspaceId && m.articleId === articleId,
  );
  if (list.length === 0) return null;
  return list.reduce((best, m) =>
    m.createdAt > best ? m.createdAt : best,
  list[0]!.createdAt);
}

function normalizeKind(raw: string): "in" | "out" | "adjustment" {
  const t = raw.trim();
  if (t === "in" || t === "out" || t === "adjustment") return t;
  throw new Error(`Type de mouvement invalide : ${t}`);
}

export const stockHandlers: Record<string, MockHandler> = {
  list_stock_levels: (args) => {
    const workspaceId = args.workspaceId as string;
    const arts = store.articles.filter((a) => a.workspaceId === workspaceId);
    const rows: StockLevelRow[] = arts.map((a) => {
      const qty = stockQuantity(workspaceId, a.id);
      const last = lastMovementAt(workspaceId, a.id);
      return {
        articleId: a.id,
        articleName: a.name,
        quantity: qty,
        updatedAt: last ?? "—",
      };
    });
    rows.sort((x, y) => x.articleName.localeCompare(y.articleName, "fr"));
    return rows;
  },

  list_stock_movements: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.stockMovements
      .filter((m) => m.workspaceId === workspaceId)
      .map(({ workspaceId: _w, ...row }) => row)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 300);
  },

  create_stock_movement: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as StockMovementInput;
    const kind = normalizeKind(input.movementKind);
    const q = input.quantity;
    if (!Number.isFinite(q)) {
      throw new Error("Quantité invalide.");
    }
    const art = store.articles.find(
      (x) => x.id === input.articleId && x.workspaceId === workspaceId,
    );
    if (!art) {
      throw new Error("Article introuvable dans cet espace.");
    }
    let delta = 0;
    if (kind === "in") {
      if (q <= 0) {
        throw new Error("Pour une entrée, la quantité doit être positive.");
      }
      delta = q;
    } else if (kind === "out") {
      if (q <= 0) {
        throw new Error("Pour une sortie, la quantité doit être positive.");
      }
      delta = -q;
    } else {
      delta = q;
    }
    const before = stockQuantity(workspaceId, input.articleId);
    if (before + delta < -1e-9) {
      throw new Error("Stock insuffisant pour ce mouvement.");
    }
    const t = now();
    const id = rid();
    const row: StockMovementRow & { workspaceId: string } = {
      id,
      workspaceId,
      articleId: input.articleId,
      articleName: art.name,
      movementKind: kind,
      quantityDelta: delta,
      label: input.label?.trim() || null,
      createdAt: t,
    };
    store.stockMovements.push(row);
    const { workspaceId: _w, ...out } = row;
    return out;
  },

  list_stock_article_settings: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.stockArticleSettings
      .filter((s) => s.workspaceId === workspaceId)
      .map(({ workspaceId: _w, updatedAt: _u, ...row }) => row)
      .sort((a, b) => a.articleName.localeCompare(b.articleName, "fr"));
  },

  upsert_stock_article_setting: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as StockArticleSettingInput;
    const art = store.articles.find(
      (x) => x.id === input.articleId && x.workspaceId === workspaceId,
    );
    if (!art) {
      throw new Error("Article introuvable dans cet espace.");
    }
    if (input.trackStock) {
      if (input.minQuantity != null) {
        const min = input.minQuantity;
        if (!Number.isFinite(min) || min < 0) {
          throw new Error("Le seuil minimum doit être un nombre positif ou nul.");
        }
      }
      if (input.reorderQuantity != null) {
        const r = input.reorderQuantity;
        if (!Number.isFinite(r) || r < 0) {
          throw new Error(
            "La quantité de réapprovisionnement doit être positive ou nulle.",
          );
        }
      }
    }
    const t = now();
    const row: StockArticleSettingRow & {
      workspaceId: string;
      updatedAt: string;
    } = {
      workspaceId,
      updatedAt: t,
      articleId: input.articleId,
      articleName: art.name,
      trackStock: input.trackStock,
      minQuantity: input.trackStock ? (input.minQuantity ?? null) : null,
      reorderQuantity: input.trackStock ? (input.reorderQuantity ?? null) : null,
    };
    const idx = store.stockArticleSettings.findIndex(
      (s) => s.workspaceId === workspaceId && s.articleId === input.articleId,
    );
    if (idx >= 0) {
      store.stockArticleSettings[idx] = row;
    } else {
      store.stockArticleSettings.push(row);
    }
    const { workspaceId: _w, updatedAt: _u, ...out } = row;
    return out;
  },

  list_stock_low_alerts: (args) => {
    const workspaceId = args.workspaceId as string;
    const rows: StockLowAlertRow[] = [];
    for (const s of store.stockArticleSettings) {
      if (s.workspaceId !== workspaceId || !s.trackStock) continue;
      if (s.minQuantity == null || !Number.isFinite(s.minQuantity)) continue;
      const qty = stockQuantity(workspaceId, s.articleId);
      if (qty < s.minQuantity) {
        rows.push({
          articleId: s.articleId,
          articleName: s.articleName,
          quantity: qty,
          minQuantity: s.minQuantity,
        });
      }
    }
    rows.sort((a, b) => a.articleName.localeCompare(b.articleName, "fr"));
    return rows;
  },

  clear_article_stock: (args) => {
    const workspaceId = args.workspaceId as string;
    const articleId = args.articleId as string;
    const ok = store.articles.some(
      (a) => a.id === articleId && a.workspaceId === workspaceId,
    );
    if (!ok) {
      throw new Error("Article introuvable dans cet espace.");
    }
    store.stockMovements = store.stockMovements.filter(
      (m) =>
        !(m.workspaceId === workspaceId && m.articleId === articleId),
    );
    return undefined;
  },
};
