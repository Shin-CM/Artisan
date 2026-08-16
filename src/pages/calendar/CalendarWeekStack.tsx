import * as React from "react";
import {
  defaultWeekBounds,
  indexFromWeek,
  scrollTopForWeekIndex,
  scrollTopToCenterWeekIndex,
  startOfWeekIso,
  visibleDayIsoAtCenter,
  weekDays,
  weekFromIndex,
  weekWindowIndices,
  weeksCount,
  weekdayHeaders,
  isoWeekNumber,
  type WeekStartDay,
} from "./calendarWeeks";

export type WeekStackVirtualWeek = {
  index: number;
  weekStartIso: string;
  days: string[];
  topPx: number;
};

export function CalendarWeekStack({
  anchorWeekStartIso,
  weekStart,
  rowHeight,
  initialIndex,
  scrollRef,
  showWeekNumbers,
  onCenterDayChange,
  renderWeek,
}: {
  anchorWeekStartIso: string;
  weekStart: WeekStartDay;
  rowHeight: number;
  initialIndex: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  showWeekNumbers: boolean;
  onCenterDayChange: (iso: string) => void;
  renderWeek: (w: WeekStackVirtualWeek) => React.ReactNode;
}) {
  const bounds = React.useMemo(() => defaultWeekBounds(), []);
  const [viewportHeight, setViewportHeight] = React.useState(720);
  const [scrollTop, setScrollTop] = React.useState(0);
  const initialApplied = React.useRef(false);
  const lastCenterDayRef = React.useRef<string | null>(null);

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
    if (initialApplied.current) return;
    const node = scrollRef.current;
    if (!node) return;
    const top = scrollTopToCenterWeekIndex(
      initialIndex,
      bounds.minIndex,
      rowHeight,
      node.clientHeight || 720,
    );
    node.scrollTop = top;
    initialApplied.current = true;
    setScrollTop(node.scrollTop);
  }, [bounds.minIndex, initialIndex, rowHeight, scrollRef]);

  React.useEffect(() => {
    const iso = visibleDayIsoAtCenter(
      scrollTop,
      viewportHeight,
      bounds.minIndex,
      rowHeight,
      anchorWeekStartIso,
      weekStart,
      0.5,
    );
    if (lastCenterDayRef.current !== iso) {
      lastCenterDayRef.current = iso;
      onCenterDayChange(iso);
    }
  }, [
    anchorWeekStartIso,
    bounds.minIndex,
    onCenterDayChange,
    rowHeight,
    scrollTop,
    viewportHeight,
    weekStart,
  ]);

  const totalCount = weeksCount(bounds.minIndex, bounds.maxIndex);
  const totalHeight = totalCount * rowHeight;
  const { firstOffset, lastOffset } = weekWindowIndices(
    scrollTop,
    viewportHeight,
    bounds.minIndex,
    bounds.maxIndex,
    rowHeight,
    2,
  );

  const items: WeekStackVirtualWeek[] = [];
  for (let off = firstOffset; off <= lastOffset; off++) {
    const idx = bounds.minIndex + off;
    const weekStartIso = weekFromIndex(idx, anchorWeekStartIso);
    items.push({
      index: idx,
      weekStartIso,
      days: weekDays(weekStartIso),
      topPx: off * rowHeight,
    });
  }

  const headers = weekdayHeaders(weekStart);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div
        className={
          "sticky top-0 z-20 grid border-b border-[var(--color-border)] bg-[var(--color-muted)]/30 text-xs font-medium text-[var(--color-muted-foreground)]"
        }
        style={{
          gridTemplateColumns: showWeekNumbers ? "36px repeat(7, 1fr)" : "repeat(7, 1fr)",
        }}
      >
        {showWeekNumbers ? <div className="px-1 py-1 text-center">S</div> : null}
        {headers.map((w) => (
          <div key={w} className="px-2 py-1 text-center">
            {w}
          </div>
        ))}
      </div>
      <div
        ref={scrollRef}
        onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div style={{ height: totalHeight, position: "relative" }} className="w-full">
          {items.map((w) => (
            <div
              key={w.index}
              style={{
                position: "absolute",
                top: w.topPx,
                left: 0,
                right: 0,
                height: rowHeight,
                display: "grid",
                gridTemplateColumns: showWeekNumbers
                  ? "36px 1fr"
                  : "1fr",
              }}
            >
              {showWeekNumbers ? (
                <div className="flex items-start justify-center border-r border-[var(--color-border)] bg-[var(--color-muted)]/20 pt-1 text-[10px] tabular-nums text-[var(--color-muted-foreground)]">
                  {isoWeekNumber(w.weekStartIso)}
                </div>
              ) : null}
              <div className="min-h-0">{renderWeek(w)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Helpers exposés au parent pour scroller programmatique (boutons mois / Aujourd'hui). */
export function scrollToWeekContaining(
  scrollNode: HTMLDivElement,
  targetIso: string,
  anchorWeekStartIso: string,
  weekStart: WeekStartDay,
  rowHeight: number,
  behavior: ScrollBehavior = "smooth",
) {
  const targetWeekStart = startOfWeekIso(targetIso, weekStart);
  const idx = indexFromWeek(targetWeekStart, anchorWeekStartIso);
  const bounds = defaultWeekBounds();
  const top = scrollTopToCenterWeekIndex(
    idx,
    bounds.minIndex,
    rowHeight,
    scrollNode.clientHeight || 720,
  );
  scrollNode.scrollTo({ top, behavior });
}

export function scrollToWeekTop(
  scrollNode: HTMLDivElement,
  targetIso: string,
  anchorWeekStartIso: string,
  weekStart: WeekStartDay,
  rowHeight: number,
  behavior: ScrollBehavior = "smooth",
) {
  const targetWeekStart = startOfWeekIso(targetIso, weekStart);
  const idx = indexFromWeek(targetWeekStart, anchorWeekStartIso);
  const bounds = defaultWeekBounds();
  const top = scrollTopForWeekIndex(idx, bounds.minIndex, rowHeight);
  scrollNode.scrollTo({ top, behavior });
}
