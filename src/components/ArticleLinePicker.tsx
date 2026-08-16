import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Article, Category } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { buildChildrenMap } from "@/lib/categoryTree";

const UNCAT_KEY = "__uncat__";

function sortArticlesForPicker(list: Article[]): Article[] {
  return [...list].sort((x, y) => {
    const ox = x.sortOrder ?? 0;
    const oy = y.sortOrder ?? 0;
    if (ox !== oy) return ox - oy;
    return x.name.localeCompare(y.name, "fr");
  });
}

type ArticleLinePickerProps = {
  id: string;
  value: string | null;
  onSelect: (articleId: string | null) => void;
  articles: Article[];
  categories: Category[];
  /** Déclencheur plus bas (ex. lignes devis / facture). */
  compact?: boolean;
};

function CategoryBranch({
  cat,
  depth,
  byParent,
  articlesByCategory,
  expanded,
  toggleExpand,
  value,
  onPickArticle,
}: {
  cat: Category;
  depth: number;
  byParent: Map<string | null, Category[]>;
  articlesByCategory: Map<string, Article[]>;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  value: string | null;
  onPickArticle: (a: Article) => void;
}) {
  const children = byParent.get(cat.id) ?? [];
  const arts = articlesByCategory.get(cat.id) ?? [];
  const hasBranches = children.length > 0;
  const hasArticles = arts.length > 0;
  const hasContent = hasBranches || hasArticles;
  const isOpen = expanded.has(cat.id);

  return (
    <div className="select-none" style={{ paddingLeft: depth * 10 }}>
      <div className="flex min-w-0 items-center gap-0.5 py-0.5">
        {hasContent ? (
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            aria-expanded={isOpen}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(cat.id);
            }}
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        ) : (
          <span className="inline-block w-7 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          className={cn(
            "min-w-0 flex-1 truncate rounded px-1.5 py-1 text-left text-xs font-medium hover:bg-[var(--color-muted)]",
            hasContent && "cursor-pointer",
          )}
          onClick={() => {
            if (hasContent) toggleExpand(cat.id);
          }}
        >
          {cat.name}
        </button>
      </div>
      {isOpen && hasContent ? (
        <div className="space-y-0.5 pb-1">
          {children.map((ch) => (
            <CategoryBranch
              key={ch.id}
              cat={ch}
              depth={depth + 1}
              byParent={byParent}
              articlesByCategory={articlesByCategory}
              expanded={expanded}
              toggleExpand={toggleExpand}
              value={value}
              onPickArticle={onPickArticle}
            />
          ))}
          {hasArticles
            ? arts.map((a) => (
                <div key={a.id} style={{ paddingLeft: (depth + 1) * 10 + 28 }}>
                  <button
                    type="button"
                    className={cn(
                      "w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-[var(--color-muted)]",
                      value === a.id && "bg-[var(--color-muted)] font-medium",
                    )}
                    onClick={() => onPickArticle(a)}
                  >
                    {a.name}
                  </button>
                </div>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}

export function ArticleLinePicker({
  id,
  value,
  onSelect,
  articles,
  categories,
  compact = false,
}: ArticleLinePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());

  const byParent = React.useMemo(
    () => buildChildrenMap(categories),
    [categories],
  );

  const articlesByCategory = React.useMemo(() => {
    const m = new Map<string, Article[]>();
    for (const a of articles) {
      if (!a.categoryId) continue;
      if (!m.has(a.categoryId)) m.set(a.categoryId, []);
      m.get(a.categoryId)!.push(a);
    }
    for (const list of m.values()) sortArticlesForPicker(list);
    return m;
  }, [articles]);

  const uncategorized = React.useMemo(
    () => sortArticlesForPicker(articles.filter((a) => !a.categoryId)),
    [articles],
  );

  React.useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const c of categories) next.add(c.id);
      return next;
    });
  }, [categories]);

  const selectedLabel = value
    ? articles.find((a) => a.id === value)?.name ?? "—"
    : "—";

  const toggleExpand = React.useCallback((catId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }, []);

  const toggleUncat = React.useCallback(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(UNCAT_KEY)) next.delete(UNCAT_KEY);
      else next.add(UNCAT_KEY);
      return next;
    });
  }, []);

  const rootCategories = byParent.get(null) ?? [];
  const uncatOpen = expanded.has(UNCAT_KEY);
  const hasUncat = uncategorized.length > 0;

  function pickArticle(a: Article) {
    onSelect(a.id);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "w-full min-w-0 justify-start text-left font-normal shadow-sm",
            compact
              ? "h-7 min-h-7 px-1 text-[11px] leading-none"
              : "h-8 min-h-8 px-1.5 text-xs",
          )}
        >
          <span className="truncate">{selectedLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[12rem] p-1"
        align="start"
      >
        <div className="max-h-[min(16rem,70vh)] overflow-y-auto">
          <button
            type="button"
            className="w-full rounded px-2 py-1.5 text-left text-xs hover:bg-[var(--color-muted)]"
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
          >
            —
          </button>
          {rootCategories.map((c) => (
            <CategoryBranch
              key={c.id}
              cat={c}
              depth={0}
              byParent={byParent}
              articlesByCategory={articlesByCategory}
              expanded={expanded}
              toggleExpand={toggleExpand}
              value={value}
              onPickArticle={pickArticle}
            />
          ))}
          {hasUncat ? (
            <div className="select-none border-t border-[var(--color-border)] pt-1">
              <div className="flex min-w-0 items-center gap-0.5 py-0.5">
                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                  aria-expanded={uncatOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUncat();
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
                  className="min-w-0 flex-1 truncate rounded px-1.5 py-1 text-left text-xs font-medium hover:bg-[var(--color-muted)]"
                  onClick={() => toggleUncat()}
                >
                  Sans catégorie
                </button>
              </div>
              {uncatOpen
                ? uncategorized.map((a) => (
                    <div key={a.id} className="pl-[38px]">
                      <button
                        type="button"
                        className={cn(
                          "w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-[var(--color-muted)]",
                          value === a.id && "bg-[var(--color-muted)] font-medium",
                        )}
                        onClick={() => pickArticle(a)}
                      >
                        {a.name}
                      </button>
                    </div>
                  ))
                : null}
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
