import * as React from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useGlobalSearch } from "@/context/GlobalSearchContext";
import { globalSearchNormalized } from "@/lib/globalSearchFilter";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { buildChildrenMap, idsToExpandForCategory } from "@/lib/categoryTree";
import {
  sortedArticlesInCategory,
  flattenArticleReorderItemsFromState,
} from "@/lib/articleOrder";
import type { ArticleVariantDef } from "@/lib/articleOptions";
import {
  parseArticleOptionsJson,
  serializeArticleOptionsV1,
} from "@/lib/articleOptions";
import { ProductArticleEditorPanel } from "@/pages/products/ProductArticleEditorPanel";
import { ProductCatalogSidebar } from "@/pages/products/ProductCatalogSidebar";
import {
  type FolderSel,
  parentIdForNewCategory,
  resolveCategoryIdForSave,
} from "@/pages/products/productCatalogTypes";

export function ProductsPage() {
  const { active } = useWorkspace();
  const { query: globalSearchQuery } = useGlobalSearch();
  const catalogSearchNorm = React.useMemo(
    () => globalSearchNormalized(globalSearchQuery),
    [globalSearchQuery],
  );
  const [categories, setCategories] = React.useState<api.Category[]>([]);
  const [articles, setArticles] = React.useState<api.Article[]>([]);
  const [folderSel, setFolderSel] = React.useState<FolderSel>("all");
  const [artSel, setArtSel] = React.useState<api.Article | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());
  const [newCat, setNewCat] = React.useState("");
  const [categoryGripMenuId, setCategoryGripMenuId] = React.useState<string | null>(null);
  const [articleGripMenuId, setArticleGripMenuId] = React.useState<string | null>(null);
  const suppressCatalogGripClickUntil = React.useRef(0);
  const [aname, setAname] = React.useState("");
  const [aprice, setAprice] = React.useState("");
  const [aflat, setAflat] = React.useState("");
  const [ahourly, setAhourly] = React.useState("");
  const [acost, setAcost] = React.useState("");
  const [asupplierName, setAsupplierName] = React.useState("");
  const [asupplierReference, setAsupplierReference] = React.useState("");
  const [articleVariants, setArticleVariants] = React.useState<ArticleVariantDef[]>([]);

  const byId = React.useMemo(
    () => new Map(categories.map((c) => [c.id, c] as const)),
    [categories],
  );
  const byParent = React.useMemo(() => buildChildrenMap(categories), [categories]);

  const expandAround = React.useCallback(
    (categoryId: string | null) => {
      if (!categoryId) return;
      const ids = idsToExpandForCategory(categoryId, byId);
      setExpanded((prev) => new Set([...prev, ...ids]));
    },
    [byId],
  );

  const load = React.useCallback(async () => {
    if (!active) return;
    const [c, a] = await Promise.all([
      api.listCategories(active.id),
      api.listArticles(active.id),
    ]);
    setCategories(c);
    setArticles(a);
  }, [active]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (artSel?.categoryId) expandAround(artSel.categoryId);
  }, [artSel?.id, artSel?.categoryId, expandAround]);

  React.useEffect(() => {
    if (folderSel !== "all" && folderSel !== "uncat") expandAround(folderSel);
  }, [folderSel, expandAround]);

  React.useEffect(() => {
    if (artSel) {
      setAname(artSel.name);
      setAprice(artSel.basePrice === 0 ? "" : String(artSel.basePrice));
      setAflat(artSel.flatPrice != null ? String(artSel.flatPrice) : "");
      setAhourly(artSel.hourlyRate != null ? String(artSel.hourlyRate) : "");
      setAcost(artSel.productionCost != null ? String(artSel.productionCost) : "");
      setAsupplierName(artSel.supplierName?.trim() ?? "");
      setAsupplierReference(artSel.supplierReference?.trim() ?? "");
      setArticleVariants([...parseArticleOptionsJson(artSel.optionsJson).variants]);
    } else {
      setAname("");
      setAprice("");
      setAflat("");
      setAhourly("");
      setAcost("");
      setAsupplierName("");
      setAsupplierReference("");
      setArticleVariants([]);
    }
  }, [artSel]);

  const toggleExpand = React.useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  async function addCategory() {
    if (!active || !newCat.trim()) return;
    await api.createCategory(active.id, newCat.trim(), parentIdForNewCategory(folderSel));
    setNewCat("");
    void load();
  }

  async function saveArticle() {
    if (!active || !aname.trim()) return;
    const cost = acost === "" ? null : Number(acost);
    const flatPrice = aflat.trim() === "" ? null : Number(aflat);
    const hourlyRate = ahourly.trim() === "" ? null : Number(ahourly);
    const categoryId = resolveCategoryIdForSave(folderSel, artSel);
    const optionsPayload = serializeArticleOptionsV1({
      version: 1,
      variants: articleVariants.filter((v) => v.label.trim().length > 0),
    });
    try {
      if (artSel) {
        await api.updateArticle(artSel.id, {
          name: aname.trim(),
          categoryId,
          basePrice: Number(aprice) || 0,
          flatPrice: flatPrice != null && Number.isFinite(flatPrice) ? flatPrice : null,
          hourlyRate: hourlyRate != null && Number.isFinite(hourlyRate) ? hourlyRate : null,
          productionCost: cost,
          optionsJson: optionsPayload,
          supplierName: asupplierName.trim() || null,
          supplierReference: asupplierReference.trim() || null,
        });
        toast.success("Article mis à jour");
      } else {
        await api.createArticle(active.id, {
          name: aname.trim(),
          categoryId,
          basePrice: Number(aprice) || 0,
          flatPrice: flatPrice != null && Number.isFinite(flatPrice) ? flatPrice : null,
          hourlyRate: hourlyRate != null && Number.isFinite(hourlyRate) ? hourlyRate : null,
          productionCost: cost,
          optionsJson: optionsPayload,
          supplierName: asupplierName.trim() || null,
          supplierReference: asupplierReference.trim() || null,
        });
        toast.success("Article créé");
      }
      setArtSel(null);
      void load();
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function deleteArticle() {
    if (!artSel) return;
    await api.deleteArticle(artSel.id);
    setArtSel(null);
    void load();
    toast.success("Supprimé");
  }

  async function handleCategoryDragEnd(event: DragEndEvent) {
    if (!active) return;
    const { active: act, over } = event;
    if (!over) return;
    const cid = String(act.id);
    const dragged = categories.find((c) => c.id === cid);
    if (!dragged) return;
    const overId = String(over.id);
    if (overId.startsWith("drop:")) return;
    const target = categories.find((c) => c.id === overId);
    if (!target) return;
    const parent = dragged.parentId ?? null;
    if ((target.parentId ?? null) !== parent) return;
    const siblings = byParent.get(parent) ?? [];
    const oldIndex = siblings.findIndex((x) => x.id === cid);
    const newIndex = siblings.findIndex((x) => x.id === overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    const reordered = arrayMove(siblings, oldIndex, newIndex);
    try {
      await api.reorderCategories(
        active.id,
        parent,
        reordered.map((c) => c.id),
      );
      await load();
    } catch (e) {
      toast.error(String(e));
      void load();
    }
  }

  async function handleArticleDragEnd(event: DragEndEvent) {
    if (!active) return;
    const { active: act, over } = event;
    if (!over) return;
    const aid = String(act.id);
    if (categories.some((c) => c.id === aid)) {
      await handleCategoryDragEnd(event);
      return;
    }
    const article = articles.find((x) => x.id === aid);
    if (!article) return;
    const oid = String(over.id);

    try {
      if (oid.startsWith("drop:")) {
        const raw = oid.slice(5);
        const newCat = raw === "uncat" ? null : raw;
        if ((article.categoryId ?? "\0") === (newCat ?? "\0")) return;
        const without = articles.filter((x) => x.id !== aid);
        const targetList = sortedArticlesInCategory(without, newCat);
        const moved: api.Article = { ...article, categoryId: newCat };
        const newTargetList = [...targetList, moved].map((x, i) => ({
          ...x,
          sortOrder: i,
        }));
        const next = [
          ...without.filter((x) => (x.categoryId ?? null) !== newCat),
          ...newTargetList,
        ];
        await api.reorderArticles(
          active.id,
          flattenArticleReorderItemsFromState(next),
        );
        await load();
        return;
      }

      const overArt = articles.find((x) => x.id === oid);
      if (!overArt) return;
      const fromCat = article.categoryId ?? null;
      const toCat = overArt.categoryId ?? null;
      const without = articles.filter((x) => x.id !== aid);

      if (fromCat === toCat) {
        const group = sortedArticlesInCategory(articles, fromCat);
        const oldIndex = group.findIndex((x) => x.id === aid);
        const newIndex = group.findIndex((x) => x.id === oid);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
        const reordered = arrayMove(group, oldIndex, newIndex);
        const merged = reordered.map((x, i) => ({ ...x, sortOrder: i }));
        const next = [
          ...articles.filter((x) => (x.categoryId ?? null) !== fromCat),
          ...merged,
        ];
        await api.reorderArticles(
          active.id,
          flattenArticleReorderItemsFromState(next),
        );
        await load();
        return;
      }

      const group = sortedArticlesInCategory(without, toCat);
      const insertAt = group.findIndex((x) => x.id === oid);
      const moved: api.Article = { ...article, categoryId: toCat };
      const newGroup = [...group.slice(0, insertAt), moved, ...group.slice(insertAt)].map(
        (x, i) => ({ ...x, sortOrder: i }),
      );
      const next = [
        ...without.filter((x) => (x.categoryId ?? null) !== toCat),
        ...newGroup,
      ];
      await api.reorderArticles(
        active.id,
        flattenArticleReorderItemsFromState(next),
      );
      await load();
    } catch (e) {
      toast.error(String(e));
      void load();
    }
  }

  if (!active) return null;

  return (
    <div className="flex h-full min-h-0">
      <ProductCatalogSidebar
        workspaceId={active.id}
        categories={categories}
        articles={articles}
        globalListFilterNormalized={catalogSearchNorm}
        folderSel={folderSel}
        setFolderSel={setFolderSel}
        artSel={artSel}
        setArtSel={setArtSel}
        newCat={newCat}
        setNewCat={setNewCat}
        onAddCategory={() => void addCategory()}
        expanded={expanded}
        toggleExpand={toggleExpand}
        categoryGripMenuId={categoryGripMenuId}
        setCategoryGripMenuId={setCategoryGripMenuId}
        articleGripMenuId={articleGripMenuId}
        setArticleGripMenuId={setArticleGripMenuId}
        suppressCatalogGripClickUntil={suppressCatalogGripClickUntil}
        onCategoryUpdated={() => void load()}
        onCategoryDeleted={(deletedId, parentId) => {
          setCategoryGripMenuId((mid) => (mid === deletedId ? null : mid));
          setFolderSel((fs) => (fs === deletedId ? (parentId ?? "all") : fs));
          setArtSel((a) => (a?.categoryId === deletedId ? { ...a, categoryId: null } : a));
          void load();
        }}
        onArticleDeleted={(deletedId) => {
          setArticleGripMenuId((mid) => (mid === deletedId ? null : mid));
          setArtSel((a) => (a?.id === deletedId ? null : a));
          void load();
        }}
        onDragEnd={(e) => void handleArticleDragEnd(e)}
      />
      <ProductArticleEditorPanel
        artSel={artSel}
        aname={aname}
        setAname={setAname}
        aprice={aprice}
        setAprice={setAprice}
        aflat={aflat}
        setAflat={setAflat}
        ahourly={ahourly}
        setAhourly={setAhourly}
        acost={acost}
        setAcost={setAcost}
        asupplierName={asupplierName}
        setAsupplierName={setAsupplierName}
        asupplierReference={asupplierReference}
        setAsupplierReference={setAsupplierReference}
        articleVariants={articleVariants}
        setArticleVariants={setArticleVariants}
        onSave={() => void saveArticle()}
        onDeleteArticle={() => void deleteArticle()}
      />
    </div>
  );
}
