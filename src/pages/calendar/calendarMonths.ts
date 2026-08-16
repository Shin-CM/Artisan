/**
 * Helpers pour la liste verticale de mois empilés (scroll quasi-infini).
 *
 * Aucune dépendance React : utilisable en composants, helpers et tests Vitest.
 *
 * Convention :
 * - `index` est un entier signé : `0` = mois ancre (typiquement le mois courant
 *   à l'ouverture de la page), `+1` = mois suivant, `-1` = mois précédent.
 * - Une « ancre » est un couple `{ year, month }` où `month` est 0-indexé (0..11).
 * - Bornes par défaut : ±120 mois autour de l'ancre (≈ 20 ans), largement
 *   suffisant pour la navigation quotidienne tout en évitant d'allouer une
 *   structure infinie.
 */

import {
  MONTH_GRID_LANE_BAR_HEIGHT_PX,
  MONTH_GRID_MAX_CHIPS_PER_CELL,
  MONTH_GRID_MAX_VISIBLE_LANES,
} from "./calendarMonthGridMetrics";

export type MonthAnchor = { year: number; month: number };

/** Plage par défaut : ±120 mois autour de l'ancre. */
export const MONTHS_BUFFER = 120;

/** Hauteur visuelle minimale / plancher historique d'un bloc mois (px). */
export const MONTH_HEIGHT_PX = 760;

/** Hauteur de l'en-tête sticky de section mois (en px). */
export const MONTH_HEADER_HEIGHT_PX = 32;

/** Hauteur de la ligne « Lun. Mar. … » au-dessus des cellules (px, marge incluse). */
export const MONTH_WEEKDAY_HEADER_ROW_PX = 36;

/**
 * Hauteur allouée à **chaque** mois dans la liste virtualisée (`CalendarVirtualStack`).
 * Doit être **≥** à la hauteur réelle rendue (en-tête sticky + ligne des jours + 6 rangées
 * de cellules), sinon les blocs se **chevauchent** : `elementsFromPoint` peut viser le
 * mauvais mois (DnD / pointillés décalés d’une semaine ou plus). `MONTH_HEIGHT_PX`
 * reste le plancher historique pour les petites densités.
 *
 * Chaque **rangée de semaine** peut dépasser `cellHeightPx` : les cellules ont un
 * `minHeight` égal à la densité, mais le `paddingTop` réservé aux barres multi-jours
 * et la pile de chips (`CalendarWeekRow`) augmentent la hauteur réelle — d’où un
 * plancher par rangée dérivé des constantes `MONTH_GRID_*`.
 */
export function estimateMonthVirtualHeightPx(cellHeightPx: number): number {
  const lanePaddingTopPx =
    MONTH_GRID_MAX_VISIBLE_LANES * MONTH_GRID_LANE_BAR_HEIGHT_PX + 2;
  const chipBlockPx = MONTH_GRID_MAX_CHIPS_PER_CELL * 24 + 24;
  const dayHeaderRowPx = 32;
  const weekRowMinForStackedContentPx =
    dayHeaderRowPx + lanePaddingTopPx + chipBlockPx;
  const weekRowPx = Math.max(cellHeightPx, weekRowMinForStackedContentPx);
  const bodyFudgePx = 52;
  const raw =
    MONTH_HEADER_HEIGHT_PX +
    MONTH_WEEKDAY_HEADER_ROW_PX +
    6 * weekRowPx +
    bodyFudgePx;
  return Math.max(MONTH_HEIGHT_PX, raw);
}

/** Index relatif (0 = ancre) → couple `{ year, month }`. */
export function monthFromIndex(index: number, anchor: MonthAnchor): MonthAnchor {
  const total = anchor.year * 12 + anchor.month + index;
  const year = Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  return { year, month };
}

/** Couple `{ year, month }` → index relatif à l'ancre. */
export function indexFromMonth(target: MonthAnchor, anchor: MonthAnchor): number {
  return (target.year - anchor.year) * 12 + (target.month - anchor.month);
}

/** Index relatif d'un mois courant (mois système). */
export function currentMonthIndex(anchor: MonthAnchor, now: Date = new Date()): number {
  return indexFromMonth({ year: now.getFullYear(), month: now.getMonth() }, anchor);
}

/**
 * Bornes par défaut autour de l'ancre. `minIndex` est négatif (passé),
 * `maxIndex` positif (futur), tous deux inclus.
 */
export function defaultMonthBounds(buffer: number = MONTHS_BUFFER): {
  minIndex: number;
  maxIndex: number;
} {
  return { minIndex: -buffer, maxIndex: buffer };
}

/** Nombre total de mois dans la liste (bornes inclues). */
export function monthsCount(min: number, max: number): number {
  return max - min + 1;
}

/**
 * Convertit une position de scroll (px) en index relatif du mois « principal »
 * visible (celui qui occupe le plus le viewport). On utilise le centre du
 * viewport (scrollTop + viewportHeight / 2) pour décider du mois mis en avant
 * dans le titre global.
 */
export function visibleMonthIndex(
  scrollTop: number,
  viewportHeight: number,
  minIndex: number,
  monthHeight: number = MONTH_HEIGHT_PX,
): number {
  const center = scrollTop + viewportHeight / 2;
  const offset = Math.floor(center / monthHeight);
  return minIndex + offset;
}

/**
 * Convertit un index relatif (à `minIndex`) en `scrollTop` (px) pour positionner
 * le mois en haut du viewport.
 */
export function scrollTopForIndex(
  index: number,
  minIndex: number,
  monthHeight: number = MONTH_HEIGHT_PX,
): number {
  const offset = index - minIndex;
  return Math.max(0, offset * monthHeight);
}

/**
 * Plage d'indices à rendre dans le DOM (windowing). `scrollTop` et
 * `viewportHeight` sont en px ; `overscan` est le nombre de mois additionnels
 * à conserver de chaque côté pour éviter les blanc-pages lors d'un scroll
 * rapide. Le résultat est clamp aux bornes `[minIndex, maxIndex]`.
 */
export function windowIndices(
  scrollTop: number,
  viewportHeight: number,
  minIndex: number,
  maxIndex: number,
  monthHeight: number = MONTH_HEIGHT_PX,
  overscan: number = 1,
): { firstOffset: number; lastOffset: number } {
  const firstVisible = Math.floor(scrollTop / monthHeight);
  const lastVisible = Math.floor((scrollTop + viewportHeight) / monthHeight);
  const firstOffset = Math.max(0, firstVisible - overscan);
  const lastOffset = Math.min(
    maxIndex - minIndex,
    lastVisible + overscan,
  );
  return { firstOffset, lastOffset };
}

/**
 * Normalise une paire d'ISO `(a, b)` : retourne `[start, end]` avec
 * `start <= end` (lexicographique = chronologique pour `YYYY-MM-DD`).
 */
export function normalizeIsoRange(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a];
}

/** Indique si un ISO est dans la plage `[start, end]` (inclus). */
export function isoInRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}
