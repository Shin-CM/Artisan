import * as React from "react";

/**
 * Préférences utilisateur du calendrier persistées localement.
 *
 * Stockage : `localStorage` sous la clé `calendar.prefs.v1`. Les champs inconnus
 * sont ignorés au chargement (forward-compat) ; les champs manquants prennent la
 * valeur par défaut (backward-compat).
 */

export type CalendarViewMode = "weeks" | "months";
export type CalendarDensity = "compact" | "comfort" | "spacious";
export type WeekStartDay = "monday" | "sunday";
export type MonthAccentMode = "none" | "alternating" | "pastille";
export type FirstOfMonthLabel = "number" | "number_short_month";

export type CalendarSourceKey =
  | "reminder"
  | "invoice-due"
  | "invoice-overdue"
  | "quote-validity"
  | "project-start"
  | "project-end"
  | "neutral"
  | "recovery-scheduled";

/** Portée des jours fériés publics CH : fédéral (API sans subdivision) ou canton. */
export type SwissPublicHolidayScope = "federal" | "canton";

/** Calendrier des vacances scolaires affichées sur la grille (Suisse ou France). */
export type SchoolVacationRegion = "CH" | "FR";

/** Zones métropolitaines France (OpenHolidays `SchoolHolidays`). */
export type FrenchSchoolZone = "FR-ZA" | "FR-ZB" | "FR-ZC";

export const FRENCH_SCHOOL_ZONE_OPTIONS: ReadonlyArray<{
  value: FrenchSchoolZone;
  label: string;
}> = [
  { value: "FR-ZA", label: "Zone A" },
  { value: "FR-ZB", label: "Zone B" },
  { value: "FR-ZC", label: "Zone C" },
];

export type CalendarPrefs = {
  viewMode: CalendarViewMode;
  density: CalendarDensity;
  weekStart: WeekStartDay;
  showWeekNumbers: boolean;
  monthAccent: MonthAccentMode;
  firstOfMonthLabel: FirstOfMonthLabel;
  fadeWeekends: boolean;
  defaultSources: Record<CalendarSourceKey, boolean>;
  /** Pays ISO pour les fériés (défaut CH). */
  holidayCountry: string;
  chPublicScope: SwissPublicHolidayScope;
  /** Code canton sans préfixe `CH-` (ex. `ZH`), utilisé si `chPublicScope === "canton"`. */
  chPublicCanton: string | null;
  /** Canton des vacances scolaires, format `ZH` ou `CH-ZH` (défaut ZH). */
  chSchoolCanton: string;
  /** Vacances scolaires : calendrier suisse (canton) ou français (zones A/B/C). */
  schoolVacationRegion: SchoolVacationRegion;
  /** Si `schoolVacationRegion === "FR"` : zone scolaire OpenHolidays (`FR-ZA` …). */
  frSchoolZone: FrenchSchoolZone;
  showPublicHolidays: boolean;
  showSchoolVacations: boolean;
  /** Mise à jour best-effort via IPC (OpenHolidays). */
  holidayFetchEnabled: boolean;
  /** URL de base OpenHolidays ou service compatible (vide = défaut officiel). */
  holidayCustomApiBaseUrl: string | null;
  blockCreateOnPublicHoliday: boolean;
  blockRangeDragIfIncludesPublicHoliday: boolean;
  blockDndDropOnPublicHoliday: boolean;
  blockCreateOnSchoolVacation: boolean;
  blockRangeDragIfIncludesSchoolVacation: boolean;
  blockDndDropOnSchoolVacation: boolean;
  /**
   * Glisser-déposer des événements éditables sur la grille (expérimental).
   * Désactiver en cas de problème d’affichage ou de comportement.
   */
  experimentalEventDndEnabled: boolean;
};

export const DEFAULT_PREFS: CalendarPrefs = {
  viewMode: "weeks",
  density: "comfort",
  weekStart: "monday",
  showWeekNumbers: false,
  monthAccent: "pastille",
  firstOfMonthLabel: "number_short_month",
  fadeWeekends: true,
  defaultSources: {
    reminder: true,
    "invoice-due": true,
    "invoice-overdue": true,
    "quote-validity": true,
    "project-start": true,
    "project-end": true,
    neutral: true,
    "recovery-scheduled": true,
  },
  holidayCountry: "CH",
  chPublicScope: "federal",
  chPublicCanton: null,
  chSchoolCanton: "ZH",
  schoolVacationRegion: "CH",
  frSchoolZone: "FR-ZC",
  showPublicHolidays: true,
  showSchoolVacations: true,
  holidayFetchEnabled: true,
  holidayCustomApiBaseUrl: null,
  blockCreateOnPublicHoliday: false,
  blockRangeDragIfIncludesPublicHoliday: false,
  blockDndDropOnPublicHoliday: false,
  blockCreateOnSchoolVacation: false,
  blockRangeDragIfIncludesSchoolVacation: false,
  blockDndDropOnSchoolVacation: false,
  experimentalEventDndEnabled: true,
};

const STORAGE_KEY = "calendar.prefs.v1";

/** Émis sur `window` après chaque `savePrefs` (même onglet ou autre). */
export const CALENDAR_PREFS_CHANGED_EVENT = "invoicies:calendar-prefs-changed";

function notifyCalendarPrefsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CALENDAR_PREFS_CHANGED_EVENT));
}

/** Hauteur en px d'une cellule jour selon la densité choisie. */
export function cellHeightForDensity(density: CalendarDensity): number {
  switch (density) {
    case "compact":
      return 96;
    case "spacious":
      return 144;
    case "comfort":
    default:
      return 112;
  }
}

/** Hauteur d'une ligne semaine (cellules + petite marge de séparation). */
export function weekRowHeightForDensity(density: CalendarDensity): number {
  return cellHeightForDensity(density) + 0;
}

export function loadPrefs(): CalendarPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<CalendarPrefs>;
    return mergePrefs(parsed);
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: CalendarPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    notifyCalendarPrefsChanged();
  } catch {
    /* localStorage indisponible ou plein : on ignore */
  }
}

function mergePrefs(raw: Partial<CalendarPrefs>): CalendarPrefs {
  const ds =
    raw?.defaultSources && typeof raw.defaultSources === "object"
      ? { ...DEFAULT_PREFS.defaultSources, ...raw.defaultSources }
      : DEFAULT_PREFS.defaultSources;
  return {
    ...DEFAULT_PREFS,
    ...raw,
    defaultSources: ds,
    holidayCountry: raw.holidayCountry ?? DEFAULT_PREFS.holidayCountry,
    chPublicScope: raw.chPublicScope ?? DEFAULT_PREFS.chPublicScope,
    chPublicCanton:
      raw.chPublicCanton === undefined
        ? DEFAULT_PREFS.chPublicCanton
        : raw.chPublicCanton,
    chSchoolCanton: raw.chSchoolCanton ?? DEFAULT_PREFS.chSchoolCanton,
    schoolVacationRegion: normalizeSchoolVacationRegion(
      raw.schoolVacationRegion,
    ),
    frSchoolZone: normalizeFrenchSchoolZone(raw.frSchoolZone),
    showPublicHolidays:
      raw.showPublicHolidays ?? DEFAULT_PREFS.showPublicHolidays,
    showSchoolVacations:
      raw.showSchoolVacations ?? DEFAULT_PREFS.showSchoolVacations,
    holidayFetchEnabled:
      raw.holidayFetchEnabled ?? DEFAULT_PREFS.holidayFetchEnabled,
    holidayCustomApiBaseUrl:
      raw.holidayCustomApiBaseUrl === undefined
        ? DEFAULT_PREFS.holidayCustomApiBaseUrl
        : raw.holidayCustomApiBaseUrl,
    blockCreateOnPublicHoliday:
      raw.blockCreateOnPublicHoliday ??
      DEFAULT_PREFS.blockCreateOnPublicHoliday,
    blockRangeDragIfIncludesPublicHoliday:
      raw.blockRangeDragIfIncludesPublicHoliday ??
      DEFAULT_PREFS.blockRangeDragIfIncludesPublicHoliday,
    blockDndDropOnPublicHoliday:
      raw.blockDndDropOnPublicHoliday ??
      DEFAULT_PREFS.blockDndDropOnPublicHoliday,
    blockCreateOnSchoolVacation:
      raw.blockCreateOnSchoolVacation ??
      DEFAULT_PREFS.blockCreateOnSchoolVacation,
    blockRangeDragIfIncludesSchoolVacation:
      raw.blockRangeDragIfIncludesSchoolVacation ??
      DEFAULT_PREFS.blockRangeDragIfIncludesSchoolVacation,
    blockDndDropOnSchoolVacation:
      raw.blockDndDropOnSchoolVacation ??
      DEFAULT_PREFS.blockDndDropOnSchoolVacation,
    experimentalEventDndEnabled:
      typeof raw.experimentalEventDndEnabled === "boolean"
        ? raw.experimentalEventDndEnabled
        : DEFAULT_PREFS.experimentalEventDndEnabled,
  };
}

function normalizeSchoolVacationRegion(
  raw: unknown,
): SchoolVacationRegion {
  return raw === "FR" ? "FR" : "CH";
}

function normalizeFrenchSchoolZone(raw: unknown): FrenchSchoolZone {
  const z = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (z === "FR-ZA" || z === "FR-ZB" || z === "FR-ZC") {
    return z as FrenchSchoolZone;
  }
  return DEFAULT_PREFS.frSchoolZone;
}

/** Hook React : retourne `[prefs, patch, reset]`. */
export function useCalendarPrefs(): [
  CalendarPrefs,
  (patch: Partial<CalendarPrefs>) => void,
  () => void,
] {
  const [prefs, setPrefs] = React.useState<CalendarPrefs>(loadPrefs);
  React.useEffect(() => {
    const sync = () => setPrefs(loadPrefs());
    window.addEventListener(CALENDAR_PREFS_CHANGED_EVENT, sync);
    return () =>
      window.removeEventListener(CALENDAR_PREFS_CHANGED_EVENT, sync);
  }, []);
  const patch = React.useCallback((p: Partial<CalendarPrefs>) => {
    setPrefs((prev) => {
      const next: CalendarPrefs = { ...prev, ...p };
      savePrefs(next);
      return next;
    });
  }, []);
  const reset = React.useCallback(() => {
    savePrefs(DEFAULT_PREFS);
    setPrefs(DEFAULT_PREFS);
  }, []);
  return [prefs, patch, reset];
}

/** Mise à jour ciblée du dictionnaire `defaultSources` (sans toucher au reste). */
export function patchDefaultSources(
  prefs: CalendarPrefs,
  source: CalendarSourceKey,
  enabled: boolean,
): CalendarPrefs {
  return {
    ...prefs,
    defaultSources: { ...prefs.defaultSources, [source]: enabled },
  };
}
