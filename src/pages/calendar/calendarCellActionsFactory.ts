import * as React from "react";
import { toast } from "sonner";
import type { NavigateFunction } from "react-router-dom";
import type { CalendarEvent } from "@/lib/calendarEvents";
import {
  firstHolidayBlockInRange,
  isoBlockedForHolidayCreate,
  type DayHolidayInfo,
} from "@/lib/calendarHolidays";
import type { CalendarCellActions } from "./CalendarCellMenu";
import {
  emptyDraft,
  type CalendarEventDraft,
  type CalendarEventModalMode,
} from "./CalendarEventModal";
import { isoInRange } from "./calendarMonths";
import type { CalendarPrefs } from "./calendarPrefs";
import type { RangeSelection } from "./useRangeSelection";
import type { CalendarEventActionsHandle } from "./useCalendarEventActions";

export type CalendarCellActionsFactoryArgs = {
  eventsByDay: Map<string, CalendarEvent[]>;
  draftRange: RangeSelection | null;
  draftValues: CalendarEventDraft | null;
  prefs: CalendarPrefs;
  holidayMap: Map<string, DayHolidayInfo>;
  clientFollowupEnabled: boolean;
  recoveryAssistedEnabled: boolean;
  navigate: NavigateFunction;
  openCreateNeutral: CalendarEventActionsHandle["openCreateNeutral"];
  setSelectedDay: (iso: string | null) => void;
  setEventModal: React.Dispatch<
    React.SetStateAction<{
      mode: CalendarEventModalMode;
      draft: CalendarEventDraft;
      fromRange: boolean;
    } | null>
  >;
};

export function buildCalendarCellActions(
  iso: string,
  a: CalendarCellActionsFactoryArgs,
): CalendarCellActions {
  const {
    eventsByDay,
    draftRange,
    draftValues,
    prefs,
    holidayMap,
    clientFollowupEnabled,
    recoveryAssistedEnabled,
    navigate,
    openCreateNeutral,
    setSelectedDay,
    setEventModal,
  } = a;

  return {
    clientFollowupEnabled,
    recoveryAssistedEnabled,
    hasEvents: (eventsByDay.get(iso) ?? []).length > 0,
    hasDraftSelection:
      draftRange != null && isoInRange(iso, draftRange.start, draftRange.end),
    onCreateEvent: () => {
      const b = isoBlockedForHolidayCreate(prefs, holidayMap, iso);
      if (b === "public") {
        toast.message("Création désactivée les jours fériés.");
        return;
      }
      if (b === "school") {
        toast.message(
          "Création désactivée pendant les vacances scolaires.",
        );
        return;
      }
      openCreateNeutral(iso);
    },
    onCreateEventFromDraft:
      draftRange && isoInRange(iso, draftRange.start, draftRange.end)
        ? () => {
            const block = firstHolidayBlockInRange(
              prefs,
              holidayMap,
              draftRange.start,
              draftRange.end,
            );
            if (block === "public") {
              toast.message(
                "La sélection recoupe un jour férié — création bloquée.",
              );
              return;
            }
            if (block === "school") {
              toast.message(
                "La sélection recoupe des vacances scolaires — création bloquée.",
              );
              return;
            }
            setEventModal({
              mode: "create",
              draft:
                draftValues ?? emptyDraft(draftRange.start, draftRange.end),
              fromRange: true,
            });
          }
        : undefined,
    onCreateReminder: () => navigate(`/home/client-followup`),
    onScheduleRecovery: () => navigate(`/home/recovery`),
    onOpenDay: () => setSelectedDay(iso),
  };
}

export function useCalendarCellActions(
  args: CalendarCellActionsFactoryArgs,
): (iso: string) => CalendarCellActions {
  return React.useCallback(
    (iso: string) => buildCalendarCellActions(iso, args),
    [
      args.eventsByDay,
      args.draftRange,
      args.draftValues,
      args.prefs,
      args.holidayMap,
      args.clientFollowupEnabled,
      args.recoveryAssistedEnabled,
      args.navigate,
      args.openCreateNeutral,
      args.setSelectedDay,
      args.setEventModal,
    ],
  );
}
