import * as api from "@/lib/api";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MONTH_OPTIONS, monthLabel } from "./historyUtils";

type Fmt = (n: number) => string;

export function HistoryManualPanel({
  currency,
  fmt,
  manualEntries,
  manualEntriesSearchFiltered,
  formYear,
  setFormYear,
  formMonth,
  setFormMonth,
  formAmount,
  setFormAmount,
  formNotes,
  setFormNotes,
  spreadYear,
  setSpreadYear,
  spreadTotal,
  setSpreadTotal,
  spreadBusy,
  resetManualForm,
  submitManualForm,
  deleteManual,
  fillFormFromRow,
  spreadAnnual,
}: {
  currency: string;
  fmt: Fmt;
  manualEntries: api.ManualRevenueEntry[];
  manualEntriesSearchFiltered: api.ManualRevenueEntry[];
  formYear: number;
  setFormYear: React.Dispatch<React.SetStateAction<number>>;
  formMonth: number;
  setFormMonth: React.Dispatch<React.SetStateAction<number>>;
  formAmount: string;
  setFormAmount: React.Dispatch<React.SetStateAction<string>>;
  formNotes: string;
  setFormNotes: React.Dispatch<React.SetStateAction<string>>;
  spreadYear: number;
  setSpreadYear: React.Dispatch<React.SetStateAction<number>>;
  spreadTotal: string;
  setSpreadTotal: React.Dispatch<React.SetStateAction<string>>;
  spreadBusy: boolean;
  resetManualForm: () => void;
  submitManualForm: (e: React.FormEvent) => void | Promise<void>;
  deleteManual: (id: string) => void | Promise<void>;
  fillFormFromRow: (row: api.ManualRevenueEntry) => void;
  spreadAnnual: () => void | Promise<void>;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <form
        onSubmit={(e) => void submitManualForm(e)}
        className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4"
      >
        <h3 className="text-sm font-medium">Saisie par mois</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="mr-year">Année</Label>
            <Input
              id="mr-year"
              type="number"
              className="mt-1"
              min={1990}
              max={2100}
              value={formYear}
              onChange={(e) =>
                setFormYear(Number(e.target.value) || formYear)
              }
            />
          </div>
          <div>
            <Label htmlFor="mr-month">Mois</Label>
            <select
              id="mr-month"
              className="mt-1 flex h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm focus:outline-none disabled:opacity-50"
              value={formMonth}
              onChange={(e) => setFormMonth(Number(e.target.value))}
            >
              {MONTH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="mr-amount">Montant TTC ({currency})</Label>
            <Input
              id="mr-amount"
              type="text"
              inputMode="decimal"
              className="mt-1"
              placeholder="0,00"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="mr-notes">Notes (facultatif)</Label>
          <textarea
            id="mr-notes"
            className="mt-1 min-h-[60px] w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] p-2 text-sm focus:outline-none disabled:opacity-50"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder="Ex. Activité avant Artisan"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm">
            Enregistrer
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={resetManualForm}
          >
            Réinitialiser le formulaire
          </Button>
        </div>
      </form>

      <div className="space-y-3 rounded-lg border border-[var(--color-border)] border-dashed bg-[var(--color-muted)]/10 p-4">
        <h3 className="text-sm font-medium">Répartir un total annuel</h3>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Divise le total en 12 parts égales (ajustement en centimes sur les
          premiers mois) et enregistre les 12 mois de l’année choisie.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="mr-spread-year">Année</Label>
            <Input
              id="mr-spread-year"
              type="number"
              className="mt-1 w-28"
              min={1990}
              max={2100}
              value={spreadYear}
              onChange={(e) =>
                setSpreadYear(Number(e.target.value) || spreadYear)
              }
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <Label htmlFor="mr-spread-total">Total TTC ({currency})</Label>
            <Input
              id="mr-spread-total"
              type="text"
              inputMode="decimal"
              className="mt-1"
              placeholder="0,00"
              value={spreadTotal}
              onChange={(e) => setSpreadTotal(e.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={spreadBusy}
            onClick={() => void spreadAnnual()}
          >
            {spreadBusy ? "Enregistrement…" : "Répartir sur 12 mois"}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Entrées enregistrées</h3>
        {manualEntriesSearchFiltered.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {manualEntries.length === 0
              ? "Aucune saisie manuelle."
              : "Aucune entrée ne correspond à la recherche."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/20 text-left text-xs text-[var(--color-muted-foreground)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Période</th>
                  <th className="px-3 py-2 font-medium text-right">Montant</th>
                  <th className="px-3 py-2 font-medium">Notes</th>
                  <th className="w-36 px-3 py-2 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {manualEntriesSearchFiltered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-3 py-2 tabular-nums">
                      {monthLabel(row.month)} {row.year}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmt(row.amount)}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-[var(--color-muted-foreground)]">
                      {row.notes || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <div className="flex flex-row flex-nowrap items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 shrink-0"
                          onClick={() => fillFormFromRow(row)}
                        >
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 shrink-0"
                          onClick={() => void deleteManual(row.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
