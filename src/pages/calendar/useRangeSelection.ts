import * as React from "react";
import { normalizeIsoRange } from "./calendarMonths";

/**
 * Représente une plage de jours **brouillon** sélectionnée par l'utilisateur via
 * un clic maintenu (`pointerdown` puis `pointermove`). Cette plage est
 * normalisée (`start <= end`) et persiste tant que l'utilisateur ne clique pas
 * hors de la plage ou n'annule pas via `Échap`.
 */
export type RangeSelection = {
  start: string;
  end: string;
};

const AUTO_SCROLL_EDGE_PX = 64;
const AUTO_SCROLL_MAX_SPEED = 18;
const DRAG_THRESHOLD_PX = 4;

type DragState =
  | { phase: "idle" }
  | {
      phase: "pending";
      anchorIso: string;
      anchorPointerX: number;
      anchorPointerY: number;
    }
  | {
      phase: "dragging";
      anchorIso: string;
      currentIso: string;
    };

/**
 * Hook gérant la sélection multi-jours par clic maintenu.
 *
 * Convention :
 * - On capture un `pointerdown` sur une cellule (élément portant
 *   `data-day-iso`). Si l'événement est un drag d'un événement existant (élément
 *   portant `data-event-id` plus profond), on annule (`bail`).
 * - On enregistre l'ancre (jour de départ + position pointeur) puis on observe
 *   les `pointermove`. Tant que le déplacement reste sous `DRAG_THRESHOLD_PX`,
 *   on n'active **pas** la sélection (un simple clic reste un simple clic).
 * - Une fois le seuil franchi, on entre en phase « dragging » et on suit la
 *   cellule sous le pointeur via `document.elementFromPoint`.
 * - Pendant la phase dragging, si le pointeur s'approche du haut ou du bas du
 *   conteneur scrollable (`scrollRef`), on déclenche un auto-scroll continu via
 *   `requestAnimationFrame`.
 * - Au `pointerup` après un drag, on appelle `onCommit(range)` (le composant
 *   parent ouvre la modale de création).
 */
export function useRangeSelection({
  scrollRef,
  onCommit,
}: {
  scrollRef: React.RefObject<HTMLElement | null>;
  onCommit: (range: RangeSelection) => void;
}) {
  const [liveRange, setLiveRange] = React.useState<RangeSelection | null>(null);
  const dragStateRef = React.useRef<DragState>({ phase: "idle" });
  const autoScrollRafRef = React.useRef<number | null>(null);
  const pointerYRef = React.useRef<number>(0);

  const stopAutoScroll = React.useCallback(() => {
    if (autoScrollRafRef.current !== null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  const isoUnderPointer = React.useCallback((x: number, y: number) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const cell = (el as HTMLElement).closest<HTMLElement>("[data-day-iso]");
    return cell?.dataset.dayIso ?? null;
  }, []);

  const tickAutoScroll = React.useCallback(() => {
    const node = scrollRef.current;
    if (!node) {
      autoScrollRafRef.current = null;
      return;
    }
    const rect = node.getBoundingClientRect();
    const y = pointerYRef.current;
    let dy = 0;
    if (y < rect.top + AUTO_SCROLL_EDGE_PX) {
      const ratio = Math.max(
        0,
        Math.min(1, (rect.top + AUTO_SCROLL_EDGE_PX - y) / AUTO_SCROLL_EDGE_PX),
      );
      dy = -Math.ceil(ratio * AUTO_SCROLL_MAX_SPEED);
    } else if (y > rect.bottom - AUTO_SCROLL_EDGE_PX) {
      const ratio = Math.max(
        0,
        Math.min(1, (y - (rect.bottom - AUTO_SCROLL_EDGE_PX)) / AUTO_SCROLL_EDGE_PX),
      );
      dy = Math.ceil(ratio * AUTO_SCROLL_MAX_SPEED);
    }
    if (dy !== 0) {
      node.scrollTop += dy;
      const iso = isoUnderPointer(
        Math.min(rect.right - 2, Math.max(rect.left + 2, node.clientWidth / 2 + rect.left)),
        y,
      );
      if (iso) {
        const state = dragStateRef.current;
        if (state.phase === "dragging") {
          dragStateRef.current = { ...state, currentIso: iso };
          const [start, end] = normalizeIsoRange(state.anchorIso, iso);
          setLiveRange({ start, end });
        }
      }
    }
    autoScrollRafRef.current = requestAnimationFrame(tickAutoScroll);
  }, [isoUnderPointer, scrollRef]);

  const ensureAutoScroll = React.useCallback(() => {
    if (autoScrollRafRef.current === null) {
      autoScrollRafRef.current = requestAnimationFrame(tickAutoScroll);
    }
  }, [tickAutoScroll]);

  const handleWindowPointerMove = React.useCallback(
    (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (state.phase === "idle") return;
      pointerYRef.current = e.clientY;
      if (state.phase === "pending") {
        const dx = e.clientX - state.anchorPointerX;
        const dy = e.clientY - state.anchorPointerY;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        const iso = isoUnderPointer(e.clientX, e.clientY) ?? state.anchorIso;
        dragStateRef.current = {
          phase: "dragging",
          anchorIso: state.anchorIso,
          currentIso: iso,
        };
        const [start, end] = normalizeIsoRange(state.anchorIso, iso);
        setLiveRange({ start, end });
        ensureAutoScroll();
        return;
      }
      const iso = isoUnderPointer(e.clientX, e.clientY);
      if (!iso) return;
      if (iso !== state.currentIso) {
        dragStateRef.current = { ...state, currentIso: iso };
        const [start, end] = normalizeIsoRange(state.anchorIso, iso);
        setLiveRange({ start, end });
      }
    },
    [ensureAutoScroll, isoUnderPointer],
  );

  const finishDrag = React.useCallback(() => {
    const state = dragStateRef.current;
    dragStateRef.current = { phase: "idle" };
    stopAutoScroll();
    if (state.phase !== "dragging") {
      setLiveRange(null);
      return;
    }
    const [start, end] = normalizeIsoRange(state.anchorIso, state.currentIso);
    setLiveRange(null);
    onCommit({ start, end });
  }, [onCommit, stopAutoScroll]);

  const handleWindowPointerUp = React.useCallback(() => {
    if (dragStateRef.current.phase === "idle") return;
    finishDrag();
  }, [finishDrag]);

  const handleWindowPointerCancel = React.useCallback(() => {
    if (dragStateRef.current.phase === "idle") return;
    dragStateRef.current = { phase: "idle" };
    stopAutoScroll();
    setLiveRange(null);
  }, [stopAutoScroll]);

  React.useEffect(() => {
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerCancel);
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerCancel);
      stopAutoScroll();
    };
  }, [
    handleWindowPointerMove,
    handleWindowPointerUp,
    handleWindowPointerCancel,
    stopAutoScroll,
  ]);

  /**
   * À brancher sur le `onPointerDown` de chaque cellule jour. La cellule **doit**
   * porter `data-day-iso`. Si le clic vise un événement (descendant porteur de
   * `data-event-id`), on bail out pour laisser la main au DnD existant.
   */
  const onCellPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLElement>, iso: string) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-event-id]")) return;
      dragStateRef.current = {
        phase: "pending",
        anchorIso: iso,
        anchorPointerX: e.clientX,
        anchorPointerY: e.clientY,
      };
      pointerYRef.current = e.clientY;
    },
    [],
  );

  return { liveRange, onCellPointerDown };
}
