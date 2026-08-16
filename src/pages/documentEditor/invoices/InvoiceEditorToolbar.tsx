import { Archive, Eye, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DocumentActionsMenu,
  type DocumentActionItem,
} from "@/pages/documentEditor/DocumentActionsMenu";

export type InvoiceEditorToolbarProps = {
  pdfLoading: boolean;
  canSave: boolean;
  canDelete?: boolean;
  hasExistingInvoice: boolean;
  invoiceArchived: boolean;
  onSave: () => void;
  onPreviewPdf: () => void;
  onExportPdf: () => void;
  onArchive: () => void;
  onDelete: () => void;
  documentActionItems?: DocumentActionItem[];
  onDocumentAction?: (actionId: string) => void;
  documentSurface?: boolean;
};

export function InvoiceEditorToolbar({
  pdfLoading,
  canSave,
  canDelete = true,
  hasExistingInvoice,
  invoiceArchived,
  onSave,
  onPreviewPdf,
  onExportPdf,
  onArchive,
  onDelete,
  documentActionItems = [],
  onDocumentAction,
  documentSurface = false,
}: InvoiceEditorToolbarProps) {
  return (
    <div
      className={
        documentSurface
          ? "flex flex-wrap items-center gap-1.5"
          : "flex flex-wrap items-center gap-1.5 border-b border-[var(--color-border)] pb-3"
      }
    >
      <Button type="button" size="sm" disabled={!canSave} onClick={onSave}>
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
      {hasExistingInvoice &&
      documentActionItems.length > 0 &&
      onDocumentAction ? (
        <DocumentActionsMenu
          items={documentActionItems}
          onSelect={onDocumentAction}
        />
      ) : null}
      {hasExistingInvoice && !invoiceArchived ? (
        <Button type="button" size="sm" variant="outline" onClick={onArchive}>
          <Archive className="mr-1 h-4 w-4" />
          Archiver
        </Button>
      ) : null}
      {hasExistingInvoice && canDelete ? (
        <Button type="button" size="sm" variant="outline" onClick={onDelete}>
          Supprimer
        </Button>
      ) : null}
    </div>
  );
}
