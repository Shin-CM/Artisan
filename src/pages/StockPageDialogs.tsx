import { SearchableCombobox } from "@/components/SearchableCombobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
  addArticleId: string;
  setAddArticleId: (v: string) => void;
  articleOptions: Array<{ value: string; label: string }>;
  addQty: string;
  setAddQty: (v: string) => void;
  addSupplierName: string;
  setAddSupplierName: (v: string) => void;
  addSupplierReference: string;
  setAddSupplierReference: (v: string) => void;
  addNote: string;
  setAddNote: (v: string) => void;
  busy: boolean;
  onSubmitAdd: () => void;
  editOpen: boolean;
  setEditOpen: (v: boolean) => void;
  selectedRow: { articleName: string; quantity: number } | null;
  editTargetQty: string;
  setEditTargetQty: (v: string) => void;
  editSupplierName: string;
  setEditSupplierName: (v: string) => void;
  editSupplierReference: string;
  setEditSupplierReference: (v: string) => void;
  editNote: string;
  setEditNote: (v: string) => void;
  editTrackStock: boolean;
  setEditTrackStock: (v: boolean) => void;
  editMinQty: string;
  setEditMinQty: (v: string) => void;
  onSubmitEdit: () => void;
  deleteOpen: boolean;
  setDeleteOpen: (v: boolean) => void;
  onConfirmClear: () => void;
};

export function StockPageDialogs({
  addOpen,
  setAddOpen,
  addArticleId,
  setAddArticleId,
  articleOptions,
  addQty,
  setAddQty,
  addSupplierName,
  setAddSupplierName,
  addSupplierReference,
  setAddSupplierReference,
  addNote,
  setAddNote,
  busy,
  onSubmitAdd,
  editOpen,
  setEditOpen,
  selectedRow,
  editTargetQty,
  setEditTargetQty,
  editSupplierName,
  setEditSupplierName,
  editSupplierReference,
  setEditSupplierReference,
  editNote,
  setEditNote,
  editTrackStock,
  setEditTrackStock,
  editMinQty,
  setEditMinQty,
  onSubmitEdit,
  deleteOpen,
  setDeleteOpen,
  onConfirmClear,
}: Props) {
  return (
    <>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter du stock</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Entrée en stock. Vous pouvez aussi renseigner ou mettre à jour le
            fournisseur et la référence (enregistrés sur la fiche article, comme
            dans Produits).
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="add-stock-art">Article</Label>
              <SearchableCombobox
                id="add-stock-art"
                label="Article"
                hideLabel
                value={addArticleId}
                onValueChange={setAddArticleId}
                options={articleOptions}
                placeholder="Choisir…"
                allowClearSelection
                triggerClassName="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-stock-qty">Quantité à ajouter</Label>
              <Input
                id="add-stock-qty"
                inputMode="decimal"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                placeholder="ex. 10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-stock-sup">Fournisseur (optionnel)</Label>
              <Input
                id="add-stock-sup"
                value={addSupplierName}
                onChange={(e) => setAddSupplierName(e.target.value)}
                placeholder="Mis à jour sur la fiche article si modifié"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-stock-sref">Référence fournisseur (optionnel)</Label>
              <Input
                id="add-stock-sref"
                className="font-mono text-sm"
                value={addSupplierReference}
                onChange={(e) => setAddSupplierReference(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-stock-note">Note (optionnel)</Label>
              <Input
                id="add-stock-note"
                value={addNote}
                onChange={(e) => setAddNote(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => onSubmitAdd()}
            >
              Valider
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Stock et fournisseur</DialogTitle>
          </DialogHeader>
          {selectedRow ? (
            <>
              <p className="text-sm">
                <span className="text-[var(--color-muted-foreground)]">
                  Article (catalogue) :{" "}
                </span>
                <span className="font-medium">{selectedRow.articleName}</span>
              </p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Stock actuel :{" "}
                <span className="tabular-nums text-[var(--color-foreground)]">
                  {selectedRow.quantity}
                </span>
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-stock-target">Nouvelle quantité en stock</Label>
                  <Input
                    id="edit-stock-target"
                    inputMode="decimal"
                    value={editTargetQty}
                    onChange={(e) => setEditTargetQty(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-stock-sup">Fournisseur</Label>
                  <Input
                    id="edit-stock-sup"
                    value={editSupplierName}
                    onChange={(e) => setEditSupplierName(e.target.value)}
                    placeholder="Optionnel"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-stock-sref">Référence fournisseur</Label>
                  <Input
                    id="edit-stock-sref"
                    className="font-mono text-sm"
                    value={editSupplierReference}
                    onChange={(e) => setEditSupplierReference(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-stock-note">Note (optionnel)</Label>
                  <Input
                    id="edit-stock-note"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="ex. Inventaire"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="edit-stock-track"
                    type="checkbox"
                    className="h-4 w-4 rounded border-[var(--color-input)]"
                    checked={editTrackStock}
                    onChange={(e) => setEditTrackStock(e.target.checked)}
                  />
                  <Label htmlFor="edit-stock-track" className="font-normal">
                    Suivre cet article (alertes si sous le seuil)
                  </Label>
                </div>
                {editTrackStock ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-stock-min">Seuil minimum</Label>
                    <Input
                      id="edit-stock-min"
                      inputMode="decimal"
                      value={editMinQty}
                      onChange={(e) => setEditMinQty(e.target.value)}
                      placeholder="ex. 5"
                    />
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={busy || !selectedRow}
              onClick={() => onSubmitEdit()}
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Effacer les données de stock</DialogTitle>
          </DialogHeader>
          {selectedRow ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              L’article{" "}
              <span className="font-medium text-[var(--color-foreground)]">
                {selectedRow.articleName}
              </span>{" "}
              reste dans le catalogue (Produits). Seuls le niveau et l’historique
              des mouvements seront supprimés pour cet article.
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy || !selectedRow}
              onClick={() => onConfirmClear()}
            >
              Effacer le stock
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
