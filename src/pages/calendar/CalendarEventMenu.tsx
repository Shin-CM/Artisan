import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { CalendarEvent } from "@/lib/calendarEvents";

export type CalendarEventActions = {
  onOpen: (event: CalendarEvent) => void;
  onEditNeutral: (event: CalendarEvent) => void;
  onDeleteNeutral: (event: CalendarEvent) => void;
  onShiftEvent: (event: CalendarEvent, deltaDays: number) => void;
  onMarkReminderDone: (event: CalendarEvent) => void;
  onDeleteReminder: (event: CalendarEvent) => void;
};

export function CalendarEventMenu({
  event,
  actions,
  children,
}: {
  event: CalendarEvent;
  actions: CalendarEventActions;
  children: React.ReactNode;
}) {
  const editable = Boolean(event.editable);
  const isNeutral = event.source === "neutral";
  const isReminder = event.source === "reminder";
  const isOverdue = event.source === "invoice-overdue";

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onSelect={(e) => {
            e.preventDefault();
            actions.onOpen(event);
          }}
        >
          {isOverdue ? "Ouvrir la facture" : "Ouvrir"}
        </ContextMenuItem>
        {isNeutral || isReminder ? (
          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault();
              if (isNeutral) actions.onEditNeutral(event);
              else actions.onOpen(event);
            }}
          >
            Modifier…
          </ContextMenuItem>
        ) : null}
        {editable ? (
          <ContextMenuSub>
            <ContextMenuSubTrigger>Reporter</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  actions.onShiftEvent(event, 1);
                }}
              >
                À demain
              </ContextMenuItem>
              <ContextMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  actions.onShiftEvent(event, 7);
                }}
              >
                +1 semaine
              </ContextMenuItem>
              {isNeutral ? (
                <ContextMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    actions.onEditNeutral(event);
                  }}
                >
                  Date personnalisée…
                </ContextMenuItem>
              ) : null}
            </ContextMenuSubContent>
          </ContextMenuSub>
        ) : null}
        {isReminder ? (
          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault();
              actions.onMarkReminderDone(event);
            }}
          >
            Marquer comme traité
          </ContextMenuItem>
        ) : null}
        {isOverdue ? (
          <ContextMenuItem disabled>
            Ignorer cette semaine (à venir)
          </ContextMenuItem>
        ) : null}
        {isNeutral || isReminder ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-red-600 focus:text-red-700 dark:text-red-300"
              onSelect={(e) => {
                e.preventDefault();
                if (isNeutral) actions.onDeleteNeutral(event);
                else actions.onDeleteReminder(event);
              }}
            >
              Supprimer
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}
