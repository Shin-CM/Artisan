import * as React from "react";
import { isoFromYearMonthDay } from "./calendarGrid";
import {
  currentMonthIndex,
  indexFromMonth,
  scrollTopForIndex,
  type MonthAnchor,
} from "./calendarMonths";
import { scrollToWeekContaining } from "./CalendarWeekStack";
import type { CalendarPrefs } from "./calendarPrefs";
import { weekRowHeightForDensity } from "./calendarPrefs";

export function useCalendarScrollNavigation({
  scrollRef,
  monthsAnchor,
  monthsBoundsMinIndex,
  monthVirtualHeight,
  weeksAnchorIso,
  prefs,
  today,
  cursor,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  monthsAnchor: MonthAnchor;
  monthsBoundsMinIndex: number;
  monthVirtualHeight: number;
  weeksAnchorIso: string;
  prefs: CalendarPrefs;
  today: string;
  cursor: MonthAnchor;
}) {
  const scrollToMonthIndex = React.useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const node = scrollRef.current;
      if (!node) return;
      const top = scrollTopForIndex(
        index,
        monthsBoundsMinIndex,
        monthVirtualHeight,
      );
      node.scrollTo({ top, behavior });
    },
    [monthsBoundsMinIndex, monthVirtualHeight, scrollRef],
  );

  const shiftMonth = React.useCallback(
    (delta: number) => {
      if (prefs.viewMode === "weeks") {
        const node = scrollRef.current;
        if (!node) return;
        const targetIso = isoFromYearMonthDay(
          cursor.year,
          cursor.month + delta,
          1,
        );
        scrollToWeekContaining(
          node,
          targetIso,
          weeksAnchorIso,
          prefs.weekStart,
          weekRowHeightForDensity(prefs.density),
        );
        return;
      }
      const targetIndex = indexFromMonth(cursor, monthsAnchor) + delta;
      scrollToMonthIndex(targetIndex);
    },
    [
      cursor,
      monthsAnchor,
      prefs.density,
      prefs.viewMode,
      prefs.weekStart,
      scrollRef,
      scrollToMonthIndex,
      weeksAnchorIso,
    ],
  );

  const jumpToday = React.useCallback(() => {
    if (prefs.viewMode === "weeks") {
      const node = scrollRef.current;
      if (!node) return;
      scrollToWeekContaining(
        node,
        today,
        weeksAnchorIso,
        prefs.weekStart,
        weekRowHeightForDensity(prefs.density),
      );
      return;
    }
    scrollToMonthIndex(currentMonthIndex(monthsAnchor));
  }, [
    monthsAnchor,
    prefs.density,
    prefs.viewMode,
    prefs.weekStart,
    scrollRef,
    scrollToMonthIndex,
    today,
    weeksAnchorIso,
  ]);

  return { scrollToMonthIndex, shiftMonth, jumpToday };
}
