import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { folderLabelForKey } from "@/lib/brandingWorkspaceFontGroups";
import { FolderInput } from "lucide-react";

export type WorkspacePdfFontMovePopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerDisabled: boolean;
  destinationFolderKeys: string[];
  busy: boolean;
  customFolder: string;
  onCustomFolderChange: (value: string) => void;
  onMoveTo: (targetFolderKey: string) => void;
};

export function WorkspacePdfFontMovePopover({
  open,
  onOpenChange,
  triggerDisabled,
  destinationFolderKeys,
  busy,
  customFolder,
  onCustomFolderChange,
  onMoveTo,
}: WorkspacePdfFontMovePopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 shrink-0 p-0"
          title="Déplacer la sélection vers un dossier"
          disabled={triggerDisabled}
        >
          <FolderInput className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="sr-only">Déplacer la sélection vers un dossier</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <p className="mb-2 text-xs font-medium text-[var(--color-foreground)]">
          Dossier cible
        </p>
        <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-md border border-[var(--color-border)] p-1">
          {destinationFolderKeys.map((destKey) => (
            <button
              key={destKey || "__root__"}
              type="button"
              className="w-full rounded px-2 py-1.5 text-left text-xs text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/50"
              disabled={busy}
              onClick={() => void onMoveTo(destKey)}
            >
              {folderLabelForKey(destKey)}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-1.5 border-t border-[var(--color-border)] pt-3">
          <Label
            htmlFor="move-font-custom-folder"
            className="text-xs text-[var(--color-muted-foreground)]"
          >
            Autre chemin sous <span className="font-mono">fonts/</span>{" "}
            (segments <span className="font-mono">/</span>)
          </Label>
          <div className="flex flex-wrap gap-1.5">
            <Input
              id="move-font-custom-folder"
              className="h-8 min-w-0 flex-1 font-mono text-xs"
              value={customFolder}
              disabled={busy}
              placeholder="ex. Ma_famille/Gras"
              onChange={(e) => onCustomFolderChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void onMoveTo(customFolder);
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0"
              disabled={busy}
              onClick={() => void onMoveTo(customFolder)}
            >
              Déplacer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
