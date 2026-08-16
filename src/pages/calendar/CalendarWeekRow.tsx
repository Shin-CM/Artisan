import * as React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  calendarSourceClasses,
  calendarSourceLabel,
  neutralPaletteClasses,
  type CalendarEvent,
} from "@/lib/calendarEvents";
import { DAY_FULL_FMT, dateFromIso } from "./calendarGrid";
import { isoInRange } from "./calendarMonths";
import type { WeekLaneSegment, WeekLanes } from "./calendarWeekLayout";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CalendarCellMenu,
  type CalendarCellActions,
} from "./CalendarCellMenu";
import {
  CalendarEventMenu,
  type CalendarEventActions,
} from "./CalendarEventMenu";
import type { CalendarPrefs } from "./calendarPrefs";
import type { DayHolidayInfo } from "@/lib/calendarHolidays";
import { monthPastilleStyle } from "./monthAccent";
import {
  MONTH_GRID_LANE_BAR_HEIGHT_PX as LANE_BAR_HEIGHT,
  MONTH_GRID_MAX_CHIPS_PER_CELL as MAX_CHIPS_PER_CELL,
} from "./calendarMonthGridMetrics";

const LANES_TOP_OFFSET = 26;

const MONTH_SHORT_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export type WeekRowSelection = {
  liveStart: string | null;
  liveEnd: string | null;
  draftStart: string | null;
  draftEnd: string | null;
};

export type WeekRowOptions = {
  /**
   * Mois « courant » de la rangée. Si `null`, tous les jours sont considérés
   * comme appartenant au mois courant (mode `weeks`). Si défini, les jours
   * d'un autre mois sont grisés et **non sélectionnables** par le drag.
   */
  currentMonth: number | null;
  prefs: CalendarPrefs;
  today: string;
  cellHeightPx: number;
  /** Jours fériés / vacances (fusion embed + cache API). */
  holidayByIso: Map<string, DayHolidayInfo>;
};

export function CalendarWeekRow({
  weekDays,
  eventsByDay,
  lanes,
  selection,
  dndCellPreview = null,
  options,
  cellActions,
  eventActions,
  onCellPointerDown,
  onOpenDay,
  onOpenEvent,
}: {
  weekDays: string[];
  eventsByDay: Map<string, CalendarEvent[]>;
  lanes: WeekLanes;
  selection: WeekRowSelection;
  /** Plage de jours à surligner en pointillés pendant un DnD (aperçu cible). */
  dndCellPreview?: { start: string; end: string } | null;
  options: WeekRowOptions;
  cellActions: (iso: string) => CalendarCellActions;
  eventActions: CalendarEventActions;
  onCellPointerDown: (e: React.PointerEvent<HTMLElement>, iso: string) => void;
  onOpenDay: (iso: string) => void;
  onOpenEvent: (event: CalendarEvent) => void;
}) {
  const { prefs, today, currentMonth, cellHeightPx, holidayByIso } = options;
  const eventDndOn = prefs.experimentalEventDndEnabled;
  const monthOfFirstDay = dateFromIso(weekDays[0]).getMonth();
  const altBand =
    prefs.monthAccent === "alternating" ? monthOfFirstDay % 2 === 0 : false;
  return (
    <div
      className={cn(
        "relative grid grid-cols-7",
        altBand && "bg-[var(--color-muted)]/25",
      )}
    >
      {weekDays.map((iso) => {
        const d = dateFromIso(iso);
        const dayMonth = d.getMonth();
        const inMonth = currentMonth === null ? true : dayMonth === currentMonth;
        const isToday = iso === today;
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const dayEvents = eventsByDay.get(iso) ?? [];
        const singleDay = dayEvents.filter((e) => !lanes.multiDayEventIds.has(e.id));
        const lanesShownHere = lanes.segments.filter(
          (s) => iso >= weekDays[s.colStart] && iso <= weekDays[s.colEnd],
        ).length;
        const chipsLimit = Math.max(0, MAX_CHIPS_PER_CELL - lanesShownHere);
        const chipsToShow = singleDay.slice(0, chipsLimit);
        const chipsOverflow = singleDay.length - chipsToShow.length;
        const laneOverflow = lanes.overflowByDay.get(iso) ?? 0;
        const totalOverflow = chipsOverflow + laneOverflow;
        const inLive = inSelection(iso, selection.liveStart, selection.liveEnd);
        const inDraft =
          !inLive && inSelection(iso, selection.draftStart, selection.draftEnd);
        const isFirstOfMonth = d.getDate() === 1;
        const showFullDate =
          isFirstOfMonth && prefs.firstOfMonthLabel === "number_short_month";

        const pastilleStyle =
          prefs.monthAccent === "pastille" && inMonth
            ? monthPastilleStyle(dayMonth)
            : undefined;

        const hi = holidayByIso.get(iso);
        const publicTitle = prefs.showPublicHolidays ? hi?.publicName : undefined;
        const schoolTitle = prefs.showSchoolVacations ? hi?.schoolName : undefined;
        const showSchoolVacationStyle =
          prefs.showSchoolVacations && Boolean(hi?.school);

        return (
          <DroppableCell key={iso} iso={iso} dndEnabled={eventDndOn}>
            <CalendarCellMenu iso={iso} actions={cellActions(iso)}>
              <button
                type="button"
                {...(inMonth ? { "data-day-iso": iso } : {})}
                onPointerDown={(e) =>
                  inMonth ? onCellPointerDown(e, iso) : undefined
                }
                onClick={() => onOpenDay(iso)}
                style={{ minHeight: cellHeightPx }}
                title={
                  publicTitle
                    ? undefined
                    : [DAY_FULL_FMT.format(d), schoolTitle]
                        .filter(Boolean)
                        .join(" — ") || undefined
                }
                className={cn(
                  "relative flex w-full flex-col items-stretch gap-1 border-b border-r border-[var(--color-border)] p-1 text-left transition-colors",
                  inMonth
                    ? "bg-[var(--color-card)]"
                    : "bg-[var(--color-muted)]/15 text-[var(--color-muted-foreground)]",
                  dayEvents.length > 0 && "hover:bg-[var(--color-muted)]/40",
                  inLive && "bg-[var(--color-muted)]/60",
                  inDraft &&
                    "bg-[var(--color-muted)]/40 outline outline-1 outline-dashed outline-[var(--color-primary)]/60 -outline-offset-2",
                  prefs.fadeWeekends && isWeekend && "bg-[var(--color-muted)]/15",
                  inMonth && showSchoolVacationStyle && "bg-violet-500/[0.07]",
                )}
                aria-label={DAY_FULL_FMT.format(d)}
              >
                <div className="flex min-w-0 items-center gap-1">
                  <div className="flex min-w-0 shrink-0 items-center gap-0.5">
                    {showFullDate ? (
                      <span
                        style={pastilleStyle}
                        className={cn(
                          "inline-flex h-6 max-w-full shrink-0 items-center justify-center gap-0.5 rounded-full px-1.5 text-center leading-none",
                          isToday
                            ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                            : pastilleStyle
                              ? "bg-[var(--cal-pastille-bg-light)] text-[var(--cal-pastille-text-light)] dark:bg-[var(--cal-pastille-bg-dark)] dark:text-[var(--cal-pastille-text-dark)]"
                              : inMonth
                                ? "bg-[var(--color-muted)]/45 text-[var(--color-foreground)] ring-1 ring-[var(--color-border)]/60"
                                : "bg-[var(--color-muted)]/25 text-[var(--color-muted-foreground)]",
                        )}
                      >
                        <span className="text-xs font-semibold tabular-nums">
                          {d.getDate()}
                        </span>
                        <span
                          className={cn(
                            "min-w-0 max-w-[2.85rem] shrink truncate text-[9px] font-semibold leading-none tracking-tight",
                            isToday
                              ? "text-[var(--color-primary-foreground)]/90"
                              : pastilleStyle
                                ? "opacity-90"
                                : "opacity-85",
                          )}
                        >
                          {MONTH_SHORT_FR[dayMonth]}
                        </span>
                      </span>
                    ) : (
                      <span
                        style={pastilleStyle}
                        className={cn(
                          "inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1 text-xs tabular-nums leading-none",
                          isToday
                            ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold"
                            : pastilleStyle
                              ? "bg-[var(--cal-pastille-bg-light)] text-[var(--cal-pastille-text-light)] dark:bg-[var(--cal-pastille-bg-dark)] dark:text-[var(--cal-pastille-text-dark)]"
                              : inMonth
                                ? "text-[var(--color-foreground)]"
                                : "text-[var(--color-muted-foreground)]",
                        )}
                      >
                        {d.getDate()}
                      </span>
                    )}
                  </div>
                  <span className="min-w-0 flex-1" aria-hidden />
                  {inMonth && publicTitle ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="group/dot relative inline-flex shrink-0 cursor-default items-center justify-center rounded-full p-0.5"
                          aria-label={
                            schoolTitle
                              ? `${publicTitle} — ${schoolTitle}`
                              : publicTitle
                          }
                        >
                          <span
                            aria-hidden
                            className="block h-1.5 w-1.5 origin-center rounded-full bg-violet-500 shadow-sm transition-transform duration-200 ease-out group-hover/dot:scale-[2.35]"
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="end"
                        className="max-w-[16rem] space-y-0.5 px-2.5 py-1.5 text-xs leading-snug"
                      >
                        <p className="font-medium text-[var(--color-popover-foreground)]">
                          {publicTitle}
                        </p>
                        {schoolTitle ? (
                          <p className="text-[11px] text-[var(--color-muted-foreground)]">
                            {schoolTitle}
                          </p>
                        ) : null}
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
                <div
                  className="flex min-h-0 flex-col gap-0.5 overflow-hidden"
                  style={{
                    paddingTop:
                      lanesShownHere > 0
                        ? lanesShownHere * LANE_BAR_HEIGHT + 2
                        : undefined,
                  }}
                >
                  {chipsToShow.map((e) => (
                    <CalendarEventMenu key={e.id} event={e} actions={eventActions}>
                      <SingleDayChip
                        event={e}
                        onOpen={() => onOpenEvent(e)}
                        dndEnabled={eventDndOn}
                      />
                    </CalendarEventMenu>
                  ))}
                  {totalOverflow > 0 ? (
                    <span className="text-[10px] text-[var(--color-muted-foreground)]">
                      +{totalOverflow} autre{totalOverflow > 1 ? "s" : ""}
                    </span>
                  ) : null}
                </div>
              </button>
            </CalendarCellMenu>
          </DroppableCell>
        );
      })}

      <div className="pointer-events-none absolute inset-0 z-10">
        {lanes.segments.map((s, i) => (
          <CalendarEventMenu
            key={`${s.event.id}-${i}`}
            event={s.event}
            actions={eventActions}
          >
            <MultiDayBar
              segment={s}
              onOpen={onOpenEvent}
              dndEnabled={eventDndOn}
            />
          </CalendarEventMenu>
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[15] grid grid-cols-7"
        aria-hidden
      >
        {weekDays.map((iso) => {
          const inDndPreview =
            dndCellPreview != null &&
            isoInRange(iso, dndCellPreview.start, dndCellPreview.end);
          return (
            <div
              key={`dnd-preview:${iso}`}
              className={cn(
                inDndPreview &&
                  "m-0.5 rounded-sm border-2 border-dotted border-[var(--color-primary)]",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

function inSelection(iso: string, start: string | null, end: string | null) {
  if (!start || !end) return false;
  return isoInRange(iso, start, end);
}

const MultiDayBar = React.forwardRef<
  HTMLDivElement,
  {
    segment: WeekLaneSegment;
    onOpen: (event: CalendarEvent) => void;
    dndEnabled: boolean;
  } & React.HTMLAttributes<HTMLDivElement>
>(function MultiDayBar({ segment, onOpen, dndEnabled, ...rest }, ref) {
  const { event, colStart, colEnd, laneIndex, roundLeft, roundRight } = segment;
  const palette = paletteForEvent(event);
  const draggable = useDraggable({
    id: `evt:${event.id}`,
    data: { event },
    disabled: !event.editable || !dndEnabled,
  });
  const { transform: dndTransform, isDragging } = draggable;
  const left = `${(colStart / 7) * 100}%`;
  const width = `${((colEnd - colStart + 1) / 7) * 100}%`;
  const top = `${LANES_TOP_OFFSET + laneIndex * LANE_BAR_HEIGHT}px`;
  return (
    <div
      {...rest}
      ref={(node) => {
        draggable.setNodeRef(node);
        if (typeof ref === "function") ref(node);
        else if (ref)
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      data-event-id={event.id}
      style={{
        left,
        width,
        top,
        height: `${LANE_BAR_HEIGHT - 2}px`,
        backgroundColor: event.colorHex ? `${event.colorHex}26` : undefined,
        borderColor: event.colorHex ? event.colorHex : undefined,
        color: event.colorHex ? event.colorHex : undefined,
        touchAction: "none",
        userSelect: "none",
        /* transform @dnd-kit : aligne le nœud avec scroll/delta ; opacity 0 = feedback via badge + pointillés */
        transform: dndTransform ? CSS.Transform.toString(dndTransform) : undefined,
        opacity: isDragging ? 0 : undefined,
      }}
      className={cn(
        "pointer-events-auto absolute mx-0.5 select-none touch-none truncate border px-2 text-[11px] leading-tight",
        event.editable && dndEnabled
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-pointer",
        roundLeft ? "rounded-l" : "",
        roundRight ? "rounded-r" : "",
        !event.colorHex && palette.chip,
        isDragging && "z-[25]",
      )}
      onClick={(ev) => {
        ev.stopPropagation();
        onOpen(event);
      }}
      title={`${calendarSourceLabel(event.source)} — ${event.title}`}
      {...draggable.attributes}
      {...draggable.listeners}
    >
      <span className="truncate align-middle text-[11px] font-medium">
        {event.title}
      </span>
    </div>
  );
});

const SingleDayChip = React.forwardRef<
  HTMLSpanElement,
  {
    event: CalendarEvent;
    onOpen: () => void;
    dndEnabled: boolean;
  } & React.HTMLAttributes<HTMLSpanElement>
>(function SingleDayChip({ event, onOpen, dndEnabled, ...rest }, ref) {
  const palette = paletteForEvent(event);
  const draggable = useDraggable({
    id: `evt:${event.id}`,
    data: { event },
    disabled: !event.editable || !dndEnabled,
  });
  const { transform: dndTransform, isDragging } = draggable;
  const style: React.CSSProperties = {};
  if (event.colorHex) {
    style.backgroundColor = `${event.colorHex}26`;
    style.borderColor = event.colorHex;
    style.color = event.colorHex;
  }
  return (
    <span
      {...rest}
      ref={(node) => {
        draggable.setNodeRef(node);
        if (typeof ref === "function") ref(node);
        else if (ref)
          (ref as React.MutableRefObject<HTMLSpanElement | null>).current = node;
      }}
      data-event-id={event.id}
      onClick={(ev) => {
        ev.stopPropagation();
        onOpen();
      }}
      className={cn(
        "block select-none touch-none truncate rounded border px-1.5 py-0.5 text-[11px] leading-tight",
        event.editable && dndEnabled
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-pointer",
        !event.colorHex && palette.chip,
        isDragging && "z-[25]",
      )}
      style={{
        ...style,
        touchAction: "none",
        userSelect: "none",
        transform: dndTransform ? CSS.Transform.toString(dndTransform) : undefined,
        opacity: isDragging ? 0 : undefined,
      }}
      title={`${calendarSourceLabel(event.source)} — ${event.title}`}
      {...draggable.attributes}
      {...draggable.listeners}
    >
      {event.title}
    </span>
  );
});

function paletteForEvent(event: CalendarEvent): { chip: string; dot: string } {
  if (event.source === "neutral" && event.colorKey) {
    return neutralPaletteClasses(event.colorKey);
  }
  return calendarSourceClasses(event.source);
}

function DroppableCell({
  iso,
  dndEnabled,
  children,
}: {
  iso: string;
  dndEnabled: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${iso}`,
    disabled: !dndEnabled,
  });
  return (
    <div
      ref={setNodeRef}
      className={cn("relative min-h-0", isOver && "bg-[var(--color-muted)]/60")}
    >
      {children}
    </div>
  );
}
