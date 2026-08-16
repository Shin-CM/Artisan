import * as React from "react";
import * as api from "@/lib/api";
import { importClientRecords } from "@/lib/importExportKinds";
import { TextareaWithCopyButton } from "@/components/TextareaWithCopyButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  capPreviewRows,
  parseClientPreviewFromCsvText,
  parseClientPreviewFromExcelRows,
  type ClientPreviewRow,
} from "@/features/dataManager/clientParsers";
import { dataManagerFileUploadButtonClassName } from "@/features/dataManager/fileUploadButtonStyles";
import { SelectablePreviewTable } from "@/features/dataManager/SelectablePreviewTable";
import { useSelectionSet } from "@/features/dataManager/useSelectionSet";

const clientImportColumns = [
  {
    key: "name",
    header: "Nom",
    cell: (r: ClientPreviewRow) => r.name || "—",
  },
  {
    key: "email",
    header: "Courriel",
    cell: (r: ClientPreviewRow) => r.email ?? "—",
  },
  {
    key: "src",
    header: "Source",
    cell: (r: ClientPreviewRow) => (
      <span className="text-[var(--color-muted-foreground)]">{r.sourceLabel}</span>
    ),
  },
];

export function DataManagerClientsSection({
  workspaceId,
  onRefresh,
  compact,
}: {
  workspaceId: string;
  onRefresh: () => void;
  compact?: boolean;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = React.useState("");
  const [importPreview, setImportPreview] = React.useState<ClientPreviewRow[]>(
    [],
  );
  const [importTruncated, setImportTruncated] = React.useState(false);
  const importSel = useSelectionSet();

  function applyImportPreview(rows: ClientPreviewRow[]) {
    const { rows: capped, truncated } = capPreviewRows(rows);
    setImportPreview(capped);
    setImportTruncated(truncated);
    importSel.setSel(
      new Set(capped.filter((r) => r.selectable).map((r) => r.id)),
    );
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const isExcel = /\.xlsx?$/i.test(file.name);
    try {
      if (isExcel) {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const name0 = wb.SheetNames[0];
        if (!name0) {
          toast.error("Classeur vide");
          return;
        }
        const sheet = wb.Sheets[name0];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        applyImportPreview(parseClientPreviewFromExcelRows(rows, file.name));
      } else {
        const text = await file.text();
        applyImportPreview(parseClientPreviewFromCsvText(text));
      }
      toast.message("Aperçu prêt : cochez les lignes puis importez.");
    } catch (err) {
      toast.error(String(err));
    }
  }

  function analyzeCsvText() {
    if (!csvText.trim()) {
      toast.error("Collez d’abord du CSV.");
      return;
    }
    applyImportPreview(parseClientPreviewFromCsvText(csvText));
    toast.message("Aperçu prêt à partir du texte CSV.");
  }

  async function runImportSelected() {
    const picked = importPreview.filter(
      (r) => importSel.sel.has(r.id) && r.selectable,
    );
    if (picked.length === 0) {
      toast.error("Cochez au moins une ligne valide (nom requis).");
      return;
    }
    try {
      const { count, failed } = await importClientRecords(
        workspaceId,
        picked.map((r) => ({ name: r.name, email: r.email })),
      );
      const status = failed > 0 ? "partial" : "ok";
      await api.logImportHistory(
        workspaceId,
        "csv",
        "clients",
        null,
        count,
        status,
      );
      toast.success(
        `${count} client(s) importé(s)${failed ? `, ${failed} échec(s)` : ""}`,
      );
      setImportPreview([]);
      importSel.setSel(new Set());
      setCsvText("");
      onRefresh();
    } catch (e) {
      toast.error(String(e));
      await api.logImportHistory(
        workspaceId,
        "csv",
        "clients",
        null,
        0,
        "error",
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium">Importer des clients</p>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <Label className="text-sm leading-snug">Fichier CSV ou Excel</Label>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => void onFileChange(e)}
              />
              <Button
                type="button"
                variant="outline"
                className={dataManagerFileUploadButtonClassName}
                onClick={() => fileInputRef.current?.click()}
              >
                Charger un fichier
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm leading-snug">
              Texte CSV (séparateur ; colonnes nom, courriel)
            </Label>
            <TextareaWithCopyButton
              className="min-h-[72px] w-full bg-[var(--color-background)]"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Nom;Courriel&#10;Société X;contact@exemple.fr"
              copyButtonAriaLabel="Copier le texte CSV"
              copyButtonTitle="Copier"
            />
            <Button type="button" variant="outline" size="sm" onClick={analyzeCsvText}>
              Analyser le CSV collé
            </Button>
          </div>
          {importPreview.length > 0 ? (
            <div className="flex flex-col gap-3 pt-2">
              <Button type="button" size="sm" onClick={() => void runImportSelected()}>
                Importer la sélection
              </Button>
              <SelectablePreviewTable
                rows={importPreview}
                columns={clientImportColumns}
                selectedIds={importSel.sel}
                onToggle={(id, checked) => {
                  const n = new Set(importSel.sel);
                  if (checked) n.add(id);
                  else n.delete(id);
                  importSel.setSel(n);
                }}
                onToggleAll={(checked) => {
                  if (checked) {
                    importSel.setSel(
                      new Set(
                        importPreview
                          .filter((r) => r.selectable)
                          .map((r) => r.id),
                      ),
                    );
                  } else {
                    importSel.setSel(new Set());
                  }
                }}
                isRowSelectable={(r) => r.selectable}
                truncated={importTruncated}
                compact={compact}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
