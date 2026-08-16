import type { RecoveryAction, RecoveryActionInput } from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { now, rid } from "@/lib/apiMock/store";

const sessionRecoveryActions: RecoveryAction[] = [];

function normalize(input: RecoveryActionInput): RecoveryActionInput {
  if (!input.dueAt || input.dueAt.length < 10) {
    throw new Error("due_at invalide (format YYYY-MM-DD ou ISO).");
  }
  return {
    invoiceId: input.invoiceId?.trim() || null,
    kind: input.kind?.trim() || "email",
    status: input.status?.trim() || "scheduled",
    dueAt: input.dueAt,
    notes: input.notes?.trim() || null,
  };
}

export const recoveryActionHandlers: Record<string, MockHandler> = {
  list_recovery_actions: (args) => {
    const workspaceId = args.workspaceId as string;
    return sessionRecoveryActions
      .filter((a) => a.workspaceId === workspaceId)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  },

  create_recovery_action: (args) => {
    const workspaceId = args.workspaceId as string;
    const cleaned = normalize(args.input as RecoveryActionInput);
    const t = now();
    const row: RecoveryAction = {
      id: rid(),
      workspaceId,
      invoiceId: cleaned.invoiceId ?? null,
      kind: cleaned.kind ?? "email",
      status: cleaned.status ?? "scheduled",
      dueAt: cleaned.dueAt,
      notes: cleaned.notes ?? null,
      createdAt: t,
      updatedAt: t,
    };
    sessionRecoveryActions.push(row);
    return row;
  },

  get_recovery_action: (args) => {
    const id = args.id as string;
    const a = sessionRecoveryActions.find((x) => x.id === id);
    if (!a) throw new Error("Relance introuvable.");
    return a;
  },

  update_recovery_action: (args) => {
    const id = args.id as string;
    const cleaned = normalize(args.input as RecoveryActionInput);
    const idx = sessionRecoveryActions.findIndex((a) => a.id === id);
    if (idx < 0) throw new Error("Relance introuvable.");
    const old = sessionRecoveryActions[idx];
    const t = now();
    const next: RecoveryAction = {
      ...old,
      invoiceId: cleaned.invoiceId ?? null,
      kind: cleaned.kind ?? old.kind,
      status: cleaned.status ?? old.status,
      dueAt: cleaned.dueAt,
      notes: cleaned.notes ?? null,
      updatedAt: t,
    };
    sessionRecoveryActions[idx] = next;
    return next;
  },

  delete_recovery_action: (args) => {
    const id = args.id as string;
    const i = sessionRecoveryActions.findIndex((a) => a.id === id);
    if (i >= 0) sessionRecoveryActions.splice(i, 1);
  },
};
