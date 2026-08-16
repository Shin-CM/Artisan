import type { CalendarEvent } from "@/lib/calendarEvents";

/**
 * Agencement (« lanes ») des événements multi-jours pour **une seule semaine**.
 *
 * Variante simplifiée de `layoutMultiDayEvents` (qui travaille sur 6 semaines
 * d'un mois). Pour la vue « semaines empilées », chaque ligne de semaine calcule
 * ses propres lanes : pas de cohérence inter-semaines (un événement qui s'étend
 * sur 3 semaines peut occuper des lanes différentes d'une semaine à l'autre).
 * C'est le compromis classique des calendriers de type Google Calendar.
 */
export type WeekLaneSegment = {
  laneIndex: number;
  colStart: number;
  colEnd: number;
  roundLeft: boolean;
  roundRight: boolean;
  event: CalendarEvent;
};

export type WeekLanes = {
  segments: WeekLaneSegment[];
  multiDayEventIds: Set<string>;
  overflowByDay: Map<string, number>;
};

const DEFAULT_MAX_LANES = 3;

export function layoutWeekLanes(
  events: CalendarEvent[],
  days: string[],
  maxLanes: number = DEFAULT_MAX_LANES,
): WeekLanes {
  const segments: WeekLaneSegment[] = [];
  const multiDayEventIds = new Set<string>();
  const overflowByDay = new Map<string, number>();

  if (days.length !== 7) {
    return { segments, multiDayEventIds, overflowByDay };
  }
  const weekStart = days[0];
  const weekEnd = days[6];

  const multiDay = events
    .filter((e) => e.endDate > e.date)
    .map((e) => ({
      event: e,
      start: e.date < weekStart ? weekStart : e.date,
      end: e.endDate > weekEnd ? weekEnd : e.endDate,
    }))
    .filter((s) => s.start <= weekEnd && s.end >= weekStart)
    .sort((a, b) => {
      if (a.start !== b.start) return a.start.localeCompare(b.start);
      return b.end.localeCompare(a.end);
    });

  for (const { event } of multiDay) {
    multiDayEventIds.add(event.id);
  }

  const lanesEnd: string[] = [];

  for (const seg of multiDay) {
    let lane = -1;
    for (let i = 0; i < lanesEnd.length; i++) {
      if (lanesEnd[i] < seg.start) {
        lane = i;
        break;
      }
    }
    if (lane === -1) {
      lane = lanesEnd.length;
      lanesEnd.push(seg.end);
    } else {
      lanesEnd[lane] = seg.end;
    }

    const colStart = days.indexOf(seg.start);
    const colEnd = days.indexOf(seg.end);
    if (colStart < 0 || colEnd < 0) continue;

    if (lane >= maxLanes) {
      for (let i = colStart; i <= colEnd; i++) {
        const iso = days[i];
        overflowByDay.set(iso, (overflowByDay.get(iso) ?? 0) + 1);
      }
      continue;
    }

    segments.push({
      laneIndex: lane,
      colStart,
      colEnd,
      roundLeft: seg.event.date >= seg.start,
      roundRight: seg.event.endDate <= seg.end,
      event: seg.event,
    });
  }

  segments.sort((a, b) => a.laneIndex - b.laneIndex || a.colStart - b.colStart);
  return { segments, multiDayEventIds, overflowByDay };
}
