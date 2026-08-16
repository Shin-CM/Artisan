import * as React from "react";
import {
  MONTH_HEIGHT_PX,
  monthFromIndex,
  monthsCount,
  scrollTopForIndex,
  visibleMonthIndex,
  windowIndices,
  type MonthAnchor,
} from "./calendarMonths";

export type VirtualMonth = {
  index: number;
  year: number;
  month: number;
  topPx: number;
};

/**
 * Conteneur scrollable virtualisé pour la liste de mois empilés.
 *
 * Le composant gère :
 * - la mesure du viewport (`viewportHeight`),
 * - l'écoute du `scrollTop` (déclenche `onCursorChange` quand le mois principal
 *   visible change),
 * - le calcul de la fenêtre des mois à rendre (`firstOffset`/`lastOffset` + overscan),
 * - l'exposition du `scrollRef` au parent (pour brancher la sélection de plage
 *   et les boutons de navigation).
 *
 * Le rendu effectif d'un mois est délégué à `renderMonth`, qui reçoit l'index
 * relatif, l'année / mois et la position verticale absolue (à reporter en CSS).
 */
export function CalendarVirtualStack({
  anchor,
  minIndex,
  maxIndex,
  initialIndex,
  monthHeight = MONTH_HEIGHT_PX,
  overscan = 1,
  scrollRef,
  onCursorChange,
  renderMonth,
}: {
  anchor: MonthAnchor;
  minIndex: number;
  maxIndex: number;
  initialIndex: number;
  monthHeight?: number;
  overscan?: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onCursorChange: (cursor: MonthAnchor) => void;
  renderMonth: (m: VirtualMonth) => React.ReactNode;
}) {
  const [viewportHeight, setViewportHeight] = React.useState(720);
  const [scrollTop, setScrollTop] = React.useState(0);
  const lastCursorRef = React.useRef<MonthAnchor | null>(null);
  const initialScrollAppliedRef = React.useRef(false);

  React.useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const apply = () => setViewportHeight(node.clientHeight);
    apply();
    const obs = new ResizeObserver(apply);
    obs.observe(node);
    return () => obs.disconnect();
  }, [scrollRef]);

  React.useLayoutEffect(() => {
    if (initialScrollAppliedRef.current) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = scrollTopForIndex(initialIndex, minIndex, monthHeight);
    initialScrollAppliedRef.current = true;
    setScrollTop(node.scrollTop);
  }, [initialIndex, minIndex, monthHeight, scrollRef]);

  React.useEffect(() => {
    const idx = visibleMonthIndex(scrollTop, viewportHeight, minIndex, monthHeight);
    const cursor = monthFromIndex(idx, anchor);
    const prev = lastCursorRef.current;
    if (!prev || prev.year !== cursor.year || prev.month !== cursor.month) {
      lastCursorRef.current = cursor;
      onCursorChange(cursor);
    }
  }, [anchor, minIndex, monthHeight, onCursorChange, scrollTop, viewportHeight]);

  const totalCount = monthsCount(minIndex, maxIndex);
  const totalHeight = totalCount * monthHeight;
  const { firstOffset, lastOffset } = windowIndices(
    scrollTop,
    viewportHeight,
    minIndex,
    maxIndex,
    monthHeight,
    overscan,
  );

  const items: VirtualMonth[] = [];
  for (let off = firstOffset; off <= lastOffset; off++) {
    const index = minIndex + off;
    const { year, month } = monthFromIndex(index, anchor);
    items.push({ index, year, month, topPx: off * monthHeight });
  }

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
      className="min-h-0 flex-1 overflow-y-auto"
    >
      <div
        style={{ height: totalHeight, position: "relative" }}
        className="w-full"
      >
        {items.map((m) => (
          <div
            key={m.index}
            style={{
              position: "absolute",
              top: m.topPx,
              left: 0,
              right: 0,
              height: monthHeight,
            }}
          >
            {renderMonth(m)}
          </div>
        ))}
      </div>
    </div>
  );
}
