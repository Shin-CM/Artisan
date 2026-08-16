import * as React from "react";
import type { CalendarEvent } from "@/lib/calendarEvents";
import { dateFromIso, isoFromYearMonthDay } from "./calendarGrid";
import { indexFromMonth, type MonthAnchor } from "./calendarMonths";
import { scrollToWeekContaining } from "./CalendarWeekStack";
import type { CalendarPrefs } from "./calendarPrefs";
import { weekRowHeightForDensity } from "./calendarPrefs";
import type { CalendarEventActionsHandle } from "./useCalendarEventActions";

export type UseCalendarSidePanelListsArgs = {
  visibleEvents: CalendarEvent[];
  today: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  setSelectedDay: (iso: string | null) => void;
  setCursor: (cursor: MonthAnchor) => void;
  prefs: CalendarPrefs;
  monthsAnchor: MonthAnchor;
  weeksAnchorIso: string;
  scrollToMonthIndex: (index: number, behavior?: ScrollBehavior) => void;
  actions: CalendarEventActionsHandle;
};

/**
 * Fenêtres 30 j passés / 30 j à venir pour le panneau latéral, plus navigation
 * grille + édition (évite d’alourdir `CalendarPage.tsx`).
 */
export function useCalendarSidePanelLists({
  visibleEvents,
  today,
  scrollRef,
  setSelectedDay,
  setCursor,
  prefs,
  monthsAnchor,
  weeksAnchorIso,
  scrollToMonthIndex,
  actions,
}: UseCalendarSidePanelListsArgs) {
  const pastEvents = React.useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const startIso = isoFromYearMonthDay(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    return visibleEvents
      .filter((e) => e.date < today && e.date >= startIso)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 40);
  }, [visibleEvents, today]);

  const upcomingEvents = React.useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() + 30);
    const endIso = isoFromYearMonthDay(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
    );
    return visibleEvents
      .filter((e) => e.date >= today && e.date <= endIso)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 40);
  }, [visibleEvents, today]);

  const focusEventInCalendar = React.useCallback(
    (e: CalendarEvent) => {
      setSelectedDay(null);
      const iso = e.date;
      const d = dateFromIso(iso);
      setCursor({ year: d.getFullYear(), month: d.getMonth() });
      const node = scrollRef.current;
      if (!node) return;
      const rowHeight = weekRowHeightForDensity(prefs.density);
      if (prefs.viewMode === "weeks") {
        scrollToWeekContaining(
          node,
          iso,
          weeksAnchorIso,
          prefs.weekStart,
          rowHeight,
          "smooth",
        );
      } else {
        const idx = indexFromMonth(
          { year: d.getFullYear(), month: d.getMonth() },
          monthsAnchor,
        );
        scrollToMonthIndex(idx, "smooth");
      }
    },
    [
      monthsAnchor,
      prefs.density,
      prefs.viewMode,
      prefs.weekStart,
      scrollRef,
      scrollToMonthIndex,
      setCursor,
      setSelectedDay,
      weeksAnchorIso,
    ],
  );

  const handleSidePanelEditEvent = React.useCallback(
    (e: CalendarEvent) => {
      if (e.source === "neutral" && e.entityId) {
        actions.editNeutral(e);
        return;
      }
      actions.openEvent(e);
    },
    [actions],
  );

  return {
    pastEvents,
    upcomingEvents,
    focusEventInCalendar,
    handleSidePanelEditEvent,
  };
}
