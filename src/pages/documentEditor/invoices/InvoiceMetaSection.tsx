import type { Client } from "@/lib/api";
import type * as api from "@/lib/api";
import { ClientSelectionPreview } from "@/components/ClientSelectionPreview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import type { InvoiceWorkspacePreferences } from "@/lib/documentOptions";
import { cn } from "@/lib/utils";

export type InvoiceMetaSectionProps = {
  invoicePrefs: InvoiceWorkspacePreferences;
  sel: api.Invoice | null;
  /** Bandeau document : « Facture » ou « Avoir ». */
  documentTypeLabel?: string;
  /** Libellé sous le type de document (numéro existant, prochain FAC-xxxxx, ou réf. perso). */
  referenceHeading: string;
  customRefDraft: string;
  onCustomRefDraftChange: (v: string) => void;
  clientId: string;
  onClientIdChange: (v: string) => void;
  clientOptions: { value: string; label: string }[];
  selectedClient: Client | undefined;
  baseCurrency: string;
  onOpenQuickClient: () => void;
  status: string;
  onStatusChange: (v: string) => void;
  issueDate: string;
  onIssueDateChange: (v: string) => void;
  dueDate: string;
  onDueDateChange: (v: string) => void;
  amountPaid: number;
  onAmountPaidChange: (v: number) => void;
  documentSurface?: boolean;
  /** Lier l’avoir à une facture (optionnel). */
  creditedInvoiceOptions?: { value: string; label: string }[];
  creditedInvoiceId?: string;
  onCreditedInvoiceIdChange?: (v: string) => void;
  projectsModuleActive?: boolean;
  projectId: string;
  onProjectIdChange: (v: string) => void;
  projectOptions: { value: string; label: string }[];
  projectSelectorLocked?: boolean;
  projectLockedLabel?: string;
  /** Lecture seule du contenu (facture émise + verrou d’espace). */
  contentLocked?: boolean;
};

export function InvoiceMetaSection({
  invoicePrefs,
  sel,
  documentTypeLabel = "Facture",
  referenceHeading,
  customRefDraft,
  onCustomRefDraftChange,
  clientId,
  onClientIdChange,
  clientOptions,
  selectedClient,
  baseCurrency,
  onOpenQuickClient,
  status,
  onStatusChange,
  issueDate,
  onIssueDateChange,
  dueDate,
  onDueDateChange,
  amountPaid,
  onAmountPaidChange,
  documentSurface = false,
  creditedInvoiceOptions,
  creditedInvoiceId = "",
  onCreditedInvoiceIdChange,
  projectsModuleActive = false,
  projectId,
  onProjectIdChange,
  projectOptions,
  projectSelectorLocked = false,
  projectLockedLabel = "",
  contentLocked = false,
}: InvoiceMetaSectionProps) {
  const documentLineInput =
    "border-0 border-b border-[var(--color-border)] bg-transparent px-0 shadow-none focus-visible:ring-0 rounded-none";

  const statusSelectClass = cn(
    "mt-1 flex h-9 w-full min-w-[9.5rem] text-sm text-[var(--color-foreground)] focus:outline-none",
    documentSurface
      ? documentLineInput
      : "rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 shadow-sm",
  );

  const showReferenceFields =
    invoicePrefs.allowCustomReference ||
    (!!sel && sel.useCustomNumber === true && !invoicePrefs.allowCustomReference);

  const showAmountPaid =
    status === "paid" || status === "partially_paid";

  return (
    <div
      className={
        documentSurface
          ? "divide-y divide-[var(--color-border)]"
          : "space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4"
      }
    >
      <div className={documentSurface ? "py-3" : "border-b border-[var(--color-border)] pb-3"}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {documentTypeLabel}
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Référence :{" "}
              <span className="font-medium tabular-nums text-[var(--color-foreground)]">
                {referenceHeading}
              </span>
            </p>
            {creditedInvoiceOptions && onCreditedInvoiceIdChange ? (
              <div className="mt-3 w-full min-w-0 max-w-md">
                <SearchableCombobox
                  id="inv-credited-invoice"
                  label="Facture d’origine (optionnel)"
                  value={creditedInvoiceId}
                  onValueChange={onCreditedInvoiceIdChange}
                  options={creditedInvoiceOptions}
                  placeholder="Rechercher une facture…"
                  hideLabel={false}
                  allowClearSelection
                  disabled={contentLocked}
                  triggerClassName={
                    documentSurface ? documentLineInput : undefined
                  }
                />
              </div>
            ) : null}
          </div>
          <div className="w-full min-w-0 shrink-0 space-y-1 sm:w-auto sm:max-w-[14rem]">
            <Label htmlFor="inv-status-meta" className="text-xs text-[var(--color-muted-foreground)]">
              Statut
            </Label>
            <select
              id="inv-status-meta"
              className={statusSelectClass}
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              {!contentLocked ? (
                <option value="draft">Brouillon</option>
              ) : null}
              <option value="issued">Émise</option>
              <option value="paid">Payée</option>
              <option value="partially_paid">Partiellement payée</option>
              <option value="overdue">En retard</option>
            </select>
            {showAmountPaid ? (
              <div className="space-y-1 border-t border-[var(--color-border)] pt-3">
                <Label
                  htmlFor="inv-amount-paid-meta"
                  className="text-xs text-[var(--color-muted-foreground)]"
                >
                  Montant payé
                </Label>
                <Input
                  id="inv-amount-paid-meta"
                  type="number"
                  className={cn(documentSurface ? documentLineInput : "mt-1")}
                  value={amountPaid}
                  onChange={(e) =>
                    onAmountPaidChange(Number(e.target.value) || 0)
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {showReferenceFields ? (
        <div className={cn(documentSurface ? "space-y-1 py-3" : "space-y-1")}>
          <Label>Référence</Label>
          {!invoicePrefs.allowCustomReference && sel?.useCustomNumber ? (
            <>
              <p className="text-sm font-medium tabular-nums">{sel.number}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Référence personnalisée existante. La création de nouvelles factures
                avec référence personnalisée est désactivée dans Paramètres → Espace
                de travail.
              </p>
            </>
          ) : !sel ? (
            <>
              <Input
                value={customRefDraft}
                onChange={(e) => onCustomRefDraftChange(e.target.value)}
                placeholder="Laisser vide pour un numéro FAC-xxxxx automatique"
                aria-label="Référence personnalisée de la facture"
                disabled={contentLocked}
                className={cn("w-full", documentSurface && documentLineInput)}
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Une valeur saisie devient la référence de la facture (unicité dans
                l’espace).
              </p>
            </>
          ) : sel.useCustomNumber ? (
            <>
              <Input
                value={customRefDraft}
                onChange={(e) => onCustomRefDraftChange(e.target.value)}
                placeholder="Référence de la facture"
                aria-label="Référence de la facture"
                disabled={contentLocked}
                className={cn("w-full", documentSurface && documentLineInput)}
              />
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--color-foreground)]">
                Numéro actuel :{" "}
                <span className="font-medium tabular-nums">{sel.number}</span>
              </p>
              <Input
                value={customRefDraft}
                onChange={(e) => onCustomRefDraftChange(e.target.value)}
                placeholder="Saisir une référence personnalisée pour remplacer ce numéro"
                aria-label="Nouvelle référence personnalisée"
                disabled={contentLocked}
                className={cn("w-full", documentSurface && documentLineInput)}
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Laissez vide pour conserver le numéro automatique ci-dessus.
              </p>
            </>
          )}
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-4 md:grid-cols-2",
          documentSurface && "py-3",
        )}
      >
        <div className="space-y-2">
          <Label htmlFor="inv-client-search-meta">Client</Label>
          <SearchableCombobox
            hideLabel
            id="inv-client-search-meta"
            label="Client"
            value={clientId}
            onValueChange={onClientIdChange}
            options={clientOptions}
            placeholder="Rechercher un client…"
            triggerClassName={documentSurface ? documentLineInput : undefined}
            onCreateNew={contentLocked ? undefined : onOpenQuickClient}
            createNewLabel="Nouveau client"
            allowClearSelection
            disabled={contentLocked}
          />
          {selectedClient ? (
            <ClientSelectionPreview
              client={selectedClient}
              baseCurrency={baseCurrency}
              variant={documentSurface ? "document" : "card"}
            />
          ) : null}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="inv-issue-date-meta">Date d’émission</Label>
            <Input
              id="inv-issue-date-meta"
              type="date"
              className={cn(documentSurface ? documentLineInput : "mt-1")}
              value={issueDate}
              disabled={contentLocked}
              onChange={(e) => onIssueDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inv-due-date-meta">Échéance</Label>
            <Input
              id="inv-due-date-meta"
              type="date"
              className={cn("w-full", documentSurface && documentLineInput)}
              value={dueDate}
              disabled={contentLocked}
              onChange={(e) => onDueDateChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {projectsModuleActive ? (
        <div className={cn(documentSurface ? "space-y-2 py-3" : "space-y-2")}>
          <Label htmlFor="inv-project-search-meta">Projet (facultatif)</Label>
          {projectSelectorLocked ? (
            <p
              id="inv-project-search-meta"
              className={cn(
                "text-sm text-[var(--color-foreground)]",
                documentSurface && documentLineInput,
              )}
            >
              {projectLockedLabel.trim() || "—"}
            </p>
          ) : (
            <SearchableCombobox
              hideLabel
              id="inv-project-search-meta"
              label="Projet"
              value={projectId}
              onValueChange={onProjectIdChange}
              options={projectOptions}
              placeholder="Rechercher un projet…"
              triggerClassName={documentSurface ? documentLineInput : undefined}
              allowClearSelection
              disabled={contentLocked}
            />
          )}
          {!projectSelectorLocked ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Les projets du client sélectionné apparaissent en premier ; vous
              pouvez en choisir un autre.
            </p>
          ) : (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Projet fixé par le contexte de l’espace projet.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
