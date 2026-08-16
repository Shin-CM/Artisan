import * as React from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { Article, Category } from "@/lib/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { parseArticleOptionsJson } from "@/lib/articleOptions";
import { cn } from "@/lib/utils";
import { buildChildrenMap } from "@/lib/categoryTree";

const UNCAT_KEY = "__uncat__";

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

function norm(s: string): string {
  return stripDiacritics(s).toLowerCase();
}

function sortArticlesForPicker(list: Article[]): Article[] {
  return [...list].sort((x, y) => {
    const ox = x.sortOrder ?? 0;
    const oy = y.sortOrder ?? 0;
    if (ox !== oy) return ox - oy;
    return x.name.localeCompare(y.name, "fr");
  });
}

function variantOptionLabel(
  a: Article,
  v: { label: string; priceDeltaHt: number },
): string {
  return `${a.name} - ${v.label}${
    v.priceDeltaHt !== 0 ? ` (+${v.priceDeltaHt} HT)` : ""
  }`;
}

function combinedValueLabel(raw: string, articles: Article[]): string {
  if (!raw) return "—";
  if (raw.startsWith("a:")) {
    const id = raw.slice(2);
    return articles.find((x) => x.id === id)?.name ?? "—";
  }
  if (raw.startsWith("v:")) {
    const parts = raw.split(":");
    const aid = parts[1];
    const vid = parts[2];
    const a = articles.find((x) => x.id === aid);
    if (!a) return "—";
    const v = parseArticleOptionsJson(a.optionsJson).variants.find(
      (x) => x.id === vid,
    );
    if (!v) return a.name;
    return variantOptionLabel(a, v);
  }
  return "—";
}

function categoryPathNames(
  categoryId: string | null,
  catById: Map<string, Category>,
): string {
  if (!categoryId) return "";
  const parts: string[] = [];
  let id: string | null = categoryId;
  while (id) {
    const c = catById.get(id);
    if (!c) break;
    parts.unshift(c.name);
    id = c.parentId ?? null;
  }
  return parts.join(" ");
}

type SearchableRow = { raw: string; label: string };

function buildSearchableRows(
  articles: Article[],
  catById: Map<string, Category>,
): SearchableRow[] {
  const rows: SearchableRow[] = [];
  for (const a of articles) {
    const path = categoryPathNames(a.categoryId, catById);
    const pathSuffix = path ? ` · ${path}` : "";
    rows.push({
      raw: `a:${a.id}`,
      label: `${a.name}${pathSuffix}`,
    });
    const variants = parseArticleOptionsJson(a.optionsJson).variants;
    for (const v of variants) {
      rows.push({
        raw: `v:${a.id}:${v.id}`,
        label: `${variantOptionLabel(a, v)}${pathSuffix}`,
      });
    }
  }
  return rows;
}

type ArticleVariantLinePickerProps = {
  id: string;
  /** Valeur combinée : `""`, `a:<articleId>`, `v:<articleId>:<variantId>`. */
  value: string;
  onSelect: (raw: string) => void;
  articles: Article[];
  categories: Category[];
  /** Classes du déclencheur (ex. alignement sur les `<select>` du tableau). */
  triggerClassName?: string;
  "aria-label"?: string;
  /** Pied de liste : fermeture du popover puis ouverture modale « nouvel article ». */
  onOpenQuickArticle?: () => void;
};

function CategoryBranchVariant({
  cat,
  depth,
  byParent,
  articlesByCategory,
  expanded,
  toggleExpand,
  combinedValue,
  onPick,
}: {
  cat: Category;
  depth: number;
  byParent: Map<string | null, Category[]>;
  articlesByCategory: Map<string, Article[]>;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  combinedValue: string;
  onPick: (raw: string) => void;
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
            <CategoryBranchVariant
              key={ch.id}
              cat={ch}
              depth={depth + 1}
              byParent={byParent}
              articlesByCategory={articlesByCategory}
              expanded={expanded}
              toggleExpand={toggleExpand}
              combinedValue={combinedValue}
              onPick={onPick}
            />
          ))}
          {hasArticles
            ? arts.map((a) => {
                const variants = parseArticleOptionsJson(a.optionsJson).variants;
                const baseKey = `a:${a.id}`;
                const pad = (depth + 1) * 10 + 28;
                return (
                  <div key={a.id} style={{ paddingLeft: pad }}>
                    <button
                      type="button"
                      className={cn(
                        "w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-[var(--color-muted)]",
                        combinedValue === baseKey &&
                          "bg-[var(--color-muted)] font-medium",
                      )}
                      onClick={() => onPick(baseKey)}
                    >
                      {a.name}
                    </button>
                    {variants.map((v) => {
                      const vk = `v:${a.id}:${v.id}`;
                      return (
                        <div key={v.id} className="mt-0.5 pl-2">
                          <button
                            type="button"
                            className={cn(
                              "w-full rounded px-2 py-1 text-left text-[11px] leading-snug hover:bg-[var(--color-muted)]",
                              combinedValue === vk &&
                                "bg-[var(--color-muted)] font-medium",
                            )}
                            onClick={() => onPick(vk)}
                          >
                            {variantOptionLabel(a, v)}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            : null}
        </div>
      ) : null}
    </div>
  );
}

export function ArticleVariantLinePicker({
  id,
  value,
  onSelect,
  articles,
  categories,
  triggerClassName,
  "aria-label": ariaLabel,
  onOpenQuickArticle,
}: ArticleVariantLinePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());
  const [query, setQuery] = React.useState("");

  const byParent = React.useMemo(
    () => buildChildrenMap(categories),
    [categories],
  );

  const catById = React.useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
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

  const searchableRows = React.useMemo(
    () => buildSearchableRows(articles, catById),
    [articles, catById],
  );

  const filteredRows = React.useMemo(() => {
    const t = query.trim();
    if (!t) return [];
    const n = norm(t);
    return searchableRows.filter(
      (r) => norm(r.label).includes(n) || norm(r.raw).includes(n),
    );
  }, [query, searchableRows]);

  const selectedLabel = React.useMemo(
    () => combinedValueLabel(value, articles),
    [value, articles],
  );

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
  const searchActive = query.trim().length > 0;

  function pick(raw: string) {
    onSelect(raw);
    setOpen(false);
    setQuery("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  function triggerNewArticle() {
    setOpen(false);
    setQuery("");
    onOpenQuickArticle?.();
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex w-full min-w-0 cursor-pointer items-center justify-start text-left font-normal",
            triggerClassName ??
              "h-8 min-h-8 rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-1.5 text-xs leading-none shadow-sm focus:outline-none",
          )}
        >
          <span className="truncate">{selectedLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="flex w-[var(--radix-popover-trigger-width)] min-w-[min(20rem,calc(100vw-2rem))] max-w-[min(28rem,calc(100vw-2rem))] flex-col overflow-hidden p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="shrink-0 border-b border-[var(--color-border)] p-2">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un article…"
            className="h-8 text-xs"
            aria-label="Rechercher dans le catalogue"
            autoComplete="off"
          />
        </div>
        <div className="max-h-[min(18rem,60vh)] min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
          {searchActive ? (
            filteredRows.length === 0 ? (
              <p className="px-2 py-2 text-xs text-[var(--color-muted-foreground)]">
                Aucun résultat.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {filteredRows.map((r) => (
                  <li key={r.raw}>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded px-2 py-1.5 text-left text-xs leading-snug hover:bg-[var(--color-muted)]",
                        value === r.raw && "bg-[var(--color-muted)] font-medium",
                      )}
                      onClick={() => pick(r.raw)}
                    >
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <>
              <button
                type="button"
                className="w-full rounded px-2 py-1.5 text-left text-xs hover:bg-[var(--color-muted)]"
                onClick={() => pick("")}
              >
                —
              </button>
              {rootCategories.map((c) => (
                <CategoryBranchVariant
                  key={c.id}
                  cat={c}
                  depth={0}
                  byParent={byParent}
                  articlesByCategory={articlesByCategory}
                  expanded={expanded}
                  toggleExpand={toggleExpand}
                  combinedValue={value}
                  onPick={pick}
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
                    ? uncategorized.map((a) => {
                        const variants = parseArticleOptionsJson(
                          a.optionsJson,
                        ).variants;
                        const baseKey = `a:${a.id}`;
                        return (
                          <div key={a.id} className="pl-[38px]">
                            <button
                              type="button"
                              className={cn(
                                "w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-[var(--color-muted)]",
                                value === baseKey &&
                                  "bg-[var(--color-muted)] font-medium",
                              )}
                              onClick={() => pick(baseKey)}
                            >
                              {a.name}
                            </button>
                            {variants.map((v) => {
                              const vk = `v:${a.id}:${v.id}`;
                              return (
                                <div key={v.id} className="mt-0.5 pl-2">
                                  <button
                                    type="button"
                                    className={cn(
                                      "w-full rounded px-2 py-1 text-left text-[11px] leading-snug hover:bg-[var(--color-muted)]",
                                      value === vk &&
                                        "bg-[var(--color-muted)] font-medium",
                                    )}
                                    onClick={() => pick(vk)}
                                  >
                                    {variantOptionLabel(a, v)}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    : null}
                </div>
              ) : null}
            </>
          )}
        </div>
        {onOpenQuickArticle ? (
          <div className="shrink-0 border-t border-[var(--color-border)]">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2 px-2 py-2 text-left text-sm text-[var(--color-foreground)] outline-none hover:bg-[var(--color-muted)]"
              onClick={triggerNewArticle}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Nouvel article
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
