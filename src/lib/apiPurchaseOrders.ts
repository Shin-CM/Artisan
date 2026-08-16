import { ipc } from "@/lib/apiCore";

import type { Quote, QuoteInput } from "@/lib/apiQuotes";

export type PurchaseOrder = Quote;
export type PurchaseOrderInput = QuoteInput;

export async function convertQuoteToPurchaseOrder(
  quoteId: string,
  workspaceId: string,
): Promise<PurchaseOrder> {
  return ipc("convert_quote_to_purchase_order", { quoteId, workspaceId });
}

export async function listPurchaseOrders(
  workspaceId: string,
): Promise<PurchaseOrder[]> {
  return ipc("list_purchase_orders", { workspaceId });
}

export async function peekNextPurchaseOrderNumber(
  workspaceId: string,
): Promise<string> {
  return ipc("peek_next_purchase_order_number", { workspaceId });
}

export async function createPurchaseOrder(
  workspaceId: string,
  input: PurchaseOrderInput,
): Promise<PurchaseOrder> {
  return ipc("create_purchase_order", { workspaceId, input });
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder> {
  return ipc("get_purchase_order", { id });
}

export async function updatePurchaseOrder(
  id: string,
  input: PurchaseOrderInput,
): Promise<PurchaseOrder> {
  return ipc("update_purchase_order", { id, input });
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  return ipc("delete_purchase_order", { id });
}
