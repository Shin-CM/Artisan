import type {
  ClientContactEvent,
  ClientFollowupRow,
  ClientReminder,
  ClientTag,
  ClientTimelineEntry,
  FollowupScoringSettings,
} from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { now, rid, store } from "@/lib/apiMock/store";

const defaultFollowupSettings = (): FollowupScoringSettings => ({
  periodMultiplier: 1.5,
  minInvoicesForPeriod: 3,
  valueMonths: 12,
  periodLookbackDays: 730,
  weights: {
    delay: 0.35,
    value: 0.25,
    regularity: 0.2,
    tenure: 0.2,
  },
});

/** État mock session : événements et rappels (navigateur uniquement). */
const sessionContactEvents: ClientContactEvent[] = [];
const sessionReminders: ClientReminder[] = [];
const sessionTags: ClientTag[] = [];

function parseDay(iso: string): string | null {
  const d = iso?.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

export const clientFollowupHandlers: Record<string, MockHandler> = {
  get_followup_settings: () => defaultFollowupSettings(),

  update_followup_settings: (args) => {
    const patch = args.patch as Record<string, unknown>;
    const base = defaultFollowupSettings();
    return {
      ...base,
      ...patch,
      weights: {
        ...base.weights,
        ...(patch.weights as FollowupScoringSettings["weights"] | undefined),
      },
    } as FollowupScoringSettings;
  },

  list_clients_followup: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = (args.input ?? {}) as {
      search?: string | null;
      priorityLevel?: string | null;
      tagId?: string | null;
    };
    const search = input.search?.trim().toLowerCase() ?? "";
    const clients = store.clients.filter((c) => c.workspaceId === workspaceId);
    const rows: ClientFollowupRow[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const c of clients) {
      if (search && !c.name.toLowerCase().includes(search)) continue;

      const quotes = store.quotes.filter(
        (q) => q.workspaceId === workspaceId && q.clientId === c.id,
      );
      const invs = store.invoices.filter(
        (i) =>
          i.workspaceId === workspaceId &&
          i.clientId === c.id &&
          (i.documentKind ?? "invoice") === "invoice",
      );

      let lastQ: string | null = null;
      let lastI: string | null = null;
      for (const q of quotes) {
        const d = parseDay(q.issueDate);
        if (d && (!lastQ || d > lastQ)) lastQ = d;
      }
      for (const i of invs) {
        const d = parseDay(i.issueDate);
        if (d && (!lastI || d > lastI)) lastI = d;
      }

      const dates = [lastQ, lastI].filter(Boolean) as string[];
      const lastTouch =
        dates.length > 0
          ? dates.reduce((a, b) => (a > b ? a : b))
          : c.createdAt.slice(0, 10);

      const lastDay = new Date(`${lastTouch}T12:00:00`);
      const daysSince = Math.floor(
        (today.getTime() - lastDay.getTime()) / (24 * 60 * 60 * 1000),
      );

      let revenue = 0;
      for (const i of invs) {
        const st = i.status ?? "";
        if (
          ["paid", "partially_paid", "partial", "sent", "issued"].includes(st)
        ) {
          revenue += i.total ?? 0;
        }
      }

      const score = Math.min(100, Math.round(30 + daysSince * 0.5));
      let priorityLevel = "low";
      if (score >= 70) priorityLevel = "high";
      else if (score >= 40) priorityLevel = "medium";

      if (
        input.priorityLevel &&
        input.priorityLevel.trim() &&
        input.priorityLevel.trim().toLowerCase() !== priorityLevel
      ) {
        continue;
      }

      rows.push({
        clientId: c.id,
        clientName: c.name,
        score,
        priorityLevel,
        daysSinceLastTouch: daysSince,
        lastTouchAt: lastTouch,
        lastQuoteAt: lastQ,
        lastInvoiceAt: lastI,
        lastContactEventAt: null,
        expectedPeriodDays: null,
        revenueValuePeriod: revenue,
        invoiceCountInPeriod: invs.length,
        tags: [],
      });
    }

    rows.sort((a, b) => b.score - a.score);
    return rows;
  },

  list_contact_events: (args) => {
    const workspaceId = args.workspaceId as string;
    const clientId = args.clientId as string;
    return sessionContactEvents.filter(
      (e) => e.workspaceId === workspaceId && e.clientId === clientId,
    );
  },

  create_contact_event: (args) => {
    const workspaceId = args.workspaceId as string;
    const clientId = args.clientId as string;
    const input = args.input as { kind: string; body?: string | null; occurredAt: string };
    const t = now();
    const row: ClientContactEvent = {
      id: rid(),
      workspaceId,
      clientId,
      kind: input.kind,
      body: input.body?.trim() ?? null,
      occurredAt: input.occurredAt,
      createdAt: t,
      updatedAt: t,
    };
    sessionContactEvents.push(row);
    return row;
  },

  delete_contact_event: (args) => {
    const id = args.id as string;
    const i = sessionContactEvents.findIndex((e) => e.id === id);
    if (i >= 0) sessionContactEvents.splice(i, 1);
  },

  update_contact_event: (args) => {
    const workspaceId = args.workspaceId as string;
    const id = args.id as string;
    const input = args.input as {
      kind: string;
      body?: string | null;
      occurredAt: string;
    };
    const idx = sessionContactEvents.findIndex(
      (e) => e.id === id && e.workspaceId === workspaceId,
    );
    if (idx < 0) throw new Error("Événement introuvable.");
    const t = now();
    const prev = sessionContactEvents[idx];
    sessionContactEvents[idx] = {
      ...prev,
      kind: input.kind.trim() || "note",
      body: input.body?.trim() ?? null,
      occurredAt: input.occurredAt,
      updatedAt: t,
    };
    return sessionContactEvents[idx];
  },

  list_client_tags: (args) => {
    const workspaceId = args.workspaceId as string;
    return sessionTags.filter((t) => t.workspaceId === workspaceId);
  },

  create_client_tag: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as { name: string; color?: string | null };
    const t = now();
    const row: ClientTag = {
      id: rid(),
      workspaceId,
      name: input.name.trim(),
      color: input.color ?? null,
      createdAt: t,
    };
    sessionTags.push(row);
    return row;
  },

  delete_client_tag: (args) => {
    const id = args.id as string;
    const i = sessionTags.findIndex((t) => t.id === id);
    if (i >= 0) sessionTags.splice(i, 1);
  },

  set_client_tags: () => {},

  list_reminders: (args) => {
    const workspaceId = args.workspaceId as string;
    return sessionReminders.filter((r) => r.workspaceId === workspaceId);
  },

  get_reminder: (args) => {
    const id = args.id as string;
    const r = sessionReminders.find((x) => x.id === id);
    if (!r) throw new Error("Rappel introuvable.");
    return r;
  },

  create_reminder: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as {
      clientId?: string | null;
      title: string;
      note?: string | null;
      dueAt: string;
      status?: string | null;
    };
    const t = now();
    const row: ClientReminder = {
      id: rid(),
      workspaceId,
      clientId: input.clientId?.trim() || null,
      title: input.title.trim(),
      note: input.note?.trim() ?? null,
      dueAt: input.dueAt,
      status: input.status?.trim() || "pending",
      recurrenceRule: null,
      createdAt: t,
      updatedAt: t,
    };
    sessionReminders.push(row);
    return row;
  },

  update_reminder: (args) => {
    const id = args.id as string;
    const input = args.input as {
      clientId?: string | null;
      title: string;
      note?: string | null;
      dueAt: string;
      status?: string | null;
    };
    const idx = sessionReminders.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error("Rappel introuvable.");
    const old = sessionReminders[idx];
    const t = now();
    const next: ClientReminder = {
      ...old,
      clientId: input.clientId?.trim() || null,
      title: input.title.trim(),
      note: input.note?.trim() ?? null,
      dueAt: input.dueAt,
      status: input.status?.trim() || "pending",
      updatedAt: t,
    };
    sessionReminders[idx] = next;
    return next;
  },

  delete_reminder: (args) => {
    const id = args.id as string;
    const i = sessionReminders.findIndex((r) => r.id === id);
    if (i >= 0) sessionReminders.splice(i, 1);
  },

  get_client_timeline: (args) => {
    const workspaceId = args.workspaceId as string;
    const clientId = args.clientId as string;
    const entries: ClientTimelineEntry[] = [];

    for (const q of store.quotes) {
      if (q.workspaceId !== workspaceId || q.clientId !== clientId) continue;
      entries.push({
        kind: "quote",
        id: q.id,
        title: `Devis ${q.number}`,
        subtitle: q.title || null,
        occurredAt: `${parseDay(q.issueDate) ?? q.issueDate}T12:00:00.000Z`,
        meta: "quote",
      });
    }
    for (const inv of store.invoices) {
      if (inv.workspaceId !== workspaceId || inv.clientId !== clientId) continue;
      const dk = inv.documentKind ?? "invoice";
      entries.push({
        kind: dk === "credit_note" ? "credit_note" : "invoice",
        id: inv.id,
        title:
          dk === "credit_note"
            ? `Avoir ${inv.number}`
            : `Facture ${inv.number}`,
        subtitle: String(inv.total),
        occurredAt: `${parseDay(inv.issueDate) ?? inv.issueDate}T12:00:00.000Z`,
        meta: dk,
      });
    }
    for (const e of sessionContactEvents) {
      if (e.workspaceId !== workspaceId || e.clientId !== clientId) continue;
      entries.push({
        kind: "contact_event",
        id: e.id,
        title: `Contact (${e.kind})`,
        subtitle: e.body,
        occurredAt: e.occurredAt,
        meta: e.kind,
      });
    }
    for (const r of sessionReminders) {
      if (
        r.workspaceId !== workspaceId ||
        r.clientId !== clientId
      ) continue;
      entries.push({
        kind: "reminder",
        id: r.id,
        title: r.title,
        subtitle: r.status,
        occurredAt: `${r.dueAt.slice(0, 10)}T12:00:00.000Z`,
        meta: "reminder",
      });
    }

    entries.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
    return entries;
  },

  get_contact_event: (args) => {
    const id = args.id as string;
    const e = sessionContactEvents.find((x) => x.id === id);
    if (!e) throw new Error("Événement introuvable.");
    return e;
  },
};
