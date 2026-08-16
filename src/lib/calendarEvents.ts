import * as api from "@/lib/api";
import { nextTuesdayOnOrAfter, todayIso } from "@/pages/calendar/calendarGrid";

/** Source d'un événement calendrier (pour filtres et couleur). */
export type CalendarEventSource =
  | "reminder"
  | "invoice-due"
  | "invoice-overdue"
  | "quote-validity"
  | "project-start"
  | "project-end"
  | "neutral"
  | "recovery-scheduled";

/**
 * Clés de la palette fixe pour les événements neutres. La palette est volontairement
 * restreinte pour garantir un rendu cohérent ; l'utilisateur peut aussi saisir un
 * hex libre qui prime sur la clé (cf. `CalendarEvent.colorHex`).
 */
export type NeutralColorKey =
  | "neutral"
  | "sky"
  | "emerald"
  | "rose"
  | "amber"
  | "violet";

export const NEUTRAL_PALETTE_KEYS: NeutralColorKey[] = [
  "neutral",
  "sky",
  "emerald",
  "rose",
  "amber",
  "violet",
];

export type CalendarEvent = {
  id: string;
  source: CalendarEventSource;
  /** Jour ISO de début (YYYY-MM-DD). */
  date: string;
  /** Jour ISO de fin (YYYY-MM-DD). Égal à `date` pour les événements mono-jour. */
  endDate: string;
  title: string;
  subtitle: string | null;
  /** Route à ouvrir au clic (peut pointer vers une liste avec `?focus=...`). */
  navigatePath: string;
  /** État courant de l'élément (ex. statut facture, état rappel) — affichage seul. */
  status?: string | null;
  /** Couleur hex personnalisée (`#RRGGBB`), prioritaire sur la palette. */
  colorHex?: string | null;
  /** Clé de palette neutre quand `source = "neutral"`. */
  colorKey?: NeutralColorKey | null;
  /** Indique si l'événement peut être modifié / déplacé (rappel, neutral). */
  editable?: boolean;
  /** Identifiant de l'entité sous-jacente (rappel, événement neutre, facture, etc.). */
  entityId?: string;
};

export type CalendarEventOptions = {
  includeReminders: boolean;
  includeInvoiceDue: boolean;
  includeOverdue: boolean;
  includeQuoteValidity: boolean;
  includeProjects: boolean;
  includeNeutral: boolean;
  includeRecoveryActions: boolean;
};

const DEFAULT_OPTIONS: CalendarEventOptions = {
  includeReminders: true,
  includeInvoiceDue: true,
  includeOverdue: true,
  includeQuoteValidity: true,
  includeProjects: true,
  includeNeutral: true,
  includeRecoveryActions: true,
};

/** Coupe une date ISO (avec ou sans heure) à `YYYY-MM-DD`. Retourne `null` si invalide. */
function toIsoDay(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length < 10) return null;
  const slice = trimmed.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slice)) return null;
  return slice;
}

/** Statut humanisé pour le PDF / l'UI (français court). */
function humanInvoiceStatus(status: string): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "sent":
      return "Envoyée";
    case "paid":
      return "Payée";
    case "partial":
      return "Partiellement payée";
    case "overdue":
      return "En retard";
    case "cancelled":
      return "Annulée";
    default:
      return status;
  }
}

function humanQuoteStatus(status: string): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "sent":
      return "Envoyé";
    case "accepted":
      return "Accepté";
    case "rejected":
      return "Refusé";
    case "expired":
      return "Expiré";
    default:
      return status;
  }
}

function humanProjectStatus(status: string): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "active":
      return "Actif";
    case "on_hold":
      return "En pause";
    case "completed":
      return "Terminé";
    case "cancelled":
      return "Annulé";
    default:
      return status;
  }
}

/**
 * Charge et agrège tous les événements visibles dans le calendrier pour un espace.
 *
 * - **Rappels** issus du module *Suivi clients* (`listReminders`).
 * - **Factures** : `dueDate` lorsqu'elle est renseignée (hors avoirs / archivées).
 * - **Devis** : `validUntil` (hors devis archivés).
 * - **Projets** : `startDate` et `endDate` (si renseignés).
 *
 * Aucune source bloquante : un module désactivé (ou un appel échoué) retourne `[]`
 * sans empêcher les autres sources de remonter leurs événements.
 */
export async function loadCalendarEvents(
  workspaceId: string,
  options: Partial<CalendarEventOptions> = {},
): Promise<CalendarEvent[]> {
  const opt: CalendarEventOptions = { ...DEFAULT_OPTIONS, ...options };

  const tasks: Promise<CalendarEvent[]>[] = [];

  if (opt.includeReminders) {
    tasks.push(
      api
        .listReminders(workspaceId)
        .then((rows) => rows.map(reminderToEvent).filter(isEvent))
        .catch(() => []),
    );
  }

  if (opt.includeInvoiceDue || opt.includeOverdue) {
    const today = todayIso();
    tasks.push(
      api
        .listInvoices(workspaceId)
        .then((rows) => {
          const out: CalendarEvent[] = [];
          for (const inv of rows) {
            if (opt.includeOverdue) {
              const ev = invoiceToOverdueEvent(inv, today);
              if (ev) out.push(ev);
            }
            if (opt.includeInvoiceDue) {
              const ev = invoiceToDueEvent(inv, today);
              if (ev) out.push(ev);
            }
          }
          return out;
        })
        .catch(() => []),
    );
  }

  if (opt.includeQuoteValidity) {
    tasks.push(
      api
        .listQuotes(workspaceId)
        .then((rows) => rows.map(quoteToEvent).filter(isEvent))
        .catch(() => []),
    );
  }

  if (opt.includeProjects) {
    tasks.push(
      api
        .listProjects(workspaceId)
        .then((rows) => rows.flatMap(projectToEvents))
        .catch(() => []),
    );
  }

  if (opt.includeNeutral) {
    tasks.push(
      api
        .listCalendarEvents(workspaceId)
        .then((rows) => rows.map(neutralToEvent).filter(isEvent))
        .catch(() => []),
    );
  }

  if (opt.includeRecoveryActions) {
    tasks.push(
      api
        .listRecoveryActions(workspaceId)
        .then((rows) => rows.map(recoveryActionToEvent).filter(isEvent))
        .catch(() => []),
    );
  }

  const results = await Promise.all(tasks);
  const merged = results.flat();
  merged.sort(compareEvents);
  return merged;
}

function isEvent(v: CalendarEvent | null): v is CalendarEvent {
  return v !== null;
}

function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.source !== b.source) return a.source.localeCompare(b.source);
  return a.title.localeCompare(b.title, "fr");
}

function reminderToEvent(r: api.ClientReminder): CalendarEvent | null {
  const day = toIsoDay(r.dueAt);
  if (!day) return null;
  const navigatePath = r.clientId
    ? `/home/client-followup/clients/${r.clientId}`
    : "/home/client-followup";
  const status = r.status === "pending" ? "À faire" : r.status === "done" ? "Traité" : r.status;
  return {
    id: `reminder:${r.id}`,
    source: "reminder",
    date: day,
    endDate: day,
    title: r.title?.trim() || "Rappel",
    subtitle: r.note?.trim() || null,
    navigatePath,
    status,
    editable: r.status !== "done",
    entityId: r.id,
  };
}

/**
 * Échéance « normale » : la `dueDate` future (ou égale à aujourd'hui).
 * Les retards ne remontent **plus** sur cette source pour éviter le doublon
 * avec `invoiceToOverdueEvent`.
 */
function invoiceToDueEvent(
  inv: api.Invoice,
  today: string,
): CalendarEvent | null {
  if (inv.archived) return null;
  if ((inv.documentKind ?? "invoice") !== "invoice") return null;
  const day = toIsoDay(inv.dueDate);
  if (!day) return null;
  if (day < today) return null;
  return {
    id: `invoice-due:${inv.id}`,
    source: "invoice-due",
    date: day,
    endDate: day,
    title: `Facture ${inv.number}`,
    subtitle: null,
    navigatePath: `/home/invoices?focus=${inv.id}`,
    status: humanInvoiceStatus(inv.status),
    entityId: inv.id,
  };
}

/**
 * Relance hebdomadaire (mardi) tant que la facture est en retard et non
 * soldée. Pour chaque facture éligible, un **seul** événement à la prochaine
 * date du mardi >= max(aujourd'hui, échéance). Quand le mardi passe sans
 * paiement, le suivant est calculé automatiquement.
 */
function invoiceToOverdueEvent(
  inv: api.Invoice,
  today: string,
): CalendarEvent | null {
  if (inv.archived) return null;
  if ((inv.documentKind ?? "invoice") !== "invoice") return null;
  if (inv.status === "paid" || inv.status === "cancelled") return null;
  const due = toIsoDay(inv.dueDate);
  if (!due) return null;
  if (due >= today) return null;
  const remaining = inv.total - (inv.amountPaid ?? 0);
  if (remaining <= 0) return null;
  const base = due > today ? due : today;
  const tuesday = nextTuesdayOnOrAfter(base);
  return {
    id: `invoice-overdue:${inv.id}`,
    source: "invoice-overdue",
    date: tuesday,
    endDate: tuesday,
    title: `Relancer ${inv.number}`,
    subtitle: `En retard — reste ${remaining.toFixed(2)}`,
    navigatePath: `/home/recovery?focus=${inv.id}`,
    status: humanInvoiceStatus(inv.status),
    entityId: inv.id,
  };
}

function quoteToEvent(q: api.Quote): CalendarEvent | null {
  if (q.archived) return null;
  const day = toIsoDay(q.validUntil);
  if (!day) return null;
  return {
    id: `quote-validity:${q.id}`,
    source: "quote-validity",
    date: day,
    endDate: day,
    title: `Devis ${q.number}`,
    subtitle: q.title?.trim() || null,
    navigatePath: `/home/quotes?focus=${q.id}`,
    status: humanQuoteStatus(q.status),
    entityId: q.id,
  };
}

function projectToEvents(p: api.Project): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  const start = toIsoDay(p.startDate);
  const end = toIsoDay(p.endDate);
  const label = p.code?.trim()
    ? `${p.code.trim()} — ${p.name}`
    : p.name;
  const navigatePath = `/home/projects/${p.id}/dashboard`;
  const status = humanProjectStatus(p.status);
  if (start) {
    out.push({
      id: `project-start:${p.id}`,
      source: "project-start",
      date: start,
      endDate: start,
      title: label,
      subtitle: "Début du projet",
      navigatePath,
      status,
      entityId: p.id,
    });
  }
  if (end && end !== start) {
    out.push({
      id: `project-end:${p.id}`,
      source: "project-end",
      date: end,
      endDate: end,
      title: label,
      subtitle: "Fin du projet",
      navigatePath,
      status,
      entityId: p.id,
    });
  }
  return out;
}

function recoveryActionToEvent(a: api.RecoveryAction): CalendarEvent | null {
  const day = toIsoDay(a.dueAt);
  if (!day) return null;
  if (a.status === "done" || a.status === "cancelled") return null;
  const kindLabel = recoveryKindLabel(a.kind);
  return {
    id: `recovery-scheduled:${a.id}`,
    source: "recovery-scheduled",
    date: day,
    endDate: day,
    title: kindLabel,
    subtitle: a.notes?.trim() || null,
    navigatePath: a.invoiceId ? `/home/recovery?focus=${a.invoiceId}` : "/home/recovery",
    status: humanRecoveryStatus(a.status),
    editable: true,
    entityId: a.id,
  };
}

function recoveryKindLabel(kind: string): string {
  switch (kind) {
    case "call":
      return "Relance — appel";
    case "letter":
      return "Relance — courrier";
    case "visit":
      return "Relance — visite";
    case "email":
    default:
      return "Relance — e-mail";
  }
}

function humanRecoveryStatus(status: string): string {
  switch (status) {
    case "scheduled":
      return "Planifiée";
    case "done":
      return "Faite";
    case "cancelled":
      return "Annulée";
    default:
      return status;
  }
}

function neutralToEvent(c: api.CalendarEvent): CalendarEvent | null {
  const start = toIsoDay(c.startDate);
  const end = toIsoDay(c.endDate);
  if (!start || !end) return null;
  const colorKey = (NEUTRAL_PALETTE_KEYS as readonly string[]).includes(
    c.colorKey ?? "",
  )
    ? (c.colorKey as NeutralColorKey)
    : null;
  return {
    id: `neutral:${c.id}`,
    source: "neutral",
    date: start,
    endDate: end,
    title: c.title,
    subtitle: c.note?.trim() || null,
    navigatePath: `/calendar?event=${c.id}`,
    status: null,
    colorHex: c.colorHex ?? null,
    colorKey,
    editable: true,
    entityId: c.id,
  };
}

/** Couleur d'accent par source (compatible thème clair / sombre via classes Tailwind). */
export function calendarSourceClasses(source: CalendarEventSource): {
  chip: string;
  dot: string;
} {
  switch (source) {
    case "reminder":
      return {
        chip: "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/40",
        dot: "bg-amber-500",
      };
    case "invoice-due":
      return {
        chip: "bg-violet-500/15 text-violet-900 dark:text-violet-200 border-violet-500/40",
        dot: "bg-violet-500",
      };
    case "invoice-overdue":
      return {
        chip: "bg-red-500/15 text-red-800 dark:text-red-200 border-red-500/50",
        dot: "bg-red-600",
      };
    case "quote-validity":
      return {
        chip: "bg-blue-500/15 text-blue-900 dark:text-blue-200 border-blue-500/40",
        dot: "bg-blue-500",
      };
    case "project-start":
      return {
        chip: "bg-sky-500/15 text-sky-900 dark:text-sky-200 border-sky-500/40",
        dot: "bg-sky-500",
      };
    case "project-end":
      return {
        chip: "bg-rose-500/15 text-rose-900 dark:text-rose-200 border-rose-500/40",
        dot: "bg-rose-500",
      };
    case "neutral":
      return {
        chip: "bg-slate-500/15 text-slate-900 dark:text-slate-200 border-slate-500/40",
        dot: "bg-slate-500",
      };
    case "recovery-scheduled":
      return {
        chip: "bg-orange-500/15 text-orange-900 dark:text-orange-200 border-orange-500/40",
        dot: "bg-orange-500",
      };
  }
}

/**
 * Palette Tailwind pour les clés `NeutralColorKey`. Centralisée pour rester
 * cohérente entre la chip de couleur (modale) et le rendu des chips/barres.
 */
export function neutralPaletteClasses(key: NeutralColorKey): {
  chip: string;
  dot: string;
} {
  switch (key) {
    case "neutral":
      return {
        chip: "bg-slate-500/15 text-slate-900 dark:text-slate-200 border-slate-500/40",
        dot: "bg-slate-500",
      };
    case "sky":
      return {
        chip: "bg-sky-500/15 text-sky-900 dark:text-sky-200 border-sky-500/40",
        dot: "bg-sky-500",
      };
    case "emerald":
      return {
        chip: "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-emerald-500/40",
        dot: "bg-emerald-500",
      };
    case "rose":
      return {
        chip: "bg-rose-500/15 text-rose-900 dark:text-rose-200 border-rose-500/40",
        dot: "bg-rose-500",
      };
    case "amber":
      return {
        chip: "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/40",
        dot: "bg-amber-500",
      };
    case "violet":
      return {
        chip: "bg-violet-500/15 text-violet-900 dark:text-violet-200 border-violet-500/40",
        dot: "bg-violet-500",
      };
  }
}

export function calendarSourceLabel(source: CalendarEventSource): string {
  switch (source) {
    case "reminder":
      return "Rappel client";
    case "invoice-due":
      return "Échéance facture";
    case "invoice-overdue":
      return "Relance facture (mardi)";
    case "quote-validity":
      return "Fin de validité devis";
    case "project-start":
      return "Début de projet";
    case "project-end":
      return "Fin de projet";
    case "neutral":
      return "Événement";
    case "recovery-scheduled":
      return "Relance planifiée";
  }
}

/** Liste de toutes les sources, pour l'UI de filtres. */
export const CALENDAR_SOURCES: CalendarEventSource[] = [
  "reminder",
  "invoice-due",
  "invoice-overdue",
  "quote-validity",
  "project-start",
  "project-end",
  "neutral",
  "recovery-scheduled",
];
