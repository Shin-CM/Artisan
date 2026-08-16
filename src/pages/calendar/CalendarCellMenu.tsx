import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export type CalendarCellActions = {
  clientFollowupEnabled: boolean;
  recoveryAssistedEnabled: boolean;
  hasEvents: boolean;
  hasDraftSelection: boolean;
  onCreateEvent: () => void;
  onCreateEventFromDraft?: () => void;
  onCreateReminder: () => void;
  onScheduleRecovery: () => void;
  onOpenDay: () => void;
};

export function CalendarCellMenu({
  iso,
  actions,
  children,
}: {
  iso: string;
  actions: CalendarCellActions;
  children: React.ReactNode;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {actions.hasDraftSelection && actions.onCreateEventFromDraft ? (
          <>
            <ContextMenuItem
              onSelect={(e) => {
                e.preventDefault();
                actions.onCreateEventFromDraft?.();
              }}
            >
              Créer l’événement à partir de la sélection
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        ) : null}
        <ContextMenuItem
          onSelect={(e) => {
            e.preventDefault();
            actions.onCreateEvent();
          }}
        >
          Nouvel événement… ({iso})
        </ContextMenuItem>
        {actions.clientFollowupEnabled ? (
          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault();
              actions.onCreateReminder();
            }}
          >
            Nouveau rappel client…
          </ContextMenuItem>
        ) : null}
        {actions.recoveryAssistedEnabled ? (
          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault();
              actions.onScheduleRecovery();
            }}
          >
            Planifier une relance…
          </ContextMenuItem>
        ) : null}
        {actions.hasEvents ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={(e) => {
                e.preventDefault();
                actions.onOpenDay();
              }}
            >
              Voir les événements du jour
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}
