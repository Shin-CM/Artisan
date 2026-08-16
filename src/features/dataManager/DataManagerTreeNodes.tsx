import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
} from "lucide-react";
import { buildChildrenMap } from "@/lib/categoryTree";
import { cn } from "@/lib/utils";
import { SidebarEntityFolder } from "@/features/dataManager/SidebarEntityFolder";
import type { DataManagerBundle } from "@/features/dataManager/useDataManagerWorkspaceData";

const EMPTY_SEL = new Set<string>();

function RowButton({
  depth,
  active,
  onClick,
  children,
}: {
  depth: number;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ paddingLeft: 4 + depth * 12 }}
      className={cn(
        "flex w-full min-w-0 items-center justify-between gap-1 rounded py-1 pr-1 text-left text-sm hover:bg-[var(--color-muted)]",
        active && "bg-[var(--color-muted)] font-medium",
      )}
    >
      {children}
    </button>
  );
}

export function CategoryRows({
  parentId,
  depth,
  byParent,
  bundle,
  countByKey,
  selectedId,
  onSelect,
  expanded,
  onToggleExpand,
  selectionMap,
  onToggleSelection,
  onSelectAllInScope,
  onClearScope,
  lazyLoad,
  ensureLoadedForScope,
  loadingForScope,
}: {
  parentId: string | null;
  depth: number;
  byParent: ReturnType<typeof buildChildrenMap>;
  bundle: DataManagerBundle;
  countByKey: Record<string, number>;
  selectedId: string;
  onSelect: (id: string) => void;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  selectionMap: Map<string, Set<string>>;
  onToggleSelection: (scope: string, entityId: string, checked: boolean) => void;
  onSelectAllInScope: (scope: string, ids: string[]) => void;
  onClearScope: (scope: string) => void;
  lazyLoad?: boolean;
  ensureLoadedForScope?: (scope: string) => void | Promise<void>;
  loadingForScope?: (scope: string) => boolean;
}) {
  const children = byParent.get(parentId) ?? [];
  return (
    <ul className="list-none space-y-0.5">
      {children.map((cat) => {
        const sub = byParent.get(cat.id) ?? [];
        const hasSub = sub.length > 0;
        const open = expanded.has(cat.id);
        const scope = `articles:cat:${cat.id}`;
        const cnt = countByKey[scope] ?? 0;
        const entities = bundle.articles
          .filter((a) => a.categoryId === cat.id)
          .map((a) => ({
            id: a.id,
            primary: a.name,
            secondary:
              a.basePrice != null
                ? `${Number(a.basePrice).toFixed(2)} € HT`
                : null,
          }));
        return (
          <li key={cat.id}>
            <div
              className="flex min-w-0 items-start gap-0.5"
              style={{ paddingLeft: 4 + depth * 12 }}
            >
              {hasSub ? (
                <button
                  type="button"
                  className="mt-0.5 flex h-7 w-6 shrink-0 items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                  aria-expanded={open}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(cat.id);
                  }}
                >
                  {open ? (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  )}
                </button>
              ) : (
                <span className="mt-0.5 inline-block w-6 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <SidebarEntityFolder
                  scope={scope}
                  label={cat.name}
                  depth={0}
                  flatLeft
                  count={cnt}
                  selectedModuleId={selectedId}
                  onSelectModule={() => onSelect(scope)}
                  selectedIds={selectionMap.get(scope) ?? EMPTY_SEL}
                  onToggle={(id, checked) =>
                    onToggleSelection(scope, id, checked)
                  }
                  onSelectAllInScope={(ids) =>
                    onSelectAllInScope(scope, ids)
                  }
                  onClearScope={() => onClearScope(scope)}
                  entities={entities}
                  ensureLoaded={
                    lazyLoad
                      ? () => void ensureLoadedForScope?.(scope)
                      : undefined
                  }
                  loading={loadingForScope?.(scope) ?? false}
                  icon={Folder}
                />
              </div>
            </div>
            {hasSub && open ? (
              <CategoryRows
                parentId={cat.id}
                depth={depth + 1}
                byParent={byParent}
                bundle={bundle}
                countByKey={countByKey}
                selectedId={selectedId}
                onSelect={onSelect}
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                selectionMap={selectionMap}
                onToggleSelection={onToggleSelection}
                onSelectAllInScope={onSelectAllInScope}
                onClearScope={onClearScope}
                lazyLoad={lazyLoad}
                ensureLoadedForScope={ensureLoadedForScope}
                loadingForScope={loadingForScope}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function Leaf({
  id,
  label,
  depth,
  count,
  hint,
  selectedId,
  onSelect,
  icon: Icon,
}: {
  id: string;
  label: string;
  depth: number;
  count: number;
  hint?: string | null;
  selectedId: string;
  onSelect: (id: string) => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <li>
      <RowButton
        depth={depth}
        active={selectedId === id}
        onClick={() => onSelect(id)}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          <span className="truncate">{label}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="rounded bg-[var(--color-card)] px-1.5 py-0.5 text-xs text-[var(--color-muted-foreground)]">
            {count}
          </span>
          {hint ? (
            <span className="max-w-[9rem] truncate text-[10px] leading-tight text-[var(--color-muted-foreground)]">
              {hint}
            </span>
          ) : null}
        </span>
      </RowButton>
    </li>
  );
}

export function GroupHeader({
  label,
  depth,
  open,
  onToggle,
}: {
  label: string;
  depth: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{ paddingLeft: 4 + depth * 12 }}
      className="flex w-full items-center gap-1 rounded py-1 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/50"
    >
      {open ? (
        <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      {label}
    </button>
  );
}
