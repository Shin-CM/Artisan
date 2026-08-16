import * as React from "react";
import { useWorkspace } from "./WorkspaceContext";
import * as api from "@/lib/api";

type ThemePref = "system" | "light" | "dark";

function normalizeThemePref(raw: unknown): ThemePref {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

function resolveEffective(theme: ThemePref): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const { active, refreshActiveWorkspace } = useWorkspace();
  const [pref, setPref] = React.useState<ThemePref>(() =>
    normalizeThemePref(active?.theme),
  );

  React.useEffect(() => {
    setPref(normalizeThemePref(active?.theme));
  }, [active?.id, active?.theme]);

  const effective = React.useMemo(() => resolveEffective(pref), [pref]);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", effective === "dark");
  }, [effective]);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = () => {
      if (pref === "system") {
        document.documentElement.classList.toggle(
          "dark",
          mq.matches,
        );
      }
    };
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [pref]);

  const setTheme = React.useCallback(
    async (t: ThemePref) => {
      setPref(t);
      if (!active) return;
      await api.updateWorkspaceTheme(active.id, t);
      await refreshActiveWorkspace();
    },
    [active, refreshActiveWorkspace],
  );

  return (
    <ThemeContext.Provider value={{ pref, effective, setTheme }}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

type ThemeCtx = {
  pref: ThemePref;
  effective: "light" | "dark";
  setTheme: (t: ThemePref) => Promise<void>;
};

const ThemeContext = React.createContext<ThemeCtx | null>(null);

export function useTheme() {
  const v = React.useContext(ThemeContext);
  if (!v) throw new Error("useTheme hors provider");
  return v;
}
