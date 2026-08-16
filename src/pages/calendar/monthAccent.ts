import type * as React from "react";

/**
 * Couleur d'accentuation par mois (0..11).
 *
 * Génère un couple light/dark depuis le mois (HSL doux). Utilisé pour :
 * - la **pastille colorée** du numéro du jour (mode `pastille`),
 * - le **bandeau alterné** des semaines (mode `alternating`).
 */

export type MonthAccent = {
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
};

/** 12 teintes réparties autour du cercle, démarrant à 220° (bleu) pour janvier. */
const HUE_BASE = 220;
const HUE_STEP = 30;

export function monthAccent(month: number): MonthAccent {
  const safe = ((month % 12) + 12) % 12;
  const hue = (HUE_BASE + safe * HUE_STEP) % 360;
  return {
    bgLight: `hsl(${hue} 55% 90%)`,
    bgDark: `hsl(${hue} 35% 24%)`,
    textLight: `hsl(${hue} 55% 32%)`,
    textDark: `hsl(${hue} 65% 80%)`,
  };
}

/** Renvoie un fond semi-transparent pour le bandeau alterné. */
export function monthBandStyle(month: number): React.CSSProperties {
  const accent = monthAccent(month);
  return {
    // CSS variables consommées via Tailwind arbitraire dans le composant.
    ["--cal-month-bg-light" as never]: accent.bgLight + "33",
    ["--cal-month-bg-dark" as never]: accent.bgDark + "55",
  } as React.CSSProperties;
}

/** Renvoie le style à appliquer sur la pastille du numéro du jour. */
export function monthPastilleStyle(month: number): React.CSSProperties {
  const accent = monthAccent(month);
  return {
    ["--cal-pastille-bg-light" as never]: accent.bgLight,
    ["--cal-pastille-bg-dark" as never]: accent.bgDark,
    ["--cal-pastille-text-light" as never]: accent.textLight,
    ["--cal-pastille-text-dark" as never]: accent.textDark,
  } as React.CSSProperties;
}
