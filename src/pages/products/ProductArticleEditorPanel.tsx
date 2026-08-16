import * as React from "react";
import { Trash2 } from "lucide-react";
import type * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ArticleVariantDef } from "@/lib/articleOptions";

/** Permet de saisir 1,30 ou 1.30 sans perdre le séparateur pendant la frappe (commit au blur). */
function VariantPriceDeltaInput({
  variantId,
  value,
  onCommit,
}: {
  variantId: string;
  value: number;
  onCommit: (n: number) => void;
}) {
  const [text, setText] = React.useState(() =>
    value === 0 ? "" : String(value),
  );

  React.useEffect(() => {
    setText(value === 0 ? "" : String(value));
  }, [variantId]);

  return (
    <Input
      type="text"
      inputMode="decimal"
      className="mt-0.5 h-8 text-xs tabular-nums"
      placeholder="ex. 1,30"
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(",", ".");
        if (raw === "" || /^-?\d*\.?\d*$/.test(raw)) {
          setText(raw);
          if (raw !== "" && !raw.endsWith(".")) {
            const n = parseFloat(raw);
            if (Number.isFinite(n)) onCommit(n);
          }
        }
      }}
      onBlur={() => {
        const n = parseFloat(text.replace(",", "."));
        const final = Number.isFinite(n) ? n : 0;
        onCommit(final);
        setText(final === 0 ? "" : String(final));
      }}
    />
  );
}

export type ProductArticleEditorPanelProps = {
  artSel: api.Article | null;
  aname: string;
  setAname: (v: string) => void;
  aprice: string;
  setAprice: (v: string) => void;
  aflat: string;
  setAflat: (v: string) => void;
  ahourly: string;
  setAhourly: (v: string) => void;
  acost: string;
  setAcost: (v: string) => void;
  asupplierName: string;
  setAsupplierName: (v: string) => void;
  asupplierReference: string;
  setAsupplierReference: (v: string) => void;
  articleVariants: ArticleVariantDef[];
  setArticleVariants: React.Dispatch<React.SetStateAction<ArticleVariantDef[]>>;
  onSave: () => void;
  onDeleteArticle: () => void;
};

export function ProductArticleEditorPanel({
  artSel,
  aname,
  setAname,
  aprice,
  setAprice,
  aflat,
  setAflat,
  ahourly,
  setAhourly,
  acost,
  setAcost,
  asupplierName,
  setAsupplierName,
  asupplierReference,
  setAsupplierReference,
  articleVariants,
  setArticleVariants,
  onSave,
  onDeleteArticle,
}: ProductArticleEditorPanelProps) {
  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <h2 className="text-lg font-medium">
        {artSel ? "Modifier l’article" : "Nouvel article"}
      </h2>
      <div className="max-w-md space-y-3">
        <div>
          <Label>Nom</Label>
          <Input value={aname} onChange={(e) => setAname(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Fournisseur (stock / achat)</Label>
          <Input
            value={asupplierName}
            onChange={(e) => setAsupplierName(e.target.value)}
            className="mt-1"
            placeholder="Optionnel"
            autoComplete="off"
          />
        </div>
        <div>
          <Label>Référence fournisseur</Label>
          <Input
            value={asupplierReference}
            onChange={(e) => setAsupplierReference(e.target.value)}
            className="mt-1 font-mono text-sm"
            placeholder="Réf. chez le fournisseur"
            autoComplete="off"
          />
        </div>
        <div>
          <Label>Prix unitaire HT (catalogue)</Label>
          <Input
            type="number"
            step="any"
            min={0}
            value={aprice}
            onChange={(e) => setAprice(e.target.value)}
            className="mt-1"
            placeholder="0"
          />
        </div>
        <div>
          <Label>Forfait HT (catalogue, optionnel)</Label>
          <Input
            type="number"
            step="any"
            min={0}
            value={aflat}
            onChange={(e) => setAflat(e.target.value)}
            className="mt-1"
            placeholder="Ligne en mode forfait"
          />
        </div>
        <div>
          <Label>Tarif horaire HT (catalogue, optionnel)</Label>
          <Input
            type="number"
            step="any"
            min={0}
            value={ahourly}
            onChange={(e) => setAhourly(e.target.value)}
            className="mt-1"
            placeholder="Ligne à l’heure"
          />
        </div>
        <div>
          <Label>Coût de production (interne, optionnel)</Label>
          <Input
            type="number"
            step="any"
            min={0}
            value={acost}
            onChange={(e) => setAcost(e.target.value)}
            className="mt-1"
            placeholder="Laisser vide si inconnu"
          />
        </div>
        <div className="border-t border-[var(--color-border)] pt-3">
          <Label>Variantes (devis / factures)</Label>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Libellé affiché après le nom article sur le PDF ; supplément HT s’ajoute au prix selon le
            mode de facturation (unitaire, forfait ou horaire).
          </p>
          <ul className="mt-2 space-y-2">
            {articleVariants.map((v, idx) => (
              <li
                key={v.id}
                className="flex flex-wrap items-end gap-2 rounded-md border border-[var(--color-border)] p-2"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-[var(--color-muted-foreground)]">Libellé</span>
                  <Input
                    className="mt-0.5 h-8 text-xs"
                    value={v.label}
                    onChange={(e) => {
                      const t = e.target.value;
                      setArticleVariants((prev) =>
                        prev.map((x, j) => (j === idx ? { ...x, label: t } : x)),
                      );
                    }}
                    placeholder="ex. aux amandes"
                  />
                </div>
                <div className="min-w-[5.5rem] shrink-0">
                  <span className="text-xs text-[var(--color-muted-foreground)]">+ HT</span>
                  <VariantPriceDeltaInput
                    variantId={v.id}
                    value={v.priceDeltaHt}
                    onCommit={(n) => {
                      setArticleVariants((prev) =>
                        prev.map((x, j) => (j === idx ? { ...x, priceDeltaHt: n } : x)),
                      );
                    }}
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-[var(--color-muted-foreground)]"
                  aria-label="Supprimer cette variante"
                  onClick={() =>
                    setArticleVariants((prev) => prev.filter((_, j) => j !== idx))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() =>
              setArticleVariants((prev) => [
                ...prev,
                { id: crypto.randomUUID(), label: "", priceDeltaHt: 0 },
              ])
            }
          >
            Ajouter une variante
          </Button>
        </div>
        <Button type="button" onClick={() => void onSave()}>
          Enregistrer
        </Button>
        {artSel ? (
          <Button type="button" variant="outline" className="ml-2" onClick={() => void onDeleteArticle()}>
            Supprimer
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Poignée catégorie : clic pour renommer / supprimer, maintenir ~0,2 s puis glisser pour
        réordonner ; poignée article : clic pour supprimer, maintenir ~0,2 s puis glisser. Déposez un
        article sur un dossier pour changer de catégorie.
      </p>
    </div>
  );
}
