import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DiscountPreset } from "@/lib/api";
import type { DocumentDiscountFormKind } from "@/pages/documentEditor/documentDiscountTotals";

type Props = {
  idPrefix: string;
  presets: DiscountPreset[];
  presetSelectKey: number;
  kind: DocumentDiscountFormKind;
  onKindChange: (k: DocumentDiscountFormKind) => void;
  value: number;
  onValueChange: (n: number) => void;
  label: string;
  onLabelChange: (s: string) => void;
  /** Id du modèle choisi, ou chaîne vide ; le parent réinitialise la clé du select si besoin. */
  onPresetPick: (presetId: string) => void;
  /** Ouvre la modale de gestion des modèles nommés (à côté du titre du bloc). */
  onOpenPresetsModal?: () => void;
  /** Sans carte : séparateur haut seulement. */
  documentSurface?: boolean;
};

export function DocumentDiscountForm({
  idPrefix,
  presets,
  presetSelectKey,
  kind,
  onKindChange,
  value,
  onValueChange,
  label,
  onLabelChange,
  onPresetPick,
  onOpenPresetsModal,
  documentSurface = false,
}: Props) {
  return (
    <div
      className={
        documentSurface
          ? "max-w-xl space-y-2 border-t border-[var(--color-border)] py-3"
          : "max-w-xl space-y-2 rounded-md border border-[var(--color-border)] p-3"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="shrink-0 leading-snug">
          Réduction (sur le total HT des lignes, TVA au prorata)
        </Label>
        {onOpenPresetsModal ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 gap-1"
            aria-label="Gérer les modèles de réduction"
            title="Modèles de réduction"
            onClick={onOpenPresetsModal}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Modèles de réduction</span>
          </Button>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-disc-preset`} className="text-xs">
            Modèle
          </Label>
          <select
            key={presetSelectKey}
            id={`${idPrefix}-disc-preset`}
            className="mt-1 flex h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm focus:outline-none"
            defaultValue=""
            onChange={(e) => onPresetPick(e.target.value)}
          >
            <option value="">— Appliquer un modèle —</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (
                {p.kind === "percent" ? `${p.value} %` : `${p.value} HT`})
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-disc-type`} className="text-xs">
            Type
          </Label>
          <select
            id={`${idPrefix}-disc-type`}
            className="mt-1 flex h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm focus:outline-none"
            value={kind}
            onChange={(e) =>
              onKindChange(e.target.value as DocumentDiscountFormKind)
            }
          >
            <option value="none">Aucune</option>
            <option value="percent">Pourcentage</option>
            <option value="fixed">Montant HT fixe</option>
          </select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-disc-val`} className="text-xs">
            Valeur
          </Label>
          <Input
            id={`${idPrefix}-disc-val`}
            className="mt-1"
            inputMode="decimal"
            disabled={kind === "none"}
            value={
              kind === "none" || !Number.isFinite(value) || value === 0
                ? ""
                : String(value)
            }
            onChange={(e) => {
              const raw = String(e.target.value).replace(",", ".").trim();
              if (raw === "") {
                onValueChange(0);
                return;
              }
              const n = Number(raw);
              onValueChange(Number.isFinite(n) ? n : 0);
            }}
            placeholder={kind === "percent" ? "%" : "HT"}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-disc-label`} className="text-xs">
            Libellé (PDF, optionnel)
          </Label>
          <Input
            id={`${idPrefix}-disc-label`}
            className="mt-1"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder="Ex. Tarif étudiants"
            disabled={kind === "none"}
          />
        </div>
      </div>
    </div>
  );
}
