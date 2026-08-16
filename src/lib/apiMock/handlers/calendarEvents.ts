import type { CalendarEvent, CalendarEventInput } from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { now, rid } from "@/lib/apiMock/store";

/** État mock session : événements calendrier (navigateur uniquement). */
const sessionCalendarEvents: CalendarEvent[] = [];

function normalize(input: CalendarEventInput): CalendarEventInput {
  const title = input.title.trim();
  if (!title) throw new Error("Titre obligatoire.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)
  ) {
    throw new Error("Date invalide (YYYY-MM-DD attendu).");
  }
  if (input.endDate < input.startDate) {
    throw new Error("La date de fin doit être >= à la date de début.");
  }
  const hex = input.colorHex?.trim() || null;
  if (hex && !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error("Couleur hexadécimale invalide (#RRGGBB attendu).");
  }
  return {
    title,
    note: input.note?.trim() || null,
    startDate: input.startDate,
    endDate: input.endDate,
    colorKey: input.colorKey?.trim() || null,
    colorHex: hex,
    clientId: input.clientId?.trim() || null,
    projectId: input.projectId?.trim() || null,
    invoiceId: input.invoiceId?.trim() || null,
  };
}

export const calendarEventHandlers: Record<string, MockHandler> = {
  list_calendar_events: (args) => {
    const workspaceId = args.workspaceId as string;
    return sessionCalendarEvents
      .filter((e) => e.workspaceId === workspaceId)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  },

  create_calendar_event: (args) => {
    const workspaceId = args.workspaceId as string;
    const cleaned = normalize(args.input as CalendarEventInput);
    const t = now();
    const row: CalendarEvent = {
      id: rid(),
      workspaceId,
      title: cleaned.title,
      note: cleaned.note ?? null,
      startDate: cleaned.startDate,
      endDate: cleaned.endDate,
      colorKey: cleaned.colorKey ?? null,
      colorHex: cleaned.colorHex ?? null,
      clientId: cleaned.clientId ?? null,
      projectId: cleaned.projectId ?? null,
      invoiceId: cleaned.invoiceId ?? null,
      createdAt: t,
      updatedAt: t,
    };
    sessionCalendarEvents.push(row);
    return row;
  },

  get_calendar_event: (args) => {
    const id = args.id as string;
    const e = sessionCalendarEvents.find((x) => x.id === id);
    if (!e) throw new Error("Événement introuvable.");
    return e;
  },

  update_calendar_event: (args) => {
    const id = args.id as string;
    const cleaned = normalize(args.input as CalendarEventInput);
    const idx = sessionCalendarEvents.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error("Événement introuvable.");
    const old = sessionCalendarEvents[idx];
    const t = now();
    const next: CalendarEvent = {
      ...old,
      title: cleaned.title,
      note: cleaned.note ?? null,
      startDate: cleaned.startDate,
      endDate: cleaned.endDate,
      colorKey: cleaned.colorKey ?? null,
      colorHex: cleaned.colorHex ?? null,
      clientId: cleaned.clientId ?? null,
      projectId: cleaned.projectId ?? null,
      invoiceId: cleaned.invoiceId ?? null,
      updatedAt: t,
    };
    sessionCalendarEvents[idx] = next;
    return next;
  },

  delete_calendar_event: (args) => {
    const id = args.id as string;
    const i = sessionCalendarEvents.findIndex((e) => e.id === id);
    if (i >= 0) sessionCalendarEvents.splice(i, 1);
  },
};
