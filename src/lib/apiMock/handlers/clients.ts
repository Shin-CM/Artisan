import type { Client } from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { now, rid, store } from "@/lib/apiMock/store";

export const clientHandlers: Record<string, MockHandler> = {
  list_clients: (args) => {
    const workspaceId = args.workspaceId as string;
    const list = store.clients.filter((c) => c.workspaceId === workspaceId);
    return [...list].sort((a, b) => {
      const ao = a.sortOrder ?? 0;
      const bo = b.sortOrder ?? 0;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name, "fr");
    });
  },

  create_client: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as {
      name: string;
      email?: string | null;
      phone?: string | null;
      addressJson?: Record<string, unknown> | null;
      notes?: string | null;
      detailsJson?: Record<string, unknown> | null;
    };
    const t = now();
    const sameWs = store.clients.filter((x) => x.workspaceId === workspaceId);
    const nextOrder =
      sameWs.reduce((m, x) => Math.max(m, x.sortOrder ?? 0), -1) + 1;
    const c: Client = {
      id: rid(),
      workspaceId,
      name: input.name.trim(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      addressJson: input.addressJson
        ? JSON.stringify(input.addressJson)
        : null,
      notes: input.notes ?? null,
      detailsJson: input.detailsJson
        ? JSON.stringify(input.detailsJson)
        : null,
      sortOrder: nextOrder,
      createdAt: t,
      updatedAt: t,
    };
    store.clients.push(c);
    return c;
  },

  update_client: (args) => {
    const id = args.id as string;
    const input = args.input as {
      name: string;
      email?: string | null;
      phone?: string | null;
      addressJson?: Record<string, unknown> | null;
      notes?: string | null;
      detailsJson?: Record<string, unknown> | null;
    };
    const c = store.clients.find((x) => x.id === id);
    if (!c) throw new Error("Client introuvable");
    c.name = input.name.trim();
    c.email = input.email ?? null;
    c.phone = input.phone ?? null;
    c.addressJson = input.addressJson
      ? JSON.stringify(input.addressJson)
      : null;
    c.notes = input.notes ?? null;
    if (input.detailsJson !== undefined) {
      c.detailsJson = input.detailsJson
        ? JSON.stringify(input.detailsJson)
        : null;
    }
    c.updatedAt = now();
    return c;
  },

  delete_client: (args) => {
    const id = args.id as string;
    store.clients = store.clients.filter((c) => c.id !== id);
    return undefined;
  },

  reorder_clients: (args) => {
    const workspaceId = args.workspaceId as string;
    const orderedIds = args.orderedIds as string[];
    const t = now();
    orderedIds.forEach((id, i) => {
      const c = store.clients.find(
        (x) => x.id === id && x.workspaceId === workspaceId,
      );
      if (!c) throw new Error(`Client introuvable : ${id}`);
      c.sortOrder = i;
      c.updatedAt = t;
    });
    return undefined;
  },
};
