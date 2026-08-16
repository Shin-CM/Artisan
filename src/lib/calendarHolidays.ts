/**
 * Fusion des jours fériés publics et vacances scolaires (offline-first + OpenHolidays).
 * Données embarquées CH `src/data/ch-embed-holidays.json` ; vacances scolaires France
 * uniquement via API / cache (zones A/B/C).
 */

import embedRaw from "@/data/ch-embed-holidays.json";
import { dateFromIso, diffDaysIso, isoFromYearMonthDay } from "@/pages/calendar/calendarGrid";
import type { CalendarPrefs } from "@/pages/calendar/calendarPrefs";

export type DayHolidayInfo = {
  publicName?: string;
  school?: boolean;
  schoolName?: string;
};

type LocalizedText = { language: string; text: string };

type OhHoliday = {
  startDate: string;
  endDate: string;
  name?: LocalizedText[];
  type?: string;
};

type EmbedFile = {
  version: string;
  publicFixed: { date: string; name: string }[];
  schoolBlocksZH: { name: string; start: string; end: string }[];
};

const embed = embedRaw as EmbedFile;

/** Parse la charge utile SQLite (bundle JSON) pour fusion OpenHolidays. */
export function parseHolidayCachePayload(
  raw: string | null,
): Record<string, unknown> | null {
  if (raw == null || !String(raw).trim()) return null;
  try {
    const v = JSON.parse(String(raw)) as unknown;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      if ("public" in o && "school" in o) return o;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Subdivision OpenHolidays pour les vacances scolaires (CH-xx ou FR-Zx). */
export function effectiveSchoolSubdivision(prefs: CalendarPrefs): string {
  if (prefs.schoolVacationRegion === "FR") {
    const z = prefs.frSchoolZone?.trim().toUpperCase() || "FR-ZC";
    if (z.startsWith("FR-")) return z;
    return `FR-${z}`;
  }
  const sc = prefs.chSchoolCanton.trim();
  return sc.startsWith("CH-") ? sc : `CH-${sc}`;
}

/** Arguments alignés sur la commande Tauri `sync_open_holidays` (camelCase côté JS). */
export function holidayIpcArgs(
  prefs: CalendarPrefs,
  yearFrom: number,
  yearTo: number,
  force: boolean,
) {
  const publicSubdivision =
    prefs.chPublicScope === "federal"
      ? null
      : prefs.chPublicCanton?.trim()
        ? `CH-${prefs.chPublicCanton.trim()}`
        : null;
  const schoolSubdivision = effectiveSchoolSubdivision(prefs);
  return {
    countryIso: (prefs.holidayCountry || "CH").trim(),
    publicSubdivision,
    schoolSubdivision,
    yearFrom,
    yearTo,
    force,
    customBaseUrl: prefs.holidayCustomApiBaseUrl?.trim() || null,
  };
}

function pickLocalizedName(names: LocalizedText[] | undefined): string | undefined {
  if (!names?.length) return undefined;
  const fr = names.find((n) => n.language.toLowerCase() === "fr");
  return (fr ?? names[0]).text;
}

/** Toutes les dates ISO entre `start` et `end` inclus (ordre lexicographique = chronologique). */
export function expandIsoRangeInclusive(start: string, end: string): string[] {
  const [a, b] = start <= end ? [start, end] : [end, start];
  const out: string[] = [];
  let cur = a;
  while (cur <= b) {
    out.push(cur);
    const d = dateFromIso(cur);
    d.setDate(d.getDate() + 1);
    cur = isoFromYearMonthDay(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return out;
}

function mergeOhList(
  map: Map<string, DayHolidayInfo>,
  list: unknown,
  kind: "public" | "school",
) {
  if (!Array.isArray(list)) return;
  for (const row of list) {
    const h = row as OhHoliday;
    if (!h?.startDate || !h?.endDate) continue;
    const label = pickLocalizedName(h.name);
    const days = expandIsoRangeInclusive(h.startDate, h.endDate);
    for (const iso of days) {
      const prev = map.get(iso) ?? {};
      if (kind === "public") {
        map.set(iso, { ...prev, publicName: label ?? prev.publicName ?? "Férié" });
      } else {
        map.set(iso, {
          ...prev,
          school: true,
          schoolName: label ?? prev.schoolName ?? "Vacances scolaires",
        });
      }
    }
  }
}

/** Clé de cache alignée sur le backend Rust (`calendar_holidays.rs`). */
export function holidayCacheKey(
  prefs: CalendarPrefs,
  yearFrom: number,
  yearTo: number,
): string {
  const base = (prefs.holidayCustomApiBaseUrl ?? "").trim() || "https://openholidaysapi.org";
  const pub =
    prefs.chPublicScope === "federal"
      ? ""
      : (prefs.chPublicCanton ? `CH-${prefs.chPublicCanton}` : "");
  const school = effectiveSchoolSubdivision(prefs);
  return `OH|${base}|${prefs.holidayCountry}|pub:${pub}|school:${school}|${yearFrom}..${yearTo}`;
}

/**
 * Construit la carte jour → infos fériés / vacances pour `yearFrom`…`yearTo`.
 * `apiBundle` : objet `{ public, school, fetchedAt? }` issu du cache IPC ou `null`.
 */
export function buildHolidayDayMap(
  prefs: CalendarPrefs,
  yearFrom: number,
  yearTo: number,
  apiBundle: Record<string, unknown> | null,
): Map<string, DayHolidayInfo> {
  const map = new Map<string, DayHolidayInfo>();

  // Données complètes pour les restrictions ; l’affichage grille est filtré côté UI.
  for (const row of embed.publicFixed) {
    const y = Number.parseInt(row.date.slice(0, 4), 10);
    if (y >= yearFrom && y <= yearTo) {
      map.set(row.date, { ...map.get(row.date), publicName: row.name });
    }
  }

  const schoolCanton = prefs.chSchoolCanton.replace(/^CH-/, "");
  const useChZhEmbed =
    prefs.schoolVacationRegion === "CH" && schoolCanton === "ZH";
  if (useChZhEmbed) {
    for (const block of embed.schoolBlocksZH) {
      const ys = Number.parseInt(block.start.slice(0, 4), 10);
      const ye = Number.parseInt(block.end.slice(0, 4), 10);
      if (ye < yearFrom || ys > yearTo) continue;
      for (const iso of expandIsoRangeInclusive(block.start, block.end)) {
        const y = Number.parseInt(iso.slice(0, 4), 10);
        if (y < yearFrom || y > yearTo) continue;
        const prev = map.get(iso) ?? {};
        map.set(iso, {
          ...prev,
          school: true,
          schoolName: block.name,
        });
      }
    }
  }

  if (apiBundle && prefs.holidayCountry === "CH") {
    mergeOhList(map, apiBundle.public, "public");
  }

  if (apiBundle) {
    mergeOhList(map, apiBundle.school, "school");
  }

  return map;
}

export function isoInRangeInclusive(iso: string, start: string, end: string): boolean {
  const [a, b] = start <= end ? [start, end] : [end, start];
  return iso >= a && iso <= b;
}

/** Vérifie si la plage `[start,end]` intersecte un jour satisfaisant `pred`. */
export function rangeTouches(
  start: string,
  end: string,
  pred: (iso: string) => boolean,
): boolean {
  const [a, b] = start <= end ? [start, end] : [end, start];
  const n = diffDaysIso(a, b);
  for (let i = 0; i <= n; i++) {
    const d = dateFromIso(a);
    d.setDate(d.getDate() + i);
    const iso = isoFromYearMonthDay(d.getFullYear(), d.getMonth(), d.getDate());
    if (pred(iso)) return true;
  }
  return false;
}

export function isPublicHolidayDay(
  map: Map<string, DayHolidayInfo>,
  iso: string,
): boolean {
  return Boolean(map.get(iso)?.publicName);
}

export function isSchoolVacationDay(
  map: Map<string, DayHolidayInfo>,
  iso: string,
): boolean {
  return Boolean(map.get(iso)?.school);
}

/** Premier type de jour bloquant intersectant `[start,end]` pour une sélection de plage. */
export function firstHolidayBlockInRange(
  prefs: CalendarPrefs,
  map: Map<string, DayHolidayInfo>,
  start: string,
  end: string,
): "public" | "school" | null {
  if (prefs.blockRangeDragIfIncludesPublicHoliday) {
    if (rangeTouches(start, end, (iso) => isPublicHolidayDay(map, iso)))
      return "public";
  }
  if (prefs.blockRangeDragIfIncludesSchoolVacation) {
    if (rangeTouches(start, end, (iso) => isSchoolVacationDay(map, iso)))
      return "school";
  }
  return null;
}

export function isoBlockedForHolidayCreate(
  prefs: CalendarPrefs,
  map: Map<string, DayHolidayInfo>,
  iso: string,
): "public" | "school" | null {
  if (prefs.blockCreateOnPublicHoliday && isPublicHolidayDay(map, iso))
    return "public";
  if (prefs.blockCreateOnSchoolVacation && isSchoolVacationDay(map, iso))
    return "school";
  return null;
}

export function isoBlockedForHolidayDnd(
  prefs: CalendarPrefs,
  map: Map<string, DayHolidayInfo>,
  iso: string,
): "public" | "school" | null {
  if (prefs.blockDndDropOnPublicHoliday && isPublicHolidayDay(map, iso))
    return "public";
  if (prefs.blockDndDropOnSchoolVacation && isSchoolVacationDay(map, iso))
    return "school";
  return null;
}
