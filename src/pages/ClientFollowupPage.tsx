import * as React from "react";
import {
  AlarmClock,
  Copy,
  Loader2,
  RefreshCw,
  UserRoundSearch,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DocumentModulePageGate } from "@/components/DocumentModulePageGate";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import { MARKETPLACE_ROUTE_CLIENT_FOLLOWUP } from "@/lib/marketplaceModules";
import {
  loadFollowupContactPrefs,
  resolveOpenWithForMail,
  resolveOpenWithForTel,
} from "@/lib/followupContactPrefs";
import { openExternalUrl } from "@/lib/openExternalUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SortKey = "priority" | "days" | "name";

function priorityRank(level: string): number {
  switch (level) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function priorityBadgeClass(level: string): string {
  switch (level) {
    case "high":
      return "bg-red-600/15 text-red-700 dark:text-red-400";
    case "medium":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
    default:
      return "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]";
  }
}

function priorityLabel(level: string): string {
  switch (level) {
    case "high":
      return "Haute";
    case "medium":
      return "Moyenne";
    default:
      return "Basse";
  }
}

/** Normalise un numéro pour `tel:` (espaces et séparateurs courants retirés). */
function telHref(phone: string): string {
  const cleaned = phone.replace(/[\s().-]/g, "");
  return cleaned.length > 0 ? `tel:${cleaned}` : "";
}

async function copyContactField(kind: "Courriel" | "Téléphone", value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${kind} copié dans le presse-papiers.`);
  } catch {
    toast.error("Copie impossible.");
  }
}

function ClientFollowupPageInner() {
  const navigate = useNavigate();
  const { active } = useWorkspace();
  const [rows, setRows] = React.useState<api.ClientFollowupRow[]>([]);
  const [tags, setTags] = React.useState<api.ClientTag[]>([]);
  const [reminders, setReminders] = React.useState<api.ClientReminder[]>([]);
  const [clientQuickContact, setClientQuickContact] = React.useState<
    Map<string, { email: string | null; phone: string | null }>
  >(() => new Map());
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("");
  const [tagFilter, setTagFilter] = React.useState<string>("");
  const [sortKey, setSortKey] = React.useState<SortKey>("priority");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const filtersRef = React.useRef({
    search,
    priorityFilter,
    tagFilter,
  });
  filtersRef.current = { search, priorityFilter, tagFilter };

  const loadAll = React.useCallback(async () => {
    if (!active) return;
    const { search: s, priorityFilter: p, tagFilter: t } = filtersRef.current;
    setLoading(true);
    try {
      const [list, tagList, remList, clientList] = await Promise.all([
        api.listClientsFollowup(active.id, {
          search: s.trim() || undefined,
          priorityLevel: p || undefined,
          tagId: t || undefined,
        }),
        api.listClientTags(active.id),
        api.listReminders(active.id),
        api.listClients(active.id),
      ]);
      setRows(list);
      setTags(tagList);
      setReminders(remList);
      const cq = new Map<string, { email: string | null; phone: string | null }>();
      for (const c of clientList) {
        cq.set(c.id, {
          email: c.email?.trim() || null,
          phone: c.phone?.trim() || null,
        });
      }
      setClientQuickContact(cq);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [active]);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  function openClientDetail(row: api.ClientFollowupRow) {
    void navigate(`/home/client-followup/clients/${row.clientId}`);
  }

  const sortedRows = React.useMemo(() => {
    const copy = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "priority":
          cmp = priorityRank(a.priorityLevel) - priorityRank(b.priorityLevel);
          break;
        case "days":
          cmp = a.daysSinceLastTouch - b.daysSinceLastTouch;
          break;
        case "name":
          cmp = a.clientName.localeCompare(b.clientName, "fr");
          break;
        default:
          cmp = 0;
      }
      return cmp * dir;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const dueSoon = React.useMemo(() => {
    const now = Date.now();
    return reminders.filter((r) => {
      if (r.status !== "pending") return false;
      const t = new Date(r.dueAt).getTime();
      return !Number.isNaN(t) && t <= now + 7 * 24 * 60 * 60 * 1000;
    });
  }, [reminders]);

  if (!active) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2">
            <UserRoundSearch className="h-5 w-5 text-[var(--color-muted-foreground)]" />
          </div>
          <div className="min-w-0">
            <PageTitleWithInfo
              description="Clients prioritaires selon l’historique devis / factures / contacts. Activez le module dans Marketplace si besoin."
            >
              <h1 className="text-xl font-semibold">Suivi &amp; relance clients</h1>
            </PageTitleWithInfo>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadAll()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-4 w-4" />
            )}
            Actualiser
          </Button>
        </div>
      </header>

      {dueSoon.length > 0 ? (
        <div className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-1 font-medium">
            <AlarmClock className="h-4 w-4" />
            {dueSoon.length} rappel(s) à traiter sous 7 jours (tous clients).
          </span>
        </div>
      ) : null}

      <div className="flex shrink-0 flex-wrap items-end gap-2">
        <div className="w-full min-w-[12rem] max-w-sm">
          <Label htmlFor="followup-search">Recherche</Label>
          <Input
            id="followup-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom du client…"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="followup-prio">Priorité</Label>
          <select
            id="followup-prio"
            className="mt-1 flex h-9 w-full min-w-[9rem] rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-sm"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">Toutes</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
        </div>
        <div>
          <Label htmlFor="followup-tag">Tag</Label>
          <select
            id="followup-tag"
            className="mt-1 flex h-9 w-full min-w-[10rem] rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-sm"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="">Tous</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" className="mt-6" onClick={() => void loadAll()}>
          Filtrer
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="sticky top-0 bg-[var(--color-card)] shadow-sm">
            <tr className="border-b border-[var(--color-border)] text-left">
              <th className="p-2 font-medium">
                <button
                  type="button"
                  className="rounded hover:underline"
                  onClick={() => toggleSort("name")}
                >
                  Client
                </button>
              </th>
              <th className="p-2 font-medium">Courriel</th>
              <th className="p-2 font-medium">Téléphone</th>
              <th className="p-2 font-medium">
                <button
                  type="button"
                  className="rounded hover:underline"
                  onClick={() => toggleSort("priority")}
                >
                  Priorité
                </button>
              </th>
              <th className="p-2 font-medium">
                <button
                  type="button"
                  className="rounded hover:underline"
                  onClick={() => toggleSort("days")}
                >
                  Jours sans contact
                </button>
              </th>
              <th className="p-2 font-medium">Tags</th>
              <th className="p-2 font-medium w-28"> </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[var(--color-muted-foreground)]">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[var(--color-muted-foreground)]">
                  Aucun client ne correspond aux filtres.
                </td>
              </tr>
            ) : (
              sortedRows.map((r) => {
                const qc = clientQuickContact.get(r.clientId);
                const phoneTel = qc?.phone ? telHref(qc.phone) : "";
                return (
                <tr
                  key={r.clientId}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)]/40"
                >
                  <td className="p-2 font-medium">{r.clientName}</td>
                  <td className="max-w-[18rem] p-2">
                    {qc?.email ? (
                      <div className="flex min-w-0 items-center gap-0.5">
                        <a
                          href={`mailto:${qc.email}`}
                          onClick={(e) => {
                            e.preventDefault();
                            void openExternalUrl(`mailto:${qc.email}`, {
                              openWith: resolveOpenWithForMail(
                                loadFollowupContactPrefs(),
                              ),
                            }).catch(() => {
                              toast.error("Impossible d’ouvrir le courriel.");
                            });
                          }}
                          className="min-w-0 flex-1 truncate text-[var(--color-primary)] underline-offset-2 hover:underline"
                          title={qc.email}
                        >
                          {qc.email}
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                          aria-label="Copier le courriel"
                          title="Copier le courriel"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void copyContactField("Courriel", qc.email!);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[var(--color-muted-foreground)]">—</span>
                    )}
                  </td>
                  <td className="max-w-[14rem] whitespace-nowrap p-2">
                    {qc?.phone ? (
                      <div className="flex min-w-0 items-center gap-0.5">
                        {phoneTel ? (
                          <a
                            href={phoneTel}
                            onClick={(e) => {
                              e.preventDefault();
                              void openExternalUrl(phoneTel, {
                                openWith: resolveOpenWithForTel(
                                  loadFollowupContactPrefs(),
                                ),
                              }).catch(() => {
                                toast.error(
                                  "Impossible d’ouvrir l’appel téléphonique.",
                                );
                              });
                            }}
                            className="min-w-0 flex-1 truncate tabular-nums text-[var(--color-primary)] underline-offset-2 hover:underline"
                            title={qc.phone}
                          >
                            {qc.phone}
                          </a>
                        ) : (
                          <span className="min-w-0 flex-1 truncate tabular-nums text-[var(--color-muted-foreground)]">
                            {qc.phone}
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                          aria-label="Copier le numéro de téléphone"
                          title="Copier le numéro"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void copyContactField("Téléphone", qc.phone!);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[var(--color-muted-foreground)]">—</span>
                    )}
                  </td>
                  <td className="p-2">
                    <span
                      className={cn(
                        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                        priorityBadgeClass(r.priorityLevel),
                      )}
                    >
                      {priorityLabel(r.priorityLevel)}
                    </span>
                  </td>
                  <td className="p-2 tabular-nums">{r.daysSinceLastTouch}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {r.tags.map((t) => (
                        <span
                          key={t.id}
                          className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 text-xs"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => openClientDetail(r)}
                    >
                      Détails
                    </Button>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Fiches clients :{" "}
        <Link to="/database/clients" className="underline">
          Bases → Clients
        </Link>
        {" · "}
        Données suivi (tags, rappels) :{" "}
        <Link to="/database/client-followup" className="underline">
          Bases → Suivi clients
        </Link>
      </p>
    </div>
  );
}

export function ClientFollowupPage() {
  const { loading, clientFollowupEnabled } = useDocumentModules();
  return (
    <DocumentModulePageGate
      loading={loading}
      enabled={clientFollowupEnabled}
      redirectTo={MARKETPLACE_ROUTE_CLIENT_FOLLOWUP}
      redirectToast='Activez « Suivi & relance clients » dans Marketplace (onglet Clients).'
    >
      <ClientFollowupPageInner />
    </DocumentModulePageGate>
  );
}
