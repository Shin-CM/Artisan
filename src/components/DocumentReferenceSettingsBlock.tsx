import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type DocumentReferenceSettingsBlockProps = {
  idPrefix: string;
  title: string;
  /** Ex. « devis », « facture » (minuscule, pour les phrases). */
  docName: string;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  prefix: string;
  onPrefixChange: (v: string) => void;
  template: string;
  onTemplateChange: (v: string) => void;
  defaultRef: string;
  onDefaultRefChange: (v: string) => void;
};

export function DocumentReferenceSettingsBlock({
  idPrefix,
  title,
  docName,
  enabled,
  onEnabledChange,
  prefix,
  onPrefixChange,
  template,
  onTemplateChange,
  defaultRef,
  onDefaultRefChange,
}: DocumentReferenceSettingsBlockProps) {
  const switchId = `${idPrefix}-allow-custom-ref`;

  return (
    <div className="rounded-md border border-[var(--color-border)] p-3">
      <p className="text-sm font-medium leading-tight">{title}</p>
      <div className="mt-2 flex items-center gap-2">
        <Switch
          id={switchId}
          checked={enabled}
          onCheckedChange={onEnabledChange}
          aria-label={`Référence personnalisée pour les ${docName}s`}
        />
        <Label htmlFor={switchId} className="cursor-pointer text-sm font-normal">
          Autoriser une référence personnalisée
        </Label>
      </div>
      {enabled ? (
        <div className="mt-3 space-y-3 border-t border-[var(--color-border)] pt-3">
          <div>
            <Label htmlFor={`${idPrefix}-prefix`} className="text-sm">
              Code court (optionnel)
            </Label>
            <Input
              id={`${idPrefix}-prefix`}
              className="mt-1 text-sm"
              value={prefix}
              onChange={(e) => onPrefixChange(e.target.value)}
              placeholder="Ex. ACME"
              autoComplete="off"
            />
          </div>
          <div>
            <Label htmlFor={`${idPrefix}-template`} className="text-sm">
              Modèle de référence (optionnel)
            </Label>
            <Input
              id={`${idPrefix}-template`}
              className="mt-1 font-mono text-sm"
              value={template}
              onChange={(e) => onTemplateChange(e.target.value)}
              placeholder="Ex. {PREFIX}{YYYY}-{AUTO}"
              autoComplete="off"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="w-full text-[11px] text-[var(--color-muted-foreground)]">
                Exemples rapides :
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onTemplateChange("{PREFIX}{YYYY}-{AUTO}")}
              >
                Code + année + n°
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onTemplateChange("{PREFIX}{AUTO}")}
              >
                Code + n°
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onTemplateChange("{YYYY}{MM}-{AUTO}")}
              >
                Année-mois + n°
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor={`${idPrefix}-default`} className="text-sm">
              Texte prérempli (nouveau {docName})
            </Label>
            <Input
              id={`${idPrefix}-default`}
              className="mt-1 text-sm"
              value={defaultRef}
              onChange={(e) => onDefaultRefChange(e.target.value)}
              placeholder="Facultatif — remplit le champ à l’ouverture"
              autoComplete="off"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
