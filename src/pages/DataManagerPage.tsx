import * as React from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import { DataManagerTreeSidebar } from "@/features/dataManager/DataManagerTreeSidebar";
import { DataManagerMainPanel } from "@/features/dataManager/DataManagerMainPanel";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { useSidebarSelection } from "@/features/dataManager/sidebarSelection";
import { useDataManagerWorkspaceData } from "@/features/dataManager/useDataManagerWorkspaceData";
import { MarketplaceModuleBadge } from "@/components/marketplace/MarketplaceModuleBadge";
import {
  isDataManagerLazyLoadEnabled,
  MARKETPLACE_ROUTE_DATA_MANAGER_LAZY,
} from "@/lib/marketplaceModules";

export function DataManagerPage() {
  const { active } = useWorkspace();
  const [selectedId, setSelectedId] = React.useState("workspace");
  const [plugins, setPlugins] = React.useState<api.PluginRow[]>([]);

  React.useEffect(() => {
    if (!active?.id) {
      setPlugins([]);
      return;
    }
    let cancelled = false;
    void api.listPlugins(active.id).then((rows) => {
      if (!cancelled) setPlugins(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [active?.id]);

  const lazyLoad = isDataManagerLazyLoadEnabled(plugins);
  const sidebarSel = useSidebarSelection();
  const {
    bundle,
    history,
    refresh,
    countByKey,
    ensureLoadedForScope,
    loadingForScope,
  } = useDataManagerWorkspaceData(active?.id ?? null, { lazyLoad });

  if (!active) return null;

  return (
    <div className="flex h-full min-h-0">
      <DataManagerTreeSidebar
        selectedId={selectedId}
        onSelect={setSelectedId}
        categories={bundle.categories}
        bundle={bundle}
        countByKey={countByKey}
        history={history}
        selectionMap={sidebarSel.selection}
        onToggleSelection={sidebarSel.toggle}
        onSelectAllInScope={sidebarSel.selectAllInScope}
        onClearScope={sidebarSel.clearScope}
        lazyLoad={lazyLoad}
        ensureLoadedForScope={ensureLoadedForScope}
        loadingForScope={loadingForScope}
      />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
        <div className="relative mx-auto w-full max-w-6xl space-y-4">
          {lazyLoad ? (
            <div className="absolute right-0 top-0 z-[1]">
              <MarketplaceModuleBadge to={MARKETPLACE_ROUTE_DATA_MANAGER_LAZY} />
            </div>
          ) : null}
          <div className={lazyLoad ? "pr-10" : undefined}>
            <PageTitleWithInfo description="Arborescence des données, aperçu et sélection avant import ou export.">
              <h1 className="text-xl font-semibold">Import et export des données</h1>
            </PageTitleWithInfo>
          </div>
          <DataManagerMainPanel
            workspaceId={active.id}
            workspaceName={active.name}
            baseCurrency={active.baseCurrency ?? "EUR"}
            selectionId={selectedId}
            history={history}
            bundle={bundle}
            sidebarSelection={sidebarSel.selection}
            onRefresh={() => void refresh()}
          />
        </div>
      </main>
    </div>
  );
}
