import type * as api from "@/lib/api";
import { ClientSelectionPreview } from "@/components/ClientSelectionPreview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import type { QuoteWorkspacePreferences } from "@/lib/documentOptions";
import { cn } from "@/lib/utils";

export type QuoteSurfaceKind = "quote" | "purchase_order";

function labelsForSurface(kind: QuoteSurfaceKind) {
  if (kind === "purchase_order") {
    return {
      header: "Bon de commande",
      docTitleField: "Intitulé du bon de commande",
      docWord: "bon de commande",
      autoNumberExample: "BDC-xxxxx automatique",
      legacyHelp:
        "La création de nouveaux bons de commande avec référence personnalisée est désactivée dans Paramètres → Espace de travail.",
      refCustomAria: "Référence personnalisée du bon de commande",
      refUniqueHint:
        "Une valeur saisie devient la référence du bon de commande (unicité dans l’espace).",
      refPlaceholder: "Référence du bon de commande",
      validUntilAria:
        "Date limite de validité du bon de commande (facultatif)",
    };
  }
  return {
    header: "Devis",
    docTitleField: "Intitulé du devis",
    docWord: "devis",
    autoNumberExample: "DEV-xxxxx automatique",
    legacyHelp:
      "La création de nouveaux devis avec référence personnalisée est désactivée dans Paramètres → Espace de travail.",
    refCustomAria: "Référence personnalisée du devis",
    refUniqueHint:
      "Une valeur saisie devient la référence du devis (unicité dans l’espace).",
    refPlaceholder: "Référence du devis",
    validUntilAria: "Date limite de validité du devis (facultatif)",
  };
}

export type QuoteMetaSectionProps = {
  quotePrefs: QuoteWorkspacePreferences;
  sel: api.Quote | null;
  surfaceKind?: QuoteSurfaceKind;
  /** Libellé exact affiché sous l’en-tête document (numéro existant, prochain auto, ou réf. perso). */
  referenceHeading: string;
  customRefDraft: string;
  onCustomRefDraftChange: (v: string) => void;
  docTitle: string;
  onDocTitleChange: (v: string) => void;
  clientId: string;
  onClientIdChange: (v: string) => void;
  clientOptions: { value: string; label: string }[];
  selectedClient: api.Client | undefined;
  /** Devise du workspace (parse `detailsJson` client). */
  baseCurrency: string;
  onOpenQuickClient: () => void;
  status: string;
  onStatusChange: (v: string) => void;
  issueDate: string;
  onIssueDateChange: (v: string) => void;
  /** Vide = aucune date limite (rien sur le PDF). */
  validUntil: string;
  onValidUntilChange: (v: string) => void;
  documentSurface?: boolean;
  /** Module Marketplace Projets actif : combobox facultative. */
  projectsModuleActive?: boolean;
  projectId: string;
  onProjectIdChange: (v: string) => void;
  projectOptions: { value: string; label: string }[];
  /** Contexte espace projet : pas de changement de projet. */
  projectSelectorLocked?: boolean;
  /** Libellé affiché si le sélecteur est verrouillé. */
  projectLockedLabel?: string;
};

export function QuoteMetaSection({
  quotePrefs,
  sel,
  surfaceKind = "quote",
  referenceHeading,
  customRefDraft,
  onCustomRefDraftChange,
  docTitle,
  onDocTitleChange,
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
  validUntil,
  onValidUntilChange,
  documentSurface = false,
  projectsModuleActive = false,
  projectId,
  onProjectIdChange,
  projectOptions,
  projectSelectorLocked = false,
  projectLockedLabel = "",
}: QuoteMetaSectionProps) {
  const L = labelsForSurface(surfaceKind);
  const documentLineInput =
    "border-0 border-b border-[var(--color-border)] bg-transparent px-0 shadow-none focus-visible:ring-0 rounded-none";

  const statusSelectClass = cn(
    "mt-1 flex h-9 w-full min-w-[9.5rem] text-sm text-[var(--color-foreground)] focus:outline-none",
    documentSurface
      ? documentLineInput
      : "rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 shadow-sm",
  );

  const showReferenceFields =
    quotePrefs.allowCustomReference ||
    (!!sel && sel.useCustomNumber && !quotePrefs.allowCustomReference);

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
              {L.header}
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Référence :{" "}
              <span className="font-medium tabular-nums text-[var(--color-foreground)]">
                {referenceHeading}
              </span>
            </p>
          </div>
          <div className="shrink-0 space-y-1">
            <Label htmlFor="quote-status" className="text-xs text-[var(--color-muted-foreground)]">
              Statut
            </Label>
            <select
              id="quote-status"
              className={statusSelectClass}
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyé</option>
              <option value="accepted">Accepté</option>
              <option value="rejected">Refusé</option>
            </select>
          </div>
        </div>
      </div>

      <div className={cn(documentSurface ? "space-y-1 py-3" : "space-y-1")}>
        <Label htmlFor="quote-title">{L.docTitleField}</Label>
        <Input
          id="quote-title"
          className={cn("mt-1", documentSurface && documentLineInput)}
          value={docTitle}
          onChange={(e) => onDocTitleChange(e.target.value)}
          placeholder="Ex. Rénovation toiture"
        />
      </div>

      {showReferenceFields ? (
        <div className={cn(documentSurface ? "space-y-1 py-3" : "space-y-1")}>
          <Label>Référence</Label>
          {!quotePrefs.allowCustomReference && sel?.useCustomNumber ? (
            <>
              <p className="text-sm font-medium tabular-nums">{sel.number}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Référence personnalisée existante. {L.legacyHelp}
              </p>
            </>
          ) : !sel ? (
            <>
              <Input
                value={customRefDraft}
                onChange={(e) => onCustomRefDraftChange(e.target.value)}
                placeholder={`Laisser vide pour un numéro ${L.autoNumberExample}`}
                aria-label={L.refCustomAria}
                className={cn("w-full", documentSurface && documentLineInput)}
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {L.refUniqueHint}
              </p>
            </>
          ) : sel.useCustomNumber ? (
            <>
              <Input
                value={customRefDraft}
                onChange={(e) => onCustomRefDraftChange(e.target.value)}
                placeholder={L.refPlaceholder}
                aria-label={L.refPlaceholder}
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
          <Label htmlFor="quote-client-search">Client</Label>
          <SearchableCombobox
            hideLabel
            id="quote-client-search"
            label="Client"
            value={clientId}
            onValueChange={onClientIdChange}
            options={clientOptions}
            placeholder="Rechercher un client…"
            triggerClassName={documentSurface ? documentLineInput : undefined}
            onCreateNew={onOpenQuickClient}
            createNewLabel="Nouveau client"
            allowClearSelection
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
            <Label htmlFor="quote-issue-date">Date d’émission</Label>
            <Input
              id="quote-issue-date"
              type="date"
              className={cn(documentSurface ? documentLineInput : "mt-0")}
              value={issueDate}
              onChange={(e) => onIssueDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="quote-valid-until-date">Valable jusqu’au</Label>
            <Input
              id="quote-valid-until-date"
              type="date"
              className={cn("w-full", documentSurface && documentLineInput)}
              value={validUntil}
              onChange={(e) => onValidUntilChange(e.target.value)}
              aria-label={L.validUntilAria}
            />
          </div>
        </div>
      </div>

      {projectsModuleActive ? (
        <div className={cn(documentSurface ? "space-y-2 py-3" : "space-y-2")}>
          <Label htmlFor="quote-project-search">Projet (facultatif)</Label>
          {projectSelectorLocked ? (
            <p
              id="quote-project-search"
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
              id="quote-project-search"
              label="Projet"
              value={projectId}
              onValueChange={onProjectIdChange}
              options={projectOptions}
              placeholder="Rechercher un projet…"
              triggerClassName={documentSurface ? documentLineInput : undefined}
              allowClearSelection
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
