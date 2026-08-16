import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useTheme } from "@/context/ThemeContext";
import { useTooltipPreference } from "@/context/TooltipPreferenceContext";
export function ProfileModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { workspaces, active, openWorkspace, leaveWorkspace } = useWorkspace();
  const { pref, setTheme } = useTheme();
  const { tooltipsEnabled, setTooltipsEnabled } = useTooltipPreference();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compte et préférences</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Thème</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["system", "Système"],
                  ["light", "Clair"],
                  ["dark", "Sombre"],
                ] as const
              ).map(([v, label]) => (
                <Button
                  key={v}
                  type="button"
                  size="sm"
                  variant={pref === v ? "default" : "outline"}
                  onClick={() => void setTheme(v)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-0.5">
              <Label htmlFor="pref-tooltips">Infobulles</Label>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Textes d’aide au survol des icônes (barre du haut, bases de
                données…)
              </p>
            </div>
            <Switch
              id="pref-tooltips"
              checked={tooltipsEnabled}
              onCheckedChange={setTooltipsEnabled}
              aria-label="Activer les infobulles"
            />
          </div>
          <div>
            <Label>Espaces de travail</Label>
            <ul className="mt-2 max-h-40 space-y-1 overflow-auto">
              {workspaces.map((w) => (
                <li key={w.id}>
                  <Button
                    type="button"
                    variant={active?.id === w.id ? "secondary" : "ghost"}
                    className="h-auto w-full justify-start py-2"
                    onClick={() => {
                      openWorkspace(w);
                      onOpenChange(false);
                    }}
                  >
                    {w.name}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              leaveWorkspace();
              onOpenChange(false);
            }}
          >
            Retour aux espaces de travail
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
