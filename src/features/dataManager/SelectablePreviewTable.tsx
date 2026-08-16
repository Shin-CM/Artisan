import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectablePreviewColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
};

type SelectablePreviewTableProps<T extends { id: string }> = {
  rows: T[];
  columns: SelectablePreviewColumn<T>[];
  selectedIds: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  onToggleAll?: (checked: boolean) => void;
  /** Si faux, la case de la ligne est désactivée (ex. ligne invalide). */
  isRowSelectable?: (row: T) => boolean;
  truncated?: boolean;
  compact?: boolean;
};

export function SelectablePreviewTable<T extends { id: string }>({
  rows,
  columns,
  selectedIds,
  onToggle,
  onToggleAll,
  isRowSelectable = () => true,
  truncated,
  compact,
}: SelectablePreviewTableProps<T>) {
  const selectableRows = rows.filter((r) => isRowSelectable(r));
  const allSelected =
    selectableRows.length > 0 &&
    selectableRows.every((r) => selectedIds.has(r.id));
  const someSelected = selectableRows.some((r) => selectedIds.has(r.id));

  return (
    <div className={cn("space-y-2", compact && "text-xs")}>
      {truncated ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Aperçu tronqué — seules les premières lignes sont affichées.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
              <th className="w-10 p-2">
                {onToggleAll ? (
                  <input
                    type="checkbox"
                    aria-label="Tout sélectionner"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={(e) => onToggleAll(e.target.checked)}
                  />
                ) : null}
              </th>
              {columns.map((c) => (
                <th key={c.key} className="p-2 font-medium">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const sel = isRowSelectable(row);
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-[var(--color-border)] last:border-0",
                    !sel && "opacity-60",
                  )}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      disabled={!sel}
                      checked={selectedIds.has(row.id)}
                      onChange={(e) => onToggle(row.id, e.target.checked)}
                    />
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="p-2 align-top">
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
