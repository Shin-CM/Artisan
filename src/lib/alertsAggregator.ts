import * as api from "@/lib/api";
import {
  dateFromIso,
  isoFromYearMonthDay,
  nextTuesdayOnOrAfter,
  shiftIso,
  todayIso,
} from "@/pages/calendar/calendarGrid";

export type AlertKind =
  | "reminder-due"
  | "reminder-upcoming"
  | "invoice-due-today"
  | "invoice-due-soon"
  | "invoice-overdue-tuesday"
  | "invoice-overdue-stale"
  | "quote-expires-today"
  | "quote-expires-soon"
  | "stock-below-min";

export type Alert = {
  id: string;
  kind: AlertKind;
  title: string;
  subtitle: string | null;
  date: string;
  navigatePath: string;
};

export type AlertBuckets = {
  today: Alert[];
  thisWeek: Alert[];
  watch: Alert[];
};

export type AlertOptions = {
  clientFollowupEnabled: boolean;
  recoveryAssistedEnabled: boolean;
  stockManagerEnabled: boolean;
};

const EMPTY_BUCKETS: AlertBuckets = {
  today: [],
  thisWeek: [],
  watch: [],
};

function toIsoDay(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length < 10) return null;
  const slice = trimmed.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slice)) return null;
  return slice;
}

function todayPlusDays(days: number): string {
  const t = dateFromIso(todayIso());
  t.setDate(t.getDate() + days);
  return isoFromYearMonthDay(t.getFullYear(), t.getMonth(), t.getDate());
}

/**
 * Calcule la liste des alertes en cours pour l'espace courant, classées par
 * urgence (jour J, cette semaine, à surveiller > 30 j).
 *
 * Lit `listReminders`, `listInvoices`, `listQuotes` en parallèle ; tout échec
 * d'une source est silencieusement ignoré (les autres sources restent
 * disponibles).
 */
export async function loadAlerts(
  workspaceId: string,
  options: AlertOptions,
): Promise<AlertBuckets> {
  const today = todayIso();
  const sevenDays = todayPlusDays(7);
  const thirtyDays = shiftIso(today, -30);

  const tasks: Promise<unknown>[] = [];
  const reminders: api.ClientReminder[] = [];
  const invoices: api.Invoice[] = [];
  const quotes: api.Quote[] = [];

  if (options.clientFollowupEnabled) {
    tasks.push(
      api
        .listReminders(workspaceId)
        .then((r) => {
          reminders.push(...r);
        })
        .catch(() => undefined),
    );
  }
  tasks.push(
    api
      .listInvoices(workspaceId)
      .then((r) => {
        invoices.push(...r);
      })
      .catch(() => undefined),
  );
  tasks.push(
    api
      .listQuotes(workspaceId)
      .then((r) => {
        quotes.push(...r);
      })
      .catch(() => undefined),
  );

  const stockLowAlerts: api.StockLowAlertRow[] = [];
  if (options.stockManagerEnabled) {
    tasks.push(
      api
        .listStockLowAlerts(workspaceId)
        .then((low) => {
          stockLowAlerts.push(...low);
        })
        .catch(() => undefined),
    );
  }

  await Promise.all(tasks);

  const buckets: AlertBuckets = {
    today: [],
    thisWeek: [],
    watch: [],
  };

  for (const row of stockLowAlerts) {
    buckets.watch.push({
      id: `stock-low:${row.articleId}`,
      kind: "stock-below-min",
      title: `${row.articleName} — stock bas`,
      subtitle: `${row.quantity} / seuil ${row.minQuantity}`,
      date: today,
      navigatePath: "/home/stock",
    });
  }

  if (options.clientFollowupEnabled) {
    for (const r of reminders) {
      if (r.status !== "pending") continue;
      const day = toIsoDay(r.dueAt);
      if (!day) continue;
      const path = r.clientId
        ? `/home/client-followup/clients/${r.clientId}`
        : "/home/client-followup";
      if (day <= today) {
        buckets.today.push({
          id: `reminder:${r.id}`,
          kind: "reminder-due",
          title: r.title?.trim() || "Rappel",
          subtitle: day < today ? "En retard" : "Aujourd’hui",
          date: day,
          navigatePath: path,
        });
      } else if (day <= sevenDays) {
        buckets.thisWeek.push({
          id: `reminder:${r.id}`,
          kind: "reminder-upcoming",
          title: r.title?.trim() || "Rappel",
          subtitle: null,
          date: day,
          navigatePath: path,
        });
      }
    }
  }

  for (const inv of invoices) {
    if (inv.archived) continue;
    if ((inv.documentKind ?? "invoice") !== "invoice") continue;
    if (inv.status === "paid" || inv.status === "cancelled") continue;
    const due = toIsoDay(inv.dueDate);
    if (!due) continue;
    const remaining = inv.total - (inv.amountPaid ?? 0);
    if (remaining <= 0) continue;

    if (due >= today) {
      if (due === today) {
        buckets.today.push({
          id: `invoice-due:${inv.id}`,
          kind: "invoice-due-today",
          title: `Facture ${inv.number} échue ce jour`,
          subtitle: `Reste ${remaining.toFixed(2)}`,
          date: due,
          navigatePath: `/home/invoices?focus=${inv.id}`,
        });
      } else if (due <= sevenDays) {
        buckets.thisWeek.push({
          id: `invoice-due:${inv.id}`,
          kind: "invoice-due-soon",
          title: `Facture ${inv.number}`,
          subtitle: `Échéance — reste ${remaining.toFixed(2)}`,
          date: due,
          navigatePath: `/home/invoices?focus=${inv.id}`,
        });
      }
    } else if (options.recoveryAssistedEnabled) {
      const tuesday = nextTuesdayOnOrAfter(today);
      if (tuesday === today) {
        buckets.today.push({
          id: `overdue-today:${inv.id}`,
          kind: "invoice-overdue-tuesday",
          title: `Relancer ${inv.number}`,
          subtitle: `En retard — reste ${remaining.toFixed(2)}`,
          date: tuesday,
          navigatePath: `/home/recovery?focus=${inv.id}`,
        });
      } else if (tuesday <= sevenDays) {
        buckets.thisWeek.push({
          id: `overdue-tuesday:${inv.id}`,
          kind: "invoice-overdue-tuesday",
          title: `Relancer ${inv.number}`,
          subtitle: `Mardi — reste ${remaining.toFixed(2)}`,
          date: tuesday,
          navigatePath: `/home/recovery?focus=${inv.id}`,
        });
      }
      if (due < thirtyDays) {
        buckets.watch.push({
          id: `overdue-stale:${inv.id}`,
          kind: "invoice-overdue-stale",
          title: `Facture ${inv.number} en retard`,
          subtitle: `Échue le ${due} — reste ${remaining.toFixed(2)}`,
          date: due,
          navigatePath: `/home/recovery?focus=${inv.id}`,
        });
      }
    }
  }

  for (const q of quotes) {
    if (q.archived) continue;
    const expiry = toIsoDay(q.validUntil);
    if (!expiry) continue;
    if (expiry === today) {
      buckets.today.push({
        id: `quote-expires:${q.id}`,
        kind: "quote-expires-today",
        title: `Devis ${q.number} expire ce jour`,
        subtitle: q.title?.trim() || null,
        date: expiry,
        navigatePath: `/home/quotes?focus=${q.id}`,
      });
    } else if (expiry > today && expiry <= sevenDays) {
      buckets.thisWeek.push({
        id: `quote-expires:${q.id}`,
        kind: "quote-expires-soon",
        title: `Devis ${q.number}`,
        subtitle: `Expire le ${expiry}`,
        date: expiry,
        navigatePath: `/home/quotes?focus=${q.id}`,
      });
    }
  }

  buckets.today.sort((a, b) => a.date.localeCompare(b.date));
  buckets.thisWeek.sort((a, b) => a.date.localeCompare(b.date));
  buckets.watch.sort((a, b) => a.date.localeCompare(b.date));

  return buckets;
}

export function totalAlerts(buckets: AlertBuckets): number {
  return buckets.today.length + buckets.thisWeek.length + buckets.watch.length;
}

export function emptyAlertBuckets(): AlertBuckets {
  return { today: [...EMPTY_BUCKETS.today], thisWeek: [...EMPTY_BUCKETS.thisWeek], watch: [...EMPTY_BUCKETS.watch] };
}
