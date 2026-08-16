import type { MockHandler } from "@/lib/apiMock/handlerTypes";

/** Cache mémoire pour le mock navigateur (clé → payload brut). */
const mockHolidayCache = new Map<string, string>();

export const calendarHolidayHandlers: Record<string, MockHandler> = {
  get_calendar_holiday_cache: (args) => {
    const key = args.cacheKey as string;
    return mockHolidayCache.get(key) ?? null;
  },

  sync_open_holidays: (args) => {
    const countryIso = args.countryIso as string;
    const yearFrom = args.yearFrom as number;
    const yearTo = args.yearTo as number;
    const base =
      (args.customBaseUrl as string | null | undefined)?.trim() ||
      "https://openholidaysapi.org";
    const pub = (args.publicSubdivision as string | null | undefined) ?? "";
    const school = String(args.schoolSubdivision ?? "CH-ZH");
    const key = `OH|${base}|${countryIso}|pub:${pub}|school:${school}|${yearFrom}..${yearTo}`;
    const bundle = {
      public: [
        {
          startDate: "2026-01-01",
          endDate: "2026-01-01",
          name: [{ language: "fr", text: "Nouvel An (mock)" }],
        },
        {
          startDate: "2026-12-25",
          endDate: "2026-12-25",
          name: [{ language: "fr", text: "Noël (mock)" }],
        },
      ],
      school: [
        {
          startDate: "2026-04-03",
          endDate: "2026-04-17",
          name: [{ language: "fr", text: "Vacances de printemps (mock)" }],
        },
      ],
      fetchedAt: new Date().toISOString(),
      skipped: false,
      cacheKey: key,
    };
    const json = JSON.stringify(bundle);
    mockHolidayCache.set(key, json);
    return bundle;
  },
};
