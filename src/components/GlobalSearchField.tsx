import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useGlobalSearch } from "@/context/GlobalSearchContext";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import {
  searchNavigationMatches,
  shouldPreserveSearchQueryAfterNav,
  normalizeSearchNavQuery,
  type SearchNavMatch,
} from "@/lib/searchNavigation";

export function GlobalSearchField() {
  const { query, setQuery } = useGlobalSearch();
  const navigate = useNavigate();
  const {
    loading: docModulesLoading,
    purchaseOrdersEnabled,
    creditNotesEnabled,
    crmPipelineEnabled,
    recoveryAssistedEnabled,
    clientFollowupEnabled,
    projectsEnabled,
    stockManagerEnabled,
  } = useDocumentModules();
  const [open, setOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const blurTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const matches = React.useMemo(() => {
    const raw = searchNavigationMatches(query, 10);
    if (docModulesLoading) {
      return raw.filter(
        (m) =>
          !m.path.startsWith("/home/purchase-orders") &&
          !m.path.startsWith("/home/credit-notes") &&
          !m.path.startsWith("/home/crm") &&
          !m.path.startsWith("/home/recovery") &&
          !m.path.startsWith("/home/client-followup") &&
          !m.path.startsWith("/database/client-followup") &&
          !m.path.startsWith("/home/projects") &&
          !m.path.startsWith("/home/stock"),
      );
    }
    return raw.filter((m) => {
      if (
        m.path.startsWith("/home/purchase-orders") &&
        !purchaseOrdersEnabled
      ) {
        return false;
      }
      if (m.path.startsWith("/home/credit-notes") && !creditNotesEnabled) {
        return false;
      }
      if (m.path.startsWith("/home/crm") && !crmPipelineEnabled) {
        return false;
      }
      if (m.path.startsWith("/home/recovery") && !recoveryAssistedEnabled) {
        return false;
      }
      if (
        m.path.startsWith("/home/client-followup") &&
        !clientFollowupEnabled
      ) {
        return false;
      }
      if (
        m.path.startsWith("/database/client-followup") &&
        !clientFollowupEnabled
      ) {
        return false;
      }
      if (m.path.startsWith("/home/projects") && !projectsEnabled) {
        return false;
      }
      if (m.path.startsWith("/home/stock") && !stockManagerEnabled) {
        return false;
      }
      return true;
    });
  }, [
    query,
    docModulesLoading,
    purchaseOrdersEnabled,
    creditNotesEnabled,
    crmPipelineEnabled,
    recoveryAssistedEnabled,
    clientFollowupEnabled,
    projectsEnabled,
    stockManagerEnabled,
  ]);

  const canNavigate = matches.length > 0;

  React.useEffect(() => {
    setHighlight(0);
  }, [query]);

  React.useEffect(() => {
    if (highlight >= matches.length) setHighlight(0);
  }, [highlight, matches.length]);

  function clearBlurTimeout() {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }

  function goToMatch(m: SearchNavMatch) {
    navigate(m.path);
    if (!shouldPreserveSearchQueryAfterNav(m.path)) {
      setQuery("");
    }
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleNavigateSelected() {
    if (!canNavigate) return;
    const m = matches[highlight] ?? matches[0];
    if (m) goToMatch(m);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (!canNavigate) return;
      e.preventDefault();
      const wasOpen = open;
      setOpen(true);
      setHighlight((i) =>
        wasOpen ? (i + 1) % matches.length : 0,
      );
      return;
    }
    if (e.key === "ArrowUp") {
      if (!canNavigate) return;
      e.preventDefault();
      const wasOpen = open;
      setOpen(true);
      setHighlight((i) =>
        wasOpen
          ? (i - 1 + matches.length) % matches.length
          : matches.length - 1,
      );
      return;
    }
    if (e.key === "Enter") {
      const q = normalizeSearchNavQuery(query);
      if (q.length >= 2 && canNavigate) {
        e.preventDefault();
        handleNavigateSelected();
      }
      return;
    }
    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  }

  return (
    <div className="relative w-full max-w-xl">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]"
        aria-hidden
      />
      <Input
        ref={inputRef}
        placeholder="Recherche ou aller à… (clients, devis, paramètres…)"
        className="h-8 rounded-full pl-9"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          clearBlurTimeout();
          if (matches.length > 0) setOpen(true);
        }}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => setOpen(false), 180);
        }}
        onKeyDown={handleKeyDown}
        aria-label="Recherche globale et navigation"
        aria-expanded={open && canNavigate}
        aria-controls="global-search-nav-suggestions"
        aria-autocomplete="list"
        role="combobox"
        autoComplete="off"
      />
      {open && canNavigate ? (
        <ul
          id="global-search-nav-suggestions"
          role="listbox"
          aria-label="Aller à la page"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-popover)] py-1 text-sm shadow-md"
        >
          <li className="px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Aller à la page
          </li>
          {matches.map((m, i) => (
            <li key={m.path} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={cn(
                  "flex w-full cursor-pointer px-3 py-2 text-left text-[var(--color-foreground)]",
                  i === highlight
                    ? "bg-[var(--color-muted)]"
                    : "hover:bg-[var(--color-muted)]/60",
                )}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goToMatch(m)}
              >
                <span className="font-medium">{m.label}</span>
              </button>
            </li>
          ))}
          <li className="border-t border-[var(--color-border)] px-3 py-1.5 text-[0.7rem] text-[var(--color-muted-foreground)]">
            Entrée pour ouvrir la sélection · flèches pour choisir
          </li>
        </ul>
      ) : null}
    </div>
  );
}
