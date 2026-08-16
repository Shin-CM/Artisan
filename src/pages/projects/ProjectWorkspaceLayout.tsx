import * as React from "react";
import {
  NavLink,
  Navigate,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  Settings2,
  ShoppingCart,
} from "lucide-react";
import { DocumentModulePageGate } from "@/components/DocumentModulePageGate";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { ProjectWorkspaceProvider } from "@/context/ProjectWorkspaceContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";
import { MARKETPLACE_ROUTE_DOCUMENT_PROJECTS } from "@/lib/marketplaceModules";
import { projectStatusLabel } from "@/pages/projects/projectUtils";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-[var(--color-muted)]",
    isActive && "bg-[var(--color-muted)] font-medium",
  );

export function ProjectWorkspaceLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const { active } = useWorkspace();
  const navigate = useNavigate();
  const { loading: modLoading, projectsEnabled, purchaseOrdersEnabled } =
    useDocumentModules();
  const [project, setProject] = React.useState<api.Project | null>(null);
  const [loadingProject, setLoadingProject] = React.useState(true);

  const reloadProject = React.useCallback(async () => {
    if (!projectId) return;
    try {
      const p = await api.getProject(projectId);
      if (active && p.workspaceId !== active.id) {
        navigate("/home/projects", { replace: true });
        return;
      }
      setProject(p);
    } catch {
      navigate("/home/projects", { replace: true });
    }
  }, [projectId, active, navigate]);

  React.useEffect(() => {
    if (!projectId || !active?.id) {
      setLoadingProject(false);
      setProject(null);
      return;
    }
    setLoadingProject(true);
    void api
      .getProject(projectId)
      .then((p) => {
        if (p.workspaceId !== active.id) {
          navigate("/home/projects", { replace: true });
          return;
        }
        setProject(p);
      })
      .catch(() => navigate("/home/projects", { replace: true }))
      .finally(() => setLoadingProject(false));
  }, [projectId, active?.id, navigate]);

  if (!projectId) {
    return <Navigate to="/home/projects" replace />;
  }

  const base = `/home/projects/${projectId}`;

  return (
    <DocumentModulePageGate
      enabled={projectsEnabled}
      loading={modLoading}
      redirectToast="Activez le module Projets dans la Marketplace pour accéder à cette page."
      redirectTo={MARKETPLACE_ROUTE_DOCUMENT_PROJECTS}
    >
      <ProjectWorkspaceProvider
        projectId={projectId}
        project={project}
        setProject={setProject}
        reloadProject={reloadProject}
      >
        <div className="flex h-full min-h-0">
          <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-muted)]/20 p-2 text-sm">
            <NavLink
              to="/home/projects"
              className="mb-2 flex items-center gap-2 rounded px-2 py-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              Tous les projets
            </NavLink>
            <div className="mb-3 border-b border-[var(--color-border)] pb-2">
              <p className="flex items-center gap-1.5 truncate px-1 font-medium">
                <FolderKanban className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                <span className="truncate" title={project?.name}>
                  {loadingProject ? "…" : (project?.name ?? "—")}
                </span>
              </p>
              {project ? (
                <p className="mt-0.5 truncate px-1 text-xs text-[var(--color-muted-foreground)]">
                  {projectStatusLabel(project.status)}
                  {project.code ? ` · ${project.code}` : ""}
                </p>
              ) : null}
            </div>
            <nav className="flex min-h-0 flex-1 flex-col gap-0.5">
              <NavLink to={`${base}/dashboard`} className={navClass} end>
                <LayoutDashboard className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                Tableau de bord
              </NavLink>
              <NavLink to={`${base}/detail`} className={navClass}>
                <Settings2 className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                Fiche projet
              </NavLink>
              <NavLink to={`${base}/quotes`} className={navClass}>
                <FileText className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                Devis
              </NavLink>
              {purchaseOrdersEnabled ? (
                <NavLink to={`${base}/purchase-orders`} className={navClass}>
                  <ShoppingCart className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  Bons de commande
                </NavLink>
              ) : null}
              <NavLink to={`${base}/invoices`} className={navClass}>
                <Receipt className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                Factures
              </NavLink>
            </nav>
          </aside>
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            {loadingProject ? (
              <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted-foreground)]">
                Chargement du projet…
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </ProjectWorkspaceProvider>
    </DocumentModulePageGate>
  );
}
