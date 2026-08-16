import * as React from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ComboboxOption = { value: string; label: string };

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

function norm(s: string): string {
  return stripDiacritics(s).toLowerCase();
}

function filterOptions(options: ComboboxOption[], q: string): ComboboxOption[] {
  const t = q.trim();
  if (!t) return options;
  const n = norm(t);
  return options.filter(
    (o) => norm(o.label).includes(n) || norm(o.value).includes(n),
  );
}

function labelFor(options: ComboboxOption[], value: string): string {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label ?? value;
}

type SearchableComboboxProps = {
  id: string;
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  /** Si vrai, Entrée valide la saisie même hors liste (ex. ville). */
  allowCustom?: boolean;
  disabled?: boolean;
  className?: string;
  /** Masque le libellé (utile si un Label est rendu au-dessus). */
  hideLabel?: boolean;
  /** Classes additionnelles sur le champ déclencheur (ex. style « ligne » document). */
  triggerClassName?: string;
  /** Pied de liste : ouvre une action (ex. création client) après fermeture du popover. */
  onCreateNew?: () => void;
  /** Libellé du bouton pied de liste (icône + à part ; défaut : « Nouveau client »). */
  createNewLabel?: string;
  /** Si vrai, effacer toute la saisie du champ remet la valeur à vide (ex. désélectionner un client). */
  allowClearSelection?: boolean;
};

export function SearchableCombobox({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder,
  allowCustom = false,
  disabled,
  className,
  hideLabel = false,
  triggerClassName,
  onCreateNew,
  createNewLabel,
  allowClearSelection = false,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlighted, setHighlighted] = React.useState(0);
  const listId = `${id}-listbox`;
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const openRef = React.useRef(open);
  openRef.current = open;

  const selectedLabel = React.useMemo(
    () => labelFor(options, value),
    [options, value],
  );

  const filtered = React.useMemo(
    () => filterOptions(options, open ? query : ""),
    [options, query, open],
  );

  const createSlot = Boolean(onCreateNew);
  const itemCount = filtered.length + (createSlot ? 1 : 0);

  const prevValueRef = React.useRef<string | undefined>(undefined);

  React.useLayoutEffect(() => {
    if (prevValueRef.current === undefined) {
      prevValueRef.current = value;
      setQuery(value ? selectedLabel : "");
      return;
    }
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setQuery(value ? selectedLabel : "");
      setHighlighted(0);
    }
  }, [value, selectedLabel]);

  React.useEffect(() => {
    if (!open) return;
    setHighlighted(0);
  }, [open, query]);

  React.useEffect(() => {
    setHighlighted((h) => {
      if (itemCount === 0) return 0;
      return Math.min(h, itemCount - 1);
    });
  }, [itemCount]);

  function pick(opt: ComboboxOption) {
    onValueChange(opt.value);
    setOpen(false);
  }

  function tryCommitCustom() {
    if (!allowCustom) return;
    const t = query.trim();
    if (t) {
      onValueChange(t);
      setOpen(false);
    }
  }

  function triggerCreateNew() {
    if (!onCreateNew) return;
    setOpen(false);
    onCreateNew();
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else if (itemCount > 0)
        setHighlighted((h) => Math.min(h + 1, itemCount - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open) setHighlighted((h) => Math.max(h - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (highlighted < filtered.length && filtered[highlighted]) {
        pick(filtered[highlighted]);
        return;
      }
      if (createSlot && highlighted === filtered.length) {
        triggerCreateNew();
        return;
      }
      tryCommitCustom();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
  }

  const displayClosed = value ? selectedLabel : "";

  return (
    <div className={cn("w-full", className)}>
      {!hideLabel && <Label htmlFor={id}>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div ref={anchorRef} className={cn("w-full", !hideLabel && "mt-1")}>
            <Input
              id={id}
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              disabled={disabled}
              placeholder={placeholder}
              autoComplete="off"
              value={open ? query : displayClosed}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                if (v.trim() === "") {
                  setOpen(false);
                  if (value && (allowClearSelection || allowCustom))
                    onValueChange("");
                  return;
                }
                if (!openRef.current) setOpen(true);
              }}
              onFocus={() => {
                if (!openRef.current) {
                  const q0 = value ? selectedLabel : "";
                  setQuery(q0);
                  setHighlighted(0);
                  if (q0.trim() !== "") setOpen(true);
                }
              }}
              onKeyDown={onInputKeyDown}
              className={cn("min-w-0 w-full", triggerClassName)}
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          className={cn(
            "flex max-h-[min(14rem,calc(100vh-3rem))] flex-col overflow-hidden p-0",
            onCreateNew && "max-h-[min(16rem,calc(100vh-3rem))]",
          )}
          align="start"
          side="bottom"
          collisionPadding={20}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => {
            const t = e.detail.originalEvent.target as Node | null;
            if (t && anchorRef.current?.contains(t)) {
              e.preventDefault();
            }
          }}
          onFocusOutside={(e) => {
            const next = e.detail.originalEvent.relatedTarget as Node | null;
            if (next && anchorRef.current?.contains(next)) {
              e.preventDefault();
            }
          }}
        >
          <div
            id={listId}
            role="listbox"
            className="min-h-0 max-h-[min(11rem,calc(100vh-5rem))] flex-1 overflow-y-auto overscroll-contain py-1"
          >
            {filtered.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-[var(--color-muted-foreground)]">
                {allowCustom
                  ? "Aucune suggestion — validez avec Entrée."
                  : "Aucun résultat."}
              </div>
            ) : (
              filtered.map((opt, i) => (
                <div
                  key={`${opt.value}-${opt.label}`}
                  role="option"
                  aria-selected={i === highlighted}
                  className={cn(
                    "cursor-pointer px-2 py-1.5 text-sm outline-none",
                    i === highlighted
                      ? "bg-[var(--color-muted)] text-[var(--color-accent-foreground)]"
                      : "hover:bg-[var(--color-muted)]",
                  )}
                  onMouseEnter={() => setHighlighted(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(opt)}
                >
                  {opt.label}
                </div>
              ))
            )}
            {onCreateNew ? (
              <div
                role="option"
                aria-selected={highlighted === filtered.length}
                className={cn(
                  "mt-0 flex cursor-pointer items-center gap-2 border-t border-[var(--color-border)] px-2 py-2 text-left text-sm text-[var(--color-foreground)] outline-none",
                  highlighted === filtered.length
                    ? "bg-[var(--color-muted)] text-[var(--color-accent-foreground)]"
                    : "hover:bg-[var(--color-muted)]",
                )}
                onMouseEnter={() => setHighlighted(filtered.length)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => triggerCreateNew()}
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                {createNewLabel ?? "Nouveau client"}
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
