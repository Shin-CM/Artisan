/**
 * Présentation « vitrine » pour les modules Marketplace (grille + modales).
 * Variables de thème uniquement — cohérent clair / sombre.
 * Carte grille : icône + titre + chevron uniquement (détails en modale).
 */

export const marketplaceCardArticleClass =
  "group relative w-full overflow-hidden rounded-lg border border-[var(--color-border)]/90 bg-[var(--color-card)] shadow-sm ring-1 ring-black/[0.03] transition-shadow duration-200 hover:shadow-md hover:ring-black/[0.05] dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.45)] dark:ring-white/[0.06] dark:hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.55)] before:pointer-events-none before:absolute before:inset-x-3 before:top-0 before:h-px before:rounded-b-full before:bg-gradient-to-r before:from-transparent before:via-[var(--color-foreground)]/15 before:to-transparent";

export const marketplaceCardButtonClass =
  "relative flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-200 hover:bg-[var(--color-muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)]";

export const marketplaceCardIconFrameClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)]/70 bg-gradient-to-br from-[var(--color-muted)]/80 to-[var(--color-card)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] dark:from-[var(--color-muted)] dark:to-[var(--color-card)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]";

/** Titre seul sur la tuile (une ligne, tronqué si besoin). */
export const marketplaceCardTitleClass =
  "min-w-0 flex-1 truncate text-sm font-semibold leading-tight tracking-tight text-[var(--color-foreground)]";

/** Résumé court affiché en tête de corps de modale (ex- sous-titre de carte). */
export const marketplaceCardSummaryForModalClass =
  "text-sm font-medium leading-snug text-[var(--color-foreground)]";

export const marketplaceCardSubtitleClass =
  "mt-1 text-xs leading-relaxed text-[var(--color-muted-foreground)]";

export const marketplaceBadgeActiveClass =
  "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.14] to-emerald-600/[0.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 shadow-sm dark:text-emerald-200";

export const marketplaceChevronClass =
  "h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] opacity-50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100";

/** Statut module (modale uniquement). */
export const marketplaceModalStatusRowClass =
  "mb-4 flex min-h-[1.75rem] flex-wrap items-center gap-2";

export const marketplaceDialogContentClass =
  "flex max-h-[88vh] max-w-2xl flex-col gap-0 overflow-hidden border-0 bg-[var(--color-card)] p-0 shadow-2xl ring-1 ring-black/[0.06] dark:ring-white/[0.12] sm:max-w-2xl sm:rounded-2xl";

export const marketplaceDialogHeroClass =
  "relative border-b border-[var(--color-border)]/70 bg-gradient-to-br from-[var(--color-muted)]/50 via-[var(--color-card)] to-[var(--color-muted)]/20 px-6 pb-5 pt-6 pr-14";

export const marketplaceDialogTitleClass =
  "text-left text-xl font-semibold leading-tight tracking-tight text-[var(--color-foreground)]";

export const marketplaceDialogBodyClass =
  "min-h-0 flex-1 overflow-y-auto px-6 py-5 pr-12";

export const marketplaceDialogLeadClass =
  "text-sm leading-relaxed text-[var(--color-muted-foreground)]";

export const marketplaceDialogSpecClass =
  "mt-5 grid gap-3 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-muted)]/[0.22] p-4 text-xs sm:grid-cols-2 dark:bg-[var(--color-muted)]/20";

export const marketplaceDialogActionsClass =
  "mt-8 flex flex-wrap gap-3 border-t border-[var(--color-border)]/60 pt-6";

export const marketplaceModalIconFrameClass =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)]/60 bg-gradient-to-br from-[var(--color-muted)]/80 to-[var(--color-card)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]";

export const marketplaceGalleryGridGapClass = "gap-3";

/** Hauteur alignée sur une tuile compacte (une ligne). */
export const marketplaceEmptySlotClass =
  "w-full min-h-[3.5rem] rounded-lg border border-dashed border-[var(--color-border)]/60 bg-gradient-to-b from-[var(--color-muted)]/20 to-[var(--color-card)]/30 dark:from-[var(--color-muted)]/12 dark:to-transparent";
