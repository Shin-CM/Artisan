import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ImportPreviewSection } from "@/lib/importBundleImportPreview";

const scrollMaxH = (compact: boolean | undefined) =>
  compact ? "max-h-[min(45vh,18rem)]" : "max-h-[min(55vh,22rem)]";

export function DataManagerImportPreviewPane({
  sections,
  selectedKeys,
  onToggleKey,
  onSelectAll,
  onDeselectAll,
  building,
  progressMessage,
  compact,
}: {
  sections: ImportPreviewSection[];
  selectedKeys: Set<string>;
  onToggleKey: (key: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  building: boolean;
  progressMessage: string;
  compact?: boolean;
}) {
  const totalRows = sections.reduce((a, s) => a + s.rows.length, 0);
  const maxH = scrollMaxH(compact);

  return (
    <div
      className={cn(
        "flex min-h-[min(55vh,22rem)] min-w-0 flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/40",
        compact && "min-h-[min(45vh,18rem)]",
      )}
    >
      <div className="shrink-0 space-y-2 border-b border-[var(--color-border)] px-3 py-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">Aperçu avant import</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Cochez les lignes à importer. Les règles de liaison (catégories,
              clients / devis-factures) s’appliquent automatiquement.
            </p>
          </div>
          {!building && sections.length > 0 ? (
            <div className="flex shrink-0 flex-wrap gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={onSelectAll}>
                Tout cocher
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onDeselectAll}>
                Tout décocher
              </Button>
            </div>
          ) : null}
        </div>
        {!building && totalRows > 0 ? (
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {totalRows} ligne(s) — {selectedKeys.size}{" "}
            {selectedKeys.size === 1 ? "sélectionnée" : "sélectionnées"}
          </p>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1">
        {building ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[var(--color-background)]/80 px-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" aria-hidden />
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              Préparation de l’aperçu…
            </p>
            {progressMessage ? (
              <p className="text-xs text-[var(--color-muted-foreground)]">{progressMessage}</p>
            ) : null}
          </div>
        ) : null}

        {!building && sections.length === 0 ? (
          <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-[var(--color-muted-foreground)]">
            Analysez un paquet pour afficher le détail ici.
          </div>
        ) : null}

        {!building && sections.length > 0 ? (
          <div
            className={cn(
              "h-full overflow-y-auto overscroll-contain px-2 py-2",
              maxH,
            )}
          >
            <div className="space-y-5 pb-2">
              {sections.map((sec) => (
                <div key={sec.kind}>
                  <p className="sticky top-0 z-[1] bg-[var(--color-card)]/95 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] backdrop-blur-sm">
                    {sec.label}
                    <span className="ml-1 font-normal normal-case text-[var(--color-muted-foreground)]">
                      ({sec.rows.length})
                    </span>
                  </p>
                  <ul className="mt-1 space-y-2">
                    {sec.rows.map((row) => (
                      <li
                        key={row.key}
                        className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-2"
                      >
                        <label className="flex cursor-pointer gap-2">
                          <input
                            type="checkbox"
                            className="mt-1 shrink-0"
                            checked={selectedKeys.has(row.key)}
                            onChange={(e) =>
                              onToggleKey(row.key, e.target.checked)
                            }
                          />
                          <span className="min-w-0 flex-1 text-xs">
                            <span className="font-medium text-[var(--color-foreground)]">
                              {row.title}
                            </span>
                            {row.lines.length > 0 ? (
                              <span className="mt-1 block space-y-0.5 text-[var(--color-muted-foreground)]">
                                {row.lines.map((line, i) => (
                                  <span key={i} className="block whitespace-pre-wrap">
                                    {line}
                                  </span>
                                ))}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
