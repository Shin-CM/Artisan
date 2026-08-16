import * as React from "react";
import * as api from "@/lib/api";
import { Label } from "@/components/ui/label";
import { DataManagerWorkspacePanel } from "@/features/dataManager/DataManagerWorkspacePanel";
import { hintForSelection, titleForSelection } from "@/features/dataManager/moduleHints";
import type { DataManagerBundle } from "@/features/dataManager/useDataManagerWorkspaceData";

type DataManagerMainPanelProps = {
  workspaceId: string;
  workspaceName: string;
  baseCurrency: string;
  selectionId: string;
  history: api.ImportHistoryRow[];
  bundle: DataManagerBundle;
  sidebarSelection: Map<string, Set<string>>;
  onRefresh: () => void;
  compact?: boolean;
};

export function DataManagerMainPanel({
  workspaceId,
  workspaceName,
  baseCurrency,
  selectionId,
  history,
  bundle,
  sidebarSelection,
  onRefresh,
  compact,
}: DataManagerMainPanelProps) {
  const categoryNameById = React.useMemo(
    () => new Map(bundle.categories.map((c) => [c.id, c.name] as const)),
    [bundle.categories],
  );

  const anySidebarSelection = React.useMemo(() => {
    for (const s of sidebarSelection.values()) {
      if (s.size > 0) return true;
    }
    return false;
  }, [sidebarSelection]);

  if (selectionId === "history") {
    return <DataManagerHistoryPage history={history} compact={compact} />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/40 p-3 text-sm">
        <p className="font-medium">Import et export des données</p>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          Un seul panneau pour le paquet workspace (JSON / v1:) ; utilisez
          l’arborescence pour cocher les enregistrements à inclure dans l’export.
        </p>
        {selectionId !== "workspace" ? (
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            Repère dans l’arborescence :{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              {titleForSelection(selectionId, categoryNameById)}
            </span>
            {" — "}
            {hintForSelection(selectionId)}
          </p>
        ) : null}
        {anySidebarSelection ? (
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            Au moins une case est cochée dans la barre latérale : ces ids seront
            pris en compte pour les modules correspondants lors de l’export
            (sauf si vous activez « inclure tout » pour les modules sans case).
          </p>
        ) : null}
      </div>

      <div className="min-h-0">
        <DataManagerWorkspacePanel
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          bundle={bundle}
          sidebarSelection={sidebarSelection}
          onRefresh={onRefresh}
          compact={compact}
          baseCurrency={baseCurrency}
        />
      </div>
    </div>
  );
}

function DataManagerHistoryPage({
  history,
  compact,
}: {
  history: api.ImportHistoryRow[];
  compact?: boolean;
}) {
  const modulesInData = React.useMemo(() => {
    const s = new Set(history.map((h) => h.module));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "fr"));
  }, [history]);

  const [moduleFilter, setModuleFilter] = React.useState<string>("all");

  const displayed = React.useMemo(() => {
    if (moduleFilter === "all") return history;
    return history.filter((h) => h.module === moduleFilter);
  }, [history, moduleFilter]);

  const listMaxH = compact
    ? "max-h-[min(22rem,50vh)]"
    : "max-h-[min(32rem,60vh)]";

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/40 p-3 text-sm">
        <p className="font-medium">Historique</p>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          {hintForSelection("history")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="dm-history-module" className="text-sm shrink-0">
          Filtrer par module
        </Label>
        <select
          id="dm-history-module"
          className="h-9 min-w-[12rem] rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
        >
          <option value="all">Tous les modules</option>
          {modulesInData.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <ul className={`space-y-2 overflow-y-auto text-sm ${listMaxH}`}>
        {displayed.map((h) => (
          <li
            key={h.id}
            className="flex justify-between rounded border border-[var(--color-border)] p-2"
          >
            <span>
              {h.createdAt.slice(0, 19)} — {h.module} ({h.sourceType})
              {h.fileName ? ` · ${h.fileName}` : ""}
            </span>
            <span className="shrink-0 pl-2">
              {h.recordCount} · {h.status}
            </span>
          </li>
        ))}
        {displayed.length === 0 ? (
          <li className="text-[var(--color-muted-foreground)]">
            {history.length === 0
              ? "Aucun historique"
              : "Aucune entrée pour ce filtre"}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
