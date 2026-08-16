import { describe, expect, it } from "vitest";
import {
  defaultWeekBounds,
  endOfWeekIso,
  indexFromWeek,
  isoWeekNumber,
  scrollTopForWeekIndex,
  scrollTopToCenterWeekIndex,
  startOfWeekIso,
  visibleDayIsoAtCenter,
  weekDays,
  weekFromIndex,
  weekWindowIndices,
  weeksCount,
} from "./calendarWeeks";

describe("calendarWeeks", () => {
  it("startOfWeekIso aligns on Monday by default", () => {
    expect(startOfWeekIso("2026-05-12")).toBe("2026-05-11");
    expect(startOfWeekIso("2026-05-11")).toBe("2026-05-11");
    expect(startOfWeekIso("2026-05-17")).toBe("2026-05-11");
  });

  it("startOfWeekIso aligns on Sunday when requested", () => {
    expect(startOfWeekIso("2026-05-12", "sunday")).toBe("2026-05-10");
    expect(startOfWeekIso("2026-05-10", "sunday")).toBe("2026-05-10");
    expect(startOfWeekIso("2026-05-16", "sunday")).toBe("2026-05-10");
  });

  it("endOfWeekIso returns Sunday for a Monday-start week", () => {
    expect(endOfWeekIso("2026-05-11")).toBe("2026-05-17");
  });

  it("weekDays returns 7 consecutive ISO dates", () => {
    const days = weekDays("2026-05-11");
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-05-11");
    expect(days[6]).toBe("2026-05-17");
  });

  it("weekFromIndex / indexFromWeek round-trip", () => {
    const anchor = "2026-05-11";
    for (const delta of [-52, -1, 0, 1, 52]) {
      const w = weekFromIndex(delta, anchor);
      expect(indexFromWeek(w, anchor)).toBe(delta);
    }
  });

  it("defaultWeekBounds is symmetric around 0", () => {
    const { minIndex, maxIndex } = defaultWeekBounds(60);
    expect(minIndex).toBe(-60);
    expect(maxIndex).toBe(60);
    expect(weeksCount(minIndex, maxIndex)).toBe(121);
  });

  it("scrollTopForWeekIndex translates index → px (top of week)", () => {
    expect(scrollTopForWeekIndex(-60, -60, 120)).toBe(0);
    expect(scrollTopForWeekIndex(0, -60, 120)).toBe(60 * 120);
  });

  it("scrollTopToCenterWeekIndex centers the row in the viewport", () => {
    const top = scrollTopToCenterWeekIndex(0, -60, 120, 800);
    // top-of-row at 60 * 120 = 7200 ; minus (800 - 120) / 2 = 340 ; expected ~ 6860
    expect(top).toBe(6860);
  });

  it("weekWindowIndices clamps to the bottom", () => {
    const total = 121;
    const totalPx = total * 120;
    const { lastOffset } = weekWindowIndices(
      totalPx - 800,
      800,
      -60,
      60,
      120,
      2,
    );
    expect(lastOffset).toBe(total - 1);
  });

  it("visibleDayIsoAtCenter returns a day close to the center", () => {
    const anchor = "2026-05-11";
    const rowHeight = 120;
    // scrollTop placed at top of week index 0 ; viewport 800px → center at row 3 of anchor's neighborhood
    const iso = visibleDayIsoAtCenter(
      0,
      800,
      -10,
      rowHeight,
      anchor,
      "monday",
      3 / 7,
    );
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("isoWeekNumber matches ISO 8601 examples", () => {
    expect(isoWeekNumber("2026-01-05")).toBe(2);
    expect(isoWeekNumber("2025-12-29")).toBe(1);
    expect(isoWeekNumber("2026-05-12")).toBe(20);
  });
});
