import * as React from "react";
import type { Project } from "@/lib/api";

export type ProjectWorkspaceContextValue = {
  projectId: string;
  project: Project | null;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  reloadProject: () => Promise<void>;
};

const ProjectWorkspaceContext =
  React.createContext<ProjectWorkspaceContextValue | null>(null);

export function ProjectWorkspaceProvider({
  projectId,
  project,
  setProject,
  reloadProject,
  children,
}: {
  projectId: string;
  project: Project | null;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  reloadProject: () => Promise<void>;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({ projectId, project, setProject, reloadProject }),
    [projectId, project, setProject, reloadProject],
  );
  return (
    <ProjectWorkspaceContext.Provider value={value}>
      {children}
    </ProjectWorkspaceContext.Provider>
  );
}

export function useOptionalProjectWorkspace(): ProjectWorkspaceContextValue | null {
  return React.useContext(ProjectWorkspaceContext);
}

export function useProjectWorkspace(): ProjectWorkspaceContextValue {
  const v = React.useContext(ProjectWorkspaceContext);
  if (!v) {
    throw new Error("useProjectWorkspace hors contexte projet.");
  }
  return v;
}
