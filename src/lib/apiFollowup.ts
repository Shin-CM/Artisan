import { ipc } from "@/lib/apiCore";

export type FollowupWeights = {
  delay: number;
  value: number;
  regularity: number;
  tenure: number;
};

export type FollowupScoringSettings = {
  periodMultiplier: number;
  minInvoicesForPeriod: number;
  valueMonths: number;
  weights: FollowupWeights;
  periodLookbackDays: number;
};

export async function getFollowupSettings(
  workspaceId: string,
): Promise<FollowupScoringSettings> {
  return ipc("get_followup_settings", { workspaceId });
}

export async function updateFollowupSettings(
  workspaceId: string,
  patch: Record<string, unknown>,
): Promise<FollowupScoringSettings> {
  return ipc("update_followup_settings", { workspaceId, patch });
}

export type ListClientsFollowupInput = {
  search?: string | null;
  priorityLevel?: string | null;
  tagId?: string | null;
};

export type ClientTagBrief = {
  id: string;
  name: string;
  color: string | null;
};

export type ClientFollowupRow = {
  clientId: string;
  clientName: string;
  score: number;
  priorityLevel: string;
  daysSinceLastTouch: number;
  lastTouchAt: string | null;
  lastQuoteAt: string | null;
  lastInvoiceAt: string | null;
  lastContactEventAt: string | null;
  expectedPeriodDays: number | null;
  revenueValuePeriod: number;
  invoiceCountInPeriod: number;
  tags: ClientTagBrief[];
};

export async function listClientsFollowup(
  workspaceId: string,
  input: ListClientsFollowupInput = {},
): Promise<ClientFollowupRow[]> {
  return ipc("list_clients_followup", { workspaceId, input });
}

export type ClientContactEvent = {
  id: string;
  workspaceId: string;
  clientId: string;
  kind: string;
  body: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientContactEventInput = {
  kind: string;
  body?: string | null;
  occurredAt: string;
};

export async function listContactEvents(
  workspaceId: string,
  clientId: string,
): Promise<ClientContactEvent[]> {
  return ipc("list_contact_events", { workspaceId, clientId });
}

export async function createContactEvent(
  workspaceId: string,
  clientId: string,
  input: ClientContactEventInput,
): Promise<ClientContactEvent> {
  return ipc("create_contact_event", { workspaceId, clientId, input });
}

export async function deleteContactEvent(id: string): Promise<void> {
  return ipc("delete_contact_event", { id });
}

export async function updateContactEvent(
  workspaceId: string,
  id: string,
  input: ClientContactEventInput,
): Promise<ClientContactEvent> {
  return ipc("update_contact_event", { workspaceId, id, input });
}

export type ClientTag = {
  id: string;
  workspaceId: string;
  name: string;
  color: string | null;
  createdAt: string;
};

export async function listClientTags(workspaceId: string): Promise<ClientTag[]> {
  return ipc("list_client_tags", { workspaceId });
}

export async function createClientTag(
  workspaceId: string,
  input: { name: string; color?: string | null },
): Promise<ClientTag> {
  return ipc("create_client_tag", { workspaceId, input });
}

export async function deleteClientTag(id: string): Promise<void> {
  return ipc("delete_client_tag", { id });
}

export async function setClientTags(
  workspaceId: string,
  clientId: string,
  tagIds: string[],
): Promise<void> {
  return ipc("set_client_tags", { workspaceId, clientId, tagIds });
}

export type ClientReminder = {
  id: string;
  workspaceId: string;
  clientId: string | null;
  title: string;
  note: string | null;
  dueAt: string;
  status: string;
  recurrenceRule: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientReminderInput = {
  clientId?: string | null;
  title: string;
  note?: string | null;
  dueAt: string;
  status?: string | null;
  recurrenceRule?: string | null;
};

export async function listReminders(
  workspaceId: string,
): Promise<ClientReminder[]> {
  return ipc("list_reminders", { workspaceId });
}

export async function createReminder(
  workspaceId: string,
  input: ClientReminderInput,
): Promise<ClientReminder> {
  return ipc("create_reminder", { workspaceId, input });
}

export async function getReminder(id: string): Promise<ClientReminder> {
  return ipc("get_reminder", { id });
}

export async function updateReminder(
  id: string,
  input: ClientReminderInput,
): Promise<ClientReminder> {
  return ipc("update_reminder", { id, input });
}

export async function deleteReminder(id: string): Promise<void> {
  return ipc("delete_reminder", { id });
}

export type CalendarEvent = {
  id: string;
  workspaceId: string;
  title: string;
  note: string | null;
  startDate: string;
  endDate: string;
  /** Clé symbolique de la palette interne (`neutral`, `sky`, …). */
  colorKey: string | null;
  /** Couleur hex personnalisée prioritaire sur `colorKey` (`#RRGGBB`). */
  colorHex: string | null;
  clientId: string | null;
  projectId: string | null;
  invoiceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventInput = {
  title: string;
  note?: string | null;
  startDate: string;
  endDate: string;
  colorKey?: string | null;
  colorHex?: string | null;
  clientId?: string | null;
  projectId?: string | null;
  invoiceId?: string | null;
};

export async function listCalendarEvents(
  workspaceId: string,
): Promise<CalendarEvent[]> {
  return ipc("list_calendar_events", { workspaceId });
}

export async function createCalendarEvent(
  workspaceId: string,
  input: CalendarEventInput,
): Promise<CalendarEvent> {
  return ipc("create_calendar_event", { workspaceId, input });
}

export async function getCalendarEvent(id: string): Promise<CalendarEvent> {
  return ipc("get_calendar_event", { id });
}

export async function updateCalendarEvent(
  id: string,
  input: CalendarEventInput,
): Promise<CalendarEvent> {
  return ipc("update_calendar_event", { id, input });
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  return ipc("delete_calendar_event", { id });
}

export async function getCalendarHolidayCache(
  cacheKey: string,
): Promise<string | null> {
  return ipc("get_calendar_holiday_cache", { cacheKey });
}

export async function syncOpenHolidays(args: {
  countryIso: string;
  publicSubdivision: string | null;
  schoolSubdivision: string;
  yearFrom: number;
  yearTo: number;
  force: boolean;
  customBaseUrl: string | null;
}): Promise<Record<string, unknown>> {
  return ipc("sync_open_holidays", args);
}

export type RecoveryAction = {
  id: string;
  workspaceId: string;
  invoiceId: string | null;
  kind: string;
  status: string;
  dueAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecoveryActionInput = {
  invoiceId?: string | null;
  kind?: string | null;
  status?: string | null;
  dueAt: string;
  notes?: string | null;
};

export async function listRecoveryActions(
  workspaceId: string,
): Promise<RecoveryAction[]> {
  return ipc("list_recovery_actions", { workspaceId });
}

export async function createRecoveryAction(
  workspaceId: string,
  input: RecoveryActionInput,
): Promise<RecoveryAction> {
  return ipc("create_recovery_action", { workspaceId, input });
}

export async function getRecoveryAction(id: string): Promise<RecoveryAction> {
  return ipc("get_recovery_action", { id });
}

export async function updateRecoveryAction(
  id: string,
  input: RecoveryActionInput,
): Promise<RecoveryAction> {
  return ipc("update_recovery_action", { id, input });
}

export async function deleteRecoveryAction(id: string): Promise<void> {
  return ipc("delete_recovery_action", { id });
}

export type ClientTimelineEntry = {
  kind: string;
  id: string;
  title: string;
  subtitle: string | null;
  occurredAt: string;
  meta?: string | null;
};

export async function getClientTimeline(
  workspaceId: string,
  clientId: string,
): Promise<ClientTimelineEntry[]> {
  return ipc("get_client_timeline", { workspaceId, clientId });
}
