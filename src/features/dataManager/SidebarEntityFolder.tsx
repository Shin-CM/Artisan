import * as React from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  matchesSearch,
  normalizeSearch,
  paginateSlice,
  SIDEBAR_PAGE_SIZE,
} from "@/features/dataManager/sidebarListUtils";

export type SidebarEntityRow = {
  id: string;
  primary: string;
  secondary?: string | null;
};

type SidebarEntityFolderProps = {
  scope: string;
  label: string;
  depth: number;
  /** Si true, pas de marge gauche (le parent aligne déjà l’indentation). */
  flatLeft?: boolean;
  count: number;
  /** Module actif (panneau droit) */
  selectedModuleId: string;
  onSelectModule: () => void;
  selectedIds: Set<string>;
  onToggle: (entityId: string, checked: boolean) => void;
  onSelectAllInScope: (ids: string[]) => void;
  onClearScope: () => void;
  entities: SidebarEntityRow[];
  hint?: string | null;
  /** Option 1 : chargement au premier dépli */
  ensureLoaded?: () => void | Promise<void>;
  loading?: boolean;
  icon: React.ComponentType<{ className?: string }>;
};

export function SidebarEntityFolder({
  scope,
  label,
  depth,
  flatLeft = false,
  count,
  selectedModuleId,
  onSelectModule,
  selectedIds,
  onToggle,
  onSelectAllInScope,
  onClearScope,
  entities,
  hint,
  ensureLoaded,
  loading = false,
  icon: Icon,
}: SidebarEntityFolderProps) {
  const [open, setOpen] = React.useState(false);
  const [everOpened, setEverOpened] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(0);
  const normQ = React.useMemo(() => normalizeSearch(search), [search]);

  const filtered = React.useMemo(() => {
    if (!normQ) return entities;
    return entities.filter(
      (e) =>
        matchesSearch(e.primary, normQ) ||
        (e.secondary && matchesSearch(e.secondary, normQ)),
    );
  }, [entities, normQ]);

  React.useEffect(() => {
    setPage(0);
  }, [normQ, entities.length]);

  const { slice, pageCount, total } = React.useMemo(
    () => paginateSlice(filtered, page, SIDEBAR_PAGE_SIZE),
    [filtered, page],
  );

  const active = selectedModuleId === scope;

  async function handleToggleOpen() {
    const next = !open;
    if (next && !everOpened) {
      setEverOpened(true);
      if (ensureLoaded) await Promise.resolve(ensureLoaded());
    }
    setOpen(next);
  }

  const allFilteredIds = React.useMemo(
    () => filtered.map((e) => e.id),
    [filtered],
  );

  const allFilteredSelected = React.useMemo(() => {
    if (allFilteredIds.length === 0) return false;
    return allFilteredIds.every((id) => selectedIds.has(id));
  }, [allFilteredIds, selectedIds]);

  const someFilteredSelected = React.useMemo(() => {
    if (allFilteredIds.length === 0) return false;
    return allFilteredIds.some((id) => selectedIds.has(id));
  }, [allFilteredIds, selectedIds]);

  const masterCheckboxRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const el = masterCheckboxRef.current;
    if (!el) return;
    el.indeterminate =
      someFilteredSelected && !allFilteredSelected && allFilteredIds.length > 0;
  }, [someFilteredSelected, allFilteredSelected, allFilteredIds.length]);

  function handleMasterCheckboxChange() {
    if (allFilteredIds.length === 0) return;
    if (allFilteredSelected) onClearScope();
    else onSelectAllInScope(allFilteredIds);
  }

  return (
    <li className="list-none">
      <div
        className="flex min-w-0 items-start gap-0.5"
        style={{ paddingLeft: flatLeft ? 0 : 4 + depth * 12 }}
      >
        <button
          type="button"
          className="mt-0.5 flex h-7 w-6 shrink-0 items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          aria-expanded={open}
          onClick={() => void handleToggleOpen()}
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onSelectModule}
            className={cn(
              "flex w-full min-w-0 items-center justify-between gap-1 rounded py-1 pr-1 text-left text-sm hover:bg-[var(--color-muted)]",
              active && "bg-[var(--color-muted)] font-medium",
            )}
          >
            <span className="flex min-w-0 items-center gap-1">
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
          </button>
          {open && everOpened ? (
            <div className="mt-1 space-y-1 border-l border-[var(--color-border)]/60 pl-2 pb-1">
              {loading ? (
                <div className="flex items-center gap-1 py-2 text-xs text-[var(--color-muted-foreground)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Chargement…
                </div>
              ) : (
                <>
                  <div className="flex min-w-0 items-center gap-2">
                    <Input
                      type="search"
                      className="h-7 min-w-0 flex-1 text-xs"
                      placeholder="Rechercher…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      aria-label={`Rechercher dans ${label}`}
                    />
                    <label
                      className={cn(
                        "flex shrink-0 cursor-pointer items-center py-0.5",
                        allFilteredIds.length === 0 &&
                          "cursor-not-allowed opacity-50",
                      )}
                      title={
                        allFilteredIds.length === 0
                          ? "Aucun élément à sélectionner"
                          : allFilteredSelected
                            ? "Tout décocher pour ce module"
                            : "Tout cocher les résultats filtrés"
                      }
                    >
                      <input
                        ref={masterCheckboxRef}
                        type="checkbox"
                        className="h-3.5 w-3.5 shrink-0"
                        checked={allFilteredSelected}
                        disabled={allFilteredIds.length === 0}
                        onChange={handleMasterCheckboxChange}
                        aria-label={
                          allFilteredIds.length === 0
                            ? `Aucun résultat dans ${label}`
                            : allFilteredSelected
                              ? `Tout décocher la sélection pour ${label}`
                              : `Tout cocher les résultats affichés pour ${label}`
                        }
                      />
                    </label>
                  </div>
                  <ul className="max-h-48 space-y-0.5 overflow-y-auto text-xs">
                    {slice.map((e) => (
                      <li
                        key={e.id}
                        className="flex min-w-0 items-start gap-1.5 rounded py-0.5 hover:bg-[var(--color-muted)]/50"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 shrink-0"
                          checked={selectedIds.has(e.id)}
                          onChange={(ev) =>
                            onToggle(e.id, ev.target.checked)
                          }
                          aria-label={e.primary}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {e.primary}
                          </span>
                          {e.secondary ? (
                            <span className="block truncate text-[10px] text-[var(--color-muted-foreground)]">
                              {e.secondary}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {pageCount > 1 ? (
                    <div className="flex items-center justify-between gap-1 text-[10px] text-[var(--color-muted-foreground)]">
                      <span>
                        {total} élément{total > 1 ? "s" : ""}
                        {pageCount > 1
                          ? ` · page ${page + 1}/${pageCount}`
                          : ""}
                      </span>
                      <span className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[10px]"
                          disabled={page <= 0}
                          onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                          Préc.
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[10px]"
                          disabled={page >= pageCount - 1}
                          onClick={() =>
                            setPage((p) => Math.min(pageCount - 1, p + 1))
                          }
                        >
                          Suiv.
                        </Button>
                      </span>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
