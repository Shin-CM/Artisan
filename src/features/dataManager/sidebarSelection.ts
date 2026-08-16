import * as React from "react";

/** Clé de scope = même chaîne que `selectionId` du module (export). */
export type SidebarScope = string;

export function scopeHasSelection(
  map: Map<string, Set<string>>,
  scope: SidebarScope,
): boolean {
  const s = map.get(scope);
  return (s?.size ?? 0) > 0;
}

export function getScopeSelection(
  map: Map<string, Set<string>>,
  scope: SidebarScope,
): Set<string> | null {
  if (!scopeHasSelection(map, scope)) return null;
  return new Set(map.get(scope)!);
}

export function useSidebarSelection() {
  const [map, setMap] = React.useState<Map<string, Set<string>>>(
    () => new Map(),
  );

  const toggle = React.useCallback(
    (scope: SidebarScope, entityId: string, checked: boolean) => {
      setMap((prev) => {
        const next = new Map(prev);
        const cur = new Set(next.get(scope) ?? []);
        if (checked) cur.add(entityId);
        else cur.delete(entityId);
        if (cur.size === 0) next.delete(scope);
        else next.set(scope, cur);
        return next;
      });
    },
    [],
  );

  const selectAllInScope = React.useCallback(
    (scope: SidebarScope, allIds: string[]) => {
      setMap((prev) => {
        const next = new Map(prev);
        next.set(scope, new Set(allIds));
        return next;
      });
    },
    [],
  );

  const clearScope = React.useCallback((scope: SidebarScope) => {
    setMap((prev) => {
      const next = new Map(prev);
      next.delete(scope);
      return next;
    });
  }, []);

  return { selection: map, toggle, selectAllInScope, clearScope, setMap };
}
