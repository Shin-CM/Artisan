import { Link } from "react-router-dom";
import { Info, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TextSnippet } from "@/lib/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type EditableComplement = {
  id: string | null;
  snippetId: string | null;
  body: string;
};

export function DocumentComplementsEditor({
  items,
  onChange,
  snippets,
  settingsPath = "/settings/template",
  documentSurface = false,
}: {
  items: EditableComplement[];
  onChange: (next: EditableComplement[]) => void;
  snippets: TextSnippet[];
  settingsPath?: string;
  /** Liste plate type document ; options snippet dans un popover. */
  documentSurface?: boolean;
}) {
  function addBlock() {
    onChange([...items, { id: null, snippetId: null, body: "" }]);
  }

  function removeBlock(i: number) {
    onChange(items.filter((_, j) => j !== i));
  }

  function patchBlock(i: number, patch: Partial<EditableComplement>) {
    onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  function applySnippet(i: number, snippetId: string) {
    const s = snippets.find((x) => x.id === snippetId);
    if (!s) return;
    patchBlock(i, { snippetId, body: s.body });
  }

  const complementsInfoBody = documentSurface
    ? "Texte affiché sous les articles sur le PDF (conditions, délais…). Textes enregistrés via le bouton options de chaque bloc."
    : "Texte affiché sous les articles sur le PDF (conditions, délais…). Vous pouvez partir d’un texte enregistré ou tout saisir à la main ; les modèles se gèrent dans Paramètres → mise en page PDF.";

  const settingsLinkLabel =
    "Textes enregistrés — modèles (Paramètres → mise en page PDF)";

  return (
    <div
      className={
        documentSurface
          ? "border-t border-[var(--color-border)] pt-3"
          : "space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/40 p-4"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-medium">Compléments d’information</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex shrink-0 rounded-full text-[var(--color-muted-foreground)] outline-none hover:text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                  aria-label="Informations sur les compléments d’information"
                >
                  <Info className="h-4 w-4" strokeWidth={2} aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="max-w-xs text-left text-sm leading-snug text-[var(--color-popover-foreground)]"
              >
                <div className="space-y-2">
                  <p>{complementsInfoBody}</p>
                  <p className="border-t border-[var(--color-border)] pt-2">
                    <Link
                      to={settingsPath}
                      className="font-medium text-[var(--color-primary)] underline underline-offset-2 hover:opacity-90"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {settingsLinkLabel}
                    </Link>
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          {!documentSurface ? (
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              <Link
                to={settingsPath}
                className="font-medium text-[var(--color-foreground)] underline-offset-4 hover:underline"
              >
                Textes enregistrés
              </Link>
              {" — raccourci vers la configuration"}
            </p>
          ) : null}
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addBlock}>
          <Plus className="mr-1 h-4 w-4" />
          Ajouter un complément
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Aucun complément. Utilisez « Ajouter un complément » si besoin.
        </p>
      ) : (
        <ul className={cn(documentSurface ? "divide-y divide-[var(--color-border)]" : "space-y-4")}>
          {items.map((item, i) =>
            documentSurface ? (
              <li
                key={item.id ?? `new-${i}`}
                className="flex gap-2 py-3"
              >
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`complement-body-${i}`} className="text-xs">
                    Texte sur le document
                  </Label>
                  <textarea
                    id={`complement-body-${i}`}
                    rows={3}
                    className="mt-1 min-h-[4.5rem] w-full resize-y border-0 border-b border-[var(--color-border)] bg-transparent px-0 py-1 text-sm focus:outline-none focus-visible:border-[var(--color-ring)]"
                    value={item.body}
                    onChange={(e) =>
                      patchBlock(i, {
                        body: e.target.value,
                        snippetId: item.snippetId,
                      })
                    }
                    placeholder="Saisissez ou modifiez le texte…"
                  />
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-[var(--color-muted-foreground)]"
                        aria-label="Texte enregistré et options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="bottom"
                      align="end"
                      className="w-72 space-y-2 p-3"
                    >
                      <Label className="text-xs">Partir d’un texte enregistré</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm"
                        value={item.snippetId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!v) {
                            patchBlock(i, { snippetId: null });
                            return;
                          }
                          applySnippet(i, v);
                        }}
                      >
                        <option value="">— Saisie libre uniquement —</option>
                        {snippets.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-[var(--color-muted-foreground)] hover:text-destructive"
                    aria-label="Supprimer ce complément"
                    onClick={() => removeBlock(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ) : (
              <li
                key={item.id ?? `new-${i}`}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-3"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <Label className="text-xs">Partir d’un texte enregistré</Label>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-[var(--color-muted-foreground)] hover:text-destructive"
                    aria-label="Supprimer ce complément"
                    onClick={() => removeBlock(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <select
                  className="mb-2 w-full max-w-md rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 py-1.5 text-sm"
                  value={item.snippetId ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) {
                      patchBlock(i, { snippetId: null });
                      return;
                    }
                    applySnippet(i, v);
                  }}
                >
                  <option value="">— Saisie libre uniquement —</option>
                  {snippets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Label htmlFor={`complement-body-${i}`} className="text-xs">
                  Texte sur le document
                </Label>
                <textarea
                  id={`complement-body-${i}`}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] p-2 text-sm"
                  value={item.body}
                  onChange={(e) =>
                    patchBlock(i, {
                      body: e.target.value,
                      snippetId: item.snippetId,
                    })
                  }
                  placeholder="Saisissez ou modifiez le texte…"
                />
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
