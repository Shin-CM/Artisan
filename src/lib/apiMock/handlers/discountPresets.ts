import type { DiscountPreset } from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { now, rid, store } from "@/lib/apiMock/store";

export const discountPresetHandlers: Record<string, MockHandler> = {
  list_discount_presets: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.discountPresets
      .filter((p) => p.workspaceId === workspaceId)
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name, "fr");
      });
  },

  create_discount_preset: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as { name: string; kind: string; value: number };
    const t = now();
    const sameWs = store.discountPresets.filter(
      (p) => p.workspaceId === workspaceId,
    );
    const nextOrder =
      sameWs.reduce((m, p) => Math.max(m, p.sortOrder), -1) + 1;
    const kind = input.kind === "fixed" ? "fixed" : "percent";
    const p: DiscountPreset = {
      id: rid(),
      workspaceId,
      name: input.name.trim(),
      kind,
      value: input.value,
      sortOrder: nextOrder,
      createdAt: t,
      updatedAt: t,
    };
    store.discountPresets.push(p);
    return p;
  },

  update_discount_preset: (args) => {
    const id = args.id as string;
    const workspaceId = args.workspaceId as string;
    const input = args.input as { name: string; kind: string; value: number };
    const p = store.discountPresets.find(
      (x) => x.id === id && x.workspaceId === workspaceId,
    );
    if (!p) throw new Error("Modèle introuvable.");
    const kind = input.kind === "fixed" ? "fixed" : "percent";
    p.name = input.name.trim();
    p.kind = kind;
    p.value = input.value;
    p.updatedAt = now();
    return p;
  },

  delete_discount_preset: (args) => {
    const id = args.id as string;
    const workspaceId = args.workspaceId as string;
    const before = store.discountPresets.length;
    store.discountPresets = store.discountPresets.filter(
      (p) => !(p.id === id && p.workspaceId === workspaceId),
    );
    if (store.discountPresets.length === before)
      throw new Error("Modèle introuvable.");
    return undefined;
  },
};
