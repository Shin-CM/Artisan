import * as React from "react";
import { Bell, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  emptyAlertBuckets,
  loadAlerts,
  totalAlerts,
  type Alert,
  type AlertBuckets,
} from "@/lib/alertsAggregator";

const SECTION_TITLES: Record<keyof AlertBuckets, string> = {
  today: "À traiter aujourd’hui",
  thisWeek: "Cette semaine",
  watch: "À surveiller",
};

/** Périodicité de rafraîchissement de la cloche (ms). 60 s, sans polling agressif. */
const REFRESH_INTERVAL_MS = 60_000;

export function AlertsBell() {
  const { active } = useWorkspace();
  const {
    clientFollowupEnabled,
    recoveryAssistedEnabled,
    stockManagerEnabled,
    loading: modulesLoading,
  } = useDocumentModules();
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [buckets, setBuckets] = React.useState<AlertBuckets>(emptyAlertBuckets);

  const refresh = React.useCallback(async () => {
    if (!active) {
      setBuckets(emptyAlertBuckets());
      return;
    }
    setLoading(true);
    try {
      const next = await loadAlerts(active.id, {
        clientFollowupEnabled,
        recoveryAssistedEnabled,
        stockManagerEnabled,
      });
      setBuckets(next);
    } catch {
      setBuckets(emptyAlertBuckets());
    } finally {
      setLoading(false);
    }
  }, [active, clientFollowupEnabled, recoveryAssistedEnabled, stockManagerEnabled]);

  React.useEffect(() => {
    if (modulesLoading) return;
    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [refresh, modulesLoading]);

  React.useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const total = totalAlerts(buckets);

  function openAlert(alert: Alert) {
    setOpen(false);
    void navigate(alert.navigatePath);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Alertes"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {total > 0 ? (
                <span
                  aria-hidden
                  className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white"
                >
                  {total > 99 ? "99+" : total}
                </span>
              ) : null}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Alertes</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        sideOffset={6}
        className={cn(
          "w-[22rem] max-h-[28rem] min-w-0 p-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
          <h3 className="text-sm font-semibold">Alertes</h3>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--color-muted-foreground)]" />
          ) : (
            <span className="text-xs text-[var(--color-muted-foreground)] tabular-nums">
              {total}
            </span>
          )}
        </div>
        <div className="max-h-[22rem] overflow-y-auto">
          {total === 0 && !loading ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--color-muted-foreground)]">
              Aucune alerte en cours.
            </p>
          ) : (
            <>
              <AlertSection
                title={SECTION_TITLES.today}
                alerts={buckets.today}
                onOpen={openAlert}
                emphasis="today"
              />
              <AlertSection
                title={SECTION_TITLES.thisWeek}
                alerts={buckets.thisWeek}
                onOpen={openAlert}
              />
              <AlertSection
                title={SECTION_TITLES.watch}
                alerts={buckets.watch}
                onOpen={openAlert}
              />
            </>
          )}
        </div>
        <div className="border-t border-[var(--color-border)] px-3 py-2 text-right">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              void navigate("/calendar");
            }}
          >
            Ouvrir le calendrier
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AlertSection({
  title,
  alerts,
  onOpen,
  emphasis,
}: {
  title: string;
  alerts: Alert[];
  onOpen: (alert: Alert) => void;
  emphasis?: "today";
}) {
  if (alerts.length === 0) return null;
  return (
    <section>
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-muted)]/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {title}
        <span className="ml-2 tabular-nums">{alerts.length}</span>
      </header>
      <ul>
        {alerts.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onOpen(a)}
              className={cn(
                "flex w-full items-start gap-2 border-b border-[var(--color-border)] px-3 py-2 text-left last:border-b-0 hover:bg-[var(--color-muted)]/40",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-1 inline-block h-2 w-2 shrink-0 rounded-full",
                  emphasis === "today" ? "bg-red-500" : "bg-amber-500",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{a.title}</div>
                {a.subtitle ? (
                  <div className="mt-0.5 truncate text-xs text-[var(--color-muted-foreground)]">
                    {a.subtitle}
                  </div>
                ) : null}
              </div>
              <span className="ml-2 shrink-0 text-[11px] tabular-nums text-[var(--color-muted-foreground)]">
                {a.date.slice(5)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
