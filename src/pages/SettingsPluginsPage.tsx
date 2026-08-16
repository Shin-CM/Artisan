import * as React from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import {
  CopyCornerButton,
  TextareaWithCopyButton,
} from "@/components/TextareaWithCopyButton";
import { Button } from "@/components/ui/button";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { toast } from "sonner";
import { parseInternalManifest } from "@/plugins/pluginHost";

export function SettingsPluginsPage() {
  const { active } = useWorkspace();
  const [plugins, setPlugins] = React.useState<api.PluginRow[]>([]);
  const [manifestJson, setManifestJson] = React.useState(
    '{\n  "id": "demo",\n  "name": "Extension démo",\n  "version": "1.0.0",\n  "capabilities": []\n}',
  );

  const loadPlugins = React.useCallback(async () => {
    if (!active) return;
    const p = await api.listPlugins(active.id);
    setPlugins(p);
  }, [active]);

  React.useEffect(() => {
    void loadPlugins();
  }, [loadPlugins]);

  async function registerPlugin() {
    if (!active) return;
    try {
      JSON.parse(manifestJson);
    } catch {
      toast.error("JSON manifeste invalide");
      return;
    }
    try {
      await api.registerPluginManifest(active.id, manifestJson);
      toast.success("Manifeste enregistré");
      void loadPlugins();
    } catch (e) {
      toast.error(String(e));
    }
  }

  if (!active) return null;

  return (
    <div className="h-full min-h-0 w-full min-w-0 space-y-6 overflow-y-auto">
      <div>
        <PageTitleWithInfo
          description="Mode avancé — JSON versionné par workspace pour l’hôte d’extensions (navigation BDD, panneaux)."
        >
          <h1 className="text-xl font-semibold">Manifeste interne</h1>
        </PageTitleWithInfo>
      </div>
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Collez un manifeste conforme au format attendu par l’application.
        </p>
        <TextareaWithCopyButton
          className="min-h-[160px] w-full bg-[var(--color-background)] focus:outline-none"
          value={manifestJson}
          onChange={(e) => setManifestJson(e.target.value)}
          copyButtonAriaLabel="Copier le manifeste JSON"
          copyButtonTitle="Copier"
        />
        <Button type="button" onClick={() => void registerPlugin()}>
          Enregistrer le manifeste
        </Button>
        <ul className="space-y-2 text-sm">
          {plugins.map((p) => (
            <li
              key={p.id}
              className="rounded border border-[var(--color-border)] p-2"
            >
              <span className="text-[var(--color-muted-foreground)]">
                {parseInternalManifest(p.manifestJson)?.name ?? p.id} ·{" "}
                {p.enabled ? "activé" : "désactivé"}
              </span>
              <div className="relative mt-2">
                <pre className="max-h-32 overflow-auto whitespace-pre-wrap py-2 pl-2 pr-10 text-xs">
                  {p.manifestJson}
                </pre>
                <CopyCornerButton
                  className="absolute right-1 top-1"
                  getText={() => p.manifestJson}
                  copyAriaLabel={`Copier le manifeste enregistré · ${p.id}`}
                  copyTitle="Copier"
                />
              </div>
            </li>
          ))}
          {plugins.length === 0 && (
            <li className="text-[var(--color-muted-foreground)]">
              Aucune extension enregistrée.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
