import { cn } from "@/lib/utils";
import {
  calendarSourceClasses,
  calendarSourceLabel,
  neutralPaletteClasses,
  type CalendarEvent,
} from "@/lib/calendarEvents";

/**
 * Badge compact pendant le drag d’un événement calendrier (rendu en `fixed`
 * depuis `CalendarPage`, centré sur le curseur). Pas de réplique à l’identique
 * de la barre / chip (largeur liée à la cellule) : ce badge reste lisible en
 * vue semaines ou mois.
 */
export function CalendarDragPreview({ event }: { event: CalendarEvent }) {
  const palette =
    event.source === "neutral" && event.colorKey
      ? neutralPaletteClasses(event.colorKey)
      : calendarSourceClasses(event.source);
  const style =
    event.colorHex !== null && event.colorHex !== undefined
      ? {
          backgroundColor: `${event.colorHex}26`,
          borderColor: event.colorHex,
          color: event.colorHex,
        }
      : undefined;
  return (
    <div
      className={cn(
        "pointer-events-none inline-flex max-w-[280px] items-center gap-2 truncate rounded-md border px-2 py-1 text-[12px] font-medium shadow-lg",
        !style && palette.chip,
      )}
      style={style}
    >
      <span className="truncate">{event.title}</span>
      <span className="shrink-0 text-[10px] opacity-70">
        {calendarSourceLabel(event.source)}
      </span>
    </div>
  );
}
