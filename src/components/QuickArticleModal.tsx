import * as React from "react";
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
import { buildChildrenMap } from "@/lib/categoryTree";
import { serializeArticleOptionsV1 } from "@/lib/articleOptions";

function flattenCategoryOptions(categories: api.Category[]): {
  value: string;
  label: string;
}[] {
  const byParent = buildChildrenMap(categories);
  const opts: { value: string; label: string }[] = [
    { value: "", label: "Sans catégorie" },
  ];
  function walk(parentId: string | null, prefix: string) {
    const children = byParent.get(parentId) ?? [];
    for (const c of children) {
      const label = prefix ? `${prefix} / ${c.name}` : c.name;
      opts.push({ value: c.id, label });
      walk(c.id, label);
    }
  }
  walk(null, "");
  return opts;
}

export function QuickArticleModal({
  open,
  onOpenChange,
  workspaceId,
  categories,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workspaceId: string;
  categories: api.Category[];
  onCreated: (article: api.Article) => void;
}) {
  const [session, setSession] = React.useState(0);
  const [name, setName] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [basePrice, setBasePrice] = React.useState("0");
  const [flatPrice, setFlatPrice] = React.useState("");
  const [hourlyRate, setHourlyRate] = React.useState("");
  const [supplierName, setSupplierName] = React.useState("");
  const [supplierReference, setSupplierReference] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const categoryOptions = React.useMemo(
    () => flattenCategoryOptions(categories),
    [categories],
  );

  React.useEffect(() => {
    if (!open) return;
    setSession((s) => s + 1);
    setName("");
    setCategoryId("");
    setBasePrice("0");
    setFlatPrice("");
    setHourlyRate("");
    setSupplierName("");
    setSupplierReference("");
    setPending(false);
  }, [open]);

  async function submit() {
    const n = name.trim();
    if (!n) {
      toast.error("Indiquez un nom d’article.");
      return;
    }
    const bp = Number(String(basePrice).replace(",", ".")) || 0;
    const flat =
      flatPrice.trim() === ""
        ? null
        : Number(String(flatPrice).replace(",", "."));
    const hourly =
      hourlyRate.trim() === ""
        ? null
        : Number(String(hourlyRate).replace(",", "."));
    setPending(true);
    try {
      const article = await api.createArticle(workspaceId, {
        name: n,
        categoryId: categoryId.trim() || null,
        basePrice: bp,
        flatPrice:
          flat != null && Number.isFinite(flat) ? flat : null,
        hourlyRate:
          hourly != null && Number.isFinite(hourly) ? hourly : null,
        productionCost: null,
        optionsJson: serializeArticleOptionsV1({ version: 1, variants: [] }),
        supplierName: supplierName.trim() || null,
        supplierReference: supplierReference.trim() || null,
      });
      onCreated(article);
      onOpenChange(false);
      toast.success("Article créé");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-[var(--color-border)] px-6 py-4 text-left">
          <DialogTitle>Nouvel article</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {open && (
            <div key={session} className="space-y-3">
              <div>
                <Label htmlFor="qa-name">Nom</Label>
                <Input
                  id="qa-name"
                  className="mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. Prestation conseil"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="qa-cat">Catégorie</Label>
                <select
                  id="qa-cat"
                  className="mt-1 flex h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm focus:outline-none"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categoryOptions.map((o) => (
                    <option key={o.value || "__none"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="qa-pu">Prix unitaire HT (catalogue)</Label>
                <Input
                  id="qa-pu"
                  type="text"
                  inputMode="decimal"
                  className="mt-1"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="qa-flat">Forfait HT (optionnel)</Label>
                <Input
                  id="qa-flat"
                  type="text"
                  inputMode="decimal"
                  className="mt-1"
                  value={flatPrice}
                  onChange={(e) => setFlatPrice(e.target.value)}
                  placeholder="Mode forfait"
                />
              </div>
              <div>
                <Label htmlFor="qa-hourly">Tarif horaire HT (optionnel)</Label>
                <Input
                  id="qa-hourly"
                  type="text"
                  inputMode="decimal"
                  className="mt-1"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="À l’heure"
                />
              </div>
              <div>
                <Label htmlFor="qa-sup">Fournisseur (optionnel)</Label>
                <Input
                  id="qa-sup"
                  className="mt-1"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Stock / achat"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label htmlFor="qa-sref">Référence fournisseur (optionnel)</Label>
                <Input
                  id="qa-sref"
                  className="mt-1 font-mono text-sm"
                  value={supplierReference}
                  onChange={(e) => setSupplierReference(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Les variantes et le détail complet se gèrent dans Bases de données
                → Produits.
              </p>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={pending}
                >
                  Annuler
                </Button>
                <Button type="button" onClick={() => void submit()} disabled={pending}>
                  Créer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
