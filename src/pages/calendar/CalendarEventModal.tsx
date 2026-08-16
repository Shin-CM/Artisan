import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import { cn } from "@/lib/utils";
import * as api from "@/lib/api";
import {
  NEUTRAL_PALETTE_KEYS,
  neutralPaletteClasses,
  type NeutralColorKey,
} from "@/lib/calendarEvents";

export type CalendarEventModalMode = "create" | "edit";

export type CalendarEventDraft = {
  id?: string;
  title: string;
  note: string;
  startDate: string;
  endDate: string;
  colorKey: NeutralColorKey | null;
  colorHex: string | null;
  clientId: string | null;
  projectId: string | null;
  invoiceId: string | null;
};

export function emptyDraft(start: string, end?: string): CalendarEventDraft {
  return {
    title: "",
    note: "",
    startDate: start,
    endDate: end ?? start,
    colorKey: "neutral",
    colorHex: null,
    clientId: null,
    projectId: null,
    invoiceId: null,
  };
}

export function draftFromEvent(c: api.CalendarEvent): CalendarEventDraft {
  const fallback = (NEUTRAL_PALETTE_KEYS as readonly string[]).includes(
    c.colorKey ?? "",
  )
    ? (c.colorKey as NeutralColorKey)
    : null;
  return {
    id: c.id,
    title: c.title,
    note: c.note ?? "",
    startDate: c.startDate,
    endDate: c.endDate,
    colorKey: fallback ?? (c.colorHex ? null : "neutral"),
    colorHex: c.colorHex ?? null,
    clientId: c.clientId,
    projectId: c.projectId,
    invoiceId: c.invoiceId,
  };
}

export function CalendarEventModal({
  open,
  mode,
  draft,
  onDraftChange,
  workspaceId,
  projectsEnabled,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  mode: CalendarEventModalMode;
  draft: CalendarEventDraft;
  onDraftChange: (next: CalendarEventDraft) => void;
  workspaceId: string;
  projectsEnabled: boolean;
  onClose: () => void;
  onSaved: (saved: api.CalendarEvent) => void;
  onDeleted?: (id: string) => void;
}) {
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [clients, setClients] = React.useState<api.Client[]>([]);
  const [projects, setProjects] = React.useState<api.Project[]>([]);
  const [invoices, setInvoices] = React.useState<api.Invoice[]>([]);
  const [loadingLinks, setLoadingLinks] = React.useState(false);
  const [linksOpen, setLinksOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLinksOpen(
      Boolean(draft.clientId || draft.projectId || draft.invoiceId),
    );
  }, [open, draft.clientId, draft.projectId, draft.invoiceId]);

  React.useEffect(() => {
    if (!open || !workspaceId) return;
    let cancelled = false;
    setLoadingLinks(true);
    void Promise.all([
      api.listClients(workspaceId).catch(() => [] as api.Client[]),
      projectsEnabled
        ? api.listProjects(workspaceId).catch(() => [] as api.Project[])
        : Promise.resolve([] as api.Project[]),
      api.listInvoices(workspaceId).catch(() => [] as api.Invoice[]),
    ]).then(([c, p, i]) => {
      if (cancelled) return;
      setClients(c);
      setProjects(p);
      setInvoices(i.filter((inv) => (inv.documentKind ?? "invoice") === "invoice"));
      setLoadingLinks(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, workspaceId, projectsEnabled]);

  const clientOptions = React.useMemo(
    () =>
      [{ value: "", label: "— Aucun client —" }].concat(
        clients.map((c) => ({ value: c.id, label: c.name })),
      ),
    [clients],
  );
  const projectOptions = React.useMemo(
    () =>
      [{ value: "", label: "— Aucun projet —" }].concat(
        projects.map((p) => ({
          value: p.id,
          label: p.code ? `${p.code} — ${p.name}` : p.name,
        })),
      ),
    [projects],
  );
  const invoiceOptions = React.useMemo(
    () =>
      [{ value: "", label: "— Aucune facture —" }].concat(
        invoices.map((i) => ({
          value: i.id,
          label: `Facture ${i.number}`,
        })),
      ),
    [invoices],
  );

  const dateError =
    draft.endDate < draft.startDate
      ? "La date de fin doit être >= à la date de début."
      : null;
  const titleError = !draft.title.trim() ? "Le titre est obligatoire." : null;
  const hexError =
    draft.colorHex && !/^#[0-9A-Fa-f]{6}$/.test(draft.colorHex)
      ? "Couleur hexadécimale invalide (#RRGGBB attendu)."
      : null;
  const formError = titleError ?? dateError ?? hexError;

  function patch(partial: Partial<CalendarEventDraft>) {
    onDraftChange({ ...draft, ...partial });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formError) {
      toast.error(formError);
      return;
    }
    const input: api.CalendarEventInput = {
      title: draft.title.trim(),
      note: draft.note.trim() || null,
      startDate: draft.startDate,
      endDate: draft.endDate,
      colorKey: draft.colorHex ? null : draft.colorKey,
      colorHex: draft.colorHex,
      clientId: draft.clientId,
      projectId: draft.projectId,
      invoiceId: draft.invoiceId,
    };
    setSaving(true);
    try {
      const saved =
        mode === "create"
          ? await api.createCalendarEvent(workspaceId, input)
          : await api.updateCalendarEvent(draft.id!, input);
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!draft.id || !onDeleted) return;
    setDeleting(true);
    try {
      const snapshot = await api.getCalendarEvent(draft.id);
      await api.deleteCalendarEvent(draft.id);
      toast.success("Événement supprimé.", {
        action: {
          label: "Annuler",
          onClick: () => {
            void api
              .createCalendarEvent(snapshot.workspaceId, {
                title: snapshot.title,
                note: snapshot.note,
                startDate: snapshot.startDate,
                endDate: snapshot.endDate,
                colorKey: snapshot.colorKey,
                colorHex: snapshot.colorHex,
                clientId: snapshot.clientId,
                projectId: snapshot.projectId,
                invoiceId: snapshot.invoiceId,
              })
              .then(() => {
                toast.success("Événement restauré.");
                onSaved(snapshot);
              })
              .catch((err) => {
                toast.error(err instanceof Error ? err.message : String(err));
              });
          },
        },
      });
      onDeleted(draft.id);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Nouvel événement"
              : "Modifier l’événement"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cal-evt-title">Titre</Label>
            <Input
              id="cal-evt-title"
              autoFocus
              value={draft.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Réunion, livraison, etc."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cal-evt-start">Début</Label>
              <Input
                id="cal-evt-start"
                type="date"
                value={draft.startDate}
                onChange={(e) => {
                  const next = e.target.value;
                  const end = draft.endDate < next ? next : draft.endDate;
                  patch({ startDate: next, endDate: end });
                }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cal-evt-end">Fin</Label>
              <Input
                id="cal-evt-end"
                type="date"
                value={draft.endDate}
                onChange={(e) => patch({ endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Couleur</Label>
            <div className="flex flex-wrap items-center gap-2">
              {NEUTRAL_PALETTE_KEYS.map((key) => {
                const palette = neutralPaletteClasses(key);
                const active = draft.colorKey === key && !draft.colorHex;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => patch({ colorKey: key, colorHex: null })}
                    aria-pressed={active}
                    title={key}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs transition-colors",
                      palette.chip,
                      active ? "ring-2 ring-[var(--color-ring)]" : "opacity-90",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-2.5 w-2.5 rounded-full",
                        palette.dot,
                      )}
                      aria-hidden
                    />
                    {key}
                  </button>
                );
              })}
              <label className="ml-2 inline-flex items-center gap-2 text-xs">
                <span className="text-[var(--color-muted-foreground)]">
                  Personnalisée
                </span>
                <input
                  type="color"
                  value={draft.colorHex ?? "#94a3b8"}
                  onChange={(e) =>
                    patch({
                      colorHex: e.target.value,
                      colorKey: null,
                    })
                  }
                  className="h-7 w-9 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0"
                />
                {draft.colorHex ? (
                  <button
                    type="button"
                    onClick={() =>
                      patch({ colorHex: null, colorKey: "neutral" })
                    }
                    className="text-[11px] text-[var(--color-muted-foreground)] underline-offset-2 hover:underline"
                  >
                    réinitialiser
                  </button>
                ) : null}
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cal-evt-note">Note</Label>
            <textarea
              id="cal-evt-note"
              value={draft.note}
              onChange={(e) => patch({ note: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              placeholder="Informations complémentaires…"
            />
          </div>

          <div className="rounded-md border border-[var(--color-border)] p-2">
            <button
              type="button"
              onClick={() => setLinksOpen((v) => !v)}
              className="flex w-full items-center justify-between text-left text-sm font-medium"
            >
              <span>Liens</span>
              <span className="text-[11px] text-[var(--color-muted-foreground)]">
                {linksOpen ? "Masquer" : "Afficher"}
              </span>
            </button>
            {linksOpen ? (
              <div className="mt-2 space-y-2">
                {loadingLinks ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Chargement…
                  </div>
                ) : (
                  <>
                    <SearchableCombobox
                      id="cal-evt-client"
                      label="Client"
                      value={draft.clientId ?? ""}
                      onValueChange={(v) =>
                        patch({ clientId: v || null })
                      }
                      options={clientOptions}
                      placeholder="Aucun client lié"
                      allowClearSelection
                    />
                    {projectsEnabled ? (
                      <SearchableCombobox
                        id="cal-evt-project"
                        label="Projet"
                        value={draft.projectId ?? ""}
                        onValueChange={(v) =>
                          patch({ projectId: v || null })
                        }
                        options={projectOptions}
                        placeholder="Aucun projet lié"
                        allowClearSelection
                      />
                    ) : null}
                    <SearchableCombobox
                      id="cal-evt-invoice"
                      label="Facture"
                      value={draft.invoiceId ?? ""}
                      onValueChange={(v) =>
                        patch({ invoiceId: v || null })
                      }
                      options={invoiceOptions}
                      placeholder="Aucune facture liée"
                      allowClearSelection
                    />
                  </>
                )}
              </div>
            ) : null}
          </div>

          {formError ? (
            <p className="text-xs text-red-600 dark:text-red-300">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            {mode === "edit" && draft.id && onDeleted ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="mr-auto text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/15"
              >
                {deleting ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-1 h-4 w-4" />
                )}
                Supprimer
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving || deleting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving || deleting}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {mode === "create" ? "Créer" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
