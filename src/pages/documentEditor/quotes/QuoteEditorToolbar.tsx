import { Eye, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DocumentActionsMenu,
  type DocumentActionItem,
} from "@/pages/documentEditor/DocumentActionsMenu";

export type QuoteEditorToolbarProps = {
  pdfLoading: boolean;
  canSave: boolean;
  hasExistingQuote: boolean;
  onSave: () => void;
  onPreviewPdf: () => void;
  onExportPdf: () => void;
  documentActionItems: DocumentActionItem[];
  onDocumentAction: (actionId: string) => void;
  onDelete: () => void;
  /** Dans la feuille unique : pas de bordure dupliquée (le parent encadre). */
  documentSurface?: boolean;
};

export function QuoteEditorToolbar({
  pdfLoading,
  canSave,
  hasExistingQuote,
  onSave,
  onPreviewPdf,
  onExportPdf,
  documentActionItems,
  onDocumentAction,
  onDelete,
  documentSurface = false,
}: QuoteEditorToolbarProps) {
  return (
    <div
      className={
        documentSurface
          ? "flex flex-wrap items-center gap-1.5"
          : "flex flex-wrap items-center gap-1.5 border-b border-[var(--color-border)] pb-3"
      }
    >
      <Button
        type="button"
        size="sm"
        disabled={!canSave}
        onClick={onSave}
      >
        Enregistrer
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!canSave}
        onClick={onPreviewPdf}
      >
        <Eye className="mr-1 h-4 w-4" />
        Aperçu PDF
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!canSave || pdfLoading}
        onClick={onExportPdf}
      >
        <FileDown className="mr-1 h-4 w-4" />
        {pdfLoading ? "Export…" : "Enregistrer en PDF"}
      </Button>
      {hasExistingQuote ? (
        <>
          <DocumentActionsMenu
            items={documentActionItems}
            onSelect={onDocumentAction}
          />
          <Button type="button" size="sm" variant="outline" onClick={onDelete}>
            Supprimer
          </Button>
        </>
      ) : null}
    </div>
  );
}
