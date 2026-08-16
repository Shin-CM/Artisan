import * as React from "react";
import * as api from "@/lib/api";
import { toast } from "sonner";

export function useProjectsPageState(workspaceId: string | undefined) {
  const [projects, setProjects] = React.useState<api.Project[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [documents, setDocuments] = React.useState<api.ProjectDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = React.useState(false);
  const [financialSummary, setFinancialSummary] =
    React.useState<api.ProjectFinancialSummary | null>(null);
  const [loadingFinancial, setLoadingFinancial] = React.useState(false);
  const [timeEntries, setTimeEntries] = React.useState<api.ProjectTimeEntry[]>(
    [],
  );
  const [loadingTimeEntries, setLoadingTimeEntries] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!workspaceId) {
      setProjects([]);
      return;
    }
    try {
      const list = await api.listProjects(workspaceId);
      setProjects(list);
      setSelectedId((prev) =>
        prev && list.some((p) => p.id === prev) ? prev : null,
      );
    } catch (e) {
      toast.error(String(e));
    }
  }, [workspaceId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const loadDocuments = React.useCallback(async (projectId: string | null) => {
    if (!projectId) {
      setDocuments([]);
      return;
    }
    setLoadingDocs(true);
    try {
      const list = await api.listProjectDocuments(projectId);
      setDocuments(list);
    } catch (e) {
      toast.error(String(e));
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  const loadFinancial = React.useCallback(async (projectId: string | null) => {
    if (!projectId) {
      setFinancialSummary(null);
      return;
    }
    setLoadingFinancial(true);
    try {
      const s = await api.getProjectFinancialSummary(projectId);
      setFinancialSummary(s);
    } catch (e) {
      toast.error(String(e));
      setFinancialSummary(null);
    } finally {
      setLoadingFinancial(false);
    }
  }, []);

  const loadTimeEntries = React.useCallback(async (projectId: string | null) => {
    if (!projectId) {
      setTimeEntries([]);
      return;
    }
    setLoadingTimeEntries(true);
    try {
      const list = await api.listProjectTimeEntries(projectId);
      setTimeEntries(list);
    } catch (e) {
      toast.error(String(e));
      setTimeEntries([]);
    } finally {
      setLoadingTimeEntries(false);
    }
  }, []);

  React.useEffect(() => {
    void loadDocuments(selectedId);
  }, [selectedId, loadDocuments]);

  React.useEffect(() => {
    void loadFinancial(selectedId);
  }, [selectedId, loadFinancial]);

  React.useEffect(() => {
    void loadTimeEntries(selectedId);
  }, [selectedId, loadTimeEntries]);

  const reloadDocuments = React.useCallback(() => {
    void loadDocuments(selectedId);
  }, [selectedId, loadDocuments]);

  const reloadFinancial = React.useCallback(() => {
    void loadFinancial(selectedId);
  }, [selectedId, loadFinancial]);

  const reloadTimeEntries = React.useCallback(() => {
    void loadTimeEntries(selectedId);
  }, [selectedId, loadTimeEntries]);

  return {
    projects,
    setProjects,
    selectedId,
    setSelectedId,
    documents,
    loadingDocs,
    financialSummary,
    loadingFinancial,
    reloadFinancial,
    timeEntries,
    loadingTimeEntries,
    reloadTimeEntries,
    reload: load,
    reloadDocuments,
  };
}
