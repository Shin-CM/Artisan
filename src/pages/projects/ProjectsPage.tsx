import * as React from "react";
import { useNavigate } from "react-router-dom";
import { DocumentModulePageGate } from "@/components/DocumentModulePageGate";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { useGlobalSearch } from "@/context/GlobalSearchContext";
import { globalSearchNormalized } from "@/lib/globalSearchFilter";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { MARKETPLACE_ROUTE_DOCUMENT_PROJECTS } from "@/lib/marketplaceModules";
import { ProjectsSidebar } from "@/pages/projects/ProjectsSidebar";
import { useProjectsPageState } from "@/pages/projects/useProjectsPageState";
import { FolderKanban } from "lucide-react";

export function ProjectsPage() {
  const navigate = useNavigate();
  const { active } = useWorkspace();
  const { loading, projectsEnabled } = useDocumentModules();
  const { query: globalSearchQuery } = useGlobalSearch();
  const globalNorm = React.useMemo(
    () => globalSearchNormalized(globalSearchQuery),
    [globalSearchQuery],
  );

  const { projects, setProjects, selectedId, setSelectedId } =
    useProjectsPageState(active?.id);

  function openProject(id: string) {
    setSelectedId(id);
    navigate(`/home/projects/${id}/dashboard`);
  }

  async function handleCreate() {
    if (!active) return;
    try {
      const p = await api.createProject(active.id, {
        name: "Nouveau projet",
        status: "draft",
      });
      setProjects((prev) => [p, ...prev]);
      toast.success("Projet créé");
      openProject(p.id);
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <DocumentModulePageGate
      enabled={projectsEnabled}
      loading={loading}
      redirectToast="Activez le module Projets dans la Marketplace pour accéder à cette page."
      redirectTo={MARKETPLACE_ROUTE_DOCUMENT_PROJECTS}
    >
      <div className="flex h-full min-h-0">
        <ProjectsSidebar
          projects={projects}
          selectedId={selectedId}
          onSelect={openProject}
          onCreate={handleCreate}
          globalSearchNorm={globalNorm}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          <FolderKanban
            className="h-10 w-10 shrink-0 opacity-40"
            aria-hidden
          />
          <p>
            Choisissez un projet dans la liste ou créez-en un pour accéder au
            tableau de bord, aux documents et à la fiche.
          </p>
        </div>
      </div>
    </DocumentModulePageGate>
  );
}
