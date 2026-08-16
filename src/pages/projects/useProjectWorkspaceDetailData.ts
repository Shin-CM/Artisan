import * as React from "react";
import * as api from "@/lib/api";
import { toast } from "sonner";

/** Données chargées pour la fiche / tableau de bord d’un projet (un seul id). */
export function useProjectWorkspaceDetailData(projectId: string | undefined) {
  const [documents, setDocuments] = React.useState<api.ProjectDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = React.useState(false);
  const [financialSummary, setFinancialSummary] =
    React.useState<api.ProjectFinancialSummary | null>(null);
  const [loadingFinancial, setLoadingFinancial] = React.useState(false);
  const [timeEntries, setTimeEntries] = React.useState<api.ProjectTimeEntry[]>(
    [],
  );
  const [loadingTimeEntries, setLoadingTimeEntries] = React.useState(false);

  const loadDocuments = React.useCallback(async (pid: string | undefined) => {
    if (!pid) {
      setDocuments([]);
      return;
    }
    setLoadingDocs(true);
    try {
      setDocuments(await api.listProjectDocuments(pid));
    } catch (e) {
      toast.error(String(e));
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  const loadFinancial = React.useCallback(async (pid: string | undefined) => {
    if (!pid) {
      setFinancialSummary(null);
      return;
    }
    setLoadingFinancial(true);
    try {
      setFinancialSummary(await api.getProjectFinancialSummary(pid));
    } catch (e) {
      toast.error(String(e));
      setFinancialSummary(null);
    } finally {
      setLoadingFinancial(false);
    }
  }, []);

  const loadTimeEntries = React.useCallback(async (pid: string | undefined) => {
    if (!pid) {
      setTimeEntries([]);
      return;
    }
    setLoadingTimeEntries(true);
    try {
      setTimeEntries(await api.listProjectTimeEntries(pid));
    } catch (e) {
      toast.error(String(e));
      setTimeEntries([]);
    } finally {
      setLoadingTimeEntries(false);
    }
  }, []);

  React.useEffect(() => {
    void loadDocuments(projectId);
  }, [projectId, loadDocuments]);

  React.useEffect(() => {
    void loadFinancial(projectId);
  }, [projectId, loadFinancial]);

  React.useEffect(() => {
    void loadTimeEntries(projectId);
  }, [projectId, loadTimeEntries]);

  const reloadDocuments = React.useCallback(() => {
    void loadDocuments(projectId);
  }, [projectId, loadDocuments]);

  const reloadFinancial = React.useCallback(() => {
    void loadFinancial(projectId);
  }, [projectId, loadFinancial]);

  const reloadTimeEntries = React.useCallback(() => {
    void loadTimeEntries(projectId);
  }, [projectId, loadTimeEntries]);

  return {
    documents,
    loadingDocs,
    financialSummary,
    loadingFinancial,
    reloadFinancial,
    timeEntries,
    loadingTimeEntries,
    reloadTimeEntries,
    reloadDocuments,
  };
}
