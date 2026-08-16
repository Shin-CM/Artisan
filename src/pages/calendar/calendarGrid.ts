/**
 * Utilitaires de calendrier (calculs de date, format FR, grille mensuelle).
 *
 * Aucune dépendance React : utilisable en composants, helpers et tests Vitest.
 */

export const WEEKDAYS_FR = [
  "Lun.",
  "Mar.",
  "Mer.",
  "Jeu.",
  "Ven.",
  "Sam.",
  "Dim.",
];

export const MONTH_LABEL_FMT = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

export const DAY_FULL_FMT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const DAY_SHORT_FMT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** ISO court (`YYYY-MM-DD`) du jour courant local. */
export function todayIso(): string {
  const d = new Date();
  return isoFromYearMonthDay(d.getFullYear(), d.getMonth(), d.getDate());
}

/** ISO `YYYY-MM-DD` à partir d'année / mois (0-11) / jour (1-31) locaux. */
export function isoFromYearMonthDay(
  year: number,
  month: number,
  day: number,
): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** Construit un `Date` local à minuit depuis un ISO court (`YYYY-MM-DD`). */
export function dateFromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map((p) => Number.parseInt(p, 10));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Index 0..6 où 0 = lundi (FR). */
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Premier jour de la semaine pour la grille mensuelle (aligné sur les préférences). */
export type MonthGridWeekStart = "monday" | "sunday";

/**
 * 42 jours (6 semaines × 7) couvrant un mois civil.
 * La première case est le **lundi** ou le **dimanche** de la semaine qui contient
 * le 1er du mois, selon `weekStart` — aligné sur les en-têtes `weekdayHeaders`.
 */
export function buildMonthGrid(
  year: number,
  month: number,
  weekStart: MonthGridWeekStart = "monday",
): string[] {
  const first = new Date(year, month, 1);
  const offset =
    weekStart === "monday" ? mondayIndex(first) : first.getDay();
  const start = new Date(year, month, 1 - offset);
  const days: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(
      isoFromYearMonthDay(d.getFullYear(), d.getMonth(), d.getDate()),
    );
  }
  return days;
}

/** Décale un ISO de `deltaDays` jours (peut être négatif). */
export function shiftIso(iso: string, deltaDays: number): string {
  const d = dateFromIso(iso);
  d.setDate(d.getDate() + deltaDays);
  return isoFromYearMonthDay(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Nombre de jours entre deux ISO (`b - a`, signé). */
export function diffDaysIso(a: string, b: string): number {
  const da = dateFromIso(a).getTime();
  const db = dateFromIso(b).getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

/**
 * Étiquette de mois FR avec majuscule initiale (« Avril 2026 »).
 */
export function formatMonthLabel(year: number, month: number): string {
  const raw = MONTH_LABEL_FMT.format(new Date(year, month, 1));
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Prochain mardi (0 = dimanche, …, 2 = mardi) à partir d'un ISO inclus.
 * Si l'ISO est déjà un mardi, le retourne tel quel.
 */
export function nextTuesdayOnOrAfter(iso: string): string {
  const d = dateFromIso(iso);
  const wd = d.getDay();
  const delta = (2 - wd + 7) % 7;
  d.setDate(d.getDate() + delta);
  return isoFromYearMonthDay(d.getFullYear(), d.getMonth(), d.getDate());
}
