import * as React from "react";

type GlobalSearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
};

const GlobalSearchContext = React.createContext<GlobalSearchContextValue | null>(
  null,
);

export function GlobalSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [query, setQuery] = React.useState("");
  const value = React.useMemo(
    () => ({ query, setQuery }),
    [query],
  );
  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch(): GlobalSearchContextValue {
  const ctx = React.useContext(GlobalSearchContext);
  if (!ctx) {
    return { query: "", setQuery: () => {} };
  }
  return ctx;
}
