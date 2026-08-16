import * as React from "react";
import { toast } from "sonner";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { CalendarEvent } from "@/lib/calendarEvents";
import { diffDaysIso, shiftIso } from "./calendarGrid";
import {
  isoBlockedForHolidayDnd,
  type DayHolidayInfo,
} from "@/lib/calendarHolidays";
import { dayIsoUnderPoint } from "./dragOriginIso";
import type { CalendarPrefs } from "./calendarPrefs";
import type { CalendarEventActionsHandle } from "./useCalendarEventActions";

/**
 * Aperçu pendant le drag (événements éditables) :
 * - `"hover-cell"` : pointillés uniquement sur la case sous le curseur ; le décalage
 *   (`diffDaysIso` / `shiftIso`) n'est appliqué qu'au drop dans `handleDragEnd`.
 * - `"shifted-range"` : prévisualise toute la plage déplacée pendant le drag (legacy).
 */
const CALENDAR_DND_DRAG_PREVIEW_MODE: "hover-cell" | "shifted-range" =
  "hover-cell";

export function useCalendarEventDnD({
  scrollRef,
  visibleEventsRef,
  prefs,
  holidayMap,
  shiftEvent,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  visibleEventsRef: React.MutableRefObject<CalendarEvent[]>;
  prefs: CalendarPrefs;
  holidayMap: Map<string, DayHolidayInfo>;
  shiftEvent: CalendarEventActionsHandle["shiftEvent"];
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const [activeDragEvent, setActiveDragEvent] =
    React.useState<CalendarEvent | null>(null);
  const [dndCellPreview, setDndCellPreview] = React.useState<{
    start: string;
    end: string;
  } | null>(null);
  const [dragOverlayClient, setDragOverlayClient] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const dragPointerClientRef = React.useRef({ x: 0, y: 0 });
  const draggingEventRef = React.useRef<CalendarEvent | null>(null);
  const dragOriginIsoRef = React.useRef<string | null>(null);

  const handleDragStart = React.useCallback((e: DragStartEvent) => {
    const ev = e.active.data.current?.event as CalendarEvent | undefined;
    draggingEventRef.current = ev ?? null;
    setActiveDragEvent(ev ?? null);
    dragOriginIsoRef.current = null;
    const ae = e.activatorEvent;
    if (
      ae &&
      typeof (ae as PointerEvent).clientX === "number" &&
      typeof (ae as PointerEvent).clientY === "number"
    ) {
      const pe = ae as PointerEvent;
      dragPointerClientRef.current = { x: pe.clientX, y: pe.clientY };
      if (ev) {
        const found = dayIsoUnderPoint(
          pe.clientX,
          pe.clientY,
          scrollRef.current,
        );
        dragOriginIsoRef.current = found ?? ev.date;
      }
      if (ev?.editable) {
        setDragOverlayClient({ x: pe.clientX, y: pe.clientY });
      } else {
        setDragOverlayClient(null);
      }
    } else if (ev) {
      dragOriginIsoRef.current = ev.date;
      setDragOverlayClient(null);
    } else {
      setDragOverlayClient(null);
    }
  }, [scrollRef]);

  const handleDragCancel = React.useCallback(() => {
    draggingEventRef.current = null;
    dragOriginIsoRef.current = null;
    setActiveDragEvent(null);
    setDndCellPreview(null);
    setDragOverlayClient(null);
  }, []);

  React.useEffect(() => {
    if (!activeDragEvent?.editable || !prefs.experimentalEventDndEnabled)
      return;
    const scrollEl = scrollRef.current;
    let scrollLiveRaf = 0;
    let scrollEndRaf1 = 0;
    let scrollEndRaf2 = 0;

    const cancelScrollRafs = () => {
      cancelAnimationFrame(scrollLiveRaf);
      cancelAnimationFrame(scrollEndRaf1);
      cancelAnimationFrame(scrollEndRaf2);
      scrollLiveRaf = 0;
      scrollEndRaf1 = 0;
      scrollEndRaf2 = 0;
    };

    const pushDragUi = () => {
      const snap = draggingEventRef.current;
      const ev = snap
        ? (visibleEventsRef.current.find((e) => e.id === snap.id) ?? snap)
        : null;
      const hitRoot = scrollRef.current;
      const { x, y } = dragPointerClientRef.current;
      if (ev?.editable) {
        setDragOverlayClient((prev) => {
          if (prev && prev.x === x && prev.y === y) return prev;
          return { x, y };
        });
      } else {
        setDragOverlayClient(null);
      }
      if (!ev?.editable) {
        setDndCellPreview(null);
        return;
      }
      const hoverIso = dayIsoUnderPoint(x, y, hitRoot);
      if (!hoverIso) {
        setDndCellPreview(null);
        return;
      }
      if (CALENDAR_DND_DRAG_PREVIEW_MODE === "hover-cell") {
        setDndCellPreview((prev) => {
          if (prev?.start === hoverIso && prev?.end === hoverIso) return prev;
          return { start: hoverIso, end: hoverIso };
        });
        return;
      }
      const originIso = dragOriginIsoRef.current ?? ev.date;
      const deltaPreview = diffDaysIso(originIso, hoverIso);
      const previewStart = shiftIso(ev.date, deltaPreview);
      const previewEnd = shiftIso(ev.endDate, deltaPreview);
      setDndCellPreview((prev) => {
        if (prev?.start === previewStart && prev?.end === previewEnd) return prev;
        return { start: previewStart, end: previewEnd };
      });
    };

    const scheduleFromScroll = () => {
      cancelScrollRafs();
      scrollLiveRaf = requestAnimationFrame(() => {
        scrollLiveRaf = 0;
        pushDragUi();
      });
    };

    const onScrollEnd = () => {
      cancelScrollRafs();
      scrollEndRaf1 = requestAnimationFrame(() => {
        scrollEndRaf1 = 0;
        scrollEndRaf2 = requestAnimationFrame(() => {
          scrollEndRaf2 = 0;
          pushDragUi();
        });
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      dragPointerClientRef.current = { x: e.clientX, y: e.clientY };
      pushDragUi();
    };

    const onPointerUp = (e: PointerEvent) => {
      dragPointerClientRef.current = { x: e.clientX, y: e.clientY };
      pushDragUi();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, {
      passive: true,
      capture: true,
    });
    window.addEventListener("pointercancel", onPointerUp, {
      passive: true,
      capture: true,
    });
    scrollEl?.addEventListener("scroll", scheduleFromScroll, { passive: true });
    scrollEl?.addEventListener("scrollend", onScrollEnd, { passive: true });
    pushDragUi();

    return () => {
      cancelScrollRafs();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp, { capture: true });
      window.removeEventListener("pointercancel", onPointerUp, {
        capture: true,
      });
      scrollEl?.removeEventListener("scroll", scheduleFromScroll);
      scrollEl?.removeEventListener("scrollend", onScrollEnd);
      setDndCellPreview(null);
      setDragOverlayClient(null);
    };
  }, [activeDragEvent, prefs.experimentalEventDndEnabled, scrollRef, visibleEventsRef]);

  const handleDragEnd = React.useCallback(
    (e: DragEndEvent) => {
      const { active } = e;
      const snap = active?.data.current?.event as CalendarEvent | undefined;
      const ev =
        snap != null
          ? (visibleEventsRef.current.find((e) => e.id === snap.id) ?? snap)
          : undefined;
      const originIso = dragOriginIsoRef.current ?? ev?.date ?? "";
      const { x, y } = dragPointerClientRef.current;
      const hitRoot = scrollRef.current;

      draggingEventRef.current = null;
      dragOriginIsoRef.current = null;
      setActiveDragEvent(null);
      setDndCellPreview(null);
      setDragOverlayClient(null);

      if (!active || !ev || !ev.editable) return;
      if (!prefs.experimentalEventDndEnabled) return;

      const targetIso = dayIsoUnderPoint(x, y, hitRoot);
      if (!targetIso) return;
      const block = isoBlockedForHolidayDnd(prefs, holidayMap, targetIso);
      if (block === "public") {
        toast.message("Déplacement impossible vers un jour férié.");
        return;
      }
      if (block === "school") {
        toast.message(
          "Déplacement impossible pendant les vacances scolaires.",
        );
        return;
      }

      const delta = diffDaysIso(originIso, targetIso);
      if (delta === 0) return;
      void shiftEvent(ev, delta, { withUndoToast: true });
    },
    [holidayMap, prefs, scrollRef, shiftEvent, visibleEventsRef],
  );

  return {
    sensors,
    activeDragEvent,
    dndCellPreview,
    dragOverlayClient,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
