import * as React from "react";
import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { calendarSourceLabel } from "@/lib/calendarEvents";
import type {
  CalendarPrefs,
  CalendarSourceKey,
  CalendarViewMode,
  CalendarDensity,
  WeekStartDay,
  MonthAccentMode,
  FirstOfMonthLabel,
} from "./calendarPrefs";

/** Codes canton CH (sans préfixe `CH-`) pour les listes déroulantes. */
export const SWISS_CANTON_CODES = [
  "AG",
  "AI",
  "AR",
  "BE",
  "BL",
  "BS",
  "FR",
  "GE",
  "GL",
  "GR",
  "JU",
  "LU",
  "NE",
  "NW",
  "OW",
  "SG",
  "SH",
  "SO",
  "SZ",
  "TG",
  "TI",
  "UR",
  "VD",
  "VS",
  "ZG",
  "ZH",
] as const;

const ALL_SOURCES: CalendarSourceKey[] = [
  "neutral",
  "reminder",
  "invoice-due",
  "invoice-overdue",
  "quote-validity",
  "recovery-scheduled",
  "project-start",
  "project-end",
];

export function CalendarPrefsForm({
  prefs,
  onPatch,
  onReset,
}: {
  prefs: CalendarPrefs;
  onPatch: (patch: Partial<CalendarPrefs>) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-3 text-sm">
      <Section title="Vue">
        <Segmented<CalendarViewMode>
          value={prefs.viewMode}
          options={[
            { value: "weeks", label: "Semaines (∞)" },
            { value: "months", label: "Mois" },
          ]}
          onChange={(v) => onPatch({ viewMode: v })}
        />
      </Section>

      <Section title="Densité">
        <Segmented<CalendarDensity>
          value={prefs.density}
          options={[
            { value: "compact", label: "Compact" },
            { value: "comfort", label: "Confort" },
            { value: "spacious", label: "Spacieux" },
          ]}
          onChange={(v) => onPatch({ density: v })}
        />
      </Section>

      <Section title="Premier jour de la semaine">
        <Segmented<WeekStartDay>
          value={prefs.weekStart}
          options={[
            { value: "monday", label: "Lundi" },
            { value: "sunday", label: "Dimanche" },
          ]}
          onChange={(v) => onPatch({ weekStart: v })}
        />
      </Section>

      <ToggleRow
        label="Numéros de semaine"
        checked={prefs.showWeekNumbers}
        onChange={(v) => onPatch({ showWeekNumbers: v })}
      />

      <Section title="Différenciation des mois">
        <Segmented<MonthAccentMode>
          value={prefs.monthAccent}
          options={[
            { value: "none", label: "Aucune" },
            { value: "alternating", label: "Bandeau" },
            { value: "pastille", label: "Pastille" },
          ]}
          onChange={(v) => onPatch({ monthAccent: v })}
        />
      </Section>

      <Section title="Repère du 1er du mois">
        <Segmented<FirstOfMonthLabel>
          value={prefs.firstOfMonthLabel}
          options={[
            { value: "number", label: "Numéro seul" },
            { value: "number_short_month", label: "Numéro + mois" },
          ]}
          onChange={(v) => onPatch({ firstOfMonthLabel: v })}
        />
      </Section>

      <ToggleRow
        label="Week-ends estompés"
        checked={prefs.fadeWeekends}
        onChange={(v) => onPatch({ fadeWeekends: v })}
      />

      <Section title="Glisser-déposer (expérimental)">
        <ToggleRow
          label="Déplacer les événements à la souris"
          checked={prefs.experimentalEventDndEnabled}
          onChange={(v) => onPatch({ experimentalEventDndEnabled: v })}
        />
        <p className="text-[11px] leading-snug text-[var(--color-muted-foreground)]">
          Fonction encore en évolution ; désactivez-la en cas de problème
          d’affichage ou de repère pendant le glissement. Les autres actions
          (menus, report depuis le menu) restent disponibles.
        </p>
      </Section>

      <Section title="Sources actives par défaut">
        <div className="flex flex-col gap-1.5">
          {ALL_SOURCES.map((key) => (
            <label
              key={key}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="truncate">{calendarSourceLabel(key)}</span>
              <Switch
                size="sm"
                checked={prefs.defaultSources[key]}
                onCheckedChange={(v) =>
                  onPatch({
                    defaultSources: {
                      ...prefs.defaultSources,
                      [key]: v,
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
      </Section>

      <Section title="Fériés & vacances — affichage sur la grille">
        <p className="text-[11px] leading-snug text-[var(--color-muted-foreground)]">
          Portée API fériés publics CH et calendrier des vacances scolaires (Suisse
          ou France, zones A/B/C) :{" "}
          <Link
            to="/settings/calendar"
            className="font-medium text-[var(--color-foreground)] underline-offset-2 hover:underline"
          >
            Paramètres → Calendrier
          </Link>
          .
        </p>
        <ToggleRow
          label="Afficher les jours fériés publics"
          checked={prefs.showPublicHolidays}
          onChange={(v) => onPatch({ showPublicHolidays: v })}
        />
        <ToggleRow
          label="Afficher les vacances scolaires"
          checked={prefs.showSchoolVacations}
          onChange={(v) => onPatch({ showSchoolVacations: v })}
        />
      </Section>

      <Section title="Fériés & vacances — restrictions">
        <p className="text-[11px] leading-snug text-[var(--color-muted-foreground)]">
          Création, sélection de plage et glisser-déposer sur la grille. Toutes
          désactivées par défaut.
        </p>
        <ToggleRow
          label="Bloquer création sur jour férié"
          checked={prefs.blockCreateOnPublicHoliday}
          onChange={(v) => onPatch({ blockCreateOnPublicHoliday: v })}
        />
        <ToggleRow
          label="Bloquer sélection si plage inclut un férié"
          checked={prefs.blockRangeDragIfIncludesPublicHoliday}
          onChange={(v) => onPatch({ blockRangeDragIfIncludesPublicHoliday: v })}
        />
        <ToggleRow
          label="Bloquer dépôt DnD sur jour férié"
          checked={prefs.blockDndDropOnPublicHoliday}
          onChange={(v) => onPatch({ blockDndDropOnPublicHoliday: v })}
        />
        <ToggleRow
          label="Bloquer création en vacances scolaires"
          checked={prefs.blockCreateOnSchoolVacation}
          onChange={(v) => onPatch({ blockCreateOnSchoolVacation: v })}
        />
        <ToggleRow
          label="Bloquer sélection si plage inclut vacances"
          checked={prefs.blockRangeDragIfIncludesSchoolVacation}
          onChange={(v) =>
            onPatch({ blockRangeDragIfIncludesSchoolVacation: v })
          }
        />
        <ToggleRow
          label="Bloquer dépôt DnD en vacances scolaires"
          checked={prefs.blockDndDropOnSchoolVacation}
          onChange={(v) => onPatch({ blockDndDropOnSchoolVacation: v })}
        />
      </Section>

      <div className="flex items-center justify-end pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-[var(--color-muted-foreground)]"
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-[var(--color-muted-foreground)]">
        {title}
      </Label>
      {children}
    </div>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span>{label}</span>
      <Switch size="sm" checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded px-2 py-1 text-xs transition-colors",
            value === opt.value
              ? "bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm"
              : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
