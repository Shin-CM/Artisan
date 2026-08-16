import * as React from "react";
import {
  ArrowLeft,
  CalendarClock,
  Loader2,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DocumentModulePageGate } from "@/components/DocumentModulePageGate";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import { MARKETPLACE_ROUTE_CLIENT_FOLLOWUP } from "@/lib/marketplaceModules";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  CONTACT_EVENT_KIND_OPTIONS,
  contactEventKindLabel,
  toDatetimeLocalValue,
} from "@/lib/contactEventKinds";

function formatOccurred(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function DatabaseClientFollowupHistoryPageInner() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { active } = useWorkspace();

  const [clientName, setClientName] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<api.ClientContactEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const [kind, setKind] = React.useState("note");
  const [body, setBody] = React.useState("");
  const [occurredLocal, setOccurredLocal] = React.useState(() =>
    toDatetimeLocalValue(new Date().toISOString()),
  );

  const load = React.useCallback(async () => {
    if (!active || !clientId) return;
    setLoading(true);
    try {
      const [clients, evs] = await Promise.all([
        api.listClients(active.id),
        api.listContactEvents(active.id, clientId),
      ]);
      const c = clients.find((x) => x.id === clientId);
      setClientName(c?.name ?? null);
      setEvents(evs);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [active, clientId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    if (!active || !clientId || !occurredLocal.trim()) return;
    const iso = new Date(occurredLocal).toISOString();
    if (Number.isNaN(new Date(iso).getTime())) {
      toast.error("Date ou heure invalide.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createContactEvent(active.id, clientId, {
        kind,
        body: body.trim() || null,
        occurredAt: iso,
      });
      setBody("");
      toast.success("Événement enregistré.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeEvent(id: string) {
    try {
      await api.deleteContactEvent(id);
      toast.success("Événement supprimé.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  if (!active || !clientId) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto px-4 py-4">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2">
            <CalendarClock className="h-5 w-5 text-[var(--color-muted-foreground)]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 -ml-2"
                onClick={() => void navigate("/database/client-followup")}
              >
                <ArrowLeft className="h-4 w-4" />
                Suivi — données
              </Button>
            </div>
            <PageTitleWithInfo
              className="mt-1"
              description="Saisissez des contacts passés en indiquant la date et l’heure réelles de l’interaction : ils apparaissent dans la chronologie du suivi et participent au calcul du dernier contact (avec les documents)."
            >
              <h1 className="text-lg font-semibold">
                {loading ? (
                  <span className="text-[var(--color-muted-foreground)]">
                    Chargement…
                  </span>
                ) : clientName ? (
                  <>Historique — {clientName}</>
                ) : (
                  <>Historique — client introuvable</>
                )}
              </h1>
            </PageTitleWithInfo>
            {clientId ? (
              <p className="mt-2 text-sm">
                <Link
                  to={`/home/client-followup/clients/${clientId}`}
                  className="font-medium text-[var(--color-primary)] underline"
                >
                  Ouvrir la fiche dans Accueil → Suivi clients
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {!loading && !clientName ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
          Ce client n’existe pas dans cet espace.
        </div>
      ) : (
        <>
          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <h2 className="mb-3 text-sm font-semibold">
              Nouvel événement (rétroactif possible)
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="hist-kind">Type</Label>
                <select
                  id="hist-kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  disabled={loading || !clientName}
                  className="flex h-9 w-full min-w-0 rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-1 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {CONTACT_EVENT_KIND_OPTIONS.map((k) => (
                    <option key={k.value} value={k.value}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="hist-when">Date et heure du contact</Label>
                <Input
                  id="hist-when"
                  type="datetime-local"
                  value={occurredLocal}
                  onChange={(e) => setOccurredLocal(e.target.value)}
                  disabled={loading || !clientName}
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="hist-body">Détail (optionnel)</Label>
              <textarea
                id="hist-body"
                className="min-h-[88px] w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-sm"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Compte rendu, sujet de l’échange…"
                disabled={loading || !clientName}
              />
            </div>
            <Button
              type="button"
              className="mt-4"
              disabled={
                submitting || loading || !clientName || !occurredLocal.trim()
              }
              onClick={() => void submit()}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Enregistrer dans l’historique
            </Button>
          </section>

          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <h2 className="mb-3 text-sm font-semibold">
              Événements enregistrés ({events.length})
            </h2>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted-foreground)]" />
            ) : events.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Aucun événement de contact saisi pour ce client. Les notes
                ajoutées depuis Accueil → Suivi apparaissent aussi ici.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
                {events.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex flex-wrap items-start justify-between gap-2 p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium",
                            "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
                          )}
                        >
                          {contactEventKindLabel(ev.kind)}
                        </span>
                        <span className="tabular-nums text-xs text-[var(--color-muted-foreground)]">
                          {formatOccurred(ev.occurredAt)}
                        </span>
                      </div>
                      {ev.body?.trim() ? (
                        <p className="mt-2 whitespace-pre-wrap text-[var(--color-foreground)]">
                          {ev.body.trim()}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs italic text-[var(--color-muted-foreground)]">
                          Sans détail
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      aria-label="Supprimer cet événement"
                      onClick={() => void removeEvent(ev.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export function DatabaseClientFollowupHistoryPage() {
  const { loading, clientFollowupEnabled } = useDocumentModules();
  return (
    <DocumentModulePageGate
      loading={loading}
      enabled={clientFollowupEnabled}
      redirectTo={MARKETPLACE_ROUTE_CLIENT_FOLLOWUP}
      redirectToast='Activez « Suivi & relance clients » dans Marketplace (onglet Clients).'
    >
      <DatabaseClientFollowupHistoryPageInner />
    </DocumentModulePageGate>
  );
}
