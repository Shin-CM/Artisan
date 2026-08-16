import * as React from "react";
import { roundMoneyHt } from "@/core/documentMath";
import { Input } from "@/components/ui/input";

/** Saisie locale (virgule) ; chaîne vide → 0 ; invalide → null. */
function parseLocaleDecimal(s: string): number | null {
  const t = s.replace(/\s/g, "").replace(",", ".").trim();
  if (t === "") return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Affichage hors focus : 0 → champ vide (placeholder). */
function decimalToDraft(n: number, fractionDigits: number): string {
  if (!Number.isFinite(n) || n === 0) return "";
  const r = roundMoneyHt(n, fractionDigits);
  return String(r).replace(".", ",");
}

type LineDecimalInputProps = {
  id: string;
  className?: string;
  value: number;
  onCommit: (n: number) => void;
  placeholder?: string;
  title?: string;
  disabled?: boolean;
  selectAllOnFocus?: boolean;
  /** Décimales pour affichage hors focus et arrondi au blur (défaut 2). */
  fractionDigits?: number;
};

export function LineDecimalInput({
  id,
  className,
  value,
  onCommit,
  placeholder = "0",
  title,
  disabled = false,
  selectAllOnFocus = false,
  fractionDigits = 2,
}: LineDecimalInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const selectAllAfterLayoutRef = React.useRef(false);
  const [focused, setFocused] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const display = focused ? draft : decimalToDraft(value, fractionDigits);

  React.useLayoutEffect(() => {
    if (!selectAllAfterLayoutRef.current || !inputRef.current) return;
    selectAllAfterLayoutRef.current = false;
    const el = inputRef.current;
    if (el.value.length > 0) el.select();
  }, [focused, display]);

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      id={id}
      title={title}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      value={display}
      onFocus={() => {
        if (disabled) return;
        setFocused(true);
        setDraft(decimalToDraft(value, fractionDigits));
        if (selectAllOnFocus) selectAllAfterLayoutRef.current = true;
      }}
      onChange={(e) => {
        if (disabled) return;
        const t = e.target.value;
        setDraft(t);
        const n = parseLocaleDecimal(t);
        if (n !== null) onCommit(n);
      }}
      onBlur={(e) => {
        if (disabled) return;
        const n = parseLocaleDecimal(e.target.value);
        const raw = n === null ? 0 : n;
        onCommit(roundMoneyHt(raw, fractionDigits));
        setFocused(false);
        setDraft("");
      }}
    />
  );
}
