import * as React from "react";
import { FileText, Folder, FolderKanban, FolderOpen, Layers, LayoutGrid, LayoutList } from "lucide-react";
import type * as api from "@/lib/api";
import { buildChildrenMap } from "@/lib/categoryTree";
import { lastOkImportByModule } from "@/features/dataManager/historyHints";
import { SidebarEntityFolder } from "@/features/dataManager/SidebarEntityFolder";
import {
  CategoryRows,
  GroupHeader,
  Leaf,
} from "@/features/dataManager/DataManagerTreeNodes";
import type { DataManagerBundle } from "@/features/dataManager/useDataManagerWorkspaceData";

const GROUP_IDS = {
  ref: "grp:referentiel",
  catalog: "grp:catalogue",
  documents: "grp:documents",
} as const;

const EMPTY_SEL = new Set<string>();

type TreeSidebarProps = {
  selectedId: string;
  onSelect: (id: string) => void;
  categories: api.Category[];
  bundle: DataManagerBundle;
  countByKey: Record<string, number>;
  history: api.ImportHistoryRow[];
  selectionMap: Map<string, Set<string>>;
  onToggleSelection: (scope: string, entityId: string, checked: boolean) => void;
  onSelectAllInScope: (scope: string, ids: string[]) => void;
  onClearScope: (scope: string) => void;
  lazyLoad?: boolean;
  ensureLoadedForScope?: (scope: string) => void | Promise<void>;
  loadingForScope?: (scope: string) => boolean;
};


export function DataManagerTreeSidebar({
  selectedId,
  onSelect,
  categories,
  bundle,
  countByKey,
  history,
  selectionMap,
  onToggleSelection,
  onSelectAllInScope,
  onClearScope,
  lazyLoad,
  ensureLoadedForScope,
  loadingForScope,
}: TreeSidebarProps) {
  const byParent = React.useMemo(
    () => buildChildrenMap(categories),
    [categories],
  );
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [catExpanded, setCatExpanded] = React.useState<Set<string>>(
    () => new Set(),
  );

  const catalogExpanded = expanded.has(GROUP_IDS.catalog);
  const documentsExpanded = expanded.has(GROUP_IDS.documents);

  React.useEffect(() => {
    if (!lazyLoad || !catalogExpanded) return;
    void ensureLoadedForScope?.("categories");
    void ensureLoadedForScope?.("articles:all");
  }, [lazyLoad, catalogExpanded, ensureLoadedForScope]);

  React.useEffect(() => {
    if (!lazyLoad || !documentsExpanded) return;
    void ensureLoadedForScope?.("projects");
    void ensureLoadedForScope?.("quotes");
    void ensureLoadedForScope?.("invoices");
  }, [lazyLoad, documentsExpanded, ensureLoadedForScope]);

  const lastByMod = React.useMemo(() => lastOkImportByModule(history), [history]);

  function hintFor(moduleKey: string): string | null {
    const x = lastByMod.get(moduleKey);
    if (!x) return null;
    return `Dernier import ${x.at} · ${x.count} lignes`;
  }

  const parentNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const c of bundle.categories) m.set(c.id, c.name);
    return m;
  }, [bundle.categories]);

  const clientEntities = React.useMemo(
    () =>
      bundle.clients.map((c) => ({
        id: c.id,
        primary: c.name,
        secondary: c.email ?? null,
      })),
    [bundle.clients],
  );

  const categoryDataEntities = React.useMemo(
    () =>
      bundle.categories.map((c) => ({
        id: c.id,
        primary: c.name,
        secondary: c.parentId
          ? (parentNameById.get(c.parentId) ?? "—")
          : "Racine",
      })),
    [bundle.categories, parentNameById],
  );

  const articleAllEntities = React.useMemo(
    () =>
      bundle.articles.map((a) => ({
        id: a.id,
        primary: a.name,
        secondary:
          a.categoryId && parentNameById.get(a.categoryId)
            ? parentNameById.get(a.categoryId)!
            : a.categoryId
              ? "—"
              : "Sans dossier",
      })),
    [bundle.articles, parentNameById],
  );

  const articleUncatEntities = React.useMemo(
    () =>
      bundle.articles
        .filter((a) => !a.categoryId)
        .map((a) => ({
          id: a.id,
          primary: a.name,
          secondary:
            a.basePrice != null
              ? `${Number(a.basePrice).toFixed(2)} € HT`
              : null,
        })),
    [bundle.articles],
  );

  const taxEntities = React.useMemo(
    () =>
      bundle.taxRates.map((t) => ({
        id: t.id,
        primary: t.name,
        secondary: `${t.rate}%`,
      })),
    [bundle.taxRates],
  );

  const snippetEntities = React.useMemo(
    () =>
      bundle.snippets.map((s) => ({
        id: s.id,
        primary: s.name,
        secondary: s.body?.slice(0, 48) ?? null,
      })),
    [bundle.snippets],
  );

  const presetEntities = React.useMemo(
    () =>
      bundle.presets.map((p) => ({
        id: p.id,
        primary: p.name,
        secondary: `${p.kind} · ${p.value}`,
      })),
    [bundle.presets],
  );

  const quoteEntities = React.useMemo(
    () =>
      bundle.quotes.map((q) => ({
        id: q.id,
        primary: q.number || q.title || q.id,
        secondary: q.title && q.title !== q.number ? q.title : q.status,
      })),
    [bundle.quotes],
  );

  const invoiceEntities = React.useMemo(
    () =>
      bundle.invoices.map((inv) => ({
        id: inv.id,
        primary: inv.number || inv.id,
        secondary: inv.status,
      })),
    [bundle.invoices],
  );

  const projectEntities = React.useMemo(
    () =>
      bundle.projects.map((p) => ({
        id: p.id,
        primary: p.name,
        secondary: p.code?.trim() || p.status,
      })),
    [bundle.projects],
  );

  const toggleGrp = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleCat = (id: string) => {
    setCatExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const ensure = lazyLoad ? ensureLoadedForScope : undefined;
  const loading = loadingForScope ?? (() => false);

  const inventoryTotal =
    bundle.clients.length +
    bundle.categories.length +
    bundle.articles.length +
    bundle.projects.length +
    bundle.quotes.length +
    bundle.invoices.length +
    bundle.taxRates.length +
    bundle.snippets.length +
    bundle.presets.length;

  return (
    <aside className="flex min-h-0 w-[min(22rem,92vw)] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-muted)]/20 p-2">
      <p className="mb-2 flex items-center gap-1.5 px-1 text-sm font-medium">
        <Layers className="h-4 w-4 opacity-70" aria-hidden />
        Inventaire import/export
      </p>
      <p className="mb-2 px-1 text-[10px] leading-snug text-[var(--color-muted-foreground)]">
        Cochez des lignes pour les inclure dans le paquet workspace ; le panneau
        droit permet d’inclure tout un module si besoin.
      </p>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto text-sm">
        <ul className="list-none space-y-0.5 pb-1">
          <Leaf
            id="workspace"
            label="Vue globale"
            depth={0}
            count={inventoryTotal}
            hint={null}
            selectedId={selectedId}
            onSelect={onSelect}
            icon={LayoutGrid}
          />
        </ul>
        <div>
          <GroupHeader
            label="Référentiel"
            depth={0}
            open={expanded.has(GROUP_IDS.ref)}
            onToggle={() => toggleGrp(GROUP_IDS.ref)}
          />
          {expanded.has(GROUP_IDS.ref) ? (
            <ul className="mt-0.5 list-none space-y-0.5">
              <SidebarEntityFolder
                scope="clients"
                label="Clients"
                depth={1}
                count={countByKey.clients ?? 0}
                selectedModuleId={selectedId}
                onSelectModule={() => onSelect("clients")}
                selectedIds={selectionMap.get("clients") ?? EMPTY_SEL}
                onToggle={(id, checked) =>
                  onToggleSelection("clients", id, checked)
                }
                onSelectAllInScope={(ids) =>
                  onSelectAllInScope("clients", ids)
                }
                onClearScope={() => onClearScope("clients")}
                entities={clientEntities}
                hint={hintFor("clients")}
                ensureLoaded={
                  lazyLoad ? () => void ensure?.("clients") : undefined
                }
                loading={loading("clients")}
                icon={FileText}
              />
              <li className="mt-1">
                <GroupHeader
                  label="Catalogue"
                  depth={1}
                  open={expanded.has(GROUP_IDS.catalog)}
                  onToggle={() => toggleGrp(GROUP_IDS.catalog)}
                />
                {expanded.has(GROUP_IDS.catalog) ? (
                  <div className="mt-0.5 space-y-0.5">
                    <ul className="list-none space-y-0.5">
                      <SidebarEntityFolder
                        scope="articles:all"
                        label="Tous les articles"
                        depth={2}
                        count={countByKey["articles:all"] ?? 0}
                        selectedModuleId={selectedId}
                        onSelectModule={() => onSelect("articles:all")}
                        selectedIds={
                          selectionMap.get("articles:all") ?? EMPTY_SEL
                        }
                        onToggle={(id, checked) =>
                          onToggleSelection("articles:all", id, checked)
                        }
                        onSelectAllInScope={(ids) =>
                          onSelectAllInScope("articles:all", ids)
                        }
                        onClearScope={() => onClearScope("articles:all")}
                        entities={articleAllEntities}
                        hint={hintFor("articles")}
                        ensureLoaded={
                          lazyLoad
                            ? () => void ensure?.("articles:all")
                            : undefined
                        }
                        loading={loading("articles:all")}
                        icon={LayoutList}
                      />
                      <SidebarEntityFolder
                        scope="articles:uncat"
                        label="Sans catégorie"
                        depth={2}
                        count={countByKey["articles:uncat"] ?? 0}
                        selectedModuleId={selectedId}
                        onSelectModule={() => onSelect("articles:uncat")}
                        selectedIds={
                          selectionMap.get("articles:uncat") ?? EMPTY_SEL
                        }
                        onToggle={(id, checked) =>
                          onToggleSelection("articles:uncat", id, checked)
                        }
                        onSelectAllInScope={(ids) =>
                          onSelectAllInScope("articles:uncat", ids)
                        }
                        onClearScope={() => onClearScope("articles:uncat")}
                        entities={articleUncatEntities}
                        ensureLoaded={
                          lazyLoad
                            ? () => void ensure?.("articles:uncat")
                            : undefined
                        }
                        loading={loading("articles:uncat")}
                        icon={FolderOpen}
                      />
                    </ul>
                    <div className="mt-1">
                      <CategoryRows
                        parentId={null}
                        depth={2}
                        byParent={byParent}
                        bundle={bundle}
                        countByKey={countByKey}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        expanded={catExpanded}
                        onToggleExpand={toggleCat}
                        selectionMap={selectionMap}
                        onToggleSelection={onToggleSelection}
                        onSelectAllInScope={onSelectAllInScope}
                        onClearScope={onClearScope}
                        lazyLoad={lazyLoad}
                        ensureLoadedForScope={ensureLoadedForScope}
                        loadingForScope={loadingForScope}
                      />
                    </div>
                    <ul className="mt-1 list-none space-y-0.5">
                      <SidebarEntityFolder
                        scope="categories"
                        label="Catégories (données)"
                        depth={2}
                        count={countByKey.categories ?? 0}
                        selectedModuleId={selectedId}
                        onSelectModule={() => onSelect("categories")}
                        selectedIds={selectionMap.get("categories") ?? EMPTY_SEL}
                        onToggle={(id, checked) =>
                          onToggleSelection("categories", id, checked)
                        }
                        onSelectAllInScope={(ids) =>
                          onSelectAllInScope("categories", ids)
                        }
                        onClearScope={() => onClearScope("categories")}
                        entities={categoryDataEntities}
                        hint={hintFor("categories")}
                        ensureLoaded={
                          lazyLoad
                            ? () => void ensure?.("categories")
                            : undefined
                        }
                        loading={loading("categories")}
                        icon={Folder}
                      />
                      <SidebarEntityFolder
                        scope="tax-rates"
                        label="Taux TVA"
                        depth={2}
                        count={countByKey["tax-rates"] ?? 0}
                        selectedModuleId={selectedId}
                        onSelectModule={() => onSelect("tax-rates")}
                        selectedIds={
                          selectionMap.get("tax-rates") ?? EMPTY_SEL
                        }
                        onToggle={(id, checked) =>
                          onToggleSelection("tax-rates", id, checked)
                        }
                        onSelectAllInScope={(ids) =>
                          onSelectAllInScope("tax-rates", ids)
                        }
                        onClearScope={() => onClearScope("tax-rates")}
                        entities={taxEntities}
                        hint={hintFor("tax-rates")}
                        ensureLoaded={
                          lazyLoad
                            ? () => void ensure?.("tax-rates")
                            : undefined
                        }
                        loading={loading("tax-rates")}
                        icon={FileText}
                      />
                      <SidebarEntityFolder
                        scope="discount-presets"
                        label="Modèles de réduction"
                        depth={2}
                        count={countByKey["discount-presets"] ?? 0}
                        selectedModuleId={selectedId}
                        onSelectModule={() => onSelect("discount-presets")}
                        selectedIds={
                          selectionMap.get("discount-presets") ?? EMPTY_SEL
                        }
                        onToggle={(id, checked) =>
                          onToggleSelection("discount-presets", id, checked)
                        }
                        onSelectAllInScope={(ids) =>
                          onSelectAllInScope("discount-presets", ids)
                        }
                        onClearScope={() => onClearScope("discount-presets")}
                        entities={presetEntities}
                        hint={hintFor("discount-presets")}
                        ensureLoaded={
                          lazyLoad
                            ? () => void ensure?.("discount-presets")
                            : undefined
                        }
                        loading={loading("discount-presets")}
                        icon={FileText}
                      />
                      <SidebarEntityFolder
                        scope="snippets"
                        label="Textes enregistrés"
                        depth={2}
                        count={countByKey.snippets ?? 0}
                        selectedModuleId={selectedId}
                        onSelectModule={() => onSelect("snippets")}
                        selectedIds={selectionMap.get("snippets") ?? EMPTY_SEL}
                        onToggle={(id, checked) =>
                          onToggleSelection("snippets", id, checked)
                        }
                        onSelectAllInScope={(ids) =>
                          onSelectAllInScope("snippets", ids)
                        }
                        onClearScope={() => onClearScope("snippets")}
                        entities={snippetEntities}
                        hint={hintFor("snippets")}
                        ensureLoaded={
                          lazyLoad
                            ? () => void ensure?.("snippets")
                            : undefined
                        }
                        loading={loading("snippets")}
                        icon={FileText}
                      />
                    </ul>
                  </div>
                ) : null}
              </li>
            </ul>
          ) : null}
        </div>

        <div>
          <GroupHeader
            label="Documents"
            depth={0}
            open={expanded.has(GROUP_IDS.documents)}
            onToggle={() => toggleGrp(GROUP_IDS.documents)}
          />
          {expanded.has(GROUP_IDS.documents) ? (
            <ul className="mt-0.5 list-none space-y-0.5">
              <SidebarEntityFolder
                scope="projects"
                label="Projets"
                depth={1}
                count={countByKey.projects ?? 0}
                selectedModuleId={selectedId}
                onSelectModule={() => onSelect("projects")}
                selectedIds={selectionMap.get("projects") ?? EMPTY_SEL}
                onToggle={(id, checked) =>
                  onToggleSelection("projects", id, checked)
                }
                onSelectAllInScope={(ids) =>
                  onSelectAllInScope("projects", ids)
                }
                onClearScope={() => onClearScope("projects")}
                entities={projectEntities}
                hint={hintFor("projects")}
                ensureLoaded={
                  lazyLoad ? () => void ensure?.("projects") : undefined
                }
                loading={loading("projects")}
                icon={FolderKanban}
              />
              <SidebarEntityFolder
                scope="quotes"
                label="Devis"
                depth={1}
                count={countByKey.quotes ?? 0}
                selectedModuleId={selectedId}
                onSelectModule={() => onSelect("quotes")}
                selectedIds={selectionMap.get("quotes") ?? EMPTY_SEL}
                onToggle={(id, checked) =>
                  onToggleSelection("quotes", id, checked)
                }
                onSelectAllInScope={(ids) =>
                  onSelectAllInScope("quotes", ids)
                }
                onClearScope={() => onClearScope("quotes")}
                entities={quoteEntities}
                hint={hintFor("quotes")}
                ensureLoaded={
                  lazyLoad ? () => void ensure?.("quotes") : undefined
                }
                loading={loading("quotes")}
                icon={FileText}
              />
              <SidebarEntityFolder
                scope="invoices"
                label="Factures"
                depth={1}
                count={countByKey.invoices ?? 0}
                selectedModuleId={selectedId}
                onSelectModule={() => onSelect("invoices")}
                selectedIds={selectionMap.get("invoices") ?? EMPTY_SEL}
                onToggle={(id, checked) =>
                  onToggleSelection("invoices", id, checked)
                }
                onSelectAllInScope={(ids) =>
                  onSelectAllInScope("invoices", ids)
                }
                onClearScope={() => onClearScope("invoices")}
                entities={invoiceEntities}
                hint={hintFor("invoices")}
                ensureLoaded={
                  lazyLoad ? () => void ensure?.("invoices") : undefined
                }
                loading={loading("invoices")}
                icon={FileText}
              />
            </ul>
          ) : null}
        </div>

        <ul className="list-none pt-1">
          <Leaf
            id="history"
            label="Historique"
            depth={0}
            count={countByKey.history ?? 0}
            hint={null}
            selectedId={selectedId}
            onSelect={onSelect}
            icon={LayoutList}
          />
        </ul>
      </div>
    </aside>
  );
}
