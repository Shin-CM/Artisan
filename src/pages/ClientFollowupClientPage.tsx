import * as React from "react";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ClientFollowupRecapSection } from "@/components/clientFollowup/ClientFollowupRecapSection";
import { ClientFollowupTimeline } from "@/components/clientFollowup/ClientFollowupTimeline";
import { DocumentModulePageGate } from "@/components/DocumentModulePageGate";
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

function ClientFollowupClientPageInner() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { active } = useWorkspace();

  const [client, setClient] = React.useState<api.Client | null>(null);
  const [taxRates, setTaxRates] = React.useState<api.TaxRate[]>([]);
  const [workspaceTags, setWorkspaceTags] = React.useState<api.ClientTag[]>(
    [],
  );
  const [followupRow, setFollowupRow] =
    React.useState<api.ClientFollowupRow | null>(null);
  const [reminders, setReminders] = React.useState<api.ClientReminder[]>([]);
  const [timeline, setTimeline] = React.useState<api.ClientTimelineEntry[]>(
    [],
  );
  const [timelineLoading, setTimelineLoading] = React.useState(true);
  const [pageLoading, setPageLoading] = React.useState(true);

  const [contactEvents, setContactEvents] = React.useState<
    api.ClientContactEvent[]
  >([]);
  const [noteModalOpen, setNoteModalOpen] = React.useState(false);
  const [reminderModalOpen, setReminderModalOpen] = React.useState(false);

  const [noteBody, setNoteBody] = React.useState("");
  const [remTitle, setRemTitle] = React.useState("");
  const [remDue, setRemDue] = React.useState("");
  const [tagBusy, setTagBusy] = React.useState(false);

  const selectedTagIds = React.useMemo(
    () => followupRow?.tags.map((t) => t.id) ?? [],
    [followupRow],
  );

  const noteContactEvents = React.useMemo(() => {
    return [...contactEvents]
      .filter((e) => e.kind === "note")
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, 15);
  }, [contactEvents]);

  const loadAll = React.useCallback(async () => {
    if (!active || !clientId) return;
    setPageLoading(true);
    try {
      const [
        clientsList,
        rates,
        tagsWs,
        rems,
        followList,
        timelineData,
        contactEv,
      ] = await Promise.all([
        api.listClients(active.id),
        api.listTaxRates(active.id),
        api.listClientTags(active.id),
        api.listReminders(active.id),
        api.listClientsFollowup(active.id, {}),
        api.getClientTimeline(active.id, clientId),
        api.listContactEvents(active.id, clientId),
      ]);
      const c = clientsList.find((x) => x.id === clientId) ?? null;
      setClient(c);
      setTaxRates(rates);
      setWorkspaceTags(tagsWs);
      setReminders(rems);
      setFollowupRow(
        followList.find((r) => r.clientId === clientId) ?? null,
      );
      setTimeline(timelineData);
      setContactEvents(contactEv);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setPageLoading(false);
      setTimelineLoading(false);
    }
  }, [active, clientId]);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function reloadTimelineOnly() {
    if (!active || !clientId) return;
    setTimelineLoading(true);
    try {
      const t = await api.getClientTimeline(active.id, clientId);
      setTimeline(t);
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setTimelineLoading(false);
    }
  }

  async function toggleWorkspaceTag(tagId: string, checked: boolean) {
    if (!active || !clientId || tagBusy) return;
    const next = new Set(selectedTagIds);
    if (checked) next.add(tagId);
    else next.delete(tagId);
    const ids = [...next];
    setTagBusy(true);
    try {
      await api.setClientTags(active.id, clientId, ids);
      toast.success("Tags mis à jour.");
      const list = await api.listClientsFollowup(active.id, {});
      setFollowupRow(list.find((r) => r.clientId === clientId) ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setTagBusy(false);
    }
  }

  async function submitNote() {
    if (!active || !clientId || !noteBody.trim()) return;
    try {
      await api.createContactEvent(active.id, clientId, {
        kind: "note",
        body: noteBody.trim(),
        occurredAt: new Date().toISOString(),
      });
      setNoteBody("");
      toast.success("Contact enregistré.");
      setNoteModalOpen(false);
      await reloadTimelineOnly();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function deleteContactEventFromTimeline(eventId: string) {
    if (!active) return;
    try {
      await api.deleteContactEvent(eventId);
      toast.success("Note de contact retirée de la chronologie.");
      await reloadTimelineOnly();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function updateContactEventFromTimeline(
    eventId: string,
    input: api.ClientContactEventInput,
  ) {
    if (!active) return;
    try {
      await api.updateContactEvent(active.id, eventId, input);
      toast.success("Contact mis à jour.");
      await reloadTimelineOnly();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      throw e;
    }
  }

  async function submitReminder() {
    if (!active || !clientId || !remTitle.trim() || !remDue) return;
    try {
      const iso = new Date(remDue).toISOString();
      await api.createReminder(active.id, {
        clientId,
        title: remTitle.trim(),
        dueAt: iso,
        status: "pending",
      });
      setRemTitle("");
      setRemDue("");
      toast.success("Rappel créé.");
      setReminderModalOpen(false);
      await reloadTimelineOnly();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  if (!active || !clientId) return null;

  if (pageLoading && !client) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Client introuvable dans cet espace.
        </p>
        <Button type="button" variant="outline" asChild>
          <Link to="/home/client-followup">Retour au suivi</Link>
        </Button>
      </div>
    );
  }

  const displayName =
    followupRow?.clientName ?? client.name ?? "Client";

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[var(--color-border)] py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => void navigate("/home/client-followup")}
        >
          <ArrowLeft className="h-4 w-4" />
          Suivi clients
        </Button>
        <h1 className="min-w-0 flex-1 text-lg font-semibold truncate">
          {displayName}
        </h1>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to="/database/clients">Bases — Clients</Link>
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-4">
        <div className="flex w-full min-w-0 flex-col gap-6 pb-8">
          <ClientFollowupRecapSection
            client={client}
            baseCurrency={active.baseCurrency}
            taxRates={taxRates}
            noteContactEvents={noteContactEvents}
            onOpenAddNoteModal={() => setNoteModalOpen(true)}
            onOpenNewReminderModal={() => setReminderModalOpen(true)}
          />

          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <h2 className="mb-3 text-sm font-semibold">Tags suivi</h2>
            {workspaceTags.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Aucun tag défini — créez-en sous{" "}
                <Link
                  to="/database/client-followup"
                  className="underline"
                >
                  Bases → Suivi clients
                </Link>
                .
              </p>
            ) : (
              <ul className="flex flex-wrap gap-3 text-sm">
                {workspaceTags.map((t) => (
                  <li key={t.id}>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedTagIds.includes(t.id)}
                        disabled={tagBusy}
                        onChange={(e) =>
                          void toggleWorkspaceTag(t.id, e.target.checked)
                        }
                      />
                      <span>{t.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Chronologie</h2>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Vue tableau : documents et autres événements. Les lignes{" "}
                <span className="font-medium">Contact</span> peuvent être
                modifiées ou retirées (icônes à droite).
              </p>
            </div>

            <div>
              {timelineLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted-foreground)]" />
              ) : (
                <ClientFollowupTimeline
                  entries={timeline}
                  onDeleteContactEvent={(id) =>
                    void deleteContactEventFromTimeline(id)
                  }
                  onUpdateContactEvent={(id, input) =>
                    void updateContactEventFromTimeline(id, input)
                  }
                />
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Rappels ouverts</h3>
              <ul className="space-y-1 text-sm">
                {reminders
                  .filter(
                    (x) =>
                      x.clientId === clientId && x.status === "pending",
                  )
                  .map((r) => (
                    <li
                      key={r.id}
                      className="flex items-start justify-between gap-2 rounded border border-[var(--color-border)] px-2 py-1"
                    >
                      <div>
                        <div className="font-medium">{r.title}</div>
                        <div className="text-xs text-[var(--color-muted-foreground)]">
                          {r.dueAt.slice(0, 16).replace("T", " ")}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        aria-label="Supprimer le rappel"
                        onClick={async () => {
                          try {
                            await api.deleteReminder(r.id);
                            toast.success("Rappel supprimé.");
                            await loadAll();
                          } catch (e) {
                            toast.error(
                              e instanceof Error ? e.message : String(e),
                            );
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
              </ul>
            </div>
          </section>
        </div>
      </div>

      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une note de contact</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="cfu-note-body">Texte</Label>
              <textarea
                id="cfu-note-body"
                className="min-h-[100px] w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-sm"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Compte rendu d’appel, échange…"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNoteModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={!noteBody.trim()}
              onClick={() => void submitNote()}
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau rappel</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="cfu-rem-title">Titre</Label>
              <Input
                id="cfu-rem-title"
                value={remTitle}
                onChange={(e) => setRemTitle(e.target.value)}
                placeholder="Titre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cfu-rem-due">Échéance</Label>
              <Input
                id="cfu-rem-due"
                type="datetime-local"
                value={remDue}
                onChange={(e) => setRemDue(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReminderModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={!remTitle.trim() || !remDue}
              onClick={() => void submitReminder()}
            >
              Créer le rappel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ClientFollowupClientPage() {
  const { loading, clientFollowupEnabled } = useDocumentModules();
  return (
    <DocumentModulePageGate
      loading={loading}
      enabled={clientFollowupEnabled}
      redirectTo={MARKETPLACE_ROUTE_CLIENT_FOLLOWUP}
      redirectToast='Activez « Suivi & relance clients » dans Marketplace (onglet Clients).'
    >
      <ClientFollowupClientPageInner />
    </DocumentModulePageGate>
  );
}
