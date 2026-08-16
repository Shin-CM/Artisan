import { describe, expect, it } from "vitest";
import type { CalendarEvent } from "@/lib/calendarEvents";
import { layoutWeekLanes } from "./calendarWeekLayout";

function evt(
  id: string,
  start: string,
  end: string,
  overrides: Partial<CalendarEvent> = {},
): CalendarEvent {
  return {
    id,
    source: "neutral",
    title: id,
    date: start,
    endDate: end,
    editable: true,
    entityId: id,
    navigatePath: "/calendar",
    ...overrides,
  } as CalendarEvent;
}

const week = [
  "2026-05-11",
  "2026-05-12",
  "2026-05-13",
  "2026-05-14",
  "2026-05-15",
  "2026-05-16",
  "2026-05-17",
];

describe("layoutWeekLanes", () => {
  it("ignores single-day events", () => {
    const r = layoutWeekLanes([evt("a", "2026-05-12", "2026-05-12")], week);
    expect(r.segments).toHaveLength(0);
    expect(r.multiDayEventIds.size).toBe(0);
  });

  it("emits a segment for a multi-day event inside the week", () => {
    const r = layoutWeekLanes([evt("a", "2026-05-12", "2026-05-15")], week);
    expect(r.segments).toHaveLength(1);
    expect(r.segments[0].colStart).toBe(1);
    expect(r.segments[0].colEnd).toBe(4);
    expect(r.segments[0].roundLeft).toBe(true);
    expect(r.segments[0].roundRight).toBe(true);
  });

  it("clips a multi-day event starting before the week", () => {
    const r = layoutWeekLanes([evt("a", "2026-05-08", "2026-05-13")], week);
    expect(r.segments).toHaveLength(1);
    expect(r.segments[0].colStart).toBe(0);
    expect(r.segments[0].colEnd).toBe(2);
    expect(r.segments[0].roundLeft).toBe(false);
    expect(r.segments[0].roundRight).toBe(true);
  });

  it("places overlapping events on different lanes", () => {
    const r = layoutWeekLanes(
      [
        evt("a", "2026-05-12", "2026-05-15"),
        evt("b", "2026-05-13", "2026-05-16"),
      ],
      week,
    );
    expect(r.segments).toHaveLength(2);
    expect(r.segments[0].laneIndex).toBe(0);
    expect(r.segments[1].laneIndex).toBe(1);
  });

  it("counts overflow when exceeding maxLanes", () => {
    const r = layoutWeekLanes(
      [
        evt("a", "2026-05-12", "2026-05-16"),
        evt("b", "2026-05-12", "2026-05-16"),
        evt("c", "2026-05-12", "2026-05-16"),
        evt("d", "2026-05-12", "2026-05-16"),
      ],
      week,
      3,
    );
    expect(r.segments).toHaveLength(3);
    expect(r.overflowByDay.get("2026-05-12")).toBe(1);
    expect(r.overflowByDay.get("2026-05-16")).toBe(1);
  });
});
