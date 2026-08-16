import { cn } from "@/lib/utils";
import {
  calendarSourceClasses,
  calendarSourceLabel,
  type CalendarEventSource,
} from "@/lib/calendarEvents";

export function CalendarFilterChips({
  sources,
  enabled,
  onToggle,
}: {
  sources: CalendarEventSource[];
  enabled: Record<CalendarEventSource, boolean>;
  onToggle: (source: CalendarEventSource) => void;
}) {
  return (
    <section className="flex shrink-0 flex-wrap items-center gap-2">
      {sources.map((src) => {
        const on = enabled[src];
        const palette = calendarSourceClasses(src);
        return (
          <button
            key={src}
            type="button"
            onClick={() => onToggle(src)}
            aria-pressed={on}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
              on
                ? palette.chip
                : "border-[var(--color-border)] bg-transparent text-[var(--color-muted-foreground)]",
            )}
          >
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                on ? palette.dot : "bg-[var(--color-muted-foreground)]/40",
              )}
              aria-hidden
            />
            {calendarSourceLabel(src)}
          </button>
        );
      })}
    </section>
  );
}
