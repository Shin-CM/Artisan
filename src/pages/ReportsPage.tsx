import * as React from "react";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#94a3b8"];

/** Aligné sur `HomeDashboard` : évite le fond blanc par défaut de Recharts. */
const tooltipSurfaceStyle: React.CSSProperties = {
  backgroundColor: "var(--color-popover)",
  color: "var(--color-popover-foreground)",
  border: "1px solid var(--color-border)",
  borderRadius: "6px",
};

/** Survol barres : pas de voile clair (défaut Recharts illisible en thème sombre). */
const barTooltipCursor = {
  fill: "var(--color-muted)",
  fillOpacity: 0.22,
} as const;

function parseYmd(iso: string): Date | null {
  const d = iso?.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const t = new Date(`${d}T12:00:00`);
  return Number.isNaN(t.getTime()) ? null : t;
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function ReportsPage() {
  const { active } = useWorkspace();
  const [invoices, setInvoices] = React.useState<api.Invoice[]>([]);
  const [creditNotes, setCreditNotes] = React.useState<api.Invoice[]>([]);
  const [clients, setClients] = React.useState<api.Client[]>([]);

  React.useEffect(() => {
    if (!active) return;
    void Promise.all([
      api.listInvoices(active.id).then(setInvoices),
      api.listCreditNotes(active.id).then(setCreditNotes),
      api.listClients(active.id).then(setClients),
    ]);
  }, [active]);

  const invoicesScoped = invoices;
  const creditNotesScoped = creditNotes;

  const byStatus = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const inv of invoicesScoped) {
      m.set(inv.status, (m.get(inv.status) ?? 0) + 1);
    }
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [invoicesScoped]);

  const byMonth = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const inv of invoicesScoped) {
      const key = inv.issueDate.slice(0, 7);
      m.set(key, (m.get(key) ?? 0) + inv.total);
    }
    for (const cn of creditNotesScoped) {
      const key = cn.issueDate.slice(0, 7);
      m.set(key, (m.get(key) ?? 0) - cn.total);
    }
    return [...m.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, ca]) => ({ mois, ca }));
  }, [invoicesScoped, creditNotesScoped]);

  const today = React.useMemo(() => {
    const t = new Date();
    t.setHours(12, 0, 0, 0);
    return t;
  }, []);

  const cashForecastWeeks = React.useMemo(() => {
    const start = startOfWeekMonday(today);
    const weeks: { semaine: string; encaissementsAttendus: number }[] = [];
    for (let w = 0; w < 8; w++) {
      const ws = new Date(start);
      ws.setDate(ws.getDate() + w * 7);
      weeks.push({
        semaine: ws.toISOString().slice(0, 10),
        encaissementsAttendus: 0,
      });
    }
    const horizonEnd = new Date(start);
    horizonEnd.setDate(horizonEnd.getDate() + 8 * 7);
    for (const inv of invoicesScoped) {
      if ((inv.documentKind ?? "invoice") !== "invoice") continue;
      if (inv.archived === true) continue;
      const rem = inv.total - inv.amountPaid;
      if (rem <= 0.005) continue;
      const due = inv.dueDate ? parseYmd(inv.dueDate) : null;
      if (!due || due < today || due >= horizonEnd) continue;
      const wi = Math.floor(
        (due.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000),
      );
      if (wi >= 0 && wi < 8) {
        weeks[wi].encaissementsAttendus += rem;
      }
    }
    return weeks;
  }, [invoicesScoped, today]);

  const agingBalances = React.useMemo(() => {
    const buckets = {
      courant: 0,
      j1_30: 0,
      j31_60: 0,
      j61_90: 0,
      j90p: 0,
    };
    for (const inv of invoicesScoped) {
      if ((inv.documentKind ?? "invoice") !== "invoice") continue;
      if (inv.archived === true) continue;
      const rem = inv.total - inv.amountPaid;
      if (rem <= 0.005) continue;
      const due = inv.dueDate ? parseYmd(inv.dueDate) : null;
      if (!due) {
        buckets.courant += rem;
        continue;
      }
      if (due >= today) {
        buckets.courant += rem;
        continue;
      }
      const days = Math.floor(
        (today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (days <= 30) buckets.j1_30 += rem;
      else if (days <= 60) buckets.j31_60 += rem;
      else if (days <= 90) buckets.j61_90 += rem;
      else buckets.j90p += rem;
    }
    return buckets;
  }, [invoicesScoped, today]);

  const topClients = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const inv of invoicesScoped) {
      if ((inv.documentKind ?? "invoice") !== "invoice") continue;
      if (!inv.clientId) continue;
      m.set(inv.clientId, (m.get(inv.clientId) ?? 0) + inv.total);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [invoicesScoped]);

  const clientById = React.useMemo(() => {
    const m = new Map<string, api.Client>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  const currency = active?.baseCurrency ?? "EUR";
  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", { style: "currency", currency });

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="space-y-8">
      <PageTitleWithInfo
        description={
          <>
            Aperçu basé sur les factures et avoirs en base.
          </>
        }
      >
        <h1 className="text-xl font-semibold">Rapports</h1>
      </PageTitleWithInfo>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-72 rounded-lg border border-[var(--color-border)] p-4">
          <h2 className="mb-2 text-sm font-medium">Chiffre d’affaires par mois</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={byMonth}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                opacity={0.55}
              />
              <XAxis
                dataKey="mois"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <Tooltip
                contentStyle={tooltipSurfaceStyle}
                labelStyle={{
                  color: "var(--color-popover-foreground)",
                  fontWeight: 600,
                }}
                itemStyle={{ color: "var(--color-popover-foreground)" }}
                wrapperStyle={{ outline: "none" }}
                cursor={barTooltipCursor}
                formatter={(v) => fmt(typeof v === "number" ? v : Number(v))}
                labelFormatter={(l) => `Mois ${l}`}
              />
              <Bar dataKey="ca" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-72 rounded-lg border border-[var(--color-border)] p-4">
          <h2 className="mb-2 text-sm font-medium">Répartition par statut</h2>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={byStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name} (${value})`}
              >
                {byStatus.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipSurfaceStyle}
                labelStyle={{
                  color: "var(--color-popover-foreground)",
                  fontWeight: 600,
                }}
                itemStyle={{ color: "var(--color-popover-foreground)" }}
                wrapperStyle={{ outline: "none" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-72 rounded-lg border border-[var(--color-border)] p-4">
          <h2 className="mb-2 text-sm font-medium">
            Prévisionnel d’encaissement (8 semaines)
          </h2>
          <p className="mb-2 text-xs text-[var(--color-muted-foreground)]">
            Somme des restes dûs des factures non archivées, répartis par semaine
            d’échéance (lundi de début de semaine).
          </p>
          <ResponsiveContainer width="100%" height="78%">
            <BarChart data={cashForecastWeeks}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                opacity={0.55}
              />
              <XAxis
                dataKey="semaine"
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              />
              <Tooltip
                contentStyle={tooltipSurfaceStyle}
                labelStyle={{
                  color: "var(--color-popover-foreground)",
                  fontWeight: 600,
                }}
                itemStyle={{ color: "var(--color-popover-foreground)" }}
                wrapperStyle={{ outline: "none" }}
                cursor={barTooltipCursor}
                formatter={(v) => fmt(typeof v === "number" ? v : Number(v))}
                labelFormatter={(l) => `Semaine du ${l}`}
              />
              <Bar
                dataKey="encaissementsAttendus"
                fill="#0ea5e9"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] p-4">
          <h2 className="mb-2 text-sm font-medium">
            Créances — ancienneté des créances (restes dûs)
          </h2>
          <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">
            Hors avoirs ; factures non soldées. « Non échues » = sans échéance ou
            échéance future.
          </p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[var(--color-border)]">
              <tr>
                <td className="py-1.5 text-[var(--color-muted-foreground)]">
                  Non échues / à jour
                </td>
                <td className="py-1.5 text-right tabular-nums font-medium">
                  {fmt(agingBalances.courant)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-[var(--color-muted-foreground)]">
                  1 à 30 j. de retard
                </td>
                <td className="py-1.5 text-right tabular-nums font-medium">
                  {fmt(agingBalances.j1_30)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-[var(--color-muted-foreground)]">
                  31 à 60 j.
                </td>
                <td className="py-1.5 text-right tabular-nums font-medium">
                  {fmt(agingBalances.j31_60)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-[var(--color-muted-foreground)]">
                  61 à 90 j.
                </td>
                <td className="py-1.5 text-right tabular-nums font-medium">
                  {fmt(agingBalances.j61_90)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-[var(--color-muted-foreground)]">
                  Plus de 90 j.
                </td>
                <td className="py-1.5 text-right tabular-nums font-medium">
                  {fmt(agingBalances.j90p)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] p-4">
        <h2 className="mb-2 text-sm font-medium">
          Top clients (CA TTC facturé, période affichée)
        </h2>
        {topClients.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Aucune donnée.
          </p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topClients.map(([id, ca]) => ({
                  nom:
                    clientById.get(id)?.name?.trim().slice(0, 24) || "—",
                  ca,
                }))}
                layout="vertical"
                margin={{ left: 8, right: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  opacity={0.55}
                />
                <XAxis
                  type="number"
                  tick={{
                    fontSize: 11,
                    fill: "var(--color-muted-foreground)",
                  }}
                  tickFormatter={(v) => fmt(v)}
                />
                <YAxis
                  type="category"
                  dataKey="nom"
                  width={100}
                  tick={{
                    fontSize: 10,
                    fill: "var(--color-muted-foreground)",
                  }}
                />
                <Tooltip
                  contentStyle={tooltipSurfaceStyle}
                  labelStyle={{
                    color: "var(--color-popover-foreground)",
                    fontWeight: 600,
                  }}
                  itemStyle={{ color: "var(--color-popover-foreground)" }}
                  wrapperStyle={{ outline: "none" }}
                  cursor={barTooltipCursor}
                  formatter={(v) => fmt(typeof v === "number" ? v : Number(v))}
                />
                <Bar dataKey="ca" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
