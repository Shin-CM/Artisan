import * as api from "@/lib/api";
import { toast } from "sonner";
import { buildInvoicePdfBytes } from "@/lib/pdfExport";
import { loadPdfCommonContext } from "@/lib/loadPdfContext";
import { openGeneratedPdfPreview } from "@/lib/pdfPreview";
import type { InvoiceWorkspacePreferences } from "@/lib/documentOptions";
import { issuedInvoiceContentLocked } from "@/lib/documentOptions";

export function invoiceEditorPersistActions(d: {
  active: api.Workspace | null;
  sel: api.Invoice | null;
  setSel: (inv: api.Invoice | null) => void;
  clients: api.Client[];
  clientId: string;
  projectsEnabled: boolean;
  setPdfLoading: (v: boolean) => void;
  makeInvoiceForPdf: () => api.Invoice;
  makeInvoiceInput: (archived: boolean) => api.InvoiceInput;
  invoicePrefs: InvoiceWorkspacePreferences;
  customRefDraft: string;
  docLabel: string;
  load: () => void | Promise<void>;
}) {
  const {
    active,
    sel,
    setSel,
    clients,
    clientId,
    projectsEnabled,
    setPdfLoading,
    makeInvoiceForPdf,
    makeInvoiceInput,
    invoicePrefs,
    customRefDraft,
    docLabel,
    load,
  } = d;

  async function exportInvoicePdf() {
    if (!active) return;
    const dir = active.pdfOutputDir?.trim();
    if (!dir) {
      toast.error(
        "Indiquez un dossier de sortie PDF dans Paramètres → Espace de travail.",
      );
      return;
    }
    setPdfLoading(true);
    try {
      const inv = makeInvoiceForPdf();
      const ctx = await loadPdfCommonContext(
        active,
        clients,
        clientId || null,
        {
          projectId: inv.projectId,
          projectsModuleEnabled: projectsEnabled,
        },
      );
      const bytes = await buildInvoicePdfBytes(inv, ctx);
      const safeName = `${inv.number.replace(/[/\\\\?%*:|"<>]/g, "-")}.pdf`;
      const path =
        dir.endsWith("/") || dir.endsWith("\\")
          ? `${dir}${safeName}`
          : `${dir}/${safeName}`;
      await api.writePdfFile(path, bytes);
      toast.success(`PDF enregistré : ${safeName}`);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setPdfLoading(false);
    }
  }

  async function previewInvoicePdf() {
    if (!active) return;
    try {
      const inv = makeInvoiceForPdf();
      const ctx = await loadPdfCommonContext(
        active,
        clients,
        clientId || null,
        {
          projectId: inv.projectId,
          projectsModuleEnabled: projectsEnabled,
        },
      );
      const bytes = await buildInvoicePdfBytes(inv, ctx);
      await openGeneratedPdfPreview(bytes);
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function handleSave() {
    if (!active) return;
    if (
      invoicePrefs.allowCustomReference &&
      sel?.useCustomNumber === true &&
      !customRefDraft.trim()
    ) {
      toast.error(`Indiquez une référence de ${docLabel.toLowerCase()}.`);
      return;
    }
    const input = makeInvoiceInput(sel?.archived ?? false);
    try {
      if (sel) {
        const updated = await api.updateInvoice(sel.id, input);
        setSel(updated);
        toast.success(`${docLabel} enregistré(e)`);
      } else {
        const created = await api.createInvoice(active.id, input);
        setSel(created);
        toast.success(`${docLabel} créé(e)`);
      }
      void load();
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function setInvoiceArchived(next: boolean) {
    if (!active || !sel) return;
    try {
      const input = makeInvoiceInput(next);
      const updated = await api.updateInvoice(sel.id, input);
      setSel(updated);
      void load();
      toast.success(next ? `${docLabel} archivé(e)` : `${docLabel} restauré(e)`);
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function handleDeleteInvoice() {
    if (!active || !sel) return;
    if (issuedInvoiceContentLocked(sel, invoicePrefs)) {
      toast.error(
        "Impossible de supprimer une facture verrouillée. Archivez-la, créez un avoir, ou désactivez le verrouillage dans Paramètres → Espace de travail.",
      );
      return;
    }
    try {
      await api.deleteInvoice(sel.id);
      setSel(null);
      void load();
      toast.success(`${docLabel} supprimé(e)`);
    } catch (e) {
      toast.error(String(e));
    }
  }

  return {
    exportInvoicePdf,
    previewInvoicePdf,
    handleSave,
    setInvoiceArchived,
    handleDeleteInvoice,
  };
}
