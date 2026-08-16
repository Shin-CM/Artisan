import * as React from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as api from "@/lib/api";
import {
  exampleNewTaxRateNamePlaceholder,
  primaryPresetTaxRateFormString,
} from "@/lib/workspaceDefaultTaxRates";
import { toast } from "sonner";

function formatRatePct(rate: number): string {
  if (Number.isInteger(rate)) return String(rate);
  return String(rate);
}

export function QuoteTaxRatesModal({
  open,
  onOpenChange,
  workspaceId,
  countryCode = "",
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workspaceId: string;
  /** Pays du workspace : exemples de taux / libellés alignés sur les presets (FR, CH…). */
  countryCode?: string;
  onSaved: () => void;
}) {
  const [rows, setRows] = React.useState<api.TaxRate[]>([]);
  const [name, setName] = React.useState("");
  const [rateStr, setRateStr] = React.useState(() =>
    primaryPresetTaxRateFormString(countryCode),
  );
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const list = await api.listTaxRates(workspaceId);
    setRows(list);
  }, [workspaceId]);

  React.useEffect(() => {
    if (open) {
      void refresh();
      setName("");
      setRateStr(primaryPresetTaxRateFormString(countryCode));
    }
  }, [open, refresh, countryCode]);

  async function handleAdd() {
    const rate = Number(String(rateStr).replace(",", ".").trim());
    if (!name.trim()) {
      toast.error("Indiquez un libellé.");
      return;
    }
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast.error("Taux entre 0 et 100 %.");
      return;
    }
    setBusy(true);
    try {
      await api.createTaxRate(workspaceId, { name: name.trim(), rate });
      setName("");
      setRateStr(primaryPresetTaxRateFormString(countryCode));
      await refresh();
      onSaved();
      toast.success("Taux enregistré");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteTaxRate(id, workspaceId);
      await refresh();
      onSaved();
      toast.success("Taux supprimé");
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Taux de TVA (devis)</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Libellés enregistrés pour cet espace de travail. Ils apparaissent dans
          le menu déroulant de chaque ligne du devis.
        </p>
        <ul className="max-h-48 space-y-1 overflow-auto rounded-md border border-[var(--color-border)] p-2 text-sm">
          {rows.length === 0 ? (
            <li className="px-1 py-2 text-[var(--color-muted-foreground)]">
              Aucun taux — ajoutez-en ci-dessous.
            </li>
          ) : (
            rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded px-1 py-1 hover:bg-[var(--color-muted)]/50"
              >
                <span>
                  {r.name}{" "}
                  <span className="text-[var(--color-muted-foreground)]">
                    ({formatRatePct(r.rate)} %)
                  </span>
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-red-600 dark:text-red-400"
                  aria-label={`Supprimer ${r.name}`}
                  onClick={() => void handleDelete(r.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))
          )}
        </ul>
        <div className="space-y-2 border-t border-[var(--color-border)] pt-3">
          <Label htmlFor="new-tax-name">Nouveau libellé</Label>
          <Input
            id="new-tax-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={exampleNewTaxRateNamePlaceholder(countryCode)}
          />
          <Label htmlFor="new-tax-rate">Taux (%)</Label>
          <Input
            id="new-tax-rate"
            type="text"
            inputMode="decimal"
            value={rateStr}
            onChange={(e) => setRateStr(e.target.value)}
            placeholder={primaryPresetTaxRateFormString(countryCode)}
          />
          <Button
            type="button"
            className="w-full"
            disabled={busy}
            onClick={() => void handleAdd()}
          >
            Enregistrer le taux
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
