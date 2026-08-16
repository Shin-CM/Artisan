import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  calendarSourceClasses,
  calendarSourceLabel,
  type CalendarEvent,
} from "@/lib/calendarEvents";
import { DAY_FULL_FMT, dateFromIso } from "./calendarGrid";

export function CalendarDayDetailModal({
  iso,
  events,
  onOpenChange,
  onOpenEvent,
}: {
  iso: string | null;
  events: CalendarEvent[];
  onOpenChange: (open: boolean) => void;
  onOpenEvent: (event: CalendarEvent) => void;
}) {
  return (
    <Dialog open={iso !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {iso ? DAY_FULL_FMT.format(dateFromIso(iso)) : ""}
          </DialogTitle>
        </DialogHeader>
        {events.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Aucun événement.
          </p>
        ) : (
          <ul className="max-h-[60vh] divide-y divide-[var(--color-border)] overflow-y-auto rounded-md border border-[var(--color-border)]">
            {events.map((e) => {
              const palette = calendarSourceClasses(e.source);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onOpenEvent(e)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-[var(--color-muted)]/40"
                  >
                    <span
                      className={cn(
                        "mt-1 inline-block h-2 w-2 shrink-0 rounded-full",
                        palette.dot,
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {e.title}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-[var(--color-muted-foreground)]">
                        {calendarSourceLabel(e.source)}
                        {e.subtitle ? ` · ${e.subtitle}` : ""}
                        {e.status ? ` · ${e.status}` : ""}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
