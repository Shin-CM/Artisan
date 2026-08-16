/**
 * Retourne le `data-day-iso` de la cellule jour la plus proche située sous le
 * point écran `(x, y)`, ou `null` si aucun ancêtre n'en porte.
 *
 * Utilise `document.elementsFromPoint` (pluriel) afin de **traverser** les
 * éléments empilés (notamment la barre multi-jours `pointer-events: auto` qui
 * masquerait la cellule sous-jacente avec un simple `elementFromPoint`).
 *
 * @param root — Si défini (ex. le `div` scrollable du calendrier), seules les
 *   cellules **contenues** dans `root` sont prises en compte. Évite de résoudre
 *   un jour d’un autre mois **recouvert** par erreur (virtualisation avec hauteur
 *   de slot trop faible) ou un élément hors grille.
 *
 * Robuste hors navigateur (SSR / Vitest sans JSDOM) : retourne `null` si
 * `document` ou `elementsFromPoint` est indisponible.
 */
export function dayIsoUnderPoint(
  x: number,
  y: number,
  root: Element | null = null,
): string | null {
  if (typeof document === "undefined") return null;
  const fn = (
    document as Document & {
      elementsFromPoint?: (x: number, y: number) => Element[];
    }
  ).elementsFromPoint;
  if (typeof fn !== "function") return null;
  const els = fn.call(document, x, y) as Element[];
  for (const el of els) {
    const cell = (el as HTMLElement).closest?.<HTMLElement>("[data-day-iso]");
    if (!cell?.dataset.dayIso) continue;
    if (root && !root.contains(cell)) continue;
    return cell.dataset.dayIso;
  }
  return null;
}
