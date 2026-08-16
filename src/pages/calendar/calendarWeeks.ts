/**
 * Helpers pour la vue « semaines empilées » (scroll continu sans grille mois).
 *
 * Convention :
 * - Une « semaine » est identifiée par l'ISO de son **premier jour** (lundi ou
 *   dimanche selon la préférence utilisateur).
 * - `index` est un entier signé : `0` = semaine ancre (semaine du jour courant
 *   à l'ouverture), `+1` = semaine suivante, `-1` = précédente.
 * - Bornes par défaut : ±520 semaines (~10 ans) autour de l'ancre.
 */

import {
  dateFromIso,
  diffDaysIso,
  isoFromYearMonthDay,
  shiftIso,
} from "./calendarGrid";

export type WeekStartDay = "monday" | "sunday";

/** Largeur du buffer par défaut (en semaines). */
export const WEEKS_BUFFER = 520;

/** ISO du premier jour de la semaine contenant `iso`. */
export function startOfWeekIso(
  iso: string,
  weekStart: WeekStartDay = "monday",
): string {
  const d = dateFromIso(iso);
  const dow = d.getDay();
  const delta = weekStart === "monday" ? (dow + 6) % 7 : dow;
  d.setDate(d.getDate() - delta);
  return isoFromYearMonthDay(d.getFullYear(), d.getMonth(), d.getDate());
}

/** ISO du dernier jour de la semaine commençant à `weekStartIso`. */
export function endOfWeekIso(weekStartIso: string): string {
  return shiftIso(weekStartIso, 6);
}

/** 7 ISO jours de la semaine commençant à `weekStartIso`. */
export function weekDays(weekStartIso: string): string[] {
  return [0, 1, 2, 3, 4, 5, 6].map((i) => shiftIso(weekStartIso, i));
}

/** Index relatif (0 = ancre) → ISO de la semaine. */
export function weekFromIndex(index: number, anchor: string): string {
  return shiftIso(anchor, index * 7);
}

/** ISO de semaine → index relatif à l'ancre (en supposant aligné). */
export function indexFromWeek(target: string, anchor: string): number {
  return Math.round(diffDaysIso(anchor, target) / 7);
}

/**
 * Bornes par défaut autour de l'ancre. `minIndex` négatif (passé),
 * `maxIndex` positif (futur), tous deux inclus.
 */
export function defaultWeekBounds(buffer: number = WEEKS_BUFFER): {
  minIndex: number;
  maxIndex: number;
} {
  return { minIndex: -buffer, maxIndex: buffer };
}

/** Nombre total de semaines dans la liste (bornes inclues). */
export function weeksCount(min: number, max: number): number {
  return max - min + 1;
}

/**
 * Détermine l'ISO du jour situé au **centre vertical** du viewport, à partir du
 * scroll de la liste virtualisée. Le mois associé à ce jour devient le libellé
 * affiché dans l'en-tête.
 */
export function visibleDayIsoAtCenter(
  scrollTop: number,
  viewportHeight: number,
  minIndex: number,
  rowHeight: number,
  anchor: string,
  columnsStart: WeekStartDay = "monday",
  pointerXFraction: number = 0.5,
): string {
  const center = scrollTop + viewportHeight / 2;
  const offset = Math.floor(center / rowHeight);
  const weekIso = weekFromIndex(minIndex + offset, anchor);
  const col = Math.min(6, Math.max(0, Math.floor(pointerXFraction * 7)));
  // columnsStart is kept for symmetry with future Sunday-start sweeping.
  void columnsStart;
  return shiftIso(weekIso, col);
}

/**
 * Convertit un index relatif en `scrollTop` (px), pour positionner la semaine
 * en haut du viewport.
 */
export function scrollTopForWeekIndex(
  index: number,
  minIndex: number,
  rowHeight: number,
): number {
  const offset = index - minIndex;
  return Math.max(0, offset * rowHeight);
}

/**
 * `scrollTop` pour **centrer** la semaine `index` dans un viewport de hauteur
 * `viewportHeight`. Utilisé par le bouton « Aujourd'hui » et par les boutons
 * mois précédent/suivant.
 */
export function scrollTopToCenterWeekIndex(
  index: number,
  minIndex: number,
  rowHeight: number,
  viewportHeight: number,
): number {
  const top = scrollTopForWeekIndex(index, minIndex, rowHeight);
  return Math.max(0, top - viewportHeight / 2 + rowHeight / 2);
}

/**
 * Plage d'indices à rendre dans le DOM (windowing). Clamp aux bornes
 * `[minIndex, maxIndex]`.
 */
export function weekWindowIndices(
  scrollTop: number,
  viewportHeight: number,
  minIndex: number,
  maxIndex: number,
  rowHeight: number,
  overscan: number = 2,
): { firstOffset: number; lastOffset: number } {
  const firstVisible = Math.floor(scrollTop / rowHeight);
  const lastVisible = Math.floor((scrollTop + viewportHeight) / rowHeight);
  const firstOffset = Math.max(0, firstVisible - overscan);
  const lastOffset = Math.min(maxIndex - minIndex, lastVisible + overscan);
  return { firstOffset, lastOffset };
}

/** Numéro ISO 8601 de la semaine pour `iso` (utile pour la colonne `S##`). */
export function isoWeekNumber(iso: string): number {
  const d = dateFromIso(iso);
  d.setHours(0, 0, 0, 0);
  // Jeudi de la semaine ISO décide de l'année
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const msPerDay = 1000 * 60 * 60 * 24;
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / msPerDay -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
}

/** Libellés des jours de la semaine en fonction du premier jour choisi. */
export function weekdayHeaders(weekStart: WeekStartDay): string[] {
  const monday = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."];
  const sunday = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
  return weekStart === "monday" ? monday : sunday;
}
