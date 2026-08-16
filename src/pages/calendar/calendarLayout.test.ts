import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/lib/calendarEvents";
import { buildMonthGrid } from "./calendarGrid";
import { layoutMultiDayEvents } from "./calendarLayout";

function neutral(
  id: string,
  date: string,
  endDate: string,
): CalendarEvent {
  return {
    id,
    source: "neutral",
    date,
    endDate,
    title: id,
    subtitle: null,
    navigatePath: `/calendar?event=${id}`,
  };
}

describe("layoutMultiDayEvents", () => {
  it("returns empty layout for a non-42 grid", () => {
    const r = layoutMultiDayEvents([], ["2026-04-01"], 3);
    expect(r.segmentsByWeek.every((w) => w.length === 0)).toBe(true);
    expect(r.totalLanes).toBe(0);
  });

  it("ignores single-day events (date == endDate)", () => {
    const days = buildMonthGrid(2026, 3);
    const r = layoutMultiDayEvents(
      [neutral("a", "2026-04-10", "2026-04-10")],
      days,
    );
    expect(r.multiDayEventIds.has("a")).toBe(false);
    expect(r.segmentsByWeek.every((w) => w.length === 0)).toBe(true);
  });

  it("splits a multi-week event into one segment per week", () => {
    const days = buildMonthGrid(2026, 3);
    const r = layoutMultiDayEvents(
      [neutral("a", "2026-04-08", "2026-04-20")],
      days,
    );
    expect(r.multiDayEventIds.has("a")).toBe(true);
    const segs = r.segmentsByWeek.flat().filter((s) => s.event.id === "a");
    expect(segs.length).toBeGreaterThanOrEqual(2);
    expect(segs.length).toBe(3);
    expect(segs[0].roundLeft).toBe(true);
    expect(segs[0].roundRight).toBe(false);
    expect(segs[segs.length - 1].roundLeft).toBe(false);
    expect(segs[segs.length - 1].roundRight).toBe(true);
  });

  it("assigns separate lanes when events overlap", () => {
    const days = buildMonthGrid(2026, 3);
    const r = layoutMultiDayEvents(
      [
        neutral("a", "2026-04-07", "2026-04-09"),
        neutral("b", "2026-04-08", "2026-04-10"),
      ],
      days,
    );
    const lanesA = r.segmentsByWeek
      .flat()
      .filter((s) => s.event.id === "a")
      .map((s) => s.laneIndex);
    const lanesB = r.segmentsByWeek
      .flat()
      .filter((s) => s.event.id === "b")
      .map((s) => s.laneIndex);
    expect(lanesA[0]).toBe(0);
    expect(lanesB[0]).toBe(1);
  });

  it("reuses lane 0 when events do not overlap", () => {
    const days = buildMonthGrid(2026, 3);
    const r = layoutMultiDayEvents(
      [
        neutral("a", "2026-04-07", "2026-04-09"),
        neutral("b", "2026-04-15", "2026-04-17"),
      ],
      days,
    );
    const lanesA = r.segmentsByWeek
      .flat()
      .filter((s) => s.event.id === "a")
      .map((s) => s.laneIndex);
    const lanesB = r.segmentsByWeek
      .flat()
      .filter((s) => s.event.id === "b")
      .map((s) => s.laneIndex);
    expect(lanesA[0]).toBe(0);
    expect(lanesB[0]).toBe(0);
  });

  it("counts overflow when events exceed maxLanes", () => {
    const days = buildMonthGrid(2026, 3);
    const r = layoutMultiDayEvents(
      [
        neutral("a", "2026-04-07", "2026-04-09"),
        neutral("b", "2026-04-07", "2026-04-09"),
        neutral("c", "2026-04-07", "2026-04-09"),
        neutral("d", "2026-04-07", "2026-04-09"),
      ],
      days,
      3,
    );
    const overflowOn7 = r.overflowByDay.get("2026-04-07") ?? 0;
    expect(overflowOn7).toBe(1);
    expect(r.totalLanes).toBe(4);
  });
});
