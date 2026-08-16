import * as React from "react";
import * as api from "@/lib/api";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  isCreditNotesModuleEnabledForWorkspace,
  isClientFollowupEnabledForWorkspace,
  isCrmPipelineEnabledForWorkspace,
  isProjectsModuleEnabledForWorkspace,
  isPurchaseOrdersModuleEnabledForWorkspace,
  isRecoveryAssistedEnabledForWorkspace,
  isStockManagerModuleEnabledForWorkspace,
} from "@/lib/marketplaceModules";

type DocumentModulesContextValue = {
  loading: boolean;
  plugins: api.PluginRow[];
  refresh: () => Promise<void>;
  purchaseOrdersEnabled: boolean;
  creditNotesEnabled: boolean;
  crmPipelineEnabled: boolean;
  clientFollowupEnabled: boolean;
  recoveryAssistedEnabled: boolean;
  projectsEnabled: boolean;
  stockManagerEnabled: boolean;
};

const DocumentModulesContext = React.createContext<
  DocumentModulesContextValue | null
>(null);

export function DocumentModulesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { active } = useWorkspace();
  const [plugins, setPlugins] = React.useState<api.PluginRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!active) {
      setPlugins([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await api.listPlugins(active.id);
      setPlugins(list);
    } catch {
      setPlugins([]);
    } finally {
      setLoading(false);
    }
  }, [active]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const value = React.useMemo<DocumentModulesContextValue>(
    () => ({
      loading,
      plugins,
      refresh: load,
      purchaseOrdersEnabled:
        isPurchaseOrdersModuleEnabledForWorkspace(plugins),
      creditNotesEnabled: isCreditNotesModuleEnabledForWorkspace(plugins),
      crmPipelineEnabled: isCrmPipelineEnabledForWorkspace(plugins),
      clientFollowupEnabled: isClientFollowupEnabledForWorkspace(plugins),
      recoveryAssistedEnabled: isRecoveryAssistedEnabledForWorkspace(plugins),
      projectsEnabled: isProjectsModuleEnabledForWorkspace(plugins),
      stockManagerEnabled: isStockManagerModuleEnabledForWorkspace(plugins),
    }),
    [loading, plugins, load],
  );

  return (
    <DocumentModulesContext.Provider value={value}>
      {children}
    </DocumentModulesContext.Provider>
  );
}

export function useDocumentModules(): DocumentModulesContextValue {
  const ctx = React.useContext(DocumentModulesContext);
  if (!ctx) {
    throw new Error(
      "useDocumentModules doit être utilisé sous DocumentModulesProvider",
    );
  }
  return ctx;
}
