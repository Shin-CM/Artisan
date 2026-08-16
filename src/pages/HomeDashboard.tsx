import * as React from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import { DevLocalhostDemoSeedPanel } from "@/components/DevLocalhostDemoSeedPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/** Couleurs pour les années précédentes (lisibles en clair / sombre). */
const PAST_YEAR_STROKES = [
  "hsl(220 14% 46%)",
  "hsl(280 32% 52%)",
  "hsl(24 75% 48%)",
  "hsl(160 36% 38%)",
  "hsl(340 55% 48%)",
];

const tooltipSurfaceStyle: React.CSSProperties = {
  backgroundColor: "var(--color-popover)",
  color: "var(--color-popover-foreground)",
  border: "1px solid var(--color-border)",
  borderRadius: "6px",
};

export function HomeDashboard() {
  const { active } = useWorkspace();
  const [stats, setStats] = React.useState<api.DashboardStats | null>(null);
  const [yearCount, setYearCount] = React.useState(3);
  const [comparison, setComparison] =
    React.useState<api.RevenueComparison | null>(null);

  React.useEffect(() => {
    if (!active) return;
    void api.getDashboardStats(active.id).then(setStats);
  }, [active]);

  React.useEffect(() => {
    if (!active) return;
    void api
      .getRevenueComparison(active.id, yearCount)
      .then(setComparison)
      .catch(() => setComparison(null));
  }, [active, yearCount]);

  const chartRows = React.useMemo(() => {
    if (!comparison?.months?.length) return [];
    return comparison.months.map((m) => ({
      monthLabel: m.monthLabel,
      month: m.month,
      ...m.amounts,
    }));
  }, [comparison]);

  const chartYears = comparison?.years ?? [];

  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", {
      style: "currency",
      currency: active?.baseCurrency || "EUR",
    });

  const currentCalendarYear = new Date().getFullYear();

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Tableau de bord</h1>
        {active ? (
          <DevLocalhostDemoSeedPanel
            workspaceId={active.id}
            baseCurrency={active.baseCurrency}
          />
        ) : null}
        {!stats ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Chargement des indicateurs…
          </p>
        ) : null}
        {!stats ? null : (
          <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chiffre d’affaires total</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {fmt(stats.revenueTotal)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CA du mois</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {fmt(stats.revenueMonth)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CA de l’année</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {fmt(stats.revenueYear)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Factures en attente</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {stats.invoicesOutstanding}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Factures payées</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {stats.invoicesPaid}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">
                Évolution du CA (factures)
              </CardTitle>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Même périmètre que les cartes : factures émises / payées (hors
                brouillon). Une courbe par année calendaire ; l’année en cours
                est mise en avant.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <Label htmlFor="dash-year-span" className="text-xs">
                Période
              </Label>
              <select
                id="dash-year-span"
                className="h-9 rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm text-[var(--color-foreground)] focus:outline-none disabled:opacity-50"
                value={yearCount}
                onChange={(e) => setYearCount(Number(e.target.value))}
              >
                <option value={1}>1 an</option>
                <option value={2}>2 ans</option>
                <option value={3}>3 ans</option>
                <option value={4}>4 ans</option>
                <option value={5}>5 ans</option>
                <option value={6}>6 ans</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {chartRows.length === 0 || chartYears.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Aucune donnée sur la période.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartRows} margin={{ top: 8, right: 8 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{
                      fontSize: 11,
                      fill: "var(--color-muted-foreground)",
                    }}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
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
                    cursor={{
                      stroke: "var(--color-border)",
                      strokeWidth: 1,
                    }}
                    formatter={(v) =>
                      fmt(typeof v === "number" ? v : Number(v))
                    }
                    itemSorter={(item) => {
                      const y = Number(item.dataKey);
                      if (Number.isFinite(y) && y === currentCalendarYear) {
                        return Number.MIN_SAFE_INTEGER;
                      }
                      if (Number.isFinite(y)) {
                        return -y;
                      }
                      return 0;
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 12,
                      color: "var(--color-foreground)",
                    }}
                  />
                  {chartYears.map((y) => {
                    const key = String(y);
                    const isCurrent = y === currentCalendarYear;
                    const pastYears = chartYears.filter(
                      (yy) => yy !== currentCalendarYear,
                    );
                    const pastIndex = pastYears.indexOf(y);
                    const stroke = isCurrent
                      ? "var(--color-primary)"
                      : PAST_YEAR_STROKES[
                          pastIndex >= 0
                            ? pastIndex % PAST_YEAR_STROKES.length
                            : 0
                        ];
                    return (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={String(y)}
                        stroke={stroke}
                        strokeWidth={isCurrent ? 3 : 2}
                        dot={{ r: isCurrent ? 3 : 2 }}
                        connectNulls
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  );
}
