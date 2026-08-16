import * as React from "react";
import { isTauri } from "@tauri-apps/api/core";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Kanban,
  Loader2,
  MailWarning,
  Tablet,
  UserRoundSearch,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import * as api from "@/lib/api";
import * as apiLocal from "@/lib/apiLocal";
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
import {
  CRM_PIPELINE_MODULE_ANCHOR,
  CRM_PIPELINE_MODULE_META,
  DOCUMENT_CREDIT_NOTES_MODULE_ANCHOR,
  DOCUMENT_CREDIT_NOTES_MODULE_META,
  DOCUMENT_PROJECTS_MODULE_ANCHOR,
  DOCUMENT_PROJECTS_MODULE_META,
  STOCK_MANAGER_MODULE_ANCHOR,
  STOCK_MANAGER_MODULE_META,
  DOCUMENT_PURCHASE_ORDERS_MODULE_ANCHOR,
  DOCUMENT_PURCHASE_ORDERS_MODULE_META,
  RECOVERY_ASSISTED_MODULE_ANCHOR,
  RECOVERY_ASSISTED_MODULE_META,
  CLIENT_FOLLOWUP_MODULE_ANCHOR,
  CLIENT_FOLLOWUP_MODULE_META,
  clientFollowupManifestJson,
  crmPipelineManifestJson,
  documentCreditNotesManifestJson,
  documentProjectsManifestJson,
  documentPurchaseOrdersManifestJson,
  findStockManagerPlugin,
  findCrmPipelinePlugin,
  findDocumentCreditNotesPlugin,
  findDocumentProjectsPlugin,
  findDocumentPurchaseOrdersPlugin,
  findRecoveryAssistedPlugin,
  findClientFollowupPlugin,
  findLocalTabletApiPlugin,
  isCreditNotesModuleEnabledForWorkspace,
  isCrmPipelineEnabledForWorkspace,
  isLocalTabletApiEnabledForWorkspace,
  isProjectsModuleEnabledForWorkspace,
  isPurchaseOrdersModuleEnabledForWorkspace,
  isRecoveryAssistedEnabledForWorkspace,
  isClientFollowupEnabledForWorkspace,
  isStockManagerModuleEnabledForWorkspace,
  LOCAL_TABLET_API_MODULE_ANCHOR,
  LOCAL_TABLET_API_MODULE_META,
  localTabletApiManifestJson,
  recoveryAssistedManifestJson,
  stockManagerManifestJson,
} from "@/lib/marketplaceModules";

type ModuleMeta = {
  id: string;
  displayName: string;
  version: string;
  capabilities: readonly string[];
};

type Config = {
  meta: ModuleMeta;
  anchor: string;
  manifestJson: () => string;
  findPlugin: (plugins: api.PluginRow[]) => api.PluginRow | null;
  isFeatureOn: (plugins: api.PluginRow[]) => boolean;
  Icon: LucideIcon;
  /** Résumé court en tête de modale (ex-aperçu carte). */
  modalSummary: string;
  modalLead: string;
  docPath: string;
  docLinkLabel: string;
  /** Encart d’avertissement dans la modale (ex. extension expérimentale). */
  experimental?: boolean;
  /** Après désactivation réussie (ex. couper un service lié au module). */
  afterDeactivate?: () => Promise<void>;
};

function DocumentFeatureMarketplaceCardInner({ config }: { config: Config }) {
  const { active } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const { plugins, loading, refresh } = useDocumentModules();
  const [busy, setBusy] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (location.hash === `#${config.anchor}`) {
      setModalOpen(true);
    }
  }, [location.hash, config.anchor]);

  function handleModalOpenChange(open: boolean) {
    setModalOpen(open);
    if (!open && location.hash === `#${config.anchor}`) {
      navigate(
        { pathname: location.pathname, search: location.search, hash: "" },
        { replace: true },
      );
    }
  }

  const row = config.findPlugin(plugins);
  const featureOn = config.isFeatureOn(plugins);

  async function activate() {
    if (!active) return;
    if (featureOn) return;
    setBusy(true);
    try {
      if (row && !row.enabled) {
        await api.setPluginEnabled(row.id, true);
      } else if (!row) {
        await api.registerPluginManifest(active.id, config.manifestJson());
      }
      await refresh();
      toast.success(`« ${config.meta.displayName} » activé`);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    if (!active) return;
    setBusy(true);
    try {
      let registryRow = config.findPlugin(plugins);
      if (!registryRow) {
        await api.registerPluginManifest(active.id, config.manifestJson());
        await refresh();
        const list = await api.listPlugins(active.id);
        registryRow = config.findPlugin(list);
      }
      if (registryRow) {
        await api.setPluginEnabled(registryRow.id, false);
      }
      await refresh();
      if (config.afterDeactivate) {
        try {
          await config.afterDeactivate();
        } catch {
          /* ne pas masquer la désactivation registre */
        }
      }
      toast.success("Module désactivé");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  const Icon = config.Icon;

  return (
    <Dialog open={modalOpen} onOpenChange={handleModalOpenChange}>
      <article id={config.anchor} className={marketplaceCardArticleClass}>
        <button
          type="button"
          aria-haspopup="dialog"
          id={`${config.anchor}-toggle`}
          className={marketplaceCardButtonClass}
          onClick={() => setModalOpen(true)}
        >
          <div className={marketplaceCardIconFrameClass}>
            <Icon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
          </div>
          <h3 className={marketplaceCardTitleClass}>
            {config.meta.displayName}
          </h3>
          <ChevronRight className={marketplaceChevronClass} aria-hidden />
        </button>
      </article>

      <DialogContent className={marketplaceDialogContentClass}>
        <div className={marketplaceDialogHeroClass}>
          <DialogHeader className="space-y-0 text-left">
            <div className="flex items-start gap-4">
              <div className={marketplaceModalIconFrameClass}>
                <Icon className="h-6 w-6 text-[var(--color-muted-foreground)]" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <DialogTitle className={marketplaceDialogTitleClass}>
                  {config.meta.displayName}
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
            ) : featureOn ? (
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
                Non activé — enregistrez le module pour l’utiliser dans cet espace.
              </span>
            )}
          </div>
          <p className={marketplaceCardSummaryForModalClass}>
            {config.modalSummary}
          </p>
          <p className={`${marketplaceDialogLeadClass} mt-3`}>
            {config.modalLead}
          </p>
          {config.experimental ? (
            <p
              className="mt-3 rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-[var(--color-foreground)]"
              role="note"
            >
              <span className="font-medium">Extension expérimentale.</span> Le
              périmètre API, la sécurité réseau et le comportement peuvent
              évoluer ; activez ce module uniquement si vous acceptez ces
              contraintes sur votre LAN.
            </p>
          ) : null}

          <dl className={marketplaceDialogSpecClass}>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">
                Identifiant
              </dt>
              <dd className="mt-0.5 font-mono text-[11px] text-[var(--color-foreground)]">
                {config.meta.id}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted-foreground)]">Version</dt>
              <dd className="mt-0.5 text-[var(--color-foreground)]">
                {config.meta.version}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--color-muted-foreground)]">
                Capacités
              </dt>
              <dd className="mt-0.5 font-mono text-[11px] text-[var(--color-foreground)]">
                {config.meta.capabilities.join(", ")}
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
            {!featureOn ? (
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
                disabled={busy || loading}
                onClick={() => void deactivate()}
              >
                Désactiver
              </Button>
            )}
            <Button type="button" size="default" variant="secondary" asChild>
              <Link to={config.docPath}>{config.docLinkLabel}</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const PURCHASE_ORDERS_CARD_CONFIG: Config = {
  meta: DOCUMENT_PURCHASE_ORDERS_MODULE_META,
  anchor: DOCUMENT_PURCHASE_ORDERS_MODULE_ANCHOR,
  manifestJson: documentPurchaseOrdersManifestJson,
  findPlugin: findDocumentPurchaseOrdersPlugin,
  isFeatureOn: isPurchaseOrdersModuleEnabledForWorkspace,
  Icon: ClipboardList,
  modalSummary:
    "Commandes fournisseurs ou internes, numérotation BDC, conversion en facture.",
  modalLead:
    "Lorsque ce module est actif, l’entrée « Bons de commande » apparaît dans le menu Accueil et vous pouvez convertir un devis en bon de commande. Désactivez-le si vous n’utilisez pas ce flux.",
  docPath: "/home/purchase-orders",
  docLinkLabel: "Ouvrir les bons de commande",
};

const CREDIT_NOTES_CARD_CONFIG: Config = {
  meta: DOCUMENT_CREDIT_NOTES_MODULE_META,
  anchor: DOCUMENT_CREDIT_NOTES_MODULE_ANCHOR,
  manifestJson: documentCreditNotesManifestJson,
  findPlugin: findDocumentCreditNotesPlugin,
  isFeatureOn: isCreditNotesModuleEnabledForWorkspace,
  Icon: BadgePercent,
  modalSummary:
    "Notes de crédit liées à une facture, même éditeur que les factures.",
  modalLead:
    "Lorsque ce module est actif, l’entrée « Avoirs » est disponible et vous pouvez créer un avoir depuis une facture (bouton Actions sur une facture). Désactivez-le si vous ne gérez pas d’avoirs.",
  docPath: "/home/credit-notes",
  docLinkLabel: "Ouvrir les avoirs",
};

const DOCUMENT_PROJECTS_CARD_CONFIG: Config = {
  meta: DOCUMENT_PROJECTS_MODULE_META,
  anchor: DOCUMENT_PROJECTS_MODULE_ANCHOR,
  manifestJson: documentProjectsManifestJson,
  findPlugin: findDocumentProjectsPlugin,
  isFeatureOn: isProjectsModuleEnabledForWorkspace,
  Icon: Briefcase,
  modalSummary:
    "Regrouper devis, factures et bons de commande par affaire ou chantier.",
  modalLead:
    "Une fois le module activé, l’entrée « Projets » apparaît sous Accueil — Vue d’ensemble. Vous pouvez lier un projet aux documents depuis leurs fiches.",
  docPath: "/home/projects",
  docLinkLabel: "Ouvrir les projets",
};

const STOCK_MANAGER_CARD_CONFIG: Config = {
  meta: STOCK_MANAGER_MODULE_META,
  anchor: STOCK_MANAGER_MODULE_ANCHOR,
  manifestJson: stockManagerManifestJson,
  findPlugin: findStockManagerPlugin,
  isFeatureOn: isStockManagerModuleEnabledForWorkspace,
  Icon: Warehouse,
  modalSummary:
    "Quantités par article, mouvements, seuils minimum et alertes dans la cloche.",
  modalLead:
    "Gérez les entrées, sorties et ajustements, suivez les articles sous un seuil et recevez des alertes lorsque le stock est bas. L’écran Stock apparaît sous Accueil et dans Bases de données une fois le module activé.",
  docPath: "/home/stock",
  docLinkLabel: "Ouvrir le stock",
};

const CRM_PIPELINE_CARD_CONFIG: Config = {
  meta: CRM_PIPELINE_MODULE_META,
  anchor: CRM_PIPELINE_MODULE_ANCHOR,
  manifestJson: crmPipelineManifestJson,
  findPlugin: findCrmPipelinePlugin,
  isFeatureOn: isCrmPipelineEnabledForWorkspace,
  Icon: Kanban,
  modalSummary:
    "Tableau Kanban des opportunités (étapes, client, devis lié, montant estimé).",
  modalLead:
    "Les données sont stockées dans votre espace (SQLite). Une fois le module activé, l’entrée « Pipeline CRM » apparaît sous Accueil — Clients & encaissements.",
  docPath: "/home/crm",
  docLinkLabel: "Ouvrir le pipeline CRM",
};

const RECOVERY_ASSISTED_CARD_CONFIG: Config = {
  meta: RECOVERY_ASSISTED_MODULE_META,
  anchor: RECOVERY_ASSISTED_MODULE_ANCHOR,
  manifestJson: recoveryAssistedManifestJson,
  findPlugin: findRecoveryAssistedPlugin,
  isFeatureOn: isRecoveryAssistedEnabledForWorkspace,
  Icon: MailWarning,
  modalSummary:
    "Relances sur factures en retard, modèles de texte et échéancier des échéances à venir.",
  modalLead:
    "Les modèles de relance sont enregistrés localement sur cet appareil. Activez le module pour afficher « Recouvrement » dans le menu Accueil.",
  docPath: "/home/recovery",
  docLinkLabel: "Ouvrir le recouvrement",
};

const CLIENT_FOLLOWUP_CARD_CONFIG: Config = {
  meta: CLIENT_FOLLOWUP_MODULE_META,
  anchor: CLIENT_FOLLOWUP_MODULE_ANCHOR,
  manifestJson: clientFollowupManifestJson,
  findPlugin: findClientFollowupPlugin,
  isFeatureOn: isClientFollowupEnabledForWorkspace,
  Icon: UserRoundSearch,
  modalSummary:
    "Liste priorisée des clients à relancer, score basé sur l’historique (devis, factures, contacts), timeline et rappels.",
  modalLead:
    "Les données sont calculées dans votre espace (SQLite). Une fois le module activé, l’entrée « Suivi clients » apparaît sous Accueil — Clients & encaissements.",
  docPath: "/home/client-followup",
  docLinkLabel: "Ouvrir le suivi clients",
};

const LOCAL_TABLET_API_CARD_CONFIG: Config = {
  meta: LOCAL_TABLET_API_MODULE_META,
  anchor: LOCAL_TABLET_API_MODULE_ANCHOR,
  manifestJson: localTabletApiManifestJson,
  findPlugin: findLocalTabletApiPlugin,
  isFeatureOn: isLocalTabletApiEnabledForWorkspace,
  Icon: Tablet,
  experimental: true,
  afterDeactivate: async () => {
    if (!isTauri()) return;
    try {
      await apiLocal.localApiSetEnabled(false);
    } catch {
      /* ignore */
    }
  },
  modalSummary:
    "Serveur HTTP dans l’application bureau : clients et devis accessibles depuis une tablette sur le même Wi‑Fi, sans cloud.",
  modalLead:
    "Une fois le module activé, l’entrée « API tablette » apparaît sous Paramètres. Vous pourrez activer l’écoute réseau, choisir le port, définir le mot de passe opérateur et générer un QR pour coupler la PWA.",
  docPath: "/settings/local-api",
  docLinkLabel: "Ouvrir les réglages API tablette",
};

/** Carte Marketplace — bons de commande (activation espace). */
export function DocumentPurchaseOrdersMarketplaceCard() {
  return (
    <DocumentFeatureMarketplaceCardInner config={PURCHASE_ORDERS_CARD_CONFIG} />
  );
}

/** Carte Marketplace — avoirs (activation espace). */
export function DocumentCreditNotesMarketplaceCard() {
  return (
    <DocumentFeatureMarketplaceCardInner config={CREDIT_NOTES_CARD_CONFIG} />
  );
}

/** Carte Marketplace — projets (activation espace). */
export function DocumentProjectsMarketplaceCard() {
  return (
    <DocumentFeatureMarketplaceCardInner config={DOCUMENT_PROJECTS_CARD_CONFIG} />
  );
}

/** Carte Marketplace — Stock Manager. */
export function StockManagerMarketplaceCard() {
  return (
    <DocumentFeatureMarketplaceCardInner config={STOCK_MANAGER_CARD_CONFIG} />
  );
}

/** Carte Marketplace — pipeline CRM. */
export function CrmPipelineMarketplaceCard() {
  return (
    <DocumentFeatureMarketplaceCardInner config={CRM_PIPELINE_CARD_CONFIG} />
  );
}

/** Carte Marketplace — recouvrement assisté. */
export function RecoveryAssistedMarketplaceCard() {
  return (
    <DocumentFeatureMarketplaceCardInner config={RECOVERY_ASSISTED_CARD_CONFIG} />
  );
}

/** Carte Marketplace — suivi & relance clients. */
export function ClientFollowupMarketplaceCard() {
  return (
    <DocumentFeatureMarketplaceCardInner config={CLIENT_FOLLOWUP_CARD_CONFIG} />
  );
}

/** Carte Marketplace — API tablette LAN (activation espace, expérimental). */
export function LocalTabletApiMarketplaceCard() {
  return (
    <DocumentFeatureMarketplaceCardInner config={LOCAL_TABLET_API_CARD_CONFIG} />
  );
}
