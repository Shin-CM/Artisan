import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import { toast } from "sonner";

export function DiscountPresetsModal({
  open,
  onOpenChange,
  workspaceId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workspaceId: string;
  onSaved: () => void;
}) {
  const [rows, setRows] = React.useState<api.DiscountPreset[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<"percent" | "fixed">("percent");
  const [valueStr, setValueStr] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const list = await api.listDiscountPresets(workspaceId);
    setRows(list);
  }, [workspaceId]);

  React.useEffect(() => {
    if (open) {
      void refresh();
      setEditingId(null);
      setName("");
      setKind("percent");
      setValueStr("");
    }
  }, [open, refresh]);

  function startEdit(p: api.DiscountPreset) {
    setEditingId(p.id);
    setName(p.name);
    setKind(p.kind === "fixed" ? "fixed" : "percent");
    setValueStr(String(p.value));
  }

  function clearForm() {
    setEditingId(null);
    setName("");
    setKind("percent");
    setValueStr("");
  }

  async function handleSubmit() {
    const raw = String(valueStr).replace(",", ".").trim();
    if (!name.trim()) {
      toast.error("Indiquez un nom (ex. Étudiants).");
      return;
    }
    if (raw === "") {
      toast.error("Indiquez une valeur.");
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Indiquez une valeur positive.");
      return;
    }
    if (kind === "percent" && value > 100) {
      toast.error("Le pourcentage ne peut pas dépasser 100.");
      return;
    }
    setBusy(true);
    try {
      if (editingId) {
        await api.updateDiscountPreset(editingId, workspaceId, {
          name: name.trim(),
          kind,
          value,
        });
        toast.success("Modèle mis à jour");
      } else {
        await api.createDiscountPreset(workspaceId, {
          name: name.trim(),
          kind,
          value,
        });
        toast.success("Modèle enregistré");
      }
      clearForm();
      await refresh();
      onSaved();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteDiscountPreset(id, workspaceId);
      if (editingId === id) clearForm();
      await refresh();
      onSaved();
      toast.success("Modèle supprimé");
    } catch (e) {
      toast.error(String(e));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modèles de réduction</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Enregistrez des remises réutilisables (pourcentage sur le HT ou montant
          HT fixe). Appliquez-les depuis le formulaire devis ou facture.
        </p>
        <ul className="max-h-40 space-y-1 overflow-auto rounded-md border border-[var(--color-border)] p-2 text-sm">
          {rows.length === 0 ? (
            <li className="px-1 py-2 text-[var(--color-muted-foreground)]">
              Aucun modèle — ajoutez-en ci-dessous.
            </li>
          ) : (
            rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded px-1 py-1 hover:bg-[var(--color-muted)]/50"
              >
                <span className="min-w-0 truncate">
                  {r.name}
                  <span className="text-[var(--color-muted-foreground)]">
                    {" "}
                    (
                    {r.kind === "percent"
                      ? `${r.value} %`
                      : `${r.value} (fixe HT)`}
                    )
                  </span>
                </span>
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label={`Modifier ${r.name}`}
                    onClick={() => startEdit(r)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    aria-label={`Supprimer ${r.name}`}
                    onClick={() => void handleDelete(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
        <div className="space-y-2 border-t border-[var(--color-border)] pt-3">
          <div className="text-xs font-medium text-[var(--color-muted-foreground)]">
            {editingId ? "Modifier le modèle" : "Nouveau modèle"}
          </div>
          <div>
            <Label htmlFor="disc-preset-name">Nom</Label>
            <Input
              id="disc-preset-name"
              className="mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Seniors, Étudiants…"
            />
          </div>
          <div>
            <Label htmlFor="disc-preset-kind">Type</Label>
            <select
              id="disc-preset-kind"
              className="mt-1 flex h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm focus:outline-none"
              value={kind}
              onChange={(e) =>
                setKind(e.target.value === "fixed" ? "fixed" : "percent")
              }
            >
              <option value="percent">Pourcentage sur le HT</option>
              <option value="fixed">Montant HT fixe</option>
            </select>
          </div>
          <div>
            <Label htmlFor="disc-preset-value">
              Valeur {kind === "percent" ? "(%)" : `(HT, devise du document)`}
            </Label>
            <Input
              id="disc-preset-value"
              className="mt-1"
              inputMode="decimal"
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              placeholder={kind === "percent" ? "%" : "HT"}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => void handleSubmit()}
            >
              {editingId ? "Enregistrer" : "Ajouter"}
            </Button>
            {editingId ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={clearForm}
              >
                Annuler
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
