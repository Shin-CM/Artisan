import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DndContext, pointerWithin } from "@dnd-kit/core";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import {
  loadCalendarEvents,
  type CalendarEvent,
  type CalendarEventSource,
} from "@/lib/calendarEvents";
import {
  firstHolidayBlockInRange,
} from "@/lib/calendarHolidays";
import { useCalendarCellActions } from "./calendarCellActionsFactory";
import { CalendarFilterChips } from "./CalendarFilterChips";
import { CalendarMonthGrid } from "./CalendarMonthGrid";
import { CalendarPageHeader } from "./CalendarPageHeader";
import { CalendarSidePanel } from "./CalendarSidePanel";
import { CalendarDayDetailModal } from "./CalendarDayDetailModal";
import {
  CalendarEventModal,
  emptyDraft,
  type CalendarEventDraft,
  type CalendarEventModalMode,
} from "./CalendarEventModal";
import { CalendarVirtualStack } from "./CalendarVirtualStack";
import { CalendarWeekStack } from "./CalendarWeekStack";
import { CalendarWeekRow } from "./CalendarWeekRow";
import { layoutWeekLanes } from "./calendarWeekLayout";
import {
  dateFromIso,
  formatMonthLabel,
  isoFromYearMonthDay,
  todayIso,
} from "./calendarGrid";
import {
  currentMonthIndex,
  defaultMonthBounds,
  estimateMonthVirtualHeightPx,
  isoInRange,
  type MonthAnchor,
} from "./calendarMonths";
import {
  startOfWeekIso,
} from "./calendarWeeks";
import {
  cellHeightForDensity,
  useCalendarPrefs,
  weekRowHeightForDensity,
} from "./calendarPrefs";
import {
  useRangeSelection,
  type RangeSelection,
} from "./useRangeSelection";
import { useCalendarEventActions } from "./useCalendarEventActions";
import { useCalendarEventDnD } from "./useCalendarEventDnD";
import { useCalendarScrollNavigation } from "./useCalendarScrollNavigation";
import { useCalendarSidePanelLists } from "./useCalendarSidePanelLists";
import { useCalendarHolidayLayer } from "./useCalendarHolidayLayer";
import { CalendarDragPreview } from "./CalendarDragPreview";

function CalendarPageInner() {
  const { active } = useWorkspace();
  const {
    clientFollowupEnabled,
    projectsEnabled,
    recoveryAssistedEnabled,
    loading: modulesLoading,
  } = useDocumentModules();
  const navigate = useNavigate();
  const [prefs, patchPrefs, resetPrefs] = useCalendarPrefs();

  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [enabledSources, setEnabledSources] = React.useState<
    Record<CalendarEventSource, boolean>
  >(() => ({ ...prefs.defaultSources }));
  // Sync `enabledSources` quand `prefs.defaultSources` change (réglages temps réel).
  React.useEffect(() => {
    setEnabledSources({ ...prefs.defaultSources });
  }, [prefs.defaultSources]);
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);
  const [eventModal, setEventModal] = React.useState<{
    mode: CalendarEventModalMode;
    draft: CalendarEventDraft;
    fromRange: boolean;
  } | null>(null);
  const [draftRange, setDraftRange] = React.useState<RangeSelection | null>(
    null,
  );
  const [draftValues, setDraftValues] =
    React.useState<CalendarEventDraft | null>(null);
  const [sideTab, setSideTab] =
    React.useState<"events" | "settings">("events");

  const today = React.useMemo(todayIso, []);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Ancre figée au montage selon la vue.
  const monthsAnchor = React.useMemo<MonthAnchor>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, []);
  const monthsBounds = React.useMemo(() => defaultMonthBounds(), []);
  const monthsInitialIndex = React.useMemo(
    () => currentMonthIndex(monthsAnchor),
    [monthsAnchor],
  );
  const weeksAnchorIso = React.useMemo(
    () => startOfWeekIso(today, prefs.weekStart),
    [today, prefs.weekStart],
  );

  const monthVirtualHeight = React.useMemo(
    () => estimateMonthVirtualHeightPx(cellHeightForDensity(prefs.density)),
    [prefs.density],
  );

  // Cursor = mois affiché dans le libellé d'en-tête.
  const [cursor, setCursor] = React.useState<MonthAnchor>(monthsAnchor);

  const { scrollToMonthIndex, shiftMonth, jumpToday } =
    useCalendarScrollNavigation({
      scrollRef,
      monthsAnchor,
      monthsBoundsMinIndex: monthsBounds.minIndex,
      monthVirtualHeight,
      weeksAnchorIso,
      prefs,
      today,
      cursor,
    });

  // === Chargement des événements ======================================

  const load = React.useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const list = await loadCalendarEvents(active.id, {
        includeReminders: clientFollowupEnabled,
        includeProjects: projectsEnabled,
        includeInvoiceDue: true,
        includeOverdue: recoveryAssistedEnabled,
        includeQuoteValidity: true,
        includeNeutral: true,
        includeRecoveryActions: recoveryAssistedEnabled,
      });
      setEvents(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [active, clientFollowupEnabled, projectsEnabled, recoveryAssistedEnabled]);

  React.useEffect(() => {
    if (modulesLoading) return;
    void load();
  }, [load, modulesLoading]);

  const visibleEvents = React.useMemo(
    () => events.filter((e) => enabledSources[e.source]),
    [events, enabledSources],
  );
  const visibleEventsRef = React.useRef(visibleEvents);
  visibleEventsRef.current = visibleEvents;

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of visibleEvents) {
      if (e.endDate === e.date) {
        const arr = map.get(e.date);
        if (arr) arr.push(e);
        else map.set(e.date, [e]);
        continue;
      }
      const start = dateFromIso(e.date);
      const end = dateFromIso(e.endDate);
      const cur = new Date(start);
      while (cur.getTime() <= end.getTime()) {
        const iso = isoFromYearMonthDay(
          cur.getFullYear(),
          cur.getMonth(),
          cur.getDate(),
        );
        const arr = map.get(iso);
        if (arr) arr.push(e);
        else map.set(iso, [e]);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [visibleEvents]);

  const { holidayByIso: holidayMap } = useCalendarHolidayLayer(
    prefs,
    cursor.year,
  );

  function toggleSource(source: CalendarEventSource) {
    setEnabledSources((prev) => ({ ...prev, [source]: !prev[source] }));
  }

  // === Actions d'événements (extracted) ===============================

  const clearDraft = React.useCallback(() => {
    setDraftRange(null);
    setDraftValues(null);
  }, []);

  const actions = useCalendarEventActions({
    today,
    navigate,
    reload: () => void load(),
    onOpenModal: setEventModal,
    onClearDay: () => setSelectedDay(null),
  });

  const {
    pastEvents,
    upcomingEvents,
    focusEventInCalendar,
    handleSidePanelEditEvent,
  } = useCalendarSidePanelLists({
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
  });

  // === Sélection de plage (drag multi-jours) ===========================

  const handleRangeCommit = React.useCallback(
    (range: RangeSelection) => {
      const block = firstHolidayBlockInRange(
        prefs,
        holidayMap,
        range.start,
        range.end,
      );
      if (block === "public") {
        toast.message(
          "La sélection recoupe un jour férié — création d’événement bloquée.",
        );
        return;
      }
      if (block === "school") {
        toast.message(
          "La sélection recoupe des vacances scolaires — création bloquée.",
        );
        return;
      }
      setDraftRange(range);
      const fresh = emptyDraft(range.start, range.end);
      setDraftValues(fresh);
      setEventModal({ mode: "create", draft: fresh, fromRange: true });
    },
    [prefs, holidayMap],
  );

  const { liveRange, onCellPointerDown } = useRangeSelection({
    scrollRef,
    onCommit: handleRangeCommit,
  });

  React.useEffect(() => {
    if (!draftRange || eventModal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") clearDraft();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draftRange, eventModal, clearDraft]);

  const handleOpenDay = React.useCallback(
    (iso: string) => {
      if (draftRange && isoInRange(iso, draftRange.start, draftRange.end)) {
        const block = firstHolidayBlockInRange(
          prefs,
          holidayMap,
          draftRange.start,
          draftRange.end,
        );
        if (block === "public") {
          toast.message(
            "La sélection recoupe un jour férié — création d’événement bloquée.",
          );
          return;
        }
        if (block === "school") {
          toast.message(
            "La sélection recoupe des vacances scolaires — création bloquée.",
          );
          return;
        }
        const draft =
          draftValues ?? emptyDraft(draftRange.start, draftRange.end);
        setEventModal({ mode: "create", draft, fromRange: true });
        return;
      }
      if (draftRange) clearDraft();
      if ((eventsByDay.get(iso) ?? []).length > 0) setSelectedDay(iso);
    },
    [clearDraft, draftRange, draftValues, eventsByDay, prefs, holidayMap],
  );

  // === Actions cellules / événements ==================================

  const cellActions = useCalendarCellActions({
    eventsByDay,
    draftRange,
    draftValues,
    prefs,
    holidayMap,
    clientFollowupEnabled,
    recoveryAssistedEnabled,
    navigate,
    openCreateNeutral: actions.openCreateNeutral,
    setSelectedDay,
    setEventModal,
  });

  const eventActions = React.useMemo(
    () => ({
      onOpen: actions.openEvent,
      onEditNeutral: actions.editNeutral,
      onDeleteNeutral: actions.deleteNeutral,
      onShiftEvent: actions.shiftEvent,
      onMarkReminderDone: actions.markReminderDone,
      onDeleteReminder: actions.deleteReminder,
    }),
    [actions],
  );

  const {
    sensors,
    activeDragEvent,
    dndCellPreview,
    dragOverlayClient,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  } = useCalendarEventDnD({
    scrollRef,
    visibleEventsRef,
    prefs,
    holidayMap,
    shiftEvent: actions.shiftEvent,
  });

  const availableSources = React.useMemo<CalendarEventSource[]>(() => {
    const list: CalendarEventSource[] = [
      "neutral",
      "invoice-due",
      "quote-validity",
    ];
    if (clientFollowupEnabled) list.unshift("reminder");
    if (recoveryAssistedEnabled) {
      list.push("invoice-overdue");
      list.push("recovery-scheduled");
    }
    if (projectsEnabled) {
      list.push("project-start");
      list.push("project-end");
    }
    return list;
  }, [clientFollowupEnabled, projectsEnabled, recoveryAssistedEnabled]);

  const selectionState = React.useMemo(
    () => ({
      liveStart: liveRange?.start ?? null,
      liveEnd: liveRange?.end ?? null,
      draftStart: draftRange?.start ?? null,
      draftEnd: draftRange?.end ?? null,
    }),
    [liveRange, draftRange],
  );

  // Mise à jour du libellé d'en-tête au scroll (vue weeks → centre du viewport).
  const handleCenterDayChange = React.useCallback((iso: string) => {
    const d = dateFromIso(iso);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }, []);

  if (!active) return null;

  const selectedDayEvents = selectedDay
    ? eventsByDay.get(selectedDay) ?? []
    : [];
  const monthLabel = formatMonthLabel(cursor.year, cursor.month);
  const cellHeight = cellHeightForDensity(prefs.density);
  const rowHeight = weekRowHeightForDensity(prefs.density);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4">
      <CalendarPageHeader
        monthLabel={monthLabel}
        loading={loading}
        clientFollowupEnabled={clientFollowupEnabled}
        recoveryAssistedEnabled={recoveryAssistedEnabled}
        onShiftMonth={shiftMonth}
        onJumpToday={jumpToday}
        onOpenSettings={() => setSideTab("settings")}
        onRefresh={() => void load()}
        onNewNeutral={() => actions.openCreateNeutral()}
        onNavigateFollowup={() => navigate("/home/client-followup")}
        onNavigateRecovery={() => navigate("/home/recovery")}
      />

      <CalendarFilterChips
        sources={availableSources}
        enabled={enabledSources}
        onToggle={toggleSource}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]">
            {prefs.viewMode === "weeks" ? (
              <CalendarWeekStack
                anchorWeekStartIso={weeksAnchorIso}
                weekStart={prefs.weekStart}
                rowHeight={rowHeight}
                initialIndex={0}
                scrollRef={scrollRef}
                showWeekNumbers={prefs.showWeekNumbers}
                onCenterDayChange={handleCenterDayChange}
                renderWeek={({ index, days }) => {
                  const lanes = layoutWeekLanes(visibleEvents, days, 3);
                  return (
                    <CalendarWeekRow
                      key={index}
                      weekDays={days}
                      eventsByDay={eventsByDay}
                      lanes={lanes}
                      selection={selectionState}
                      dndCellPreview={
                        prefs.experimentalEventDndEnabled
                          ? dndCellPreview
                          : null
                      }
                      options={{
                        currentMonth: null,
                        prefs,
                        today,
                        cellHeightPx: cellHeight,
                        holidayByIso: holidayMap,
                      }}
                      cellActions={cellActions}
                      eventActions={eventActions}
                      onCellPointerDown={onCellPointerDown}
                      onOpenDay={handleOpenDay}
                      onOpenEvent={actions.openEvent}
                    />
                  );
                }}
              />
            ) : (
              <CalendarVirtualStack
                anchor={monthsAnchor}
                minIndex={monthsBounds.minIndex}
                maxIndex={monthsBounds.maxIndex}
                initialIndex={monthsInitialIndex}
                monthHeight={monthVirtualHeight}
                scrollRef={scrollRef}
                onCursorChange={setCursor}
                renderMonth={({ index, year, month }) => (
                  <CalendarMonthGrid
                    key={index}
                    cursor={{ year, month }}
                    today={today}
                    events={visibleEvents}
                    eventsByDay={eventsByDay}
                    prefs={prefs}
                    holidayByIso={holidayMap}
                    cellActions={cellActions}
                    eventActions={eventActions}
                    selection={selectionState}
                    dndCellPreview={
                      prefs.experimentalEventDndEnabled
                        ? dndCellPreview
                        : null
                    }
                    onCellPointerDown={onCellPointerDown}
                    onOpenDay={handleOpenDay}
                    onOpenEvent={actions.openEvent}
                  />
                )}
              />
            )}
          </div>
          <CalendarSidePanel
            pastEvents={pastEvents}
            upcomingEvents={upcomingEvents}
            loading={loading}
            prefs={prefs}
            onPatchPrefs={patchPrefs}
            onResetPrefs={resetPrefs}
            tab={sideTab}
            onTabChange={setSideTab}
            onFocusEventInCalendar={focusEventInCalendar}
            onEditEvent={handleSidePanelEditEvent}
          />
        </div>
        {activeDragEvent &&
        dragOverlayClient &&
        prefs.experimentalEventDndEnabled ? (
          <div
            className="pointer-events-none fixed z-[1000]"
            style={{
              left: dragOverlayClient.x,
              top: dragOverlayClient.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <CalendarDragPreview event={activeDragEvent} />
          </div>
        ) : null}
      </DndContext>

      <CalendarDayDetailModal
        iso={selectedDay}
        events={selectedDayEvents}
        onOpenChange={(o) => {
          if (!o) setSelectedDay(null);
        }}
        onOpenEvent={actions.openEvent}
      />

      {eventModal ? (
        <CalendarEventModal
          open
          mode={eventModal.mode}
          draft={eventModal.draft}
          onDraftChange={(draft) => {
            setEventModal((prev) => (prev ? { ...prev, draft } : prev));
            if (eventModal.fromRange) setDraftValues(draft);
          }}
          workspaceId={active.id}
          projectsEnabled={projectsEnabled}
          onClose={() => setEventModal(null)}
          onSaved={() => {
            clearDraft();
            void load();
          }}
          onDeleted={() => {
            clearDraft();
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

export function CalendarPage() {
  return <CalendarPageInner />;
}
