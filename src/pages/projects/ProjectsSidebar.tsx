import * as React from "react";
import { Plus } from "lucide-react";
import type { Project } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  projectMatchesGlobalSearch,
  projectStatusLabel,
} from "@/pages/projects/projectUtils";

export function ProjectsSidebar({
  projects,
  selectedId,
  onSelect,
  onCreate,
  globalSearchNorm,
}: {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  globalSearchNorm: string;
}) {
  const [filter, setFilter] = React.useState("");
  const fl = filter.trim().toLowerCase();
  const visible = React.useMemo(() => {
    return projects.filter((p) => {
      if (!projectMatchesGlobalSearch(p, globalSearchNorm)) return false;
      if (!fl) return true;
      const blob = `${p.name} ${p.code ?? ""}`.toLowerCase();
      return blob.includes(fl);
    });
  }, [projects, globalSearchNorm, fl]);

  return (
    <div className="flex min-h-0 w-52 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="shrink-0 space-y-2 border-b border-[var(--color-border)] p-2">
        <Button
          type="button"
          size="sm"
          className="w-full gap-1"
          onClick={() => onCreate()}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nouveau projet
        </Button>
        <Input
          placeholder="Filtrer…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <ul className="min-h-0 flex-1 list-none space-y-0.5 overflow-y-auto p-2 text-sm">
        {visible.length === 0 ? (
          <li className="px-1 py-2 text-[var(--color-muted-foreground)]">
            Aucun projet.
          </li>
        ) : (
          visible.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                className={cn(
                  "w-full rounded px-2 py-1.5 text-left hover:bg-[var(--color-muted)]",
                  selectedId === p.id && "bg-[var(--color-muted)] font-medium",
                )}
              >
                <span className="block truncate">{p.name}</span>
                <span className="block truncate text-xs text-[var(--color-muted-foreground)]">
                  {projectStatusLabel(p.status)}
                  {p.code ? ` · ${p.code}` : ""}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
