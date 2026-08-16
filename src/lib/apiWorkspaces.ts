import { ipc } from "@/lib/apiCore";

export type Workspace = {
  id: string;
  name: string;
  entityType: string;
  countryCode: string;
  profileJson: string;
  baseCurrency: string;
  theme: string;
  pdfOutputDir: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listWorkspaces(): Promise<Workspace[]> {
  return ipc("list_workspaces");
}

export async function createWorkspace(input: {
  name: string;
  entityType?: string;
  countryCode?: string;
  profileJson?: Record<string, unknown>;
  baseCurrency?: string;
  pdfOutputDir?: string | null;
}): Promise<Workspace> {
  return ipc("create_workspace", { input });
}

export async function updateWorkspace(
  id: string,
  input: {
    name: string;
    entityType?: string;
    countryCode?: string;
    profileJson?: Record<string, unknown>;
    baseCurrency?: string;
    pdfOutputDir?: string | null;
  },
): Promise<Workspace> {
  return ipc("update_workspace", { id, input });
}

export async function deleteWorkspace(id: string): Promise<void> {
  return ipc("delete_workspace", { id });
}

export async function getWorkspace(id: string): Promise<Workspace> {
  return ipc("get_workspace", { id });
}

export async function updateWorkspaceTheme(
  id: string,
  theme: string,
): Promise<void> {
  return ipc("update_workspace_theme", { id, theme });
}
