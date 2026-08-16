import * as React from "react";
import { toast } from "sonner";
import { type NavigateFunction } from "react-router-dom";
import * as api from "@/lib/api";
import type { CalendarEvent } from "@/lib/calendarEvents";
import {
  dateFromIso,
  isoFromYearMonthDay,
} from "./calendarGrid";
import {
  draftFromEvent,
  emptyDraft,
  type CalendarEventDraft,
  type CalendarEventModalMode,
} from "./CalendarEventModal";

/**
 * Regroupe toutes les actions « événements calendrier » (déplacement / report,
 * édition, suppression, marquage). Extrait du `CalendarPage` pour rester sous
 * la limite de 800 lignes par fichier.
 */
export type CalendarEventActionsHandle = {
  shiftEvent: (
    event: CalendarEvent,
    deltaDays: number,
    options?: { withUndoToast?: boolean },
  ) => Promise<void>;
  markReminderDone: (event: CalendarEvent) => Promise<void>;
  deleteReminder: (event: CalendarEvent) => Promise<void>;
  deleteNeutral: (event: CalendarEvent) => Promise<void>;
  openEvent: (event: CalendarEvent) => void;
  editNeutral: (event: CalendarEvent) => void;
  openNeutralEdit: (id: string) => Promise<void>;
  openCreateNeutral: (startIso?: string, endIso?: string) => void;
};

function shiftIsoLocal(iso: string, delta: number): string {
  const d = dateFromIso(iso);
  d.setDate(d.getDate() + delta);
  return isoFromYearMonthDay(d.getFullYear(), d.getMonth(), d.getDate());
}

export function useCalendarEventActions({
  today,
  navigate,
  reload,
  onOpenModal,
  onClearDay,
}: {
  today: string;
  navigate: NavigateFunction;
  reload: () => void;
  onOpenModal: (state: {
    mode: CalendarEventModalMode;
    draft: CalendarEventDraft;
    fromRange: boolean;
  }) => void;
  onClearDay: () => void;
}): CalendarEventActionsHandle {
  const shiftEvent = React.useCallback(
    async (
      event: CalendarEvent,
      deltaDays: number,
      options: { withUndoToast?: boolean } = {},
    ) => {
      if (!event.entityId || !event.editable || deltaDays === 0) return;
      try {
        if (event.source === "neutral") {
          const full = await api.getCalendarEvent(event.entityId);
          await api.updateCalendarEvent(event.entityId, {
            title: full.title,
            note: full.note,
            startDate: shiftIsoLocal(full.startDate, deltaDays),
            endDate: shiftIsoLocal(full.endDate, deltaDays),
            colorKey: full.colorKey,
            colorHex: full.colorHex,
            clientId: full.clientId,
            projectId: full.projectId,
            invoiceId: full.invoiceId,
          });
          toast.success(
            options.withUndoToast ? "Événement déplacé." : "Événement reporté.",
            options.withUndoToast
              ? {
                  action: {
                    label: "Annuler",
                    onClick: () => void shiftEvent(event, -deltaDays),
                  },
                }
              : undefined,
          );
          reload();
          return;
        }
        if (event.source === "reminder") {
          const full = await api.getReminder(event.entityId);
          const day = full.dueAt.slice(0, 10);
          const time = full.dueAt.length > 10 ? full.dueAt.slice(10) : "";
          const next = shiftIsoLocal(day, deltaDays);
          await api.updateReminder(event.entityId, {
            clientId: full.clientId,
            title: full.title,
            note: full.note,
            dueAt: `${next}${time}`,
            status: full.status,
            recurrenceRule: full.recurrenceRule,
          });
          toast.success(
            options.withUndoToast ? "Rappel déplacé." : "Rappel reporté.",
            options.withUndoToast
              ? {
                  action: {
                    label: "Annuler",
                    onClick: () => void shiftEvent(event, -deltaDays),
                  },
                }
              : undefined,
          );
          reload();
          return;
        }
        if (event.source === "recovery-scheduled") {
          const full = await api.getRecoveryAction(event.entityId);
          const day = full.dueAt.slice(0, 10);
          const tail = full.dueAt.length > 10 ? full.dueAt.slice(10) : "";
          const next = shiftIsoLocal(day, deltaDays);
          await api.updateRecoveryAction(event.entityId, {
            invoiceId: full.invoiceId,
            kind: full.kind,
            status: full.status,
            dueAt: `${next}${tail}`,
            notes: full.notes,
          });
          toast.success(
            options.withUndoToast ? "Relance déplacée." : "Relance reportée.",
            options.withUndoToast
              ? {
                  action: {
                    label: "Annuler",
                    onClick: () => void shiftEvent(event, -deltaDays),
                  },
                }
              : undefined,
          );
          reload();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    },
    [reload],
  );

  const markReminderDone = React.useCallback(
    async (event: CalendarEvent) => {
      if (!event.entityId) return;
      try {
        const full = await api.getReminder(event.entityId);
        await api.updateReminder(event.entityId, {
          clientId: full.clientId,
          title: full.title,
          note: full.note,
          dueAt: full.dueAt,
          status: "done",
          recurrenceRule: full.recurrenceRule,
        });
        toast.success("Rappel marqué comme traité.");
        reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    },
    [reload],
  );

  const deleteReminder = React.useCallback(
    async (event: CalendarEvent) => {
      if (!event.entityId) return;
      try {
        const snapshot = await api.getReminder(event.entityId);
        await api.deleteReminder(event.entityId);
        toast.success("Rappel supprimé.", {
          action: {
            label: "Annuler",
            onClick: () => {
              void api
                .createReminder(snapshot.workspaceId, {
                  clientId: snapshot.clientId,
                  title: snapshot.title,
                  note: snapshot.note,
                  dueAt: snapshot.dueAt,
                  status: snapshot.status,
                  recurrenceRule: snapshot.recurrenceRule,
                })
                .then(() => {
                  toast.success("Rappel restauré.");
                  reload();
                })
                .catch((err) => {
                  toast.error(err instanceof Error ? err.message : String(err));
                });
            },
          },
        });
        reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    },
    [reload],
  );

  const deleteNeutral = React.useCallback(
    async (event: CalendarEvent) => {
      if (!event.entityId) return;
      try {
        const snapshot = await api.getCalendarEvent(event.entityId);
        await api.deleteCalendarEvent(event.entityId);
        toast.success("Événement supprimé.", {
          action: {
            label: "Annuler",
            onClick: () => {
              void api
                .createCalendarEvent(snapshot.workspaceId, {
                  title: snapshot.title,
                  note: snapshot.note,
                  startDate: snapshot.startDate,
                  endDate: snapshot.endDate,
                  colorKey: snapshot.colorKey,
                  colorHex: snapshot.colorHex,
                  clientId: snapshot.clientId,
                  projectId: snapshot.projectId,
                  invoiceId: snapshot.invoiceId,
                })
                .then(() => {
                  toast.success("Événement restauré.");
                  reload();
                })
                .catch((err) => {
                  toast.error(err instanceof Error ? err.message : String(err));
                });
            },
          },
        });
        reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    },
    [reload],
  );

  const openNeutralEdit = React.useCallback(
    async (id: string) => {
      try {
        const full = await api.getCalendarEvent(id);
        onOpenModal({
          mode: "edit",
          draft: draftFromEvent(full),
          fromRange: false,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    },
    [onOpenModal],
  );

  const openCreateNeutral = React.useCallback(
    (startIso?: string, endIso?: string) => {
      const start = startIso ?? today;
      onOpenModal({
        mode: "create",
        draft: emptyDraft(start, endIso),
        fromRange: false,
      });
    },
    [onOpenModal, today],
  );

  const openEvent = React.useCallback(
    (event: CalendarEvent) => {
      onClearDay();
      if (event.source === "neutral" && event.entityId) {
        void openNeutralEdit(event.entityId);
        return;
      }
      void navigate(event.navigatePath);
    },
    [navigate, onClearDay, openNeutralEdit],
  );

  const editNeutral = React.useCallback(
    (event: CalendarEvent) => {
      if (!event.entityId) return;
      void openNeutralEdit(event.entityId);
    },
    [openNeutralEdit],
  );

  return {
    shiftEvent,
    markReminderDone,
    deleteReminder,
    deleteNeutral,
    openEvent,
    editNeutral,
    openNeutralEdit,
    openCreateNeutral,
  };
}
