import * as React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ScrollText } from "lucide-react";
import type { Project, Workspace } from "@/lib/api";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  buildDraftInvoiceInputForProject,
  buildDraftQuoteInputForProject,
} from "@/pages/projects/projectLinkedDocumentInputs";

type DocKind = "quote" | "invoice" | "purchase_order";

export function ProjectNewDocumentDialog({
  open,
  onOpenChange,
  workspace,
  project,
  projectsEnabled,
  purchaseOrdersEnabled,
  onCreated,
  /** Si défini, le lien « Ouvrir » reste dans l’espace projet (`/home/projects/…`). */
  shellProjectId = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | null;
  project: Project | null;
  projectsEnabled: boolean;
  purchaseOrdersEnabled: boolean;
  onCreated: () => void;
  shellProjectId?: string | null;
}) {
  const navigate = useNavigate();
  const [busyKind, setBusyKind] = React.useState<DocKind | null>(null);

  const busy = busyKind != null;

  async function createKind(kind: DocKind) {
    if (!workspace || !project) return;
    setBusyKind(kind);
    try {
      if (kind === "quote") {
        const input = buildDraftQuoteInputForProject(
          workspace,
          project,
          projectsEnabled,
        );
        const q = await api.createQuote(workspace.id, input);
        const pid = shellProjectId?.trim();
        const quoteOpen = pid
          ? `/home/projects/${pid}/quotes/edit?focus=${encodeURIComponent(q.id)}`
          : `/home/quotes?focus=${encodeURIComponent(q.id)}`;
        toast.success(`Devis ${q.number} créé`, {
          action: {
            label: "Ouvrir",
            onClick: () => void navigate(quoteOpen),
          },
        });
      } else if (kind === "purchase_order") {
        const input = buildDraftQuoteInputForProject(
          workspace,
          project,
          projectsEnabled,
        );
        const po = await api.createPurchaseOrder(workspace.id, input);
        const pidPo = shellProjectId?.trim();
        const poOpen = pidPo
          ? `/home/projects/${pidPo}/purchase-orders/edit?focus=${encodeURIComponent(po.id)}`
          : `/home/purchase-orders?focus=${encodeURIComponent(po.id)}`;
        toast.success(`Bon de commande ${po.number} créé`, {
          action: {
            label: "Ouvrir",
            onClick: () => void navigate(poOpen),
          },
        });
      } else {
        const input = buildDraftInvoiceInputForProject(
          workspace,
          project,
          projectsEnabled,
        );
        const inv = await api.createInvoice(workspace.id, input);
        const pidInv = shellProjectId?.trim();
        const invOpen = pidInv
          ? `/home/projects/${pidInv}/invoices/edit?focus=${encodeURIComponent(inv.id)}`
          : `/home/invoices?focus=${encodeURIComponent(inv.id)}`;
        toast.success(`Facture ${inv.number} créée`, {
          action: {
            label: "Ouvrir",
            onClick: () => void navigate(invOpen),
          },
        });
      }
      onCreated();
      onOpenChange(false);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusyKind(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau document lié</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Un brouillon est créé tout de suite avec le projet
          {project?.clientId ? " et le client du projet" : ""} ; il apparaît
          dans la liste des documents liés. Vous pouvez l’ouvrir depuis la
          notification ou la liste.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto justify-start gap-2 py-3"
            disabled={busy || !workspace || !project}
            onClick={() => void createKind("quote")}
          >
            <FileText className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-left font-medium">
              {busyKind === "quote" ? "Création…" : "Devis"}
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto justify-start gap-2 py-3"
            disabled={busy || !workspace || !project}
            onClick={() => void createKind("invoice")}
          >
            <ScrollText className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-left font-medium">
              {busyKind === "invoice" ? "Création…" : "Facture"}
            </span>
          </Button>
          {purchaseOrdersEnabled ? (
            <Button
              type="button"
              variant="outline"
              className="h-auto justify-start gap-2 py-3"
              disabled={busy || !workspace || !project}
              onClick={() => void createKind("purchase_order")}
            >
              <FileText className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-left font-medium">
                {busyKind === "purchase_order" ? "Création…" : "Bon de commande"}
              </span>
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
