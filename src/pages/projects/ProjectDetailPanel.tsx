import * as React from "react";
import { Link } from "react-router-dom";
import { Clock, ExternalLink, Plus, Trash2 } from "lucide-react";
import type { Workspace } from "@/lib/api";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import type {
  Client,
  Project,
  ProjectDocument,
  ProjectFinancialSummary,
  ProjectLinkCounts,
  ProjectTimeEntry,
  ProjectTimeInvoiceLineOption,
  ProjectTimeInvoiceSummary,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { ProjectNewDocumentDialog } from "@/pages/projects/ProjectNewDocumentDialog";
import { documentKindLabel } from "@/pages/projects/projectUtils";
import { makeCurrencyFormatter } from "@/pages/documentEditor/currency";
import { ProjectDetailSettingsForm } from "@/pages/projects/ProjectDetailSettingsForm";
import {
  buildTimelineRows,
  docOpenPath,
  formatIsoDateShort,
  netInvoiced,
} from "@/pages/projects/projectDetailHelpers";


export function ProjectDetailPanel({
  workspace,
  project,
  clients,
  baseCurrency,
  documents,
  loadingDocs,
  financialSummary,
  loadingFinancial,
  timeEntries,
  loadingTimeEntries,
  onSaved,
  onDeleted,
  onLinkedDocumentCreated,
  onTimeEntriesChanged,
  /** `full` : formulaire + blocs ; `overview` : synthèse, temps, docs ; `settings` : formulaire seul. */
  panelMode = "full",
  /** Si défini, les liens « Ouvrir » pointent vers le shell projet. */
  documentLinkProjectId = null,
}: {
  workspace: Workspace | null;
  project: Project | null;
  clients: Client[];
  baseCurrency: string;
  documents: ProjectDocument[];
  loadingDocs: boolean;
  financialSummary: ProjectFinancialSummary | null;
  loadingFinancial: boolean;
  timeEntries: ProjectTimeEntry[];
  loadingTimeEntries: boolean;
  onSaved: (p: Project) => void;
  onDeleted: () => void;
  onLinkedDocumentCreated: () => void;
  onTimeEntriesChanged: () => void;
  panelMode?: "full" | "overview" | "settings";
  documentLinkProjectId?: string | null;
}) {
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [status, setStatus] = React.useState<string>("draft");
  const [clientId, setClientId] = React.useState<string>("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const { purchaseOrdersEnabled, projectsEnabled } = useDocumentModules();
  const [newDocDialogOpen, setNewDocDialogOpen] = React.useState(false);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [linkCounts, setLinkCounts] = React.useState<ProjectLinkCounts | null>(
    null,
  );
  const [loadingDeleteInfo, setLoadingDeleteInfo] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const fmtMoney = React.useMemo(
    () => makeCurrencyFormatter(baseCurrency),
    [baseCurrency],
  );

  const [teDate, setTeDate] = React.useState("");
  const [teHours, setTeHours] = React.useState("");
  const [teDesc, setTeDesc] = React.useState("");
  const [teBillable, setTeBillable] = React.useState(true);
  const [teInvoiceId, setTeInvoiceId] = React.useState("");
  const [teInvoiceLineId, setTeInvoiceLineId] = React.useState("");
  const [teInvoices, setTeInvoices] = React.useState<ProjectTimeInvoiceSummary[]>(
    [],
  );
  const [teInvoiceLines, setTeInvoiceLines] = React.useState<
    ProjectTimeInvoiceLineOption[]
  >([]);
  const [loadingTeInvoices, setLoadingTeInvoices] = React.useState(false);
  const [loadingTeLines, setLoadingTeLines] = React.useState(false);
  const [teSaving, setTeSaving] = React.useState(false);

  React.useEffect(() => {
    if (!project) {
      setName("");
      setCode("");
      setStatus("draft");
      setClientId("");
      setStartDate("");
      setEndDate("");
      setBudget("");
      setNotes("");
      return;
    }
    setName(project.name);
    setCode(project.code ?? "");
    setStatus(project.status);
    setClientId(project.clientId ?? "");
    setStartDate(project.startDate ?? "");
    setEndDate(project.endDate ?? "");
    setBudget(
      project.budgetEstimate != null ? String(project.budgetEstimate) : "",
    );
    setNotes(project.notes ?? "");
    const ymd = new Date().toISOString().slice(0, 10);
    setTeDate(ymd);
    setTeInvoiceId("");
    setTeInvoiceLineId("");
  }, [project]);

  React.useEffect(() => {
    if (!project?.id) {
      setTeInvoices([]);
      return;
    }
    let cancelled = false;
    setLoadingTeInvoices(true);
    void api
      .listInvoicesForProjectTime(project.id)
      .then((list) => {
        if (!cancelled) setTeInvoices(list);
      })
      .catch((e) => {
        if (!cancelled) {
          setTeInvoices([]);
          toast.error(String(e));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTeInvoices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  React.useEffect(() => {
    if (!project?.id || !teInvoiceId.trim()) {
      setTeInvoiceLines([]);
      setTeInvoiceLineId("");
      return;
    }
    let cancelled = false;
    setLoadingTeLines(true);
    void api
      .listInvoiceLinesForProjectTime(project.id, teInvoiceId.trim())
      .then((list) => {
        if (!cancelled) setTeInvoiceLines(list);
      })
      .catch((e) => {
        if (!cancelled) {
          setTeInvoiceLines([]);
          toast.error(String(e));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTeLines(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project?.id, teInvoiceId]);

  async function save() {
    if (!project) return;
    setSaving(true);
    try {
      const budgetEstimate =
        budget.trim() === "" ? null : Number.parseFloat(budget.replace(",", "."));
      const input: api.ProjectInput = {
        name: name.trim(),
        code: code.trim() || null,
        status,
        clientId: clientId.trim() || null,
        startDate: startDate.trim() || null,
        endDate: endDate.trim() || null,
        budgetEstimate:
          budgetEstimate != null && Number.isFinite(budgetEstimate)
            ? budgetEstimate
            : null,
        notes: notes.trim() || null,
      };
      if (!input.name) {
        toast.error("Le nom du projet est obligatoire.");
        return;
      }
      const next = await api.updateProject(project.id, input);
      onSaved(next);
      toast.success("Projet enregistré");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function openDeleteDialog() {
    if (!project) return;
    setDeleteOpen(true);
    setLinkCounts(null);
    setLoadingDeleteInfo(true);
    try {
      const c = await api.countProjectLinks(project.id);
      setLinkCounts(c);
    } catch (e) {
      toast.error(String(e));
      setDeleteOpen(false);
    } finally {
      setLoadingDeleteInfo(false);
    }
  }

  async function confirmDelete() {
    if (!project) return;
    setDeleting(true);
    try {
      await api.deleteProject(project.id);
      toast.success("Projet supprimé");
      setDeleteOpen(false);
      onDeleted();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setDeleting(false);
    }
  }

  async function addTimeEntry() {
    if (!project) return;
    const h = Number.parseFloat(teHours.replace(",", "."));
    if (!Number.isFinite(h) || h <= 0) {
      toast.error("Indiquez une durée en heures (ex. 1 ou 1,5).");
      return;
    }
    const durationMinutes = Math.max(1, Math.round(h * 60));
    if (teInvoiceId.trim() && !teInvoiceLineId.trim()) {
      toast.error(
        "Choisissez une ligne de facture à l’heure, ou retirez la facture sélectionnée.",
      );
      return;
    }
    const lineToSave = teInvoiceLineId.trim() || null;
    setTeSaving(true);
    try {
      await api.createProjectTimeEntry(project.id, {
        workDate: teDate.trim(),
        durationMinutes,
        description: teDesc.trim() || null,
        billable: teBillable,
        invoiceLineId: lineToSave,
      });
      toast.success("Temps enregistré");
      setTeDesc("");
      setTeInvoiceId("");
      setTeInvoiceLineId("");
      onTimeEntriesChanged();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setTeSaving(false);
    }
  }

  async function removeTimeEntry(id: string) {
    if (!window.confirm("Supprimer cette entrée de temps ?")) return;
    try {
      await api.deleteProjectTimeEntry(id);
      toast.success("Entrée supprimée");
      onTimeEntriesChanged();
    } catch (e) {
      toast.error(String(e));
    }
  }

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const teInvoiceComboboxOptions = teInvoices.map((inv) => ({
    value: inv.id,
    label: `${inv.number} — ${formatIsoDateShort(inv.issueDate)} (${inv.status})`,
  }));

  const teLineComboboxOptions = teInvoiceLines.map((l) => ({
    value: l.id,
    label: l.description.trim() || "Ligne sans libellé",
  }));

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-[var(--color-muted-foreground)]">
        Sélectionnez un projet ou créez-en un.
      </div>
    );
  }

  const timelineRows = buildTimelineRows(project, documents);
  const budgetVal = financialSummary?.budgetEstimate;
  const net = financialSummary ? netInvoiced(financialSummary) : 0;
  const overBudget =
    budgetVal != null &&
    Number.isFinite(budgetVal) &&
    net > budgetVal + 1e-6;

  const totalLinks = linkCounts
    ? linkCounts.quotes +
      linkCounts.invoices +
      linkCounts.creditNotes +
      linkCounts.purchaseOrders +
      linkCounts.crmOpportunities
    : 0;

  const showSettingsBlock = panelMode !== "overview";
  const showOverviewBlocks = panelMode !== "settings";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold">
            {panelMode === "overview"
              ? "Tableau de bord"
              : panelMode === "settings"
                ? "Fiche projet"
                : "Projet"}
          </h1>
          {showSettingsBlock ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1 text-destructive"
                onClick={() => void openDeleteDialog()}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Supprimer
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={() => void save()}
              >
                Enregistrer
              </Button>
            </div>
          ) : null}
        </div>

        {showSettingsBlock ? (
        <ProjectDetailSettingsForm
          name={name}
          onNameChange={setName}
          code={code}
          onCodeChange={setCode}
          status={status}
          onStatusChange={setStatus}
          clientId={clientId}
          onClientIdChange={setClientId}
          clientOptions={clientOptions}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          budget={budget}
          onBudgetChange={setBudget}
          notes={notes}
          onNotesChange={setNotes}
        />
        ) : null}

        {showOverviewBlocks ? (
        <>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-4">
          <h2 className="mb-2 text-sm font-medium">Synthèse financière</h2>
          <p className="mb-3 text-[10px] leading-snug text-[var(--color-muted-foreground)]">
            Montants TTC agrégés, documents non archivés uniquement. Factures
            classiques et avoirs sont séparés ; le « net facturé » = factures −
            avoirs. Les devis pris en compte sont ceux au statut accepté.
          </p>
          {loadingFinancial ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Chargement…
            </p>
          ) : financialSummary ? (
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-2 border-b border-[var(--color-border)] pb-1 sm:col-span-2">
                <dt className="text-[var(--color-muted-foreground)]">
                  Budget estimé (HT)
                </dt>
                <dd className="tabular-nums font-medium">
                  {financialSummary.budgetEstimate != null
                    ? fmtMoney(financialSummary.budgetEstimate)
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--color-muted-foreground)]">
                  Facturé (TTC)
                </dt>
                <dd className="tabular-nums">
                  {fmtMoney(financialSummary.invoicedTotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--color-muted-foreground)]">
                  Avoirs (TTC)
                </dt>
                <dd className="tabular-nums">
                  {fmtMoney(financialSummary.creditNotesTotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:col-span-2">
                <dt className="text-[var(--color-muted-foreground)]">
                  Net facturé (TTC)
                </dt>
                <dd
                  className={cn(
                    "tabular-nums font-medium",
                    overBudget && "text-destructive",
                  )}
                >
                  {fmtMoney(net)}
                  {overBudget ? " — au-dessus du budget HT indiqué" : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--color-muted-foreground)]">
                  Devis acceptés (TTC)
                </dt>
                <dd className="tabular-nums">
                  {fmtMoney(financialSummary.quotesAcceptedTotal)}
                </dd>
              </div>
              {purchaseOrdersEnabled ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--color-muted-foreground)]">
                    Bons de commande (TTC)
                  </dt>
                  <dd className="tabular-nums">
                    {fmtMoney(financialSummary.purchaseOrdersTotal)}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">—</p>
          )}
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 opacity-70" aria-hidden />
            Temps passé
          </h2>
          <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">
            Saisie manuelle (durée en heures). Vous pouvez lier l’entrée à une
            ligne de facture en mode « à l’heure » (factures non payées, non
            archivées, rattachées à ce projet).
          </p>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="te-date">Date</Label>
              <Input
                id="te-date"
                type="date"
                value={teDate}
                onChange={(e) => setTeDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="te-hours">Durée (h)</Label>
              <Input
                id="te-hours"
                inputMode="decimal"
                value={teHours}
                onChange={(e) => setTeHours(e.target.value)}
                placeholder="ex. 1,5"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="te-desc">Description</Label>
              <Input
                id="te-desc"
                value={teDesc}
                onChange={(e) => setTeDesc(e.target.value)}
                placeholder="Optionnel"
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="te-bill"
                type="checkbox"
                className="h-4 w-4 rounded border border-[var(--color-input)]"
                checked={teBillable}
                onChange={(e) => setTeBillable(e.target.checked)}
              />
              <Label htmlFor="te-bill" className="font-normal">
                Facturable
              </Label>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="te-inv">Facture (optionnel)</Label>
              <SearchableCombobox
                id="te-inv"
                label="Facture (optionnel)"
                hideLabel
                value={teInvoiceId}
                onValueChange={(v) => {
                  setTeInvoiceId(v);
                  setTeInvoiceLineId("");
                }}
                options={teInvoiceComboboxOptions}
                placeholder={
                  loadingTeInvoices
                    ? "Chargement des factures…"
                    : teInvoiceComboboxOptions.length === 0
                      ? "Aucune facture éligible"
                      : "Choisir une facture…"
                }
                disabled={loadingTeInvoices}
                allowClearSelection
                triggerClassName="w-full"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="te-inv-line">Ligne à l’heure (optionnel)</Label>
              <SearchableCombobox
                id="te-inv-line"
                label="Ligne à l’heure (optionnel)"
                hideLabel
                value={teInvoiceLineId}
                onValueChange={setTeInvoiceLineId}
                options={teLineComboboxOptions}
                placeholder={
                  !teInvoiceId.trim()
                    ? "Sélectionnez d’abord une facture"
                    : loadingTeLines
                      ? "Chargement des lignes…"
                      : teLineComboboxOptions.length === 0
                        ? "Aucune ligne à l’heure sur cette facture"
                        : "Choisir une ligne…"
                }
                disabled={!teInvoiceId.trim() || loadingTeLines}
                allowClearSelection
                triggerClassName="w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                type="button"
                size="sm"
                disabled={teSaving}
                onClick={() => void addTimeEntry()}
              >
                Ajouter l’entrée
              </Button>
            </div>
          </div>
          {loadingTimeEntries ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Chargement…
            </p>
          ) : timeEntries.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Aucune entrée de temps.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {timeEntries.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded border border-[var(--color-border)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <span className="font-medium">
                      {formatIsoDateShort(e.workDate)}
                    </span>
                    <span className="text-[var(--color-muted-foreground)]">
                      {" "}
                      — {(e.durationMinutes / 60).toLocaleString("fr-FR", {
                        maximumFractionDigits: 2,
                      })}{" "}
                      h
                      {e.billable ? "" : " (non fact.)"}
                    </span>
                    {e.description?.trim() ? (
                      <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                        {e.description.trim()}
                      </p>
                    ) : null}
                    {e.invoiceNumber?.trim() && e.invoiceLineLabel?.trim() ? (
                      <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                        Facture {e.invoiceNumber.trim()} —{" "}
                        {e.invoiceLineLabel.trim()}
                      </p>
                    ) : e.invoiceLineId?.trim() ? (
                      <p className="mt-0.5 font-mono text-[10px] text-[var(--color-muted-foreground)]">
                        Ligne facture : {e.invoiceLineId.trim()}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive"
                    onClick={() => void removeTimeEntry(e.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-4">
          <h2 className="mb-2 text-sm font-medium">Nouveau document lié</h2>
          <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">
            Créez un devis, une facture ou un bon de commande déjà rattaché à ce
            projet (brouillon enregistré tout de suite).
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setNewDocDialogOpen(true)}
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Ajouter un document…
          </Button>
          <ProjectNewDocumentDialog
            open={newDocDialogOpen}
            onOpenChange={setNewDocDialogOpen}
            workspace={workspace}
            project={project}
            projectsEnabled={projectsEnabled}
            purchaseOrdersEnabled={purchaseOrdersEnabled}
            onCreated={onLinkedDocumentCreated}
            shellProjectId={documentLinkProjectId}
          />
        </div>

        <div className="border-t border-[var(--color-border)] pt-6">
          <h2 className="mb-3 text-sm font-medium">Chronologie</h2>
          {timelineRows.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Aucun événement à afficher.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm text-[var(--color-foreground)]">
              {timelineRows.map((r, i) => (
                <li
                  key={`${r.sortKey}-${i}`}
                  className="border-l-2 border-[var(--color-border)] pl-3"
                >
                  {r.line}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[var(--color-border)] pt-6">
          <h2 className="mb-3 text-sm font-medium">Documents liés</h2>
          {loadingDocs ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Chargement…
            </p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Aucun devis, facture ou bon de commande n’est rattaché à ce projet.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {documents.map((d) => (
                <li
                  key={`${d.documentKind}-${d.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--color-border)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <span className="font-medium">{d.number}</span>
                    <span className="text-[var(--color-muted-foreground)]">
                      {" "}
                      — {documentKindLabel(d.documentKind)}
                      {d.archived ? " (archivé)" : ""}
                    </span>
                    {d.issueDate ? (
                      <span className="block text-xs text-[var(--color-muted-foreground)]">
                        {formatIsoDateShort(d.issueDate)}
                      </span>
                    ) : null}
                  </div>
                  <Button type="button" variant="ghost" size="sm" asChild>
                    <Link to={docOpenPath(d, documentLinkProjectId)} className="gap-1">
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      Ouvrir
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        </>
        ) : null}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le projet ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Les liens vers ce projet seront retirés des documents et
            opportunités ; les enregistrements ne sont pas supprimés.
          </p>
          {loadingDeleteInfo ? (
            <p className="text-sm">Chargement des liens…</p>
          ) : linkCounts ? (
            <ul className="list-inside list-disc text-sm">
              <li>Devis : {linkCounts.quotes}</li>
              <li>Factures : {linkCounts.invoices}</li>
              <li>Avoirs : {linkCounts.creditNotes}</li>
              {purchaseOrdersEnabled ? (
                <li>Bons de commande : {linkCounts.purchaseOrders}</li>
              ) : null}
              <li>Opportunités CRM : {linkCounts.crmOpportunities}</li>
            </ul>
          ) : null}
          {linkCounts && totalLinks === 0 ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Aucun document ni opportunité ne référence ce projet.
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting || loadingDeleteInfo}
              onClick={() => void confirmDelete()}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
