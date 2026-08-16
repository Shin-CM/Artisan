import * as React from "react";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  isLocalhostDevDemoSeedAvailable,
  seedLocalhostDemoData,
} from "@/lib/devLocalhostDemoSeed";
import { toast } from "sonner";

/**
 * Visible uniquement en `npm run dev` sur localhost / 127.0.0.1.
 * Insère des clients et articles de démo pour tester devis / factures / catalogue.
 */
export function DevLocalhostDemoSeedPanel({
  workspaceId,
  baseCurrency,
}: {
  workspaceId: string;
  baseCurrency: string;
}) {
  const [busy, setBusy] = React.useState(false);

  if (!isLocalhostDevDemoSeedAvailable()) return null;

  async function run() {
    setBusy(true);
    try {
      const r = await seedLocalhostDemoData(workspaceId, baseCurrency);
      if (r.skipped) {
        toast.message("Jeu de démo déjà en place", {
          description:
            "Supprimez les clients et articles préfixés « [Démo] » pour réinjecter depuis zéro.",
        });
        return;
      }
      const parts: string[] = [];
      if (r.clients) parts.push(`${r.clients} client(s)`);
      if (r.categories) parts.push(`${r.categories} catégorie(s)`);
      if (r.articles) parts.push(`${r.articles} article(s)`);
      toast.success("Données de démo injectées", {
        description:
          parts.length > 0
            ? `Ajout : ${parts.join(", ")}. Onglets Bases de données → Clients / Produits.`
            : "Rien à ajouter (déjà présent).",
      });
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-dashed border-amber-600/35 bg-transparent dark:border-amber-500/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Database className="h-4 w-4 shrink-0 text-amber-800 dark:text-amber-400" aria-hidden />
          Démo localhost
        </CardTitle>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Uniquement en <strong>mode développement</strong> (app Tauri <code className="text-[0.7rem]">tauri dev</code> ou
          Vite sur localhost). Crée 3 clients et 20 articles (variantes, forfaits, horaire) — préfixe « [Démo] ».
          Puis ouvrez <strong>Bases de données → Clients / Produits</strong> pour les voir.
        </p>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-amber-500/50"
          disabled={busy}
          onClick={() => void run()}
        >
          {busy ? "Injection…" : "Insérer clients + catalogue de test"}
        </Button>
      </CardContent>
    </Card>
  );
}
