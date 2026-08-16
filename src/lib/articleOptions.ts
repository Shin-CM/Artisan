import { roundMoneyHt } from "@/core/documentMath";
import {
  clampLinePricesFractionDigits,
  LINE_PRICES_FRACTION_DIGITS_MIN,
} from "@/lib/documentOptions";
import type { Article } from "@/lib/api";
import type { LineBillingMode } from "@/lib/lineBilling";
import { unitPriceForArticleMode } from "@/lib/lineBilling";

export const ARTICLE_OPTIONS_VERSION = 1 as const;

export type ArticleVariantDef = {
  id: string;
  label: string;
  priceDeltaHt: number;
};

export type ArticleOptionsV1 = {
  version: typeof ARTICLE_OPTIONS_VERSION;
  variants: ArticleVariantDef[];
};

/** Identifiant fictif pour la ligne « catalogue seul » dans les selects UI. */
export const STANDARD_VARIANT_VALUE = "__standard__";

export function parseArticleOptionsJson(raw: string | null | undefined): ArticleOptionsV1 {
  if (raw == null || raw.trim() === "") {
    return { version: ARTICLE_OPTIONS_VERSION, variants: [] };
  }
  try {
    const j: unknown = JSON.parse(raw);
    if (Array.isArray(j)) {
      return { version: ARTICLE_OPTIONS_VERSION, variants: [] };
    }
    if (
      j &&
      typeof j === "object" &&
      (j as { version?: unknown }).version === ARTICLE_OPTIONS_VERSION &&
      Array.isArray((j as { variants?: unknown }).variants)
    ) {
      const variants = (j as { variants: unknown[] }).variants
        .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
        .map((v) => ({
          id: String(v.id ?? ""),
          label: String(v.label ?? "").trim(),
          priceDeltaHt: Number(v.priceDeltaHt) || 0,
        }))
        .filter((v) => v.id.length > 0 && v.label.length > 0);
      return { version: ARTICLE_OPTIONS_VERSION, variants };
    }
  } catch {
    /* ignore */
  }
  return { version: ARTICLE_OPTIONS_VERSION, variants: [] };
}

export function serializeArticleOptionsV1(opts: ArticleOptionsV1): Record<string, unknown> {
  return {
    version: ARTICLE_OPTIONS_VERSION,
    variants: opts.variants.map((v) => ({
      id: v.id,
      label: v.label.trim(),
      priceDeltaHt: Number.isFinite(v.priceDeltaHt) ? v.priceDeltaHt : 0,
    })),
  };
}

export function lineDescriptionForVariant(articleName: string, variantLabel: string): string {
  const a = articleName.trim();
  const l = variantLabel.trim();
  if (!l) return a;
  return `${a} ${l}`.trim();
}

export type LineVariantSnapshotV1 = {
  version: typeof ARTICLE_OPTIONS_VERSION;
  articleId: string;
  variantId: string | null;
  articleName: string;
  variantLabel: string;
  priceDeltaHt: number;
  billingMode: string;
};

export function buildLineVariantSnapshot(args: {
  articleId: string;
  articleName: string;
  variantId: string | null;
  variantLabel: string;
  priceDeltaHt: number;
  billingMode: string;
}): LineVariantSnapshotV1 {
  return {
    version: ARTICLE_OPTIONS_VERSION,
    articleId: args.articleId,
    variantId: args.variantId,
    articleName: args.articleName,
    variantLabel: args.variantLabel,
    priceDeltaHt: args.priceDeltaHt,
    billingMode: args.billingMode,
  };
}

export function parseLineVariantSnapshot(json: string | null | undefined): LineVariantSnapshotV1 | null {
  if (json == null || json.trim() === "" || json.trim() === "{}") return null;
  try {
    const o: unknown = JSON.parse(json);
    if (
      o &&
      typeof o === "object" &&
      (o as { version?: unknown }).version === ARTICLE_OPTIONS_VERSION &&
      typeof (o as { articleId?: unknown }).articleId === "string"
    ) {
      const x = o as Record<string, unknown>;
      return {
        version: ARTICLE_OPTIONS_VERSION,
        articleId: String(x.articleId),
        variantId: x.variantId == null || x.variantId === "" ? null : String(x.variantId),
        articleName: String(x.articleName ?? ""),
        variantLabel: String(x.variantLabel ?? ""),
        priceDeltaHt: Number(x.priceDeltaHt) || 0,
        billingMode: String(x.billingMode ?? "unit"),
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Variante sélectionnée sur la ligne si le snapshot correspond à l’article courant. */
export function variantSelectValueFromLine(
  optionsSnapshotJson: string | undefined,
  articleId: string | null,
): string {
  if (!articleId) return STANDARD_VARIANT_VALUE;
  const s = parseLineVariantSnapshot(optionsSnapshotJson);
  if (!s || s.articleId !== articleId) return STANDARD_VARIANT_VALUE;
  if (s.variantId == null || s.variantId === "") return STANDARD_VARIANT_VALUE;
  return s.variantId;
}

export function articleHasVariants(article: Article | undefined): boolean {
  if (!article) return false;
  return parseArticleOptionsJson(article.optionsJson).variants.length > 0;
}

/**
 * Applique une variante (ou standard) : description PDF, prix HT ligne, snapshot JSON.
 * Si l’article n’a pas de variantes définies, retourne nom + prix catalogue et snapshot vide.
 */
export function applyVariantToLine(args: {
  article: Article;
  billingMode: LineBillingMode;
  /** `null` ou `STANDARD_VARIANT_VALUE` = prix / libellé catalogue seul */
  variantId: string | null;
  /** Décimales PU HT (défaut 2) — aligné sur `documentInputPreferences`. */
  linePricesFractionDigits?: number;
}): { description: string; unitPrice: number; optionsSnapshotJson: string } {
  const fd = clampLinePricesFractionDigits(
    args.linePricesFractionDigits ?? LINE_PRICES_FRACTION_DIGITS_MIN,
  );
  const opts = parseArticleOptionsJson(args.article.optionsJson);
  const base = unitPriceForArticleMode(args.article, args.billingMode);
  if (opts.variants.length === 0) {
    return {
      description: args.article.name.trim(),
      unitPrice: roundMoneyHt(base, fd),
      optionsSnapshotJson: "{}",
    };
  }

  const isStandard =
    args.variantId == null ||
    args.variantId === "" ||
    args.variantId === STANDARD_VARIANT_VALUE;

  if (isStandard) {
    return {
      description: args.article.name.trim(),
      unitPrice: roundMoneyHt(base, fd),
      optionsSnapshotJson: JSON.stringify(
        buildLineVariantSnapshot({
          articleId: args.article.id,
          articleName: args.article.name,
          variantId: null,
          variantLabel: "",
          priceDeltaHt: 0,
          billingMode: args.billingMode,
        }),
      ),
    };
  }

  const v = opts.variants.find((x) => x.id === args.variantId);
  if (!v) {
    return {
      description: args.article.name.trim(),
      unitPrice: roundMoneyHt(base, fd),
      optionsSnapshotJson: JSON.stringify(
        buildLineVariantSnapshot({
          articleId: args.article.id,
          articleName: args.article.name,
          variantId: null,
          variantLabel: "",
          priceDeltaHt: 0,
          billingMode: args.billingMode,
        }),
      ),
    };
  }

  const delta = Number.isFinite(v.priceDeltaHt) ? v.priceDeltaHt : 0;
  return {
    description: lineDescriptionForVariant(args.article.name, v.label),
    unitPrice: roundMoneyHt(base + delta, fd),
    optionsSnapshotJson: JSON.stringify(
      buildLineVariantSnapshot({
        articleId: args.article.id,
        articleName: args.article.name,
        variantId: v.id,
        variantLabel: v.label,
        priceDeltaHt: delta,
        billingMode: args.billingMode,
      }),
    ),
  };
}
