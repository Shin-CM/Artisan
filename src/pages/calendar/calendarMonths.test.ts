import { describe, expect, it } from "vitest";
import {
  currentMonthIndex,
  defaultMonthBounds,
  estimateMonthVirtualHeightPx,
  indexFromMonth,
  isoInRange,
  monthFromIndex,
  monthsCount,
  normalizeIsoRange,
  scrollTopForIndex,
  visibleMonthIndex,
  windowIndices,
} from "./calendarMonths";

describe("calendarMonths", () => {
  const anchor = { year: 2026, month: 4 };

  it("monthFromIndex / indexFromMonth round-trip", () => {
    for (const delta of [-25, -1, 0, 1, 12, 36]) {
      const m = monthFromIndex(delta, anchor);
      expect(indexFromMonth(m, anchor)).toBe(delta);
    }
  });

  it("monthFromIndex traverse year boundaries", () => {
    expect(monthFromIndex(0, anchor)).toEqual({ year: 2026, month: 4 });
    expect(monthFromIndex(8, anchor)).toEqual({ year: 2027, month: 0 });
    expect(monthFromIndex(-5, anchor)).toEqual({ year: 2025, month: 11 });
    expect(monthFromIndex(-13, anchor)).toEqual({ year: 2025, month: 3 });
  });

  it("currentMonthIndex returns the offset for a given date", () => {
    expect(currentMonthIndex(anchor, new Date(2026, 4, 15))).toBe(0);
    expect(currentMonthIndex(anchor, new Date(2026, 5, 1))).toBe(1);
    expect(currentMonthIndex(anchor, new Date(2025, 4, 1))).toBe(-12);
  });

  it("defaultMonthBounds is symmetric around 0", () => {
    const { minIndex, maxIndex } = defaultMonthBounds(60);
    expect(minIndex).toBe(-60);
    expect(maxIndex).toBe(60);
    expect(monthsCount(minIndex, maxIndex)).toBe(121);
  });

  it("scrollTopForIndex translates index → px (top of month)", () => {
    expect(scrollTopForIndex(-60, -60, 760)).toBe(0);
    expect(scrollTopForIndex(0, -60, 760)).toBe(60 * 760);
    expect(scrollTopForIndex(-50, -60, 760)).toBe(10 * 760);
  });

  it("visibleMonthIndex returns the month at the center of the viewport", () => {
    const monthHeight = 760;
    // Aligned on the top of the anchor month: center is in the middle of month 0.
    expect(visibleMonthIndex(60 * monthHeight, 800, -60, monthHeight)).toBe(0);
    // Center crosses into the next month once scrolled half a month down.
    expect(
      visibleMonthIndex(60 * monthHeight + 400, 800, -60, monthHeight),
    ).toBe(1);
    // Aligned on the top of next month.
    expect(
      visibleMonthIndex(61 * monthHeight, 800, -60, monthHeight),
    ).toBe(1);
  });

  it("windowIndices includes overscan and clamps to bounds", () => {
    const monthHeight = 760;
    const { firstOffset, lastOffset } = windowIndices(
      0,
      800,
      -10,
      10,
      monthHeight,
      2,
    );
    expect(firstOffset).toBe(0);
    expect(lastOffset).toBe(0 + 1 + 2);
  });

  it("windowIndices clamps to last index near the bottom", () => {
    const monthHeight = 760;
    const totalIndices = 21;
    const totalPx = totalIndices * monthHeight;
    const { firstOffset, lastOffset } = windowIndices(
      totalPx - 800,
      800,
      -10,
      10,
      monthHeight,
      2,
    );
    expect(lastOffset).toBe(totalIndices - 1);
    expect(firstOffset).toBeGreaterThan(0);
  });

  it("normalizeIsoRange returns chronological order", () => {
    expect(normalizeIsoRange("2026-05-10", "2026-05-05")).toEqual([
      "2026-05-05",
      "2026-05-10",
    ]);
    expect(normalizeIsoRange("2026-05-05", "2026-05-10")).toEqual([
      "2026-05-05",
      "2026-05-10",
    ]);
    expect(normalizeIsoRange("2026-05-05", "2026-05-05")).toEqual([
      "2026-05-05",
      "2026-05-05",
    ]);
  });

  it("isoInRange covers inclusive bounds", () => {
    expect(isoInRange("2026-05-05", "2026-05-05", "2026-05-10")).toBe(true);
    expect(isoInRange("2026-05-10", "2026-05-05", "2026-05-10")).toBe(true);
    expect(isoInRange("2026-05-04", "2026-05-05", "2026-05-10")).toBe(false);
    expect(isoInRange("2026-05-11", "2026-05-05", "2026-05-10")).toBe(false);
  });

  it("estimateMonthVirtualHeightPx évite le chevauchement des mois (≥ hauteur réelle)", () => {
    // 6 × max(cell, plancher rangée chips + pistes multi-jours) + en-têtes + marge
    expect(estimateMonthVirtualHeightPx(96)).toBe(1224);
    expect(estimateMonthVirtualHeightPx(112)).toBe(1224);
    expect(estimateMonthVirtualHeightPx(144)).toBe(1224);
  });
});
