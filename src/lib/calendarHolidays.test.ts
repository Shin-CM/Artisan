import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS } from "@/pages/calendar/calendarPrefs";
import {
  buildHolidayDayMap,
  effectiveSchoolSubdivision,
  expandIsoRangeInclusive,
  firstHolidayBlockInRange,
  isoBlockedForHolidayCreate,
  rangeTouches,
} from "./calendarHolidays";

describe("calendarHolidays", () => {
  it("effectiveSchoolSubdivision returns CH- or FR- prefix", () => {
    expect(
      effectiveSchoolSubdivision({
        ...DEFAULT_PREFS,
        schoolVacationRegion: "CH",
        chSchoolCanton: "VD",
      }),
    ).toBe("CH-VD");
    expect(
      effectiveSchoolSubdivision({
        ...DEFAULT_PREFS,
        schoolVacationRegion: "FR",
        frSchoolZone: "FR-ZA",
      }),
    ).toBe("FR-ZA");
  });

  it("expandIsoRangeInclusive returns consecutive ISO dates", () => {
    expect(expandIsoRangeInclusive("2026-05-10", "2026-05-12")).toEqual([
      "2026-05-10",
      "2026-05-11",
      "2026-05-12",
    ]);
    expect(expandIsoRangeInclusive("2026-05-12", "2026-05-10")).toEqual([
      "2026-05-10",
      "2026-05-11",
      "2026-05-12",
    ]);
  });

  it("rangeTouches detects intersection", () => {
    const pred = (iso: string) => iso === "2026-05-11";
    expect(rangeTouches("2026-05-10", "2026-05-12", pred)).toBe(true);
    expect(rangeTouches("2026-05-12", "2026-05-10", pred)).toBe(true);
    expect(rangeTouches("2026-05-09", "2026-05-10", pred)).toBe(false);
  });

  it("buildHolidayDayMap inclut les fériés même si affichage désactivé", () => {
    const map = buildHolidayDayMap(
      {
        ...DEFAULT_PREFS,
        showPublicHolidays: false,
        showSchoolVacations: false,
        chSchoolCanton: "ZH",
        schoolVacationRegion: "CH",
      },
      2026,
      2026,
      null,
    );
    expect(map.get("2026-08-01")?.publicName).toBeTruthy();
    expect(map.get("2026-04-10")?.school).toBe(true);
  });

  it("isoBlockedForHolidayCreate respecte les prefs indépendamment de l’affichage", () => {
    const map = buildHolidayDayMap(DEFAULT_PREFS, 2026, 2026, null);
    const prefs = {
      ...DEFAULT_PREFS,
      showPublicHolidays: false,
      blockCreateOnPublicHoliday: true,
    };
    expect(isoBlockedForHolidayCreate(prefs, map, "2026-08-01")).toBe("public");
    expect(isoBlockedForHolidayCreate(prefs, map, "2026-05-20")).toBe(null);
  });

  it("firstHolidayBlockInRange ne bloque que si l’option est activée", () => {
    const map = buildHolidayDayMap(DEFAULT_PREFS, 2026, 2026, null);
    expect(
      firstHolidayBlockInRange(
        { ...DEFAULT_PREFS, blockRangeDragIfIncludesPublicHoliday: false },
        map,
        "2026-08-01",
        "2026-08-03",
      ),
    ).toBe(null);
    expect(
      firstHolidayBlockInRange(
        { ...DEFAULT_PREFS, blockRangeDragIfIncludesPublicHoliday: true },
        map,
        "2026-08-01",
        "2026-08-03",
      ),
    ).toBe("public");
  });
});
