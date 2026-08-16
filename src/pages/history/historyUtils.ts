import type * as api from "@/lib/api";

export const MONTH_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
];

export function monthLabel(m: number): string {
  return MONTH_OPTIONS.find((x) => x.value === m)?.label ?? String(m);
}

/** Année calendaire extraite de `issueDate` (ISO). */
export function issueDateYear(iso: string): number {
  const y = parseInt(iso.slice(0, 4), 10);
  return Number.isFinite(y) ? y : 0;
}

/** Répartit un total TTC en 12 parts en centimes (derniers mois +1 c. si reste). */
export function splitAnnualTotalEuros(total: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / 12);
  const rest = cents - base * 12;
  const out: number[] = [];
  for (let i = 0; i < 12; i++) {
    const c = base + (i < rest ? 1 : 0);
    out.push(c / 100);
  }
  return out;
}

export type HistorySection = "archives" | "manual";

/** Filtre date pour les tableaux factures / devis archivés. */
export type ArchiveDocYearFilter = "all" | "past_years";

export type ManualPastYearsGrouped = {
  byYear: Map<number, api.ManualRevenueEntry[]>;
  yearsDesc: number[];
};
