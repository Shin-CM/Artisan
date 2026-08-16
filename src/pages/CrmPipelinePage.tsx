import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FolderKanban, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { DocumentModulePageGate } from "@/components/DocumentModulePageGate";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { makeCurrencyFormatter } from "@/pages/documentEditor/currency";
import { orderedProjectComboboxOptions } from "@/pages/projects/projectUtils";

const PIPELINE: { id: api.CrmOpportunityStage; label: string }[] = [
  { id: "lead", label: "Piste" },
  { id: "qualified", label: "Qualifié" },
  { id: "proposal", label: "Proposition" },
  { id: "won", label: "Gagné" },
  { id: "lost", label: "Perdu" },
];

function columnDroppableId(stage: string) {
  return `column-${stage}`;
}

function resolveDropStage(
  overId: string | number | undefined | null,
  opps: api.CrmOpportunity[],
): string | null {
  if (overId == null) return null;
  const s = String(overId);
  if (s.startsWith("column-")) return s.slice("column-".length);
  const hit = opps.find((o) => o.id === s);
  return hit?.stage ?? null;
}

function maxSortInStage(
  opps: api.CrmOpportunity[],
  stage: string,
  excludeId?: string,
): number {
  let m = 0;
  for (const o of opps) {
    if (o.id === excludeId) continue;
    if (o.stage === stage) m = Math.max(m, o.sortOrder);
  }
  return m;
}

function opportunityToInput(
  o: api.CrmOpportunity,
): api.CrmOpportunityInput {
  return {
    title: o.title,
    clientId: o.clientId,
    quoteId: o.quoteId,
    projectId: o.projectId ?? null,
    stage: o.stage,
    amountEstimate: o.amountEstimate,
    nextAction: o.nextAction,
    notes: o.notes,
    sortOrder: o.sortOrder,
  };
}

function OpportunityCardFace({
  opp,
  clientName,
  quoteRef,
  projectLabel,
  fmt,
  dragHandle,
  actionsSlot,
}: {
  opp: api.CrmOpportunity;
  clientName: string;
  quoteRef: string;
  projectLabel?: string;
  fmt: (n: number) => string;
  dragHandle: React.ReactNode;
  actionsSlot: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-1">
      {dragHandle}
      <div className="min-w-0 grow">
        <p className="font-medium leading-tight">{opp.title}</p>
        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
          {clientName}
        </p>
        {opp.amountEstimate != null && opp.amountEstimate > 0 ? (
          <p className="mt-1 text-xs tabular-nums text-[var(--color-foreground)]">
            {fmt(opp.amountEstimate)}
          </p>
        ) : null}
        {opp.nextAction?.trim() ? (
          <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted-foreground)]">
            {opp.nextAction.trim()}
          </p>
        ) : null}
        {opp.quoteId ? (
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Devis {quoteRef}
          </p>
        ) : null}
        {projectLabel?.trim() ? (
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Projet {projectLabel.trim()}
          </p>
        ) : null}
      </div>
      {actionsSlot}
    </div>
  );
}

function DraggableCard({
  opp,
  clientName,
  quoteRef,
  projectLabel,
  fmt,
  onEdit,
  onDelete,
  showCreateProject,
  onCreateProject,
}: {
  opp: api.CrmOpportunity;
  clientName: string;
  quoteRef: string;
  projectLabel?: string;
  fmt: (n: number) => string;
  onEdit: () => void;
  onDelete: () => void;
  showCreateProject?: boolean;
  onCreateProject?: (o: api.CrmOpportunity) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: opp.id,
      data: { opp },
    });
  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-2 w-full min-w-0 max-w-full shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-2 text-sm shadow-sm",
        isDragging && "opacity-0",
      )}
    >
      <OpportunityCardFace
        opp={opp}
        clientName={clientName}
        quoteRef={quoteRef}
        projectLabel={projectLabel}
        fmt={fmt}
        dragHandle={
          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab touch-none text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            aria-label="Glisser"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
        actionsSlot={
          <div className="flex shrink-0 flex-col gap-0.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={onEdit}
              aria-label="Modifier"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {showCreateProject && onCreateProject && !opp.projectId ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => onCreateProject(opp)}
                aria-label="Créer un projet"
                title="Créer un projet"
              >
                <FolderKanban className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              onClick={onDelete}
              aria-label="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      />
    </div>
  );
}

function KanbanColumn({
  stageId,
  label,
  children,
}: {
  stageId: string;
  label: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(stageId),
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative z-0 flex w-[14rem] shrink-0 flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/15 p-2",
        isOver &&
          "z-20 ring-2 ring-inset ring-[var(--color-ring)]",
      )}
    >
      <h3 className="mb-2 border-b border-[var(--color-border)] pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </h3>
      <div className="flex min-h-[12rem] flex-1 flex-col">{children}</div>
    </div>
  );
}

function CrmPipelinePageContent() {
  const { active } = useWorkspace();
  const { projectsEnabled } = useDocumentModules();
  const [rows, setRows] = React.useState<api.CrmOpportunity[]>([]);
  const [clients, setClients] = React.useState<api.Client[]>([]);
  const [quotes, setQuotes] = React.useState<api.Quote[]>([]);
  const [projects, setProjects] = React.useState<api.Project[]>([]);
  const [activeDrag, setActiveDrag] = React.useState<api.CrmOpportunity | null>(
    null,
  );
  /** Taille figée au pointerdown pour que le clone ne s’étire pas (h-full / mesure overlay). */
  const [dragOverlayBox, setDragOverlayBox] = React.useState<{
    width: number;
    height: number;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<api.CrmOpportunity | null>(null);
  const [formTitle, setFormTitle] = React.useState("");
  const [formClientId, setFormClientId] = React.useState("");
  const [formQuoteId, setFormQuoteId] = React.useState("");
  const [formStage, setFormStage] =
    React.useState<api.CrmOpportunityStage>("lead");
  const [formAmount, setFormAmount] = React.useState("");
  const [formNext, setFormNext] = React.useState("");
  const [formNotes, setFormNotes] = React.useState("");
  const [formProjectId, setFormProjectId] = React.useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const currency = active?.baseCurrency ?? "EUR";
  const fmt = React.useMemo(() => makeCurrencyFormatter(currency), [currency]);

  const load = React.useCallback(async () => {
    if (!active) return;
    const projP = projectsEnabled
      ? api.listProjects(active.id)
      : Promise.resolve([] as api.Project[]);
    const [r, c, q, pr] = await Promise.all([
      api.listCrmOpportunities(active.id),
      api.listClients(active.id),
      api.listQuotes(active.id),
      projP,
    ]);
    setRows(r);
    setClients(c);
    setQuotes(q.filter((x) => !x.archived));
    setProjects(pr);
  }, [active, projectsEnabled]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const clientById = React.useMemo(() => {
    const m = new Map<string, api.Client>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  const quoteById = React.useMemo(() => {
    const m = new Map<string, api.Quote>();
    for (const q of quotes) m.set(q.id, q);
    return m;
  }, [quotes]);

  const projectById = React.useMemo(() => {
    const m = new Map<string, api.Project>();
    for (const p of projects) m.set(p.id, p);
    return m;
  }, [projects]);

  const formProjectOptions = React.useMemo(
    () => orderedProjectComboboxOptions(projects, formClientId),
    [projects, formClientId],
  );

  const byStage = React.useMemo(() => {
    const m = new Map<string, api.CrmOpportunity[]>();
    for (const p of PIPELINE) m.set(p.id, []);
    for (const o of rows) {
      const list = m.get(o.stage);
      if (list) list.push(o);
    }
    for (const p of PIPELINE) {
      const list = m.get(p.id)!;
      list.sort((a, b) => a.sortOrder - b.sortOrder || b.updatedAt.localeCompare(a.updatedAt));
    }
    return m;
  }, [rows]);

  function openNew() {
    setEditing(null);
    setFormTitle("");
    setFormClientId("");
    setFormQuoteId("");
    setFormStage("lead");
    setFormAmount("");
    setFormNext("");
    setFormNotes("");
    setFormProjectId("");
    setDialogOpen(true);
  }

  function openEdit(o: api.CrmOpportunity) {
    setEditing(o);
    setFormTitle(o.title);
    setFormClientId(o.clientId ?? "");
    setFormQuoteId(o.quoteId ?? "");
    setFormStage(o.stage as api.CrmOpportunityStage);
    setFormAmount(
      o.amountEstimate != null ? String(o.amountEstimate) : "",
    );
    setFormNext(o.nextAction ?? "");
    setFormNotes(o.notes ?? "");
    setFormProjectId(o.projectId ?? "");
    setDialogOpen(true);
  }

  async function saveForm() {
    if (!active) return;
    const title = formTitle.trim();
    if (!title) {
      toast.error("Indiquez un intitulé.");
      return;
    }
    let amountEstimate: number | null = null;
    if (formAmount.trim()) {
      const n = Number(formAmount.replace(",", "."));
      if (!Number.isFinite(n) || n < 0) {
        toast.error("Montant estimé invalide.");
        return;
      }
      amountEstimate = n;
    }
    const input: api.CrmOpportunityInput = {
      title,
      clientId: formClientId || null,
      quoteId: formQuoteId || null,
      projectId: projectsEnabled
        ? formProjectId.trim() || null
        : editing?.projectId ?? null,
      stage: formStage,
      amountEstimate,
      nextAction: formNext.trim() || null,
      notes: formNotes.trim() || null,
    };
    try {
      if (editing) {
        await api.updateCrmOpportunity(editing.id, {
          ...input,
          sortOrder: editing.sortOrder,
        });
        toast.success("Opportunité enregistrée");
      } else {
        await api.createCrmOpportunity(active.id, input);
        toast.success("Opportunité créée");
      }
      setDialogOpen(false);
      void load();
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function handleDelete(o: api.CrmOpportunity) {
    if (!window.confirm(`Supprimer « ${o.title} » ?`)) return;
    try {
      await api.deleteCrmOpportunity(o.id);
      toast.success("Supprimée");
      void load();
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function createProjectFromOpportunity(opp: api.CrmOpportunity) {
    if (!active || !projectsEnabled) return;
    try {
      const title = opp.title.trim() || "Projet";
      const p = await api.createProject(active.id, {
        name: title,
        status: "active",
        clientId: opp.clientId,
        budgetEstimate:
          opp.amountEstimate != null && opp.amountEstimate > 0
            ? opp.amountEstimate
            : null,
        notes: opp.notes?.trim()
          ? `Créé depuis l’opportunité CRM.\n${opp.notes}`
          : "Créé depuis l’opportunité CRM.",
      });
      await api.updateCrmOpportunity(opp.id, {
        ...opportunityToInput(opp),
        projectId: p.id,
      });
      toast.success("Projet créé et lié à l’opportunité");
      void load();
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function handleDragEnd(ev: DragEndEvent) {
    const { active: a, over } = ev;
    setActiveDrag(null);
    setDragOverlayBox(null);
    if (!over) return;
    const oppId = String(a.id);
    const opp = rows.find((x) => x.id === oppId);
    if (!opp) return;
    const targetStage = resolveDropStage(over.id, rows);
    if (!targetStage || targetStage === opp.stage) return;
    const nextOrder = maxSortInStage(rows, targetStage, oppId) + 1;
    try {
      await api.updateCrmOpportunity(oppId, {
        ...opportunityToInput(opp),
        stage: targetStage,
        sortOrder: nextOrder,
      });
      void load();
    } catch (e) {
      toast.error(String(e));
    }
  }

  function handleDragStart(ev: DragStartEvent) {
    const id = String(ev.active.id);
    const o = rows.find((x) => x.id === id);
    setActiveDrag(o ?? null);
    const r = ev.active.rect.current?.initial;
    if (r && r.width > 0 && r.height > 0) {
      setDragOverlayBox({ width: r.width, height: r.height });
    } else {
      setDragOverlayBox(null);
    }
  }

  function handleDragCancel() {
    setActiveDrag(null);
    setDragOverlayBox(null);
  }

  if (!active) return null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden pl-1 pr-2 sm:pl-2 sm:pr-3">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <PageTitleWithInfo description="Opportunités par étape — glisser-déposer pour changer de colonne.">
            <h1 className="text-xl font-semibold">Pipeline CRM</h1>
          </PageTitleWithInfo>
        </div>
        <Button type="button" size="sm" className="gap-1" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Nouvelle opportunité
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={(e) => void handleDragEnd(e)}
      >
        <div className="relative isolate z-[1] flex min-h-0 flex-1 gap-4 overflow-x-auto scroll-py-2 scroll-pl-2 pb-3 pl-2 pt-1">
          {PIPELINE.map((col) => (
            <KanbanColumn key={col.id} stageId={col.id} label={col.label}>
              {(byStage.get(col.id) ?? []).map((opp) => (
                <DraggableCard
                  key={opp.id}
                  opp={opp}
                  clientName={
                    (opp.clientId && clientById.get(opp.clientId)?.name) || "—"
                  }
                  quoteRef={
                    opp.quoteId
                      ? quoteById.get(opp.quoteId)?.number ?? opp.quoteId
                      : ""
                  }
                  projectLabel={
                    opp.projectId
                      ? (() => {
                          const p = projectById.get(opp.projectId!);
                          if (!p) return undefined;
                          const code = p.code?.trim();
                          return code ? `${p.name} (${code})` : p.name;
                        })()
                      : undefined
                  }
                  fmt={fmt}
                  onEdit={() => openEdit(opp)}
                  onDelete={() => void handleDelete(opp)}
                  showCreateProject={col.id === "won" && projectsEnabled}
                  onCreateProject={
                    col.id === "won" && projectsEnabled
                      ? createProjectFromOpportunity
                      : undefined
                  }
                />
              ))}
            </KanbanColumn>
          ))}
        </div>
        <DragOverlay
          dropAnimation={null}
          className="box-border overflow-hidden"
        >
          {activeDrag ? (
            <div
              className={cn(
                "box-border min-w-0 cursor-grabbing overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-2 text-sm shadow-sm",
                "pointer-events-none",
                !dragOverlayBox && "w-full max-w-full",
              )}
              style={
                dragOverlayBox
                  ? {
                      width: dragOverlayBox.width,
                      height: dragOverlayBox.height,
                      boxSizing: "border-box",
                    }
                  : undefined
              }
            >
              <OpportunityCardFace
                opp={activeDrag}
                clientName={
                  (activeDrag.clientId &&
                    clientById.get(activeDrag.clientId)?.name) ||
                  "—"
                }
                quoteRef={
                  activeDrag.quoteId
                    ? quoteById.get(activeDrag.quoteId)?.number ??
                      activeDrag.quoteId
                    : ""
                }
                projectLabel={
                  activeDrag.projectId
                    ? (() => {
                        const p = projectById.get(activeDrag.projectId!);
                        if (!p) return undefined;
                        const code = p.code?.trim();
                        return code ? `${p.name} (${code})` : p.name;
                      })()
                    : undefined
                }
                fmt={fmt}
                dragHandle={
                  <span
                    className="mt-0.5 shrink-0 text-[var(--color-muted-foreground)]"
                    aria-hidden
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                }
                actionsSlot={
                  <div
                    className="flex w-7 shrink-0 flex-col gap-0.5"
                    aria-hidden
                  >
                    <div className="size-7 shrink-0" />
                    <div className="size-7 shrink-0" />
                  </div>
                }
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier l’opportunité" : "Nouvelle opportunité"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <div className="space-y-1">
              <Label htmlFor="crm-title">Intitulé</Label>
              <Input
                id="crm-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex. Appel d’offres mairie"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="crm-stage">Étape</Label>
              <select
                id="crm-stage"
                className="flex h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm"
                value={formStage}
                onChange={(e) =>
                  setFormStage(e.target.value as api.CrmOpportunityStage)
                }
              >
                {PIPELINE.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="crm-client">Client</Label>
              <select
                id="crm-client"
                className="flex h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm"
                value={formClientId}
                onChange={(e) => setFormClientId(e.target.value)}
              >
                <option value="">—</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="crm-quote">Devis lié (optionnel)</Label>
              <select
                id="crm-quote"
                className="flex h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm"
                value={formQuoteId}
                onChange={(e) => setFormQuoteId(e.target.value)}
              >
                <option value="">—</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.number}
                    {q.title?.trim() ? ` — ${q.title.trim().slice(0, 40)}` : ""}
                  </option>
                ))}
              </select>
            </div>
            {projectsEnabled ? (
              <div className="space-y-1">
                <SearchableCombobox
                  id="crm-project"
                  label="Projet (facultatif)"
                  value={formProjectId}
                  onValueChange={setFormProjectId}
                  options={formProjectOptions}
                  placeholder="Rechercher un projet…"
                  allowClearSelection
                />
              </div>
            ) : null}
            <div className="space-y-1">
              <Label htmlFor="crm-amt">Montant estimé TTC ({currency})</Label>
              <Input
                id="crm-amt"
                inputMode="decimal"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="crm-next">Prochaine action</Label>
              <Input
                id="crm-next"
                value={formNext}
                onChange={(e) => setFormNext(e.target.value)}
                placeholder="Ex. Relancer mardi"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="crm-notes">Notes</Label>
              <textarea
                id="crm-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="min-h-[4rem] w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="button" onClick={() => void saveForm()}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CrmPipelinePage() {
  const { loading, crmPipelineEnabled } = useDocumentModules();
  return (
    <DocumentModulePageGate
      loading={loading}
      enabled={crmPipelineEnabled}
      redirectTo="/marketplace/clients"
      redirectToast="Activez « Pipeline CRM » dans Marketplace (onglet Clients)."
    >
      <CrmPipelinePageContent />
    </DocumentModulePageGate>
  );
}
