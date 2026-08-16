import * as React from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  ListTree,
  GripVertical,
} from "lucide-react";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buildChildrenMap } from "@/lib/categoryTree";
import { sortedArticlesInCategory } from "@/lib/articleOrder";
import { buildCatalogVisibility } from "@/lib/globalSearchFilter";
import type { FolderSel } from "@/pages/products/productCatalogTypes";
import { UNCAT_KEY } from "@/pages/products/productCatalogTypes";

function DroppableCategoryBanner({
  dropId,
  children,
  className,
  style,
}: {
  dropId: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        className,
        isOver &&
          "rounded bg-[var(--color-accent)]/15 ring-1 ring-inset ring-[var(--color-ring)]",
      )}
    >
      {children}
    </div>
  );
}

function SortableCategoryRow({
  category,
  depth,
  hasBranches,
  isOpen,
  isFolderSelected,
  onToggleExpand,
  onSelectFolder,
  gripMenuOpen,
  onGripMenuOpenChange,
  gripClickSuppressUntilRef,
  workspaceId,
  onCategoryUpdated,
  onCategoryDeleted,
  onArticleGripMenuClose,
  children,
}: {
  category: api.Category;
  depth: number;
  hasBranches: boolean;
  isOpen: boolean;
  isFolderSelected: boolean;
  onToggleExpand: () => void;
  onSelectFolder: () => void;
  gripMenuOpen: boolean;
  onGripMenuOpenChange: (open: boolean) => void;
  gripClickSuppressUntilRef: React.RefObject<number>;
  onArticleGripMenuClose: () => void;
  workspaceId: string;
  onCategoryUpdated: () => void;
  onCategoryDeleted: (categoryId: string, parentId: string | null) => void;
  children?: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const [renameDraft, setRenameDraft] = React.useState(category.name);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  React.useEffect(() => {
    if (gripMenuOpen) setRenameDraft(category.name);
    else {
      setDeleteConfirm(false);
      setDeleteBusy(false);
    }
  }, [gripMenuOpen, category.name]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function commitRenameIfChanged() {
    const t = renameDraft.trim();
    if (t === category.name) return;
    if (!t) {
      toast.error("Indiquez un nom de catégorie.");
      setRenameDraft(category.name);
      return;
    }
    try {
      await api.updateCategory(workspaceId, category.id, t);
      toast.success("Catégorie mise à jour");
      onCategoryUpdated();
    } catch (e) {
      toast.error(String(e));
      setRenameDraft(category.name);
    }
  }

  async function handleDeleteCategory() {
    setDeleteBusy(true);
    try {
      await api.deleteCategory(workspaceId, category.id);
      toast.success("Catégorie supprimée");
      onGripMenuOpenChange(false);
      onCategoryDeleted(category.id, category.parentId ?? null);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={{ ...style, paddingLeft: 4 + depth * 12 }}
      className={cn("list-none select-none", isDragging && "z-10 opacity-80")}
    >
      <DroppableCategoryBanner
        dropId={`drop:${category.id}`}
        className={cn(
          "flex w-full min-w-0 items-center gap-0.5 rounded py-0.5 pr-1 text-sm",
          isFolderSelected && "bg-[var(--color-muted)]",
        )}
      >
        <Popover open={gripMenuOpen} onOpenChange={onGripMenuOpenChange} modal={false}>
          <PopoverAnchor asChild>
            <button
              type="button"
              className="flex h-7 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] active:cursor-grabbing"
              aria-label="Clic : menu ; maintenir puis glisser : réordonner"
              {...attributes}
              {...listeners}
              onClick={() => {
                if (Date.now() < gripClickSuppressUntilRef.current) return;
                onArticleGripMenuClose();
                onGripMenuOpenChange(true);
              }}
            >
              <GripVertical className="h-3.5 w-3.5" aria-hidden />
            </button>
          </PopoverAnchor>
          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={4}
            className="w-[min(17rem,calc(100vw-2rem))] space-y-2 p-2"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <div>
              <Label className="text-xs">Nom de la catégorie</Label>
              <Input
                className="mt-1 h-8 text-xs"
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void commitRenameIfChanged();
                  }
                }}
                onBlur={(e) => {
                  const next = e.relatedTarget;
                  const popoverBody = e.currentTarget.parentElement?.parentElement;
                  if (next instanceof Node && popoverBody?.contains(next)) return;
                  void commitRenameIfChanged();
                }}
              />
            </div>
            {deleteConfirm ? (
              <div className="space-y-2">
                <p className="text-xs leading-snug text-[var(--color-muted-foreground)]">
                  Les sous-dossiers remontent d’un niveau ; les articles passent en « Sans
                  catégorie ».
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={deleteBusy}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setDeleteConfirm(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={deleteBusy}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => void handleDeleteCategory()}
                  >
                    {deleteBusy ? "Suppression…" : "Confirmer"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setDeleteConfirm(true)}
              >
                Supprimer la catégorie
              </Button>
            )}
          </PopoverContent>
        </Popover>
        {hasBranches ? (
          <button
            type="button"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            aria-expanded={isOpen}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        ) : (
          <span className="inline-block w-6 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-[var(--color-muted)]",
            isFolderSelected && "font-medium",
          )}
          onClick={onSelectFolder}
        >
          <Folder
            className="h-3.5 w-3.5 shrink-0 text-amber-800 dark:text-amber-400"
            aria-hidden
          />
          <span className="truncate">{category.name}</span>
        </button>
      </DroppableCategoryBanner>
      {children}
    </li>
  );
}

function SortableArticleRow({
  article,
  depth,
  selected,
  onSelect,
  gripMenuOpen,
  onGripMenuOpenChange,
  gripClickSuppressUntilRef,
  onArticleDeleted,
  onCloseOtherGripMenus,
}: {
  article: api.Article;
  depth: number;
  selected: boolean;
  onSelect: () => void;
  gripMenuOpen: boolean;
  onGripMenuOpenChange: (open: boolean) => void;
  gripClickSuppressUntilRef: React.RefObject<number>;
  onArticleDeleted: (articleId: string) => void;
  onCloseOtherGripMenus: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id });

  const [deleteConfirm, setDeleteConfirm] = React.useState(false);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  React.useEffect(() => {
    if (!gripMenuOpen) {
      setDeleteConfirm(false);
      setDeleteBusy(false);
    }
  }, [gripMenuOpen]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: 4 + depth * 12,
  };

  async function handleDeleteArticle() {
    setDeleteBusy(true);
    try {
      await api.deleteArticle(article.id);
      toast.success("Article supprimé");
      onGripMenuOpenChange(false);
      onArticleDeleted(article.id);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn("list-none", isDragging && "z-10 opacity-80")}
    >
      <div className="flex min-w-0 items-center gap-0.5 pr-1">
        <Popover open={gripMenuOpen} onOpenChange={onGripMenuOpenChange} modal={false}>
          <PopoverAnchor asChild>
            <button
              type="button"
              className="flex h-7 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] active:cursor-grabbing"
              aria-label="Clic : menu ; maintenir puis glisser : réordonner ou déplacer"
              {...attributes}
              {...listeners}
              onClick={() => {
                if (Date.now() < gripClickSuppressUntilRef.current) return;
                onCloseOtherGripMenus();
                onGripMenuOpenChange(true);
              }}
            >
              <GripVertical className="h-3.5 w-3.5" aria-hidden />
            </button>
          </PopoverAnchor>
          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={4}
            className="w-[min(15rem,calc(100vw-2rem))] space-y-2 p-2"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <p className="truncate text-xs font-medium text-[var(--color-foreground)]">
              {article.name}
            </p>
            {deleteConfirm ? (
              <div className="space-y-2">
                <p className="text-xs leading-snug text-[var(--color-muted-foreground)]">
                  Cette action est définitive.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={deleteBusy}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setDeleteConfirm(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={deleteBusy}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => void handleDeleteArticle()}
                  >
                    {deleteBusy ? "Suppression…" : "Confirmer"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setDeleteConfirm(true)}
              >
                Supprimer l’article
              </Button>
            )}
          </PopoverContent>
        </Popover>
        <button
          type="button"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5 rounded py-0.5 pr-1 pl-0.5 text-left text-sm hover:bg-[var(--color-muted)]",
            selected && "bg-[var(--color-muted)] font-medium",
          )}
          onClick={onSelect}
        >
          <FileText
            className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)]"
            aria-hidden
          />
          <span className="truncate">{article.name}</span>
        </button>
      </div>
    </li>
  );
}

export type ProductCatalogSidebarProps = {
  workspaceId: string;
  categories: api.Category[];
  articles: api.Article[];
  folderSel: FolderSel;
  setFolderSel: React.Dispatch<React.SetStateAction<FolderSel>>;
  artSel: api.Article | null;
  setArtSel: React.Dispatch<React.SetStateAction<api.Article | null>>;
  newCat: string;
  setNewCat: React.Dispatch<React.SetStateAction<string>>;
  onAddCategory: () => void;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  categoryGripMenuId: string | null;
  setCategoryGripMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  articleGripMenuId: string | null;
  setArticleGripMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  suppressCatalogGripClickUntil: React.RefObject<number>;
  onCategoryUpdated: () => void;
  onCategoryDeleted: (deletedId: string, parentId: string | null) => void;
  onArticleDeleted: (articleId: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
  /** Filtre texte global (déjà normalisé : trim + minuscules). Vide = pas de filtre. */
  globalListFilterNormalized?: string;
};

export function ProductCatalogSidebar({
  workspaceId,
  categories,
  articles,
  folderSel,
  setFolderSel,
  artSel,
  setArtSel,
  newCat,
  setNewCat,
  onAddCategory,
  expanded,
  toggleExpand,
  categoryGripMenuId,
  setCategoryGripMenuId,
  articleGripMenuId,
  setArticleGripMenuId,
  suppressCatalogGripClickUntil,
  onCategoryUpdated,
  onCategoryDeleted,
  onArticleDeleted,
  onDragEnd,
  globalListFilterNormalized = "",
}: ProductCatalogSidebarProps) {
  const catalogVis = React.useMemo(
    () =>
      buildCatalogVisibility(
        categories,
        articles,
        globalListFilterNormalized,
      ),
    [categories, articles, globalListFilterNormalized],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const byId = React.useMemo(
    () => new Map(categories.map((c) => [c.id, c] as const)),
    [categories],
  );
  const byParent = React.useMemo(() => buildChildrenMap(categories), [categories]);

  const uncatArticles = React.useMemo(
    () => sortedArticlesInCategory(articles, null),
    [articles],
  );

  const renderCategoryNode = (cat: api.Category, depth: number): React.ReactNode => {
    if (
      globalListFilterNormalized &&
      !catalogVis.categoryIds.has(cat.id)
    ) {
      return null;
    }

    const children = byParent.get(cat.id) ?? [];
    const childrenVisible = globalListFilterNormalized
      ? children.filter((ch) => catalogVis.categoryIds.has(ch.id))
      : children;
    const catArticles = sortedArticlesInCategory(articles, cat.id);
    const catArticlesVisible = globalListFilterNormalized
      ? catArticles.filter((a) => catalogVis.matchingArticleIds.has(a.id))
      : catArticles;
    const hasBranches =
      childrenVisible.length > 0 || catArticlesVisible.length > 0;
    const isOpen = expanded.has(cat.id);
    const isFolderSelected = folderSel === cat.id && !artSel;

    return (
      <SortableCategoryRow
        key={cat.id}
        category={cat}
        depth={depth}
        hasBranches={hasBranches}
        isOpen={isOpen}
        isFolderSelected={isFolderSelected}
        onToggleExpand={() => toggleExpand(cat.id)}
        onSelectFolder={() => {
          setFolderSel(cat.id);
          setArtSel(null);
        }}
        gripMenuOpen={categoryGripMenuId === cat.id}
        onGripMenuOpenChange={(open) => {
          if (open) setArticleGripMenuId(null);
          setCategoryGripMenuId(open ? cat.id : null);
        }}
        gripClickSuppressUntilRef={suppressCatalogGripClickUntil}
        workspaceId={workspaceId}
        onCategoryUpdated={onCategoryUpdated}
        onCategoryDeleted={onCategoryDeleted}
        onArticleGripMenuClose={() => setArticleGripMenuId(null)}
      >
        {hasBranches && isOpen ? (
          <ul className="list-none">
            <SortableContext
              items={childrenVisible.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {childrenVisible.map((ch) => renderCategoryNode(ch, depth + 1))}
            </SortableContext>
            <SortableContext
              items={catArticlesVisible.map((x) => x.id)}
              strategy={verticalListSortingStrategy}
            >
              {catArticlesVisible.map((a) => (
                <SortableArticleRow
                  key={a.id}
                  article={a}
                  depth={depth + 1}
                  selected={artSel?.id === a.id}
                  onSelect={() => {
                    setArtSel(a);
                    setFolderSel(a.categoryId ?? "uncat");
                  }}
                  gripMenuOpen={articleGripMenuId === a.id}
                  onGripMenuOpenChange={(open) => {
                    if (open) setCategoryGripMenuId(null);
                    setArticleGripMenuId(open ? a.id : null);
                  }}
                  gripClickSuppressUntilRef={suppressCatalogGripClickUntil}
                  onArticleDeleted={onArticleDeleted}
                  onCloseOtherGripMenus={() => setCategoryGripMenuId(null)}
                />
              ))}
            </SortableContext>
          </ul>
        ) : null}
      </SortableCategoryRow>
    );
  };

  const rootCategories = byParent.get(null) ?? [];
  const rootCategoriesVisible = globalListFilterNormalized
    ? rootCategories.filter((c) => catalogVis.categoryIds.has(c.id))
    : rootCategories;
  const uncatOpen = expanded.has(UNCAT_KEY);
  const uncatArticlesVisible = globalListFilterNormalized
    ? uncatArticles.filter((a) => catalogVis.matchingArticleIds.has(a.id))
    : uncatArticles;
  const hasUncat = uncatArticlesVisible.length > 0;

  return (
    <div className="flex min-h-0 w-64 min-w-0 shrink-0 flex-col overflow-x-hidden border-r border-[var(--color-border)] bg-[var(--color-muted)]/20 p-2">
      <div className="mb-2 shrink-0 border-b border-[var(--color-border)] pb-2">
        <p className="mb-1 text-xs text-[var(--color-muted-foreground)]">
          Nouvelle catégorie
          {folderSel !== "all" && folderSel !== "uncat" ? (
            <span className="block truncate font-medium text-[var(--color-foreground)]">
              sous « {byId.get(folderSel)?.name ?? "…"} »
            </span>
          ) : (
            <span className="block">à la racine du catalogue</span>
          )}
        </p>
        <div className="flex gap-1">
          <Input
            placeholder="Nom (ex. Croissant)"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") void onAddCategory();
            }}
          />
          <Button size="sm" className="h-8 shrink-0" type="button" onClick={() => void onAddCategory()}>
            OK
          </Button>
        </div>
        <Button
          className="mt-2 w-full"
          size="sm"
          variant="outline"
          type="button"
          onClick={() => setArtSel(null)}
        >
          Nouvel article
        </Button>
      </div>
      <p className="mb-2 shrink-0 text-sm font-medium">Catalogue</p>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={(e) => {
            const aid = String(e.active.id);
            if (
              categories.some((c) => c.id === aid) ||
              articles.some((a) => a.id === aid)
            ) {
              suppressCatalogGripClickUntil.current = Date.now() + 400;
            }
            onDragEnd(e);
          }}
        >
          <ul className="min-h-0 min-w-0 flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto text-sm">
          <li>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left hover:bg-[var(--color-muted)]",
                folderSel === "all" && !artSel && "bg-[var(--color-muted)] font-medium",
              )}
              onClick={() => {
                setFolderSel("all");
                setArtSel(null);
              }}
            >
              <ListTree className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
              Tous les articles
            </button>
          </li>
          <SortableContext
            items={rootCategoriesVisible.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {rootCategoriesVisible.map((c) => renderCategoryNode(c, 0))}
          </SortableContext>
          {hasUncat && (
            <li className="select-none">
              <DroppableCategoryBanner dropId="drop:uncat">
                <div
                  className={cn(
                    "flex w-full min-w-0 items-center gap-0.5 rounded py-0.5 pr-1 text-sm",
                    folderSel === "uncat" && !artSel && "bg-[var(--color-muted)]",
                  )}
                  style={{ paddingLeft: 4 }}
                >
                  <button
                    type="button"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                    aria-expanded={uncatOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(UNCAT_KEY);
                    }}
                  >
                    {uncatOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-[var(--color-muted)]",
                      folderSel === "uncat" && !artSel && "font-medium",
                    )}
                    onClick={() => {
                      setFolderSel("uncat");
                      setArtSel(null);
                    }}
                  >
                    <Folder className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
                    <span className="truncate">Sans catégorie</span>
                  </button>
                </div>
              </DroppableCategoryBanner>
              {uncatOpen && (
                <SortableContext
                  items={uncatArticlesVisible.map((x) => x.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="list-none">
                    {uncatArticlesVisible.map((a) => (
                      <SortableArticleRow
                        key={a.id}
                        article={a}
                        depth={1}
                        selected={artSel?.id === a.id}
                        onSelect={() => {
                          setArtSel(a);
                          setFolderSel("uncat");
                        }}
                        gripMenuOpen={articleGripMenuId === a.id}
                        onGripMenuOpenChange={(open) => {
                          if (open) setCategoryGripMenuId(null);
                          setArticleGripMenuId(open ? a.id : null);
                        }}
                        gripClickSuppressUntilRef={suppressCatalogGripClickUntil}
                        onArticleDeleted={onArticleDeleted}
                        onCloseOtherGripMenus={() => setCategoryGripMenuId(null)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              )}
            </li>
          )}
        </ul>
        </DndContext>
      </div>
    </div>
  );
}
