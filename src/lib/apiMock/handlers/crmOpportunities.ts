import type { CrmOpportunity, CrmOpportunityInput } from "@/lib/api";
import type { MockHandler } from "@/lib/apiMock/handlerTypes";
import { ensureProjectWorkspace } from "@/lib/apiMock/handlers/projects";
import { now, rid, store } from "@/lib/apiMock/store";

const STAGES = new Set(["lead", "qualified", "proposal", "won", "lost"]);

function nextSort(wsId: string, stage: string): number {
  const inStage = store.crmOpportunities.filter(
    (o) => o.workspaceId === wsId && o.stage === stage,
  );
  const max = inStage.reduce((m, o) => Math.max(m, o.sortOrder), 0);
  return max + 1;
}

export const crmOpportunityHandlers: Record<string, MockHandler> = {
  list_crm_opportunities: (args) => {
    const workspaceId = args.workspaceId as string;
    return store.crmOpportunities
      .filter((o) => o.workspaceId === workspaceId)
      .sort((a, b) => {
        const s = a.stage.localeCompare(b.stage);
        if (s !== 0) return s;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  },

  create_crm_opportunity: (args) => {
    const workspaceId = args.workspaceId as string;
    const input = args.input as CrmOpportunityInput;
    const stage = input.stage?.trim() ?? "";
    if (!STAGES.has(stage)) throw new Error(`Étape CRM invalide : ${stage}`);
    const title = input.title?.trim() ?? "";
    if (!title) throw new Error("L’intitulé de l’opportunité est obligatoire.");
    ensureProjectWorkspace(workspaceId, input.projectId);
    const t = now();
    const sortOrder =
      input.sortOrder != null ? input.sortOrder : nextSort(workspaceId, stage);
    const row: CrmOpportunity = {
      id: rid(),
      workspaceId,
      clientId: input.clientId ?? null,
      quoteId: input.quoteId ?? null,
      projectId: input.projectId?.trim() || null,
      title,
      stage,
      amountEstimate: input.amountEstimate ?? null,
      nextAction: input.nextAction?.trim() || null,
      notes: input.notes?.trim() || null,
      sortOrder,
      createdAt: t,
      updatedAt: t,
    };
    store.crmOpportunities.push(row);
    return row;
  },

  update_crm_opportunity: (args) => {
    const id = args.id as string;
    const input = args.input as CrmOpportunityInput;
    const stage = input.stage?.trim() ?? "";
    if (!STAGES.has(stage)) throw new Error(`Étape CRM invalide : ${stage}`);
    const title = input.title?.trim() ?? "";
    if (!title) throw new Error("L’intitulé de l’opportunité est obligatoire.");
    const idx = store.crmOpportunities.findIndex((o) => o.id === id);
    if (idx < 0) throw new Error("Opportunité introuvable.");
    const old = store.crmOpportunities[idx];
    ensureProjectWorkspace(old.workspaceId, input.projectId);
    let sortOrder: number;
    if (input.sortOrder != null) {
      sortOrder = input.sortOrder;
    } else if (old.stage !== stage) {
      sortOrder = nextSort(old.workspaceId, stage);
    } else {
      sortOrder = old.sortOrder;
    }
    const t = now();
    const next: CrmOpportunity = {
      ...old,
      clientId: input.clientId ?? null,
      quoteId: input.quoteId ?? null,
      projectId: input.projectId?.trim() || null,
      title,
      stage,
      amountEstimate: input.amountEstimate ?? null,
      nextAction: input.nextAction?.trim() || null,
      notes: input.notes?.trim() || null,
      sortOrder,
      updatedAt: t,
    };
    store.crmOpportunities[idx] = next;
    return next;
  },

  delete_crm_opportunity: (args) => {
    const id = args.id as string;
    store.crmOpportunities = store.crmOpportunities.filter((o) => o.id !== id);
    return undefined;
  },
};
