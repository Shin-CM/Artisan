import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import { DataManagerTreeSidebar } from "@/features/dataManager/DataManagerTreeSidebar";
import { DataManagerMainPanel } from "@/features/dataManager/DataManagerMainPanel";
import { useSidebarSelection } from "@/features/dataManager/sidebarSelection";
import { useDataManagerWorkspaceData } from "@/features/dataManager/useDataManagerWorkspaceData";
import { MarketplaceModuleBadge } from "@/components/marketplace/MarketplaceModuleBadge";
import {
  isDataManagerLazyLoadEnabled,
  MARKETPLACE_ROUTE_DATA_MANAGER_LAZY,
} from "@/lib/marketplaceModules";
import { cn } from "@/lib/utils";

export function DataManagerModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { active } = useWorkspace();
  const [selectedId, setSelectedId] = React.useState("workspace");
  const [plugins, setPlugins] = React.useState<api.PluginRow[]>([]);
  const sidebarSel = useSidebarSelection();

  React.useEffect(() => {
    if (!open || !active?.id) {
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
  }, [open, active?.id]);

  const lazyLoad = isDataManagerLazyLoadEnabled(plugins);
  const {
    bundle,
    history,
    refresh,
    countByKey,
    ensureLoadedForScope,
    loadingForScope,
  } = useDataManagerWorkspaceData(open && active ? active.id : null, {
    lazyLoad,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(88vh,760px)] w-[calc(100vw-1.5rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
        <DialogHeader
          className={cn(
            "relative shrink-0 border-b border-[var(--color-border)] px-4 py-3",
            lazyLoad && "pr-12",
          )}
        >
          {lazyLoad ? (
            <div className="absolute right-3 top-1/2 z-[1] -translate-y-1/2">
              <MarketplaceModuleBadge to={MARKETPLACE_ROUTE_DATA_MANAGER_LAZY} />
            </div>
          ) : null}
          <DialogTitle>Import et export des données</DialogTitle>
        </DialogHeader>
        {active ? (
          <div className="flex min-h-0 flex-1">
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
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3">
              <DataManagerMainPanel
                workspaceId={active.id}
                workspaceName={active.name}
                baseCurrency={active.baseCurrency ?? "EUR"}
                selectionId={selectedId}
                history={history}
                bundle={bundle}
                sidebarSelection={sidebarSel.selection}
                onRefresh={() => void refresh()}
                compact
              />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
