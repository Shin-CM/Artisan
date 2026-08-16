import * as React from "react";
import { cn } from "@/lib/utils";
import { type CalendarEvent } from "@/lib/calendarEvents";
import type { DayHolidayInfo } from "@/lib/calendarHolidays";
import {
  buildMonthGrid,
  formatMonthLabel,
} from "./calendarGrid";
import { layoutMultiDayEvents } from "./calendarLayout";
import { MONTH_GRID_MAX_VISIBLE_LANES } from "./calendarMonthGridMetrics";
import {
  CalendarWeekRow,
  type WeekRowOptions,
  type WeekRowSelection,
} from "./CalendarWeekRow";
import type { CalendarCellActions } from "./CalendarCellMenu";
import type { CalendarEventActions } from "./CalendarEventMenu";
import {
  isoWeekNumber,
  weekdayHeaders,
} from "./calendarWeeks";
import { cellHeightForDensity, type CalendarPrefs } from "./calendarPrefs";

export type MonthCursor = { year: number; month: number };

const MAX_VISIBLE_LANES = MONTH_GRID_MAX_VISIBLE_LANES;

export function CalendarMonthGrid({
  cursor,
  today,
  events,
  eventsByDay,
  prefs,
  holidayByIso,
  cellActions,
  eventActions,
  selection,
  dndCellPreview,
  onCellPointerDown,
  onOpenDay,
  onOpenEvent,
}: {
  cursor: MonthCursor;
  today: string;
  events: CalendarEvent[];
  eventsByDay: Map<string, CalendarEvent[]>;
  prefs: CalendarPrefs;
  holidayByIso: Map<string, DayHolidayInfo>;
  cellActions: (iso: string) => CalendarCellActions;
  eventActions: CalendarEventActions;
  selection: WeekRowSelection;
  /** Plage de jours à surligner en pointillés pendant un DnD (aperçu cible). */
  dndCellPreview?: { start: string; end: string } | null;
  onCellPointerDown: (e: React.PointerEvent<HTMLElement>, iso: string) => void;
  onOpenDay: (iso: string) => void;
  onOpenEvent: (event: CalendarEvent) => void;
}) {
  const monthDays = React.useMemo(
    () => buildMonthGrid(cursor.year, cursor.month, prefs.weekStart),
    [cursor.year, cursor.month, prefs.weekStart],
  );
  const monthLabel = React.useMemo(
    () => formatMonthLabel(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  const layout = React.useMemo(
    () => layoutMultiDayEvents(events, monthDays, MAX_VISIBLE_LANES),
    [events, monthDays],
  );

  const weeks = React.useMemo(() => {
    const out: string[][] = [];
    for (let w = 0; w < 6; w++) {
      out.push(monthDays.slice(w * 7, w * 7 + 7));
    }
    return out;
  }, [monthDays]);

  const cellHeight = cellHeightForDensity(prefs.density);
  const headers = weekdayHeaders(prefs.weekStart);

  return (
    <section
      className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
      aria-label={monthLabel}
    >
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card)]/95 px-3 py-1.5 backdrop-blur pointer-events-none">
        <div className="text-sm font-semibold tabular-nums">{monthLabel}</div>
      </div>

      <div
        className="grid border-b border-[var(--color-border)] bg-[var(--color-muted)]/30 text-xs font-medium text-[var(--color-muted-foreground)] pointer-events-none"
        style={{
          gridTemplateColumns: prefs.showWeekNumbers
            ? "36px repeat(7, 1fr)"
            : "repeat(7, 1fr)",
        }}
      >
        {prefs.showWeekNumbers ? (
          <div className="px-1 py-1 text-center">S</div>
        ) : null}
        {headers.map((w) => (
          <div key={w} className="px-2 py-1 text-center">
            {w}
          </div>
        ))}
      </div>

      <div className="flex flex-col">
        {weeks.map((weekDays, weekIndex) => {
          const weekLanes = {
            segments: (layout.segmentsByWeek[weekIndex] ?? []).map((s) => ({
              laneIndex: s.laneIndex,
              colStart: s.colStart,
              colEnd: s.colEnd,
              roundLeft: s.roundLeft,
              roundRight: s.roundRight,
              event: s.event,
            })),
            multiDayEventIds: layout.multiDayEventIds,
            overflowByDay: layout.overflowByDay,
          };
          const options: WeekRowOptions = {
            currentMonth: cursor.month,
            prefs,
            today,
            cellHeightPx: cellHeight,
            holidayByIso,
          };
          return (
            <div
              key={weekIndex}
              className="grid"
              style={{
                gridTemplateColumns: prefs.showWeekNumbers ? "36px 1fr" : "1fr",
              }}
            >
              {prefs.showWeekNumbers ? (
                <div className="flex items-start justify-center border-b border-r border-[var(--color-border)] bg-[var(--color-muted)]/20 pt-1 text-[10px] tabular-nums text-[var(--color-muted-foreground)]">
                  {isoWeekNumber(weekDays[0])}
                </div>
              ) : null}
              <div className={cn("min-h-0")}>
                <CalendarWeekRow
                  weekDays={weekDays}
                  eventsByDay={eventsByDay}
                  lanes={weekLanes}
                  selection={selection}
                  dndCellPreview={dndCellPreview ?? null}
                  options={options}
                  cellActions={cellActions}
                  eventActions={eventActions}
                  onCellPointerDown={onCellPointerDown}
                  onOpenDay={onOpenDay}
                  onOpenEvent={onOpenEvent}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
