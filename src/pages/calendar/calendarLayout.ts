import type { CalendarEvent } from "@/lib/calendarEvents";
import { diffDaysIso } from "./calendarGrid";

/**
 * Segment d'un événement multi-jours **dans une semaine** de la grille (Lun-Dim).
 *
 * - `colStart` / `colEnd` : indices de colonnes 0..6 (inclus / inclus).
 * - `roundLeft` / `roundRight` : indique si le début / fin tombe dans ce segment
 *   (utile pour arrondir les coins de la barre uniquement aux extrémités réelles
 *   de l'événement, pas aux frontières de semaine).
 */
export type LaneSegment = {
  weekIndex: number;
  laneIndex: number;
  colStart: number;
  colEnd: number;
  roundLeft: boolean;
  roundRight: boolean;
  event: CalendarEvent;
};

export type MonthLaneLayout = {
  /** Segments à rendre, regroupés par `weekIndex`. */
  segmentsByWeek: LaneSegment[][];
  /** Nombre maximal de pistes utilisées (peut dépasser `maxLanes`). */
  totalLanes: number;
  /** Sur-débordement par jour (ISO) — événements non placés (au-delà de `maxLanes`). */
  overflowByDay: Map<string, number>;
  /** Événements traités multi-jours (pour exclusion du rendu chips classique). */
  multiDayEventIds: Set<string>;
};

const DEFAULT_MAX_LANES = 3;

/**
 * Calcule l'agencement (« lanes ») pour les événements multi-jours visibles sur
 * la grille mensuelle (42 jours, 6 semaines × 7 jours). La semaine suit
 * `weekStart` (même convention que `buildMonthGrid`).
 *
 * - Un événement est considéré multi-jours dès que `endDate > date`.
 * - Algorithme glouton : événements triés par début (puis par fin descendante)
 *   puis assignés à la première lane libre (pas de chevauchement avec un autre
 *   événement sur la même lane).
 * - Les segments hebdomadaires sont calculés en coupant aux frontières de
 *   semaine de la grille (`monthDays[weekIndex * 7]` = premier jour de la ligne).
 * - Au-delà de `maxLanes`, le compteur d'overflow par jour est incrémenté pour
 *   afficher un badge « +N » dans la cellule.
 */
export function layoutMultiDayEvents(
  events: CalendarEvent[],
  monthDays: string[],
  maxLanes: number = DEFAULT_MAX_LANES,
): MonthLaneLayout {
  const segmentsByWeek: LaneSegment[][] = Array.from({ length: 6 }, () => []);
  const overflowByDay = new Map<string, number>();
  const multiDayEventIds = new Set<string>();

  if (monthDays.length !== 42) {
    return {
      segmentsByWeek,
      totalLanes: 0,
      overflowByDay,
      multiDayEventIds,
    };
  }

  const gridStart = monthDays[0];
  const gridEnd = monthDays[41];

  const multiDay = events
    .filter((e) => e.endDate > e.date)
    .map((e) => ({
      event: e,
      start: e.date < gridStart ? gridStart : e.date,
      end: e.endDate > gridEnd ? gridEnd : e.endDate,
    }))
    .filter((seg) => seg.start <= gridEnd && seg.end >= gridStart)
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

    if (lane >= maxLanes) {
      for (
        let d = seg.start;
        d <= seg.end;
        d = nextDay(d)
      ) {
        overflowByDay.set(d, (overflowByDay.get(d) ?? 0) + 1);
      }
      continue;
    }

    const startDelta = diffDaysIso(gridStart, seg.start);
    const endDelta = diffDaysIso(gridStart, seg.end);
    if (startDelta < 0 || endDelta > 41) continue;

    const startWeek = Math.floor(startDelta / 7);
    const endWeek = Math.floor(endDelta / 7);

    for (let w = startWeek; w <= endWeek; w++) {
      const weekStartGridIdx = w * 7;
      const colStart = w === startWeek ? startDelta - weekStartGridIdx : 0;
      const colEnd = w === endWeek ? endDelta - weekStartGridIdx : 6;
      segmentsByWeek[w].push({
        weekIndex: w,
        laneIndex: lane,
        colStart,
        colEnd,
        roundLeft: w === startWeek && seg.event.date >= seg.start,
        roundRight: w === endWeek && seg.event.endDate <= seg.end,
        event: seg.event,
      });
    }
  }

  for (const week of segmentsByWeek) {
    week.sort((a, b) => a.laneIndex - b.laneIndex || a.colStart - b.colStart);
  }

  return {
    segmentsByWeek,
    totalLanes: lanesEnd.length,
    overflowByDay,
    multiDayEventIds,
  };
}

function nextDay(iso: string): string {
  const [y, m, d] = iso.split("-").map((p) => Number.parseInt(p, 10));
  const dt = new Date(y, (m ?? 1) - 1, (d ?? 1) + 1);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}
