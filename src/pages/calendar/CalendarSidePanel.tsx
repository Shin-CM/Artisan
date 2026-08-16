import * as React from "react";
import { ChevronDown, Loader2, Pencil, SquareArrowOutUpRight } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  calendarSourceClasses,
  calendarSourceLabel,
  type CalendarEvent,
} from "@/lib/calendarEvents";
import { DAY_SHORT_FMT, dateFromIso } from "./calendarGrid";
import { CalendarPrefsForm } from "./CalendarPrefsForm";
import type { CalendarPrefs } from "./calendarPrefs";

function sidePanelEditLabel(e: CalendarEvent): "Modifier" | "Ouvrir" {
  if (e.source === "neutral" && e.entityId) return "Modifier";
  if (e.source === "reminder") return "Modifier";
  return "Ouvrir";
}

function sidePanelEditIcon(e: CalendarEvent) {
  return sidePanelEditLabel(e) === "Modifier" ? Pencil : SquareArrowOutUpRight;
}

/**
 * Panneau latéral du calendrier avec onglets :
 * - **Événements** : passés (30 j., replié par défaut) + à venir (30 j., ouvert par défaut),
 *   clic ligne → centrage sur la grille, bouton **Modifier** / **Ouvrir** selon la source.
 * - **Paramètres** : `CalendarPrefsForm` (mise à jour en temps réel).
 */
export function CalendarSidePanel({
  pastEvents,
  upcomingEvents,
  loading,
  prefs,
  onPatchPrefs,
  onResetPrefs,
  tab,
  onTabChange,
  onFocusEventInCalendar,
  onEditEvent,
}: {
  pastEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  loading: boolean;
  prefs: CalendarPrefs;
  onPatchPrefs: (patch: Partial<CalendarPrefs>) => void;
  onResetPrefs: () => void;
  tab: "events" | "settings";
  onTabChange: (tab: "events" | "settings") => void;
  onFocusEventInCalendar: (event: CalendarEvent) => void;
  onEditEvent: (event: CalendarEvent) => void;
}) {
  const totalListed = pastEvents.length + upcomingEvents.length;

  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] lg:w-80">
      <Tabs
        value={tab}
        onValueChange={(v) => onTabChange(v as "events" | "settings")}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="events">Événements</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>
          {tab === "events" ? (
            <span className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
              {totalListed}
            </span>
          ) : null}
        </div>
        <TabsContent value="events" className="mt-0 min-h-0 flex-1 overflow-y-auto">
          <EventsListsTab
            pastEvents={pastEvents}
            upcomingEvents={upcomingEvents}
            loading={loading}
            onFocusEventInCalendar={onFocusEventInCalendar}
            onEditEvent={onEditEvent}
          />
        </TabsContent>
        <TabsContent value="settings" className="mt-0 min-h-0 flex-1 overflow-y-auto">
          <CalendarPrefsForm
            prefs={prefs}
            onPatch={onPatchPrefs}
            onReset={onResetPrefs}
          />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function EventsListsTab({
  pastEvents,
  upcomingEvents,
  loading,
  onFocusEventInCalendar,
  onEditEvent,
}: {
  pastEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  loading: boolean;
  onFocusEventInCalendar: (event: CalendarEvent) => void;
  onEditEvent: (event: CalendarEvent) => void;
}) {
  const [pastOpen, setPastOpen] = React.useState(false);
  const [upcomingOpen, setUpcomingOpen] = React.useState(true);

  if (loading) {
    return (
      <div className="flex h-full min-h-[8rem] items-center justify-center p-6">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <CollapsibleEventBlock
        id="cal-past-events"
        title="30 derniers jours"
        count={pastEvents.length}
        open={pastOpen}
        onOpenChange={setPastOpen}
        emptyMessage="Aucun événement sur les 30 derniers jours."
      >
        <EventRows
          events={pastEvents}
          onFocusEventInCalendar={onFocusEventInCalendar}
          onEditEvent={onEditEvent}
        />
      </CollapsibleEventBlock>
      <CollapsibleEventBlock
        id="cal-upcoming-events"
        title="À venir (30 jours)"
        count={upcomingEvents.length}
        open={upcomingOpen}
        onOpenChange={setUpcomingOpen}
        emptyMessage="Aucun événement à venir dans les 30 prochains jours."
      >
        <EventRows
          events={upcomingEvents}
          onFocusEventInCalendar={onFocusEventInCalendar}
          onEditEvent={onEditEvent}
        />
      </CollapsibleEventBlock>
    </div>
  );
}

function CollapsibleEventBlock({
  id,
  title,
  count,
  open,
  onOpenChange,
  emptyMessage,
  children,
}: {
  id: string;
  title: string;
  count: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--color-border)] last:border-b-0">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--color-muted)]/30"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-200",
            open ? "rotate-0" : "-rotate-90",
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1 text-sm font-medium text-[var(--color-foreground)]">
          {title}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-[var(--color-muted-foreground)]">
          {count}
        </span>
      </button>
      {open ? (
        <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-trigger`}>
          {count === 0 ? (
            <p className="px-3 pb-3 pl-9 text-xs text-[var(--color-muted-foreground)]">
              {emptyMessage}
            </p>
          ) : (
            children
          )}
        </div>
      ) : null}
    </div>
  );
}

function EventRows({
  events,
  onFocusEventInCalendar,
  onEditEvent,
}: {
  events: CalendarEvent[];
  onFocusEventInCalendar: (event: CalendarEvent) => void;
  onEditEvent: (event: CalendarEvent) => void;
}) {
  return (
    <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
      {events.map((e) => {
        const palette = calendarSourceClasses(e.source);
        const EditIcon = sidePanelEditIcon(e);
        const editLabel = sidePanelEditLabel(e);
        return (
          <li key={e.id} className="flex items-stretch gap-0.5">
            <button
              type="button"
              onClick={() => onFocusEventInCalendar(e)}
              className="flex min-w-0 flex-1 items-start gap-2 px-2 py-2 pl-9 text-left hover:bg-[var(--color-muted)]/40"
            >
              <span
                className={cn(
                  "mt-1 inline-block h-2 w-2 shrink-0 rounded-full",
                  palette.dot,
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{e.title}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-[var(--color-muted-foreground)]">
                    {DAY_SHORT_FMT.format(dateFromIso(e.date))}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-[var(--color-muted-foreground)]">
                  {calendarSourceLabel(e.source)}
                  {e.subtitle ? ` · ${e.subtitle}` : ""}
                  {e.status ? ` · ${e.status}` : ""}
                </div>
              </div>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="my-0.5 mr-1 h-8 w-8 shrink-0 self-center text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              aria-label={editLabel}
              title={editLabel}
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                onEditEvent(e);
              }}
            >
              <EditIcon className="h-4 w-4" aria-hidden />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
