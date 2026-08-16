import * as React from "react";
import type { Workspace } from "@/lib/api";
import * as api from "@/lib/api";

type Ctx = {
  workspaces: Workspace[];
  active: Workspace | null;
  refresh: () => Promise<void>;
  refreshActiveWorkspace: () => Promise<void>;
  openWorkspace: (w: Workspace) => void;
  leaveWorkspace: () => void;
  setActive: (w: Workspace | null) => void;
};

const WorkspaceContext = React.createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [active, setActiveState] = React.useState<Workspace | null>(() => {
    try {
      const raw = localStorage.getItem("invoicies_active_workspace");
      return raw ? (JSON.parse(raw) as Workspace) : null;
    } catch {
      return null;
    }
  });

  const refresh = React.useCallback(async () => {
    const list = await api.listWorkspaces();
    setWorkspaces(list);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const openWorkspace = React.useCallback((w: Workspace) => {
    void (async () => {
      try {
        const full = await api.getWorkspace(w.id);
        setActiveState(full);
        localStorage.setItem(
          "invoicies_active_workspace",
          JSON.stringify(full),
        );
        setWorkspaces((prev) => {
          const i = prev.findIndex((x) => x.id === full.id);
          if (i < 0) return [...prev, full];
          return prev.map((x) => (x.id === full.id ? full : x));
        });
      } catch {
        setActiveState(w);
        localStorage.setItem(
          "invoicies_active_workspace",
          JSON.stringify(w),
        );
      }
    })();
  }, []);

  const leaveWorkspace = React.useCallback(() => {
    setActiveState(null);
    localStorage.removeItem("invoicies_active_workspace");
  }, []);

  React.useEffect(() => {
    if (!active || workspaces.length === 0) return;
    if (!workspaces.some((w) => w.id === active.id)) {
      leaveWorkspace();
    }
  }, [active, workspaces, leaveWorkspace]);

  const setActive = React.useCallback((w: Workspace | null) => {
    setActiveState(w);
    if (w) localStorage.setItem("invoicies_active_workspace", JSON.stringify(w));
    else localStorage.removeItem("invoicies_active_workspace");
  }, []);

  const refreshActiveWorkspace = React.useCallback(async () => {
    const raw = localStorage.getItem("invoicies_active_workspace");
    if (!raw) return;
    try {
      const cur = JSON.parse(raw) as { id?: string };
      if (!cur?.id) return;
      const w = await api.getWorkspace(cur.id);
      setActiveState(w);
      localStorage.setItem("invoicies_active_workspace", JSON.stringify(w));
      setWorkspaces((prev) => {
        const i = prev.findIndex((x) => x.id === w.id);
        if (i < 0) return prev;
        return prev.map((x) => (x.id === w.id ? w : x));
      });
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    void refreshActiveWorkspace();
  }, [refreshActiveWorkspace]);

  const value = React.useMemo(
    () => ({
      workspaces,
      active,
      refresh,
      refreshActiveWorkspace,
      openWorkspace,
      leaveWorkspace,
      setActive,
    }),
    [
      workspaces,
      active,
      refresh,
      refreshActiveWorkspace,
      openWorkspace,
      leaveWorkspace,
      setActive,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const v = React.useContext(WorkspaceContext);
  if (!v) throw new Error("useWorkspace hors provider");
  return v;
}
