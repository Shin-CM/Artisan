import * as React from "react";
import { toast } from "sonner";
import {
  getCalendarHolidayCache,
  syncOpenHolidays,
} from "@/lib/api";
import {
  buildHolidayDayMap,
  holidayCacheKey,
  holidayIpcArgs,
  parseHolidayCachePayload,
  type DayHolidayInfo,
} from "@/lib/calendarHolidays";
import type { CalendarPrefs } from "./calendarPrefs";

function formatHolidaySyncError(err: unknown): string {
  if (typeof err === "string" && err.trim()) return err.trim();
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }
  return "Synchronisation des jours fériés impossible.";
}

/**
 * Hook fériés / vacances :
 * - Calcule la fenêtre `cursorYear ± 2` années (agrégation côté app).
 * - Lit le cache SQLite (IPC `get_calendar_holiday_cache`) si présent.
 * - Tente une synchro best-effort OpenHolidays (IPC `sync_open_holidays`) si
 *   `prefs.holidayFetchEnabled` (le backend découpe les appels API par tranches
 *   d’années, limite OpenHolidays). Échec silencieux : les données embarquées
 *   restent disponibles via `buildHolidayDayMap`.
 * - Expose `holidayByIso` pour les grilles et `syncNow(force)` pour le bouton
 *   « Vérifier maintenant » (page Paramètres → Calendrier).
 */
export function useCalendarHolidayLayer(
  prefs: CalendarPrefs,
  cursorYear: number,
): {
  holidayByIso: Map<string, DayHolidayInfo>;
  busy: boolean;
  syncNow: (force: boolean) => Promise<void>;
} {
  const [apiBundle, setApiBundle] = React.useState<Record<
    string,
    unknown
  > | null>(null);
  const [busy, setBusy] = React.useState(false);

  const yearFrom = cursorYear - 2;
  const yearTo = cursorYear + 2;

  const holidayByIso = React.useMemo(
    () => buildHolidayDayMap(prefs, yearFrom, yearTo, apiBundle),
    [prefs, yearFrom, yearTo, apiBundle],
  );

  const syncNow = React.useCallback(
    async (force: boolean) => {
      const key = holidayCacheKey(prefs, yearFrom, yearTo);
      try {
        const raw = await getCalendarHolidayCache(key);
        const parsed = parseHolidayCachePayload(raw);
        if (parsed) setApiBundle(parsed);
      } catch {
        /* ignore */
      }
      if (!prefs.holidayFetchEnabled) {
        if (force) {
          toast.message(
            "Activez la mise à jour réseau pour synchroniser les jours fériés et les vacances scolaires.",
          );
        }
        return;
      }
      setBusy(true);
      try {
        const bundle = await syncOpenHolidays(
          holidayIpcArgs(prefs, yearFrom, yearTo, force),
        );
        if (bundle && typeof bundle === "object") {
          setApiBundle(bundle as Record<string, unknown>);
        }
      } catch (err) {
        if (force) {
          toast.error(formatHolidaySyncError(err));
        }
      } finally {
        setBusy(false);
      }
    },
    [prefs, yearFrom, yearTo],
  );

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const key = holidayCacheKey(prefs, yearFrom, yearTo);
      try {
        const raw = await getCalendarHolidayCache(key);
        if (cancelled) return;
        const parsed = parseHolidayCachePayload(raw);
        if (parsed) setApiBundle(parsed);
      } catch {
        /* ignore */
      }
      if (!prefs.holidayFetchEnabled || cancelled) return;
      try {
        const bundle = await syncOpenHolidays(
          holidayIpcArgs(prefs, yearFrom, yearTo, false),
        );
        if (cancelled) return;
        if (bundle && typeof bundle === "object") {
          setApiBundle(bundle as Record<string, unknown>);
        }
      } catch {
        /* best-effort : données embarquées toujours disponibles */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    prefs,
    prefs.holidayCountry,
    prefs.chPublicScope,
    prefs.chPublicCanton,
    prefs.chSchoolCanton,
    prefs.schoolVacationRegion,
    prefs.frSchoolZone,
    prefs.holidayCustomApiBaseUrl,
    prefs.holidayFetchEnabled,
    yearFrom,
    yearTo,
  ]);

  return { holidayByIso, busy, syncNow };
}
