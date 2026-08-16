import { describe, expect, it } from "vitest";
import {
  buildMonthGrid,
  diffDaysIso,
  isoFromYearMonthDay,
  mondayIndex,
  nextTuesdayOnOrAfter,
  shiftIso,
} from "./calendarGrid";

describe("calendarGrid utilities", () => {
  describe("isoFromYearMonthDay", () => {
    it("pads month and day to 2 digits", () => {
      expect(isoFromYearMonthDay(2026, 0, 5)).toBe("2026-01-05");
      expect(isoFromYearMonthDay(2026, 11, 31)).toBe("2026-12-31");
    });
  });

  describe("mondayIndex", () => {
    it("returns 0 for Monday, 6 for Sunday", () => {
      // 2026-04-13 is a Monday.
      expect(mondayIndex(new Date(2026, 3, 13))).toBe(0);
      // 2026-04-19 is a Sunday.
      expect(mondayIndex(new Date(2026, 3, 19))).toBe(6);
    });
  });

  describe("buildMonthGrid", () => {
    it("returns 42 days starting on the Monday on or before the 1st (monday week)", () => {
      // April 2026 starts on a Wednesday => offset 2 days => grid starts 2026-03-30.
      const days = buildMonthGrid(2026, 3, "monday");
      expect(days).toHaveLength(42);
      expect(days[0]).toBe("2026-03-30");
      expect(days[41]).toBe("2026-05-10");
    });

    it("starts on the Sunday on or before the 1st when weekStart is sunday", () => {
      const days = buildMonthGrid(2026, 3, "sunday");
      expect(days).toHaveLength(42);
      expect(days[0]).toBe("2026-03-29");
      expect(days[41]).toBe("2026-05-09");
    });
  });

  describe("shiftIso", () => {
    it("shifts forward and backward, crossing month boundaries", () => {
      expect(shiftIso("2026-04-30", 1)).toBe("2026-05-01");
      expect(shiftIso("2026-04-01", -1)).toBe("2026-03-31");
    });
  });

  describe("diffDaysIso", () => {
    it("computes signed day delta", () => {
      expect(diffDaysIso("2026-04-10", "2026-04-12")).toBe(2);
      expect(diffDaysIso("2026-04-12", "2026-04-10")).toBe(-2);
      expect(diffDaysIso("2026-04-10", "2026-04-10")).toBe(0);
    });
  });

  describe("nextTuesdayOnOrAfter", () => {
    it("returns the same date when it is already a Tuesday", () => {
      // 2026-04-14 is a Tuesday.
      expect(nextTuesdayOnOrAfter("2026-04-14")).toBe("2026-04-14");
    });

    it("advances to the next Tuesday otherwise", () => {
      // Wednesday 2026-04-15 => next Tuesday is 2026-04-21.
      expect(nextTuesdayOnOrAfter("2026-04-15")).toBe("2026-04-21");
      // Sunday 2026-04-19 => next Tuesday is 2026-04-21.
      expect(nextTuesdayOnOrAfter("2026-04-19")).toBe("2026-04-21");
      // Monday 2026-04-20 => next Tuesday is 2026-04-21.
      expect(nextTuesdayOnOrAfter("2026-04-20")).toBe("2026-04-21");
    });
  });
});
