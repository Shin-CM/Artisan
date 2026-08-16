import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Avertissement / limite d’offre : texte orange selon le thème (lisible en clair). */
export const warningNoticeTextClassName =
  "text-orange-900 dark:text-orange-300";
