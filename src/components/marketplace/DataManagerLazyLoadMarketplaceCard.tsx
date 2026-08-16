import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Database, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import {
  DATA_MANAGER_LAZY_MODULE_ANCHOR,
  DATA_MANAGER_LAZY_MODULE_META,
  dataManagerLazyManifestJson,
  findDataManagerLazyPlugin,
  isDataManagerLazyLoadEnabled,
} from "@/lib/marketplaceModules";
import { toast } from "sonner";
import {
  marketplaceBadgeActiveClass,
  marketplaceCardArticleClass,
  marketplaceCardButtonClass,
  marketplaceCardIconFrameClass,
  marketplaceCardSummaryForModalClass,
  marketplaceCardTitleClass,
  marketplaceChevronClass,
  marketplaceDialogActionsClass,
  marketplaceDialogBodyClass,
  marketplaceDialogContentClass,
  marketplaceDialogHeroClass,
  marketplaceDialogLeadClass,
  marketplaceDialogSpecClass,
  marketplaceDialogTitleClass,
  marketplaceModalIconFrameClass,
  marketplaceModalStatusRowClass,
} from "@/components/marketplace/marketplaceLuxuryClasses";

/** Carte Marketplace : clic pour ouvrir la modale de présentation. */
export function DataManagerLazyLoadMarketplaceCard() {
  const { active } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const [plugins, setPlugins] = React.useState<api.PluginRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!active) {
      setPlugins([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await api.listPlugins(active.id);
      setPlugins(list);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }, [active]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (location.hash === `#${DATA_MANAGER_LAZY_MODULE_ANCHOR}`) {
      setModalOpen(true);
    }
  }, [location.hash]);

  function handleModalOpenChange(open: boolean) {
    setModalOpen(open);
    if (!open && location.hash === `#${DATA_MANAGER_LAZY_MODULE_ANCHOR}`) {
      navigate(
        { pathname: location.pathname, search: location.search, hash: "" },
        { replace: true },
      );
    }
  }

  const row = findDataManagerLazyPlugin(plugins);
  const enabled = isDataManagerLazyLoadEnabled(plugins);

  async function activate() {
    if (!active) return;
    if (row?.enabled) return;
    setBusy(true);
    try {
      if (row && !row.enabled) {
        await api.setPluginEnabled(row.id, true);
      } else if (!row) {
        await api.registerPluginManifest(
          active.id,
          dataManagerLazyManifestJson(),
        );
      }
      await load();
      toast.success("Module « Data Manager — chargement à la demande » activé");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    if (!row) return;
    setBusy(true);
    try {
      await api.setPluginEnabled(row.id, false);
      await load();
      toast.success("Module désactivé");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={modalOpen} onOpenChange={handleModalOpenChange}>
      <article
        id={DATA_MANAGER_LAZY_MODULE_ANCHOR}
        className={marketplaceCardArticleClass}
      >
        <button
          type="button"
          aria-haspopup="dialog"
          id={`${DATA_MANAGER_LAZY_MODULE_ANCHOR}-toggle`}
          className={marketplaceCardButtonClass}
          onClick={() => setModalOpen(true)}
        >
          <div className={marketplaceCardIconFrameClass}>
            <Database className="h-4 w-4 text-[var(--color-muted-foreground)]" />
          </div>
          <h3 className={marketplaceCardTitleClass}>
            {DATA_MANAGER_LAZY_MODULE_META.displayName}
          </h3>
          <ChevronRight className={marketplaceChevronClass} aria-hidden />
        </button>
      </article>

      <DialogContent className={marketplaceDialogContentClass}>
        <div className={marketplaceDialogHeroClass}>
          <DialogHeader className="space-y-0 text-left">
            <div className="flex items-start gap-4">
              <div className={marketplaceModalIconFrameClass}>
                <Database className="h-6 w-6 text-[var(--color-muted-foreground)]" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <DialogTitle className={marketplaceDialogTitleClass}>
                  {DATA_MANAGER_LAZY_MODULE_META.displayName}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className={marketplaceDialogBodyClass}>
          <div className={marketplaceModalStatusRowClass}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--color-muted-foreground)]" />
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  Chargement du statut…
                </span>
              </>
            ) : enabled ? (
              <span className={marketplaceBadgeActiveClass}>
                <CheckCircle2 className="h-3 w-3" />
                Actif
              </span>
            ) : row ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Inactif
              </span>
            ) : (
              <span className="text-xs text-[var(--color-muted-foreground)]">
                Non installé — activez depuis cette fiche.
              </span>
            )}
          </div>
          <p className={marketplaceCardSummaryForModalClass}>
            Ne charge les listes clients, catalogue et documents qu’à l’ouverture
            des dossiers (moins d’appels au démarrage ; cache tant que vous restez
            sur la page).
          </p>
          <p className={`${marketplaceDialogLeadClass} mt-3`}>
            Par défaut, le Data Manager charge tout l’inventaire à l’ouverture.
            Avec ce module, seul l’historique d’import est chargé au départ ; chaque
            dossier de la barre latérale déclenche les requêtes nécessaires une
            première fois, puis réutilise les données en mémoire.
          </p>

          <dl className={marketplaceDialogSpecClass}>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">
                Identifiant
              </dt>
              <dd className="mt-0.5 font-mono text-[11px] text-[var(--color-foreground)]">
                {DATA_MANAGER_LAZY_MODULE_META.id}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Version</dt>
              <dd className="mt-0.5 text-[var(--color-foreground)]">
                {DATA_MANAGER_LAZY_MODULE_META.version}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--color-muted-foreground)]">
                Capacités
              </dt>
              <dd className="mt-0.5 font-mono text-[11px] text-[var(--color-foreground)]">
                {DATA_MANAGER_LAZY_MODULE_META.capabilities.join(", ")}
              </dd>
            </div>
            {row ? (
              <div className="sm:col-span-2">
                <dt className="text-[var(--color-muted-foreground)]">
                  Installation (ligne registre)
                </dt>
                <dd className="mt-0.5 font-mono text-[11px] text-[var(--color-foreground)]">
                  {row.id}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className={marketplaceDialogActionsClass}>
            {!enabled ? (
              <Button
                type="button"
                size="default"
                className="min-w-[7rem] shadow-sm"
                disabled={!active || busy || loading}
                onClick={() => void activate()}
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Activer
              </Button>
            ) : (
              <Button
                type="button"
                size="default"
                variant="outline"
                className="min-w-[7rem]"
                disabled={busy || loading || !row}
                onClick={() => void deactivate()}
              >
                Désactiver
              </Button>
            )}
            <Button type="button" size="default" variant="secondary" asChild>
              <Link to="/data-manager">Ouvrir le Data Manager</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
