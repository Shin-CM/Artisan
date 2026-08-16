import * as React from "react";
import { Copy, Mail, RefreshCw, Trash2 } from "lucide-react";
import { DocumentModulePageGate } from "@/components/DocumentModulePageGate";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { makeCurrencyFormatter } from "@/pages/documentEditor/currency";

const TEMPLATE_STORAGE_PREFIX = "invoicies_recovery_templates_v1:";

const DEFAULT_TEMPLATES = [
  `Bonjour,

Nous nous permettons de vous rappeler que la facture {numero} ({montant} TTC), échéance le {echeance}, présente encore un solde de {reste}.

Merci de procéder au règlement ou de nous contacter en cas de difficulté.

Cordialement`,
];

type AgingFilter = "all" | "d1_30" | "d31_60" | "d61_90" | "d90p";

function parseYmd(iso: string): Date | null {
  const d = iso?.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const t = new Date(`${d}T12:00:00`);
  return Number.isNaN(t.getTime()) ? null : t;
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function loadTemplates(workspaceId: string): string[] {
  try {
    const raw = localStorage.getItem(`${TEMPLATE_STORAGE_PREFIX}${workspaceId}`);
    if (!raw) return [...DEFAULT_TEMPLATES];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === "string"))
      return [...DEFAULT_TEMPLATES];
    return parsed.length ? parsed : [...DEFAULT_TEMPLATES];
  } catch {
    return [...DEFAULT_TEMPLATES];
  }
}

function saveTemplates(workspaceId: string, templates: string[]) {
  localStorage.setItem(
    `${TEMPLATE_STORAGE_PREFIX}${workspaceId}`,
    JSON.stringify(templates),
  );
}

function applyTemplate(
  body: string,
  inv: api.Invoice,
  clientName: string,
  fmt: (n: number) => string,
): string {
  const reste = Math.max(0, inv.total - inv.amountPaid);
  const due = inv.dueDate?.slice(0, 10) ?? "—";
  return body
    .replaceAll("{client}", clientName)
    .replaceAll("{numero}", inv.number)
    .replaceAll("{montant}", fmt(inv.total))
    .replaceAll("{reste}", fmt(reste))
    .replaceAll("{echeance}", due);
}

function isUnpaidInvoice(inv: api.Invoice): boolean {
  if ((inv.documentKind ?? "invoice") !== "invoice") return false;
  if (inv.archived === true) return false;
  const reste = inv.total - inv.amountPaid;
  if (reste <= 0.005) return false;
  if (inv.status === "paid") return false;
  return true;
}

function isOverdue(inv: api.Invoice, today: Date): boolean {
  if (!isUnpaidInvoice(inv)) return false;
  if (inv.status === "overdue") return true;
  const due = inv.dueDate ? parseYmd(inv.dueDate) : null;
  if (!due) return false;
  return due < today;
}

function overdueDays(inv: api.Invoice, today: Date): number {
  const due = inv.dueDate ? parseYmd(inv.dueDate) : null;
  if (!due) return 0;
  return Math.max(0, daysBetween(due, today));
}

function matchesAging(days: number, f: AgingFilter): boolean {
  if (f === "all") return true;
  if (f === "d1_30") return days >= 1 && days <= 30;
  if (f === "d31_60") return days >= 31 && days <= 60;
  if (f === "d61_90") return days >= 61 && days <= 90;
  return days >= 91;
}

function RecoveryPageContent() {
  const { active } = useWorkspace();
  const [invoices, setInvoices] = React.useState<api.Invoice[]>([]);
  const [clients, setClients] = React.useState<api.Client[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [agingFilter, setAgingFilter] = React.useState<AgingFilter>("all");
  const [templateIndex, setTemplateIndex] = React.useState(0);
  const [templates, setTemplates] = React.useState<string[]>([]);
  const [editorTemplate, setEditorTemplate] = React.useState("");
  const [manageTemplateDeletes, setManageTemplateDeletes] =
    React.useState(false);

  const today = React.useMemo(() => {
    const t = new Date();
    t.setHours(12, 0, 0, 0);
    return t;
  }, []);

  const currency = active?.baseCurrency ?? "EUR";
  const fmt = React.useMemo(() => makeCurrencyFormatter(currency), [currency]);

  const load = React.useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const [inv, c] = await Promise.all([
        api.listInvoices(active.id),
        api.listClients(active.id),
      ]);
      setInvoices(inv);
      setClients(c);
    } finally {
      setLoading(false);
    }
  }, [active]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!active) return;
    const t = loadTemplates(active.id);
    setTemplates(t);
    setEditorTemplate(t[0] ?? DEFAULT_TEMPLATES[0]);
    setTemplateIndex(0);
  }, [active?.id]);

  const clientById = React.useMemo(() => {
    const m = new Map<string, api.Client>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  const overdueRows = React.useMemo(() => {
    const rows = invoices
      .filter((inv) => isOverdue(inv, today))
      .map((inv) => ({
        inv,
        days: overdueDays(inv, today),
        clientName:
          (inv.clientId && clientById.get(inv.clientId)?.name) || "—",
      }))
      .filter((r) => matchesAging(r.days, agingFilter))
      .sort((a, b) => b.days - a.days);
    return rows;
  }, [invoices, today, clientById, agingFilter]);

  const upcomingRows = React.useMemo(() => {
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 30);
    return invoices
      .filter((inv) => isUnpaidInvoice(inv))
      .filter((inv) => {
        const due = inv.dueDate ? parseYmd(inv.dueDate) : null;
        if (!due || due < today) return false;
        return due <= horizon;
      })
      .map((inv) => ({
        inv,
        due: parseYmd(inv.dueDate!)!,
        clientName:
          (inv.clientId && clientById.get(inv.clientId)?.name) || "—",
      }))
      .sort((a, b) => a.due.getTime() - b.due.getTime());
  }, [invoices, today, clientById]);

  function persistEditor() {
    if (!active) return;
    const next = [...templates];
    next[templateIndex] = editorTemplate;
    setTemplates(next);
    saveTemplates(active.id, next);
    toast.success("Modèle enregistré localement sur cet appareil");
  }

  function removeTemplate(index: number) {
    if (!active || templates.length <= 1) return;
    const next = templates.filter((_, j) => j !== index);
    saveTemplates(active.id, next);
    setTemplates(next);
    let newSel = templateIndex;
    if (index < templateIndex) newSel = templateIndex - 1;
    else if (index === templateIndex)
      newSel = Math.min(templateIndex, next.length - 1);
    setTemplateIndex(newSel);
    setEditorTemplate(next[newSel] ?? DEFAULT_TEMPLATES[0]);
    toast.success("Modèle supprimé");
  }

  function copyReminder(inv: api.Invoice, clientName: string) {
    const body = applyTemplate(editorTemplate, inv, clientName, fmt);
    void navigator.clipboard.writeText(body).then(
      () => toast.success("Texte copié"),
      () => toast.error("Impossible de copier"),
    );
  }

  function prepareMail(inv: api.Invoice, clientName: string) {
    const client = inv.clientId ? clientById.get(inv.clientId) : undefined;
    const email = client?.email?.trim();
    const body = applyTemplate(editorTemplate, inv, clientName, fmt);
    const subject = encodeURIComponent(`Relance — facture ${inv.number}`);
    const bodyEnc = encodeURIComponent(body);
    if (!email) {
      toast.error("Aucun courriel sur la fiche client — copiez le texte à la place.");
      void navigator.clipboard.writeText(body);
      return;
    }
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${bodyEnc}`;
  }

  if (!active) return null;

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-8 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <PageTitleWithInfo description="Vue des impayés en retard, relances assistées (copie / courriel). Aucun envoi automatique.">
              <h1 className="text-xl font-semibold">Recouvrement</h1>
            </PageTitleWithInfo>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        <Tabs
          defaultValue="relances"
          className="w-full"
          onValueChange={(v) => {
            if (v !== "modeles") setManageTemplateDeletes(false);
          }}
        >
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 sm:w-auto">
            <TabsTrigger value="relances">Relances</TabsTrigger>
            <TabsTrigger value="modeles">Modèles</TabsTrigger>
          </TabsList>

          <TabsContent value="relances" className="mt-4 space-y-8 focus-visible:ring-0">
        <section className="rounded-lg border border-[var(--color-border)] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Factures en retard</h2>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "Toutes"],
                  ["d1_30", "1–30 j."],
                  ["d31_60", "31–60 j."],
                  ["d61_90", "61–90 j."],
                  ["d90p", "90 j. +"],
                ] as const
              ).map(([v, label]) => (
                <Button
                  key={v}
                  type="button"
                  size="sm"
                  variant={agingFilter === v ? "secondary" : "outline"}
                  onClick={() => setAgingFilter(v)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          {overdueRows.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Aucune facture en retard dans ce filtre.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-muted-foreground)]">
                  <tr>
                    <th className="py-2 pr-2 font-medium">Facture</th>
                    <th className="py-2 pr-2 font-medium">Client</th>
                    <th className="py-2 pr-2 font-medium">Échéance</th>
                    <th className="py-2 pr-2 font-medium">Retard</th>
                    <th className="py-2 pr-2 text-right font-medium">Reste dû</th>
                    <th className="w-40 py-2 font-medium"> </th>
                  </tr>
                </thead>
                <tbody>
                  {overdueRows.map(({ inv, days, clientName }) => (
                    <tr
                      key={inv.id}
                      className="border-b border-[var(--color-border)] last:border-0"
                    >
                      <td className="py-2 pr-2 font-mono text-xs">
                        {inv.number}
                      </td>
                      <td className="py-2 pr-2">{clientName}</td>
                      <td className="py-2 pr-2 text-[var(--color-muted-foreground)]">
                        {inv.dueDate?.slice(0, 10) ?? "—"}
                      </td>
                      <td className="py-2 pr-2 tabular-nums">{days} j.</td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {fmt(Math.max(0, inv.total - inv.amountPaid))}
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 px-2"
                            title="Copier le texte de relance"
                            onClick={() => copyReminder(inv, clientName)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copier
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 px-2"
                            title="Ouvrir le client de messagerie"
                            onClick={() => prepareMail(inv, clientName)}
                          >
                            <Mail className="h-3.5 w-3.5" />
                            E-mail
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-[var(--color-border)] p-4">
          <h2 className="mb-2 text-sm font-medium">
            Échéances à venir (30 jours)
          </h2>
          <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">
            Factures non soldées dont la date d’échéance est dans les 30 prochains jours
            (hors déjà en retard).
          </p>
          {upcomingRows.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Aucune échéance dans cette fenêtre.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-muted-foreground)]">
                  <tr>
                    <th className="py-2 pr-2 font-medium">Facture</th>
                    <th className="py-2 pr-2 font-medium">Client</th>
                    <th className="py-2 pr-2 font-medium">Échéance</th>
                    <th className="py-2 pr-2 text-right font-medium">Reste dû</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingRows.map(({ inv, clientName }) => (
                    <tr
                      key={inv.id}
                      className="border-b border-[var(--color-border)] last:border-0"
                    >
                      <td className="py-2 pr-2 font-mono text-xs">
                        {inv.number}
                      </td>
                      <td className="py-2 pr-2">{clientName}</td>
                      <td className="py-2 pr-2 text-[var(--color-muted-foreground)]">
                        {inv.dueDate?.slice(0, 10) ?? "—"}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {fmt(Math.max(0, inv.total - inv.amountPaid))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
          </TabsContent>

          <TabsContent value="modeles" className="mt-4 focus-visible:ring-0">
            <section className="rounded-lg border border-[var(--color-border)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-sm font-medium">Modèles de relance</h2>
                <Button
                  type="button"
                  variant={manageTemplateDeletes ? "secondary" : "outline"}
                  size="sm"
                  className="shrink-0"
                  title={
                    manageTemplateDeletes
                      ? "Masquer les corbeilles"
                      : "Afficher les corbeilles pour supprimer des modèles"
                  }
                  aria-pressed={manageTemplateDeletes}
                  onClick={() => setManageTemplateDeletes((v) => !v)}
                >
                  {manageTemplateDeletes ? "Terminer" : "Gérer"}
                </Button>
              </div>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Stockés localement (navigateur ou poste). Jetons :{" "}
                <code className="text-[11px]">
                  {"{client}"} {"{numero}"} {"{montant}"} {"{reste}"}{" "}
                  {"{echeance}"}
                </code>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {templates.map((_, i) => (
                  <div key={i} className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={templateIndex === i ? "secondary" : "outline"}
                      onClick={() => {
                        setTemplateIndex(i);
                        setEditorTemplate(templates[i] ?? "");
                      }}
                    >
                      Modèle {i + 1}
                    </Button>
                    {manageTemplateDeletes ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 p-0 text-destructive hover:text-destructive"
                        disabled={templates.length <= 1}
                        title={
                          templates.length <= 1
                            ? "Au moins un modèle est requis"
                            : "Supprimer ce modèle"
                        }
                        aria-label={`Supprimer le modèle ${i + 1}`}
                        onClick={() => removeTemplate(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!active) return;
                    const next = [...templates, DEFAULT_TEMPLATES[0]];
                    setTemplates(next);
                    setTemplateIndex(next.length - 1);
                    setEditorTemplate(next[next.length - 1]);
                    saveTemplates(active.id, next);
                  }}
                >
                  + Modèle
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                <Label htmlFor="recovery-template-edit">Texte</Label>
                <textarea
                  id="recovery-template-edit"
                  value={editorTemplate}
                  onChange={(e) => setEditorTemplate(e.target.value)}
                  className="min-h-[140px] w-full resize-y rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 font-mono text-xs text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                />
                <Button type="button" size="sm" onClick={persistEditor}>
                  Enregistrer ce modèle
                </Button>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function RecoveryPage() {
  const { loading, recoveryAssistedEnabled } = useDocumentModules();
  return (
    <DocumentModulePageGate
      loading={loading}
      enabled={recoveryAssistedEnabled}
      redirectTo="/marketplace/clients"
      redirectToast="Activez « Recouvrement » dans Marketplace (onglet Clients)."
    >
      <RecoveryPageContent />
    </DocumentModulePageGate>
  );
}
