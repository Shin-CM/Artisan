import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useProjectWorkspace } from "@/context/ProjectWorkspaceContext";
import * as api from "@/lib/api";
import { ProjectDetailPanel } from "@/pages/projects/ProjectDetailPanel";
import { useProjectWorkspaceDetailData } from "@/pages/projects/useProjectWorkspaceDetailData";

export function ProjectDetailPage() {
  const navigate = useNavigate();
  const { active } = useWorkspace();
  const { projectId, project, setProject, reloadProject } = useProjectWorkspace();
  const [clients, setClients] = React.useState<api.Client[]>([]);
  const {
    documents,
    loadingDocs,
    financialSummary,
    loadingFinancial,
    reloadFinancial,
    timeEntries,
    loadingTimeEntries,
    reloadTimeEntries,
    reloadDocuments,
  } = useProjectWorkspaceDetailData(projectId);

  React.useEffect(() => {
    if (!active) return;
    void api.listClients(active.id).then(setClients).catch(() => setClients([]));
  }, [active]);

  return (
    <ProjectDetailPanel
      workspace={active}
      project={project}
      clients={clients}
      baseCurrency={active?.baseCurrency ?? "EUR"}
      documents={documents}
      loadingDocs={loadingDocs}
      financialSummary={financialSummary}
      loadingFinancial={loadingFinancial}
      timeEntries={timeEntries}
      loadingTimeEntries={loadingTimeEntries}
      onSaved={(p) => {
        setProject(p);
        void reloadProject();
      }}
      onDeleted={() => navigate("/home/projects", { replace: true })}
      onLinkedDocumentCreated={() => {
        void reloadDocuments();
        void reloadFinancial();
      }}
      onTimeEntriesChanged={() => void reloadTimeEntries()}
      panelMode="settings"
      documentLinkProjectId={projectId}
    />
  );
}
