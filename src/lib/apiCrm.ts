import { ipc } from "@/lib/apiCore";

export type CrmOpportunityStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

export type CrmOpportunity = {
  id: string;
  workspaceId: string;
  clientId: string | null;
  quoteId: string | null;
  projectId?: string | null;
  title: string;
  stage: string;
  amountEstimate: number | null;
  nextAction: string | null;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CrmOpportunityInput = {
  title?: string | null;
  clientId?: string | null;
  quoteId?: string | null;
  projectId?: string | null;
  stage: string;
  amountEstimate?: number | null;
  nextAction?: string | null;
  notes?: string | null;
  sortOrder?: number | null;
};

export async function listCrmOpportunities(
  workspaceId: string,
): Promise<CrmOpportunity[]> {
  return ipc("list_crm_opportunities", { workspaceId });
}

export async function createCrmOpportunity(
  workspaceId: string,
  input: CrmOpportunityInput,
): Promise<CrmOpportunity> {
  return ipc("create_crm_opportunity", { workspaceId, input });
}

export async function updateCrmOpportunity(
  id: string,
  input: CrmOpportunityInput,
): Promise<CrmOpportunity> {
  return ipc("update_crm_opportunity", { id, input });
}

export async function deleteCrmOpportunity(id: string): Promise<void> {
  return ipc("delete_crm_opportunity", { id });
}

/** --- Suivi client / relance --- */
