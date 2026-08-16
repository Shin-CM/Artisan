import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CalendarPageHeader({
  monthLabel,
  loading,
  clientFollowupEnabled,
  recoveryAssistedEnabled,
  onShiftMonth,
  onJumpToday,
  onOpenSettings,
  onRefresh,
  onNewNeutral,
  onNavigateFollowup,
  onNavigateRecovery,
}: {
  monthLabel: string;
  loading: boolean;
  clientFollowupEnabled: boolean;
  recoveryAssistedEnabled: boolean;
  onShiftMonth: (delta: number) => void;
  onJumpToday: () => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
  onNewNeutral: () => void;
  onNavigateFollowup: () => void;
  onNavigateRecovery: () => void;
}) {
  return (
    <header className="flex shrink-0 flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2">
          <CalendarDays className="h-5 w-5 text-[var(--color-muted-foreground)]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">Calendrier</h1>
          <p
            className="text-sm tabular-nums text-[var(--color-muted-foreground)]"
            aria-live="polite"
          >
            {monthLabel}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Mois précédent"
            onClick={() => onShiftMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onJumpToday}
          >
            Aujourd’hui
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Mois suivant"
            onClick={() => onShiftMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Paramètres du calendrier"
          onClick={onOpenSettings}
          className="lg:hidden"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-4 w-4" />
          )}
          Actualiser
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Nouveau
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onNewNeutral();
              }}
            >
              Nouvel événement
            </DropdownMenuItem>
            {clientFollowupEnabled ? (
              <DropdownMenuItem onSelect={onNavigateFollowup}>
                Nouveau rappel client
              </DropdownMenuItem>
            ) : null}
            {recoveryAssistedEnabled ? (
              <DropdownMenuItem onSelect={onNavigateRecovery}>
                Planifier une relance
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
