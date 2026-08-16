import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, Loader2, Plus, Trash2, UserRoundSearch } from "lucide-react";
import { DocumentModulePageGate } from "@/components/DocumentModulePageGate";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import { MARKETPLACE_ROUTE_CLIENT_FOLLOWUP } from "@/lib/marketplaceModules";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function DatabaseClientFollowupPageInner() {
  const { active } = useWorkspace();
  const navigate = useNavigate();
  const [tags, setTags] = React.useState<api.ClientTag[]>([]);
  const [reminders, setReminders] = React.useState<api.ClientReminder[]>([]);
  const [clients, setClients] = React.useState<api.Client[]>([]);
  const [clientsById, setClientsById] = React.useState<Map<string, string>>(
    () => new Map(),
  );
  const [loading, setLoading] = React.useState(true);
  const [historyClientId, setHistoryClientId] = React.useState("");

  const [tagName, setTagName] = React.useState("");
  const [tagColor, setTagColor] = React.useState("");
  const [busyTag, setBusyTag] = React.useState(false);

  const [deleteTagOpen, setDeleteTagOpen] = React.useState(false);
  const [tagToDelete, setTagToDelete] = React.useState<api.ClientTag | null>(
    null,
  );
  const [busyDeleteTag, setBusyDeleteTag] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const [tagList, remList, clientList] = await Promise.all([
        api.listClientTags(active.id),
        api.listReminders(active.id),
        api.listClients(active.id),
      ]);
      setTags(tagList);
      setReminders(remList);
      setClients(clientList);
      const m = new Map<string, string>();
      for (const c of clientList) {
        m.set(c.id, c.name);
      }
      setClientsById(m);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [active]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function submitTag() {
    if (!active || !tagName.trim()) return;
    setBusyTag(true);
    try {
      const color =
        tagColor.trim() === "" ? null : tagColor.trim();
      await api.createClientTag(active.id, {
        name: tagName.trim(),
        color,
      });
      setTagName("");
      setTagColor("");
      toast.success("Tag créé.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyTag(false);
    }
  }

  async function confirmDeleteTag() {
    if (!tagToDelete) return;
    setBusyDeleteTag(true);
    try {
      await api.deleteClientTag(tagToDelete.id);
      toast.success("Tag supprimé.");
      setDeleteTagOpen(false);
      setTagToDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyDeleteTag(false);
    }
  }

  async function deleteReminderRow(id: string) {
    try {
      await api.deleteReminder(id);
      toast.success("Rappel supprimé.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function markReminderDone(r: api.ClientReminder) {
    try {
      await api.updateReminder(r.id, {
        clientId: r.clientId,
        title: r.title,
        note: r.note,
        dueAt: r.dueAt,
        status: "done",
        recurrenceRule: r.recurrenceRule,
      });
      toast.success("Rappel marqué comme traité.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  if (!active) return null;

  const remindersSorted = [...reminders].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
  );

  const clientOptions = React.useMemo(
    () =>
      [...clients]
        .sort((a, b) => a.name.localeCompare(b.name, "fr"))
        .map((c) => ({ value: c.id, label: c.name })),
    [clients],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto px-4 py-4">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2">
            <UserRoundSearch className="h-5 w-5 text-[var(--color-muted-foreground)]" />
          </div>
          <div className="min-w-0">
            <PageTitleWithInfo
              description="Tags et rappels communs à l’espace. La vue opérationnelle (priorités, filtres, fiches) reste sous Accueil → Suivi clients."
            >
              <h1 className="text-lg font-semibold">Données — Suivi clients</h1>
            </PageTitleWithInfo>
            <p className="mt-1 text-sm">
              <Link
                to="/home/client-followup"
                className="font-medium text-[var(--color-primary)] underline"
              >
                Accueil → Suivi clients
              </Link>
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : null}
          Actualiser
        </Button>
      </header>

      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="mb-3 flex flex-wrap items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2">
            <CalendarClock className="h-5 w-5 text-[var(--color-muted-foreground)]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">Historique des contacts</h2>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Choisissez un client pour saisir des interactions passées (dates
              libres). Les événements alimentent la chronologie sous{" "}
              <Link
                to="/home/client-followup"
                className="font-medium text-[var(--color-primary)] underline"
              >
                Accueil → Suivi clients
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[min(100%,18rem)] flex-1">
            <SearchableCombobox
              id="dbfu-history-client"
              label="Client"
              value={historyClientId}
              onValueChange={setHistoryClientId}
              options={clientOptions}
              placeholder="Rechercher un client…"
              allowClearSelection
              disabled={loading}
            />
          </div>
          <Button
            type="button"
            disabled={loading || !historyClientId}
            onClick={() =>
              void navigate(
                `/database/client-followup/clients/${historyClientId}`,
              )
            }
          >
            Ouvrir la saisie historique
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <h2 className="mb-3 text-sm font-semibold">Tags</h2>
        <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">
          Étiquettes réutilisables pour classer les clients dans le suivi. La
          liaison client ↔ tag se fait depuis la fiche détail du{" "}
          <Link to="/home/client-followup" className="underline">
            suivi clients
          </Link>
          .
        </p>
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1">
            <Label htmlFor="dbfu-tag-name">Nom du tag</Label>
            <Input
              id="dbfu-tag-name"
              className="mt-1"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Ex. VIP, À relancer…"
            />
          </div>
          <div className="w-28">
            <Label htmlFor="dbfu-tag-color">Couleur (optionnel)</Label>
            <Input
              id="dbfu-tag-color"
              className="mt-1 font-mono text-xs"
              value={tagColor}
              onChange={(e) => setTagColor(e.target.value)}
              placeholder="#94a3b8"
            />
          </div>
          <Button
            type="button"
            className="mt-6"
            disabled={busyTag || !tagName.trim()}
            onClick={() => void submitTag()}
          >
            <Plus className="mr-1 h-4 w-4" />
            Ajouter
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
          <table className="w-full min-w-[400px] border-collapse text-sm">
            <thead className="bg-[var(--color-muted)]/30">
              <tr className="border-b border-[var(--color-border)] text-left">
                <th className="p-2 font-medium">Nom</th>
                <th className="p-2 font-medium">Couleur</th>
                <th className="w-24 p-2 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="p-6 text-center text-[var(--color-muted-foreground)]"
                  >
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : tags.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="p-6 text-center text-[var(--color-muted-foreground)]"
                  >
                    Aucun tag pour l’instant.
                  </td>
                </tr>
              ) : (
                tags.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="p-2 font-medium">{t.name}</td>
                    <td className="p-2">
                      {t.color ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="inline-block h-4 w-4 rounded border border-[var(--color-border)]"
                            style={{ backgroundColor: t.color }}
                            aria-hidden
                          />
                          <span className="font-mono text-xs">{t.color}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--color-muted-foreground)]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Supprimer le tag ${t.name}`}
                        onClick={() => {
                          setTagToDelete(t);
                          setDeleteTagOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <h2 className="mb-3 text-sm font-semibold">Rappels</h2>
        <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">
          Tous les rappels de l’espace (tous clients). Les rappels liés à un client
          précis peuvent aussi être gérés depuis le détail dans le suivi.
        </p>
        <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-[var(--color-muted)]/30">
              <tr className="border-b border-[var(--color-border)] text-left">
                <th className="p-2 font-medium">Titre</th>
                <th className="p-2 font-medium">Client</th>
                <th className="p-2 font-medium">Échéance</th>
                <th className="p-2 font-medium">Statut</th>
                <th className="w-36 p-2 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-[var(--color-muted-foreground)]"
                  >
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : remindersSorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-[var(--color-muted-foreground)]"
                  >
                    Aucun rappel.
                  </td>
                </tr>
              ) : (
                remindersSorted.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="p-2 font-medium">{r.title}</td>
                    <td className="p-2 text-[var(--color-muted-foreground)]">
                      {r.clientId
                        ? clientsById.get(r.clientId) ?? r.clientId.slice(0, 8)
                        : "—"}
                    </td>
                    <td className="p-2 tabular-nums">
                      {r.dueAt.slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="p-2">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          r.status === "pending"
                            ? "bg-amber-500/15 text-amber-900 dark:text-amber-200"
                            : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
                        )}
                      >
                        {r.status === "pending" ? "À faire" : r.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap justify-end gap-1">
                        {r.status === "pending" ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => void markReminderDone(r)}
                          >
                            Traité
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => void deleteReminderRow(r.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={deleteTagOpen} onOpenChange={setDeleteTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le tag ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            « {tagToDelete?.name ?? ""} » sera retiré du catalogue. Les liaisons
            avec les clients seront supprimées.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTagOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busyDeleteTag}
              onClick={() => void confirmDeleteTag()}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function DatabaseClientFollowupPage() {
  const { loading, clientFollowupEnabled } = useDocumentModules();
  return (
    <DocumentModulePageGate
      loading={loading}
      enabled={clientFollowupEnabled}
      redirectTo={MARKETPLACE_ROUTE_CLIENT_FOLLOWUP}
      redirectToast='Activez « Suivi & relance clients » dans Marketplace (onglet Clients).'
    >
      <DatabaseClientFollowupPageInner />
    </DocumentModulePageGate>
  );
}
