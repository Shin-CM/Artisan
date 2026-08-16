import type { ManualRevenueEntry, ManualRevenueInput } from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { now, rid, store } from "@/lib/apiMock/store";

export const manualRevenueHandlers: Record<string, MockHandler> = {
  list_manual_revenue_entries: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.manualRevenueEntries
      .filter((e) => e.workspaceId === workspaceId)
      .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      });
  },

  upsert_manual_revenue_entry: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as ManualRevenueInput;
    if (input.year < 1900 || input.year > 2100)
      throw new Error("Année invalide.");
    if (input.month < 1 || input.month > 12)
      throw new Error("Mois invalide (1–12).");
    if (!Number.isFinite(input.amount) || input.amount < 0)
      throw new Error("Montant invalide.");
    const t = now();
    const cur = (input.currency ?? "").trim() || "EUR";
    const notes =
      input.notes?.trim() === "" || input.notes == null
        ? null
        : input.notes.trim();
    const idx = store.manualRevenueEntries.findIndex(
      (e) =>
        e.workspaceId === workspaceId &&
        e.year === input.year &&
        e.month === input.month,
    );
    if (idx >= 0) {
      const prev = store.manualRevenueEntries[idx]!;
      const row: ManualRevenueEntry = {
        ...prev,
        amount: input.amount,
        currency: cur,
        notes,
        updatedAt: t,
      };
      store.manualRevenueEntries[idx] = row;
      return row;
    }
    const row: ManualRevenueEntry = {
      id: rid(),
      workspaceId,
      year: input.year,
      month: input.month,
      amount: input.amount,
      currency: cur,
      notes,
      createdAt: t,
      updatedAt: t,
    };
    store.manualRevenueEntries.push(row);
    return row;
  },

  delete_manual_revenue_entry: (args) => {
    const workspaceId = args.workspaceId as string;
    const id = args.id as string;
    const before = store.manualRevenueEntries.length;
    store.manualRevenueEntries = store.manualRevenueEntries.filter(
      (e) => !(e.id === id && e.workspaceId === workspaceId),
    );
    if (store.manualRevenueEntries.length === before)
      throw new Error("Entrée introuvable.");
    return undefined;
  },
};
