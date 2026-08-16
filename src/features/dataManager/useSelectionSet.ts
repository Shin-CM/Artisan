import * as React from "react";

export function useSelectionSet() {
  const [sel, setSel] = React.useState<Set<string>>(() => new Set());
  const setSelStable = React.useCallback((next: Set<string>) => {
    setSel(new Set(next));
  }, []);
  return { sel, setSel: setSelStable };
}
