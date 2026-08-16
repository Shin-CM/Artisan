import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Type, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
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
  findPdfTypographyPlugin,
  isPdfTypographyEnabled,
  PDF_TYPOGRAPHY_MODULE_ANCHOR,
  PDF_TYPOGRAPHY_MODULE_META,
  pdfTypographyManifestJson,
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
export function PdfTypographyMarketplaceCard() {
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
    if (location.hash === `#${PDF_TYPOGRAPHY_MODULE_ANCHOR}`) {
      setModalOpen(true);
    }
  }, [location.hash]);

  function handleModalOpenChange(open: boolean) {
    setModalOpen(open);
    if (
      !open &&
      location.hash === `#${PDF_TYPOGRAPHY_MODULE_ANCHOR}`
    ) {
      navigate(
        { pathname: location.pathname, search: location.search, hash: "" },
        { replace: true },
      );
    }
  }

  const typoRow = findPdfTypographyPlugin(plugins);
  const typoEnabled = isPdfTypographyEnabled(plugins);

  async function activateTypography() {
    if (!active) return;
    if (typoRow?.enabled) return;
    setBusy(true);
    try {
      if (typoRow && !typoRow.enabled) {
        await api.setPluginEnabled(typoRow.id, true);
      } else if (!typoRow) {
        await api.registerPluginManifest(
          active.id,
          pdfTypographyManifestJson(),
        );
      }
      await load();
      toast.success("Module « Typographie PDF » activé");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function deactivateTypography() {
    if (!typoRow) return;
    setBusy(true);
    try {
      await api.setPluginEnabled(typoRow.id, false);
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
        id={PDF_TYPOGRAPHY_MODULE_ANCHOR}
        className={marketplaceCardArticleClass}
      >
        <button
          type="button"
          aria-haspopup="dialog"
          id={`${PDF_TYPOGRAPHY_MODULE_ANCHOR}-toggle`}
          className={marketplaceCardButtonClass}
          onClick={() => setModalOpen(true)}
        >
          <div className={marketplaceCardIconFrameClass}>
            <Type className="h-4 w-4 text-[var(--color-muted-foreground)]" />
          </div>
          <h3 className={marketplaceCardTitleClass}>
            {PDF_TYPOGRAPHY_MODULE_META.displayName}
          </h3>
          <ChevronRight className={marketplaceChevronClass} aria-hidden />
        </button>
      </article>

      <DialogContent className={marketplaceDialogContentClass}>
        <div className={marketplaceDialogHeroClass}>
          <DialogHeader className="space-y-0 text-left">
            <div className="flex items-start gap-4">
              <div className={marketplaceModalIconFrameClass}>
                <Type className="h-6 w-6 text-[var(--color-muted-foreground)]" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <DialogTitle className={marketplaceDialogTitleClass}>
                  {PDF_TYPOGRAPHY_MODULE_META.displayName}
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
            ) : typoEnabled ? (
              <span className={marketplaceBadgeActiveClass}>
                <CheckCircle2 className="h-3 w-3" />
                Actif
              </span>
            ) : typoRow ? (
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
            Gras, italique et gras italique par zone sur vos PDF devis et
            factures.
          </p>
          <p className={`${marketplaceDialogLeadClass} mt-3`}>
            Contrôlez l’emphase typographique par bloc : en-tête document,
            bandeau, titre « Devis / Facture », métadonnées, client, tableau des
            lignes, totaux, compléments et pied de page. Les réglages sont dans{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              Paramètres → Mise en page PDF
            </span>{" "}
            une fois le module activé.
          </p>

          <dl className={marketplaceDialogSpecClass}>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">
                Identifiant
              </dt>
              <dd className="mt-0.5 font-mono text-[11px] text-[var(--color-foreground)]">
                {PDF_TYPOGRAPHY_MODULE_META.id}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Version</dt>
              <dd className="mt-0.5 text-[var(--color-foreground)]">
                {PDF_TYPOGRAPHY_MODULE_META.version}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--color-muted-foreground)]">
                Capacités
              </dt>
              <dd className="mt-0.5 font-mono text-[11px] text-[var(--color-foreground)]">
                {PDF_TYPOGRAPHY_MODULE_META.capabilities.join(", ")}
              </dd>
            </div>
            {typoRow ? (
              <div className="sm:col-span-2">
                <dt className="text-[var(--color-muted-foreground)]">
                  Installation (ligne registre)
                </dt>
                <dd className="mt-0.5 font-mono text-[11px] text-[var(--color-foreground)]">
                  {typoRow.id}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className={marketplaceDialogActionsClass}>
            {!typoEnabled ? (
              <Button
                type="button"
                size="default"
                className="min-w-[7rem] shadow-sm"
                disabled={!active || busy || loading}
                onClick={() => void activateTypography()}
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
                disabled={busy || loading || !typoRow}
                onClick={() => void deactivateTypography()}
              >
                Désactiver
              </Button>
            )}
            <Button type="button" size="default" variant="secondary" asChild>
              <Link to="/settings/template">Mise en page PDF</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
