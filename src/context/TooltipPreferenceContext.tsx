import * as React from "react";

const STORAGE_KEY = "invoicies_tooltips_enabled";

type Ctx = {
  tooltipsEnabled: boolean;
  setTooltipsEnabled: (v: boolean) => void;
};

const TooltipPreferenceContext = React.createContext<Ctx | null>(null);

export function TooltipPreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tooltipsEnabled, setTooltipsEnabledState] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return true;
      return raw === "true" || raw === "1";
    } catch {
      return true;
    }
  });

  const setTooltipsEnabled = React.useCallback((v: boolean) => {
    setTooltipsEnabledState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo(
    () => ({ tooltipsEnabled, setTooltipsEnabled }),
    [tooltipsEnabled, setTooltipsEnabled],
  );

  return (
    <TooltipPreferenceContext.Provider value={value}>
      {children}
    </TooltipPreferenceContext.Provider>
  );
}

export function useTooltipPreference() {
  const v = React.useContext(TooltipPreferenceContext);
  if (!v) throw new Error("useTooltipPreference hors provider");
  return v;
}

export function useTooltipsEnabledForPrimitive(): boolean {
  const v = React.useContext(TooltipPreferenceContext);
  return v?.tooltipsEnabled ?? true;
}
