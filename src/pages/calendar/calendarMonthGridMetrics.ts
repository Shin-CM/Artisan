/**
 * Constantes partagées entre la grille mensuelle (`CalendarMonthGrid` /
 * `layoutMultiDayEvents`) et le rendu d’une ligne (`CalendarWeekRow`).
 *
 * Toute modification ici doit rester alignée avec le JSX de `CalendarWeekRow`
 * (paddingTop des pistes, chips, `minHeight` des cellules) et avec
 * `estimateMonthVirtualHeightPx` dans `calendarMonths.ts` pour éviter le
 * chevauchement des blocs mois en virtualisation.
 */
export const MONTH_GRID_MAX_VISIBLE_LANES = 3;
export const MONTH_GRID_LANE_BAR_HEIGHT_PX = 18;
export const MONTH_GRID_MAX_CHIPS_PER_CELL = 3;
