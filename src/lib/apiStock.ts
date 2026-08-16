import { ipc } from "@/lib/apiCore";

export type StockLevelRow = {
  articleId: string;
  articleName: string;
  quantity: number;
  updatedAt: string;
};

export type StockMovementRow = {
  id: string;
  articleId: string;
  articleName: string;
  movementKind: string;
  quantityDelta: number;
  label: string | null;
  createdAt: string;
};

export type StockMovementInput = {
  articleId: string;
  movementKind: "in" | "out" | "adjustment";
  quantity: number;
  label?: string | null;
};

export async function listStockLevels(
  workspaceId: string,
): Promise<StockLevelRow[]> {
  return ipc("list_stock_levels", { workspaceId });
}

export async function listStockMovements(
  workspaceId: string,
): Promise<StockMovementRow[]> {
  return ipc("list_stock_movements", { workspaceId });
}

export async function createStockMovement(
  workspaceId: string,
  input: StockMovementInput,
): Promise<StockMovementRow> {
  return ipc("create_stock_movement", { workspaceId, input });
}

export async function clearArticleStock(
  workspaceId: string,
  articleId: string,
): Promise<void> {
  return ipc("clear_article_stock", { workspaceId, articleId });
}

export type StockArticleSettingRow = {
  articleId: string;
  articleName: string;
  trackStock: boolean;
  minQuantity: number | null;
  reorderQuantity: number | null;
};

export type StockArticleSettingInput = {
  articleId: string;
  trackStock: boolean;
  minQuantity?: number | null;
  reorderQuantity?: number | null;
};

export type StockLowAlertRow = {
  articleId: string;
  articleName: string;
  quantity: number;
  minQuantity: number;
};

export async function listStockArticleSettings(
  workspaceId: string,
): Promise<StockArticleSettingRow[]> {
  return ipc("list_stock_article_settings", { workspaceId });
}

export async function upsertStockArticleSetting(
  workspaceId: string,
  input: StockArticleSettingInput,
): Promise<StockArticleSettingRow> {
  return ipc("upsert_stock_article_setting", { workspaceId, input });
}

export async function listStockLowAlerts(
  workspaceId: string,
): Promise<StockLowAlertRow[]> {
  return ipc("list_stock_low_alerts", { workspaceId });
}

