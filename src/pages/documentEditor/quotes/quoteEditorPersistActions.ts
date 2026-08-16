import * as api from "@/lib/api";
import { toast } from "sonner";
import { buildQuotePdfBytes } from "@/lib/pdfExport";
import { loadPdfCommonContext } from "@/lib/loadPdfContext";
import { openGeneratedPdfPreview } from "@/lib/pdfPreview";
import { quoteToUpdateInput } from "@/pages/documentEditor/quoteFormPayloads";
import type { QuoteWorkspacePreferences } from "@/lib/documentOptions";
import type { NavigateFunction } from "react-router-dom";

export function quoteEditorPersistActions(d: {
  kind: "quote" | "purchase_order";
  active: api.Workspace | null;
  sel: api.Quote | null;
  setSel: (q: api.Quote | null) => void;
  clients: api.Client[];
  clientId: string;
  projectsEnabled: boolean;
  setPdfLoading: (v: boolean) => void;
  makeQuoteForPdf: () => api.Quote;
  makeQuoteInput: (archived: boolean) => api.QuoteInput;
  quotePrefs: QuoteWorkspacePreferences;
  customRefDraft: string;
  docWord: string;
  docWordCap: string;
  load: () => void | Promise<void>;
  navigate: NavigateFunction;
  lockedProjectId: string | null;
}) {
  const {
    kind,
    active,
    sel,
    setSel,
    clients,
    clientId,
    projectsEnabled,
    setPdfLoading,
    makeQuoteForPdf,
    makeQuoteInput,
    quotePrefs,
    customRefDraft,
    docWord,
    docWordCap,
    load,
    navigate,
    lockedProjectId,
  } = d;

  async function exportQuotePdf() {
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
      const q = makeQuoteForPdf();
      const ctx = await loadPdfCommonContext(
        active,
        clients,
        clientId || null,
        {
          projectId: q.projectId,
          projectsModuleEnabled: projectsEnabled,
        },
      );
      const bytes = await buildQuotePdfBytes(
        q,
        ctx,
        kind === "purchase_order"
          ? { quotePdfTitlePrefix: "Bon de commande" }
          : undefined,
      );
      const safeName = `${q.number.replace(/[/\\\\?%*:|"<>]/g, "-")}.pdf`;
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

  async function previewQuotePdf() {
    if (!active) return;
    try {
      const q = makeQuoteForPdf();
      const ctx = await loadPdfCommonContext(
        active,
        clients,
        clientId || null,
        {
          projectId: q.projectId,
          projectsModuleEnabled: projectsEnabled,
        },
      );
      const bytes = await buildQuotePdfBytes(
        q,
        ctx,
        kind === "purchase_order"
          ? { quotePdfTitlePrefix: "Bon de commande" }
          : undefined,
      );
      await openGeneratedPdfPreview(bytes);
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function handleSave() {
    if (!active) return;
    if (
      quotePrefs.allowCustomReference &&
      sel?.useCustomNumber &&
      !customRefDraft.trim()
    ) {
      toast.error(`Indiquez une référence de ${docWord}.`);
      return;
    }
    const input = makeQuoteInput(sel?.archived ?? false);
    try {
      if (sel) {
        const updated =
          kind === "purchase_order"
            ? await api.updatePurchaseOrder(sel.id, input)
            : await api.updateQuote(sel.id, input);
        setSel(updated);
        toast.success(`${docWordCap} enregistré`);
      } else {
        if (kind === "purchase_order") {
          await api.createPurchaseOrder(active.id, input);
        } else {
          await api.createQuote(active.id, input);
        }
        setSel(null);
        toast.success(`${docWordCap} créé`);
      }
      void load();
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function setQuoteArchived(next: boolean) {
    if (!active || !sel) return;
    try {
      const input = makeQuoteInput(next);
      const updated =
        kind === "purchase_order"
          ? await api.updatePurchaseOrder(sel.id, input)
          : await api.updateQuote(sel.id, input);
      setSel(updated);
      void load();
      toast.success(next ? `${docWordCap} archivé` : `${docWordCap} restauré`);
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function archiveQuoteFromList(q: api.Quote) {
    if (!active) return;
    try {
      const input = quoteToUpdateInput(q, true);
      const updated =
        kind === "purchase_order"
          ? await api.updatePurchaseOrder(q.id, input)
          : await api.updateQuote(q.id, input);
      if (sel?.id === q.id) setSel(updated);
      void load();
      toast.success(`${docWordCap} archivé`);
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function handleDeleteQuote(quoteId: string) {
    if (!active) return;
    try {
      if (kind === "purchase_order") {
        await api.deletePurchaseOrder(quoteId);
      } else {
        await api.deleteQuote(quoteId);
      }
      if (sel?.id === quoteId) setSel(null);
      void load();
      toast.success("Supprimé");
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function handleConvert() {
    if (!active || !sel) return;
    try {
      const inv =
        kind === "purchase_order"
          ? await api.convertPurchaseOrderToInvoice(sel.id, active.id)
          : await api.convertQuoteToInvoice(sel.id, active.id);
      toast.success(`Facture ${inv.number} créée`);
      if (lockedProjectId) {
        void navigate(
          `/home/projects/${lockedProjectId}/invoices/edit?focus=${encodeURIComponent(inv.id)}`,
        );
      } else {
        void navigate(`/home/invoices?focus=${inv.id}`);
      }
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function handleConvertQuoteToPurchaseOrder() {
    if (!active || !sel || kind !== "quote") return;
    try {
      const po = await api.convertQuoteToPurchaseOrder(sel.id, active.id);
      toast.success(`Bon de commande ${po.number} créé`);
      if (lockedProjectId) {
        void navigate(
          `/home/projects/${lockedProjectId}/purchase-orders/edit?focus=${encodeURIComponent(po.id)}`,
        );
      } else {
        void navigate(`/home/purchase-orders?focus=${po.id}`);
      }
    } catch (e) {
      toast.error(String(e));
    }
  }

  return {
    exportQuotePdf,
    previewQuotePdf,
    handleSave,
    setQuoteArchived,
    archiveQuoteFromList,
    handleDeleteQuote,
    handleConvert,
    handleConvertQuoteToPurchaseOrder,
  };
}
