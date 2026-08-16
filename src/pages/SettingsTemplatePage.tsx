import * as React from "react";
import { Link } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import * as api from "@/lib/api";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  defaultDocumentLayout,
  mergeDocumentLayoutIntoProfile,
  parseBranding,
  parseDocumentLayout,
} from "@/lib/documentOptions";
import { brandingPdfFontSupportsBoldItalic } from "@/lib/pdfFontResolve";
import { MarketplaceModuleBadge } from "@/components/marketplace/MarketplaceModuleBadge";
import {
  isPdfTypographyEnabled,
  MARKETPLACE_ROUTE_DOCUMENT_PROJECTS,
  MARKETPLACE_ROUTE_PDF_TYPOGRAPHY,
} from "@/lib/marketplaceModules";
import {
  defaultPdfTypography,
  type PdfTextEmphasis,
} from "@/lib/pdfTypography";
import { toast } from "sonner";
import { cn, warningNoticeTextClassName } from "@/lib/utils";
import { ChevronDown, FileText, Plus, Trash2 } from "lucide-react";
import { PdfTemplatePreviewThumb } from "@/components/PdfTemplatePreviewThumb";
import { PDF_TEMPLATE_VARIANTS } from "@/lib/pdfTemplateVariants";
import {
  examplePdfFooterTaxMentionPlaceholder,
} from "@/lib/workspaceDefaultTaxRates";

const EMPHASIS_LABELS: Record<PdfTextEmphasis, string> = {
  normal: "Normal",
  bold: "Gras",
  italic: "Italique",
  boldItalic: "Gras italique",
};

export function SettingsTemplatePage() {
  const { active, refresh, refreshActiveWorkspace } = useWorkspace();
  const { projectsEnabled } = useDocumentModules();
  const [layout, setLayout] = React.useState(defaultDocumentLayout);
  const [plugins, setPlugins] = React.useState<api.PluginRow[]>([]);
  const [snippets, setSnippets] = React.useState<api.TextSnippet[]>([]);
  const [newSnippetName, setNewSnippetName] = React.useState("");
  const [newSnippetBody, setNewSnippetBody] = React.useState("");

  React.useEffect(() => {
    if (!active) return;
    const L = parseDocumentLayout(active.profileJson);
    setLayout(L);
  }, [active]);

  const loadSnippets = React.useCallback(async () => {
    if (!active) return;
    const s = await api.listTextSnippets(active.id);
    setSnippets(s);
  }, [active]);

  React.useEffect(() => {
    void loadSnippets();
  }, [loadSnippets]);

  const loadPlugins = React.useCallback(async () => {
    if (!active) {
      setPlugins([]);
      return;
    }
    try {
      setPlugins(await api.listPlugins(active.id));
    } catch {
      setPlugins([]);
    }
  }, [active]);

  React.useEffect(() => {
    void loadPlugins();
  }, [loadPlugins]);

  const typoModuleOn = isPdfTypographyEnabled(plugins);
  const brandingForTypo = React.useMemo(
    () => (active ? parseBranding(active.profileJson) : null),
    [active],
  );
  const boldItalicOk =
    brandingForTypo !== null
      ? brandingPdfFontSupportsBoldItalic(brandingForTypo.pdfFont)
      : true;

  const emphasisOptions = React.useMemo((): PdfTextEmphasis[] => {
    return boldItalicOk
      ? ["normal", "bold", "italic", "boldItalic"]
      : ["normal", "bold", "italic"];
  }, [boldItalicOk]);

  async function saveLayout() {
    if (!active) return;
    const f = (() => {
      try {
        return JSON.parse(active.profileJson || "{}") as Record<
          string,
          unknown
        >;
      } catch {
        return {};
      }
    })();
    const merged = mergeDocumentLayoutIntoProfile(f, layout);
    try {
      await api.updateWorkspace(active.id, {
        name: active.name,
        entityType: active.entityType,
        countryCode: active.countryCode,
        baseCurrency: active.baseCurrency,
        pdfOutputDir: active.pdfOutputDir,
        profileJson: merged,
      });
      await refresh();
      await refreshActiveWorkspace();
      toast.success("Mise en page enregistrée");
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function addSnippet() {
    if (!active) return;
    const n = newSnippetName.trim();
    if (!n) {
      toast.error("Indiquez un nom pour le texte.");
      return;
    }
    try {
      await api.createTextSnippet(active.id, {
        name: n,
        body: newSnippetBody,
      });
      setNewSnippetName("");
      setNewSnippetBody("");
      void loadSnippets();
      toast.success("Texte enregistré");
    } catch (e) {
      toast.error(String(e));
    }
  }

  async function removeSnippet(id: string) {
    try {
      await api.deleteTextSnippet(id);
      void loadSnippets();
      toast.success("Texte supprimé");
    } catch (e) {
      toast.error(String(e));
    }
  }

  if (!active) return null;

  const templateVariants = PDF_TEMPLATE_VARIANTS;

  const setQuote = (patch: Partial<typeof layout.quote>) =>
    setLayout((L) => ({ ...L, quote: { ...L.quote, ...patch } }));
  const setInvoice = (patch: Partial<typeof layout.invoice>) =>
    setLayout((L) => ({ ...L, invoice: { ...L.invoice, ...patch } }));

  return (
    <div className="h-full min-h-0 w-full min-w-0 space-y-8 overflow-y-auto">
      <div>
        <PageTitleWithInfo
          description="Ces réglages s’appliquent aux PDF de devis et de factures. Rien n’est obligatoire : le modèle par défaut s’applique aux nouveaux documents jusqu’à ce que vous en choisissiez un autre sur un devis ou une facture."
        >
          <h1 className="text-xl font-semibold">Mise en page des documents</h1>
        </PageTitleWithInfo>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Modèle PDF par défaut</h2>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Aperçu stylisé : le rendu final PDF peut légèrement différer selon
          votre logo et vos textes.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {templateVariants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() =>
                setLayout((L) => ({ ...L, defaultPdfVariant: v.id }))
              }
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
                layout.defaultPdfVariant === v.id
                  ? "border-[var(--color-foreground)] bg-[var(--color-muted)]"
                  : "border-[var(--color-border)] hover:bg-[var(--color-muted)]/50",
              )}
            >
              <PdfTemplatePreviewThumb variant={v.id} className="shrink-0" />
              <span className="font-medium">{v.label}</span>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {v.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {typoModuleOn ? (
        <details className="group rounded-lg border border-[var(--color-border)] p-4">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 shrink-0">Styles de caractères (PDF)</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
            <span className="min-w-0 flex-1" aria-hidden />
            <MarketplaceModuleBadge
              to={MARKETPLACE_ROUTE_PDF_TYPOGRAPHY}
              className="shrink-0"
            />
          </summary>
          <div className="mt-4 space-y-6">
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Ces réglages s’appliquent aux PDF exportés. Respectez les licences
              des polices (voir Branding).{" "}
              {!boldItalicOk ? (
                <span className={cn(warningNoticeTextClassName, "mt-1 block")}>
                  Avec la police actuelle du branding, le gras italique n’est pas
                  disponible (pas de fichier dédié en bibliothèque).
                </span>
              ) : null}
            </p>

            <TypoBlock title="En-tête (titre document)">
              <EmphasisField
                label="Titre principal"
                value={layout.pdfTypography.header.documentTitle}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: {
                      ...L.pdfTypography,
                      header: { ...L.pdfTypography.header, documentTitle: v },
                    },
                  }))
                }
              />
              <EmphasisField
                label="Sous-titre"
                value={layout.pdfTypography.header.tagline}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: {
                      ...L.pdfTypography,
                      header: { ...L.pdfTypography.header, tagline: v },
                    },
                  }))
                }
              />
            </TypoBlock>

            <TypoBlock title="Bandeau & titre du document">
              <EmphasisField
                label="Texte du bandeau (modèle Bandeau)"
                value={layout.pdfTypography.stripeBanner}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: { ...L.pdfTypography, stripeBanner: v },
                  }))
                }
              />
              <EmphasisField
                label="« Devis … » / « Facture … »"
                value={layout.pdfTypography.documentHeading}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: { ...L.pdfTypography, documentHeading: v },
                  }))
                }
              />
            </TypoBlock>

            <TypoBlock title="Métadonnées (dates, objet, libellés)">
              <EmphasisField
                label="Libellés (ex. Objet, Échéance)"
                value={layout.pdfTypography.meta.labels}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: {
                      ...L.pdfTypography,
                      meta: { ...L.pdfTypography.meta, labels: v },
                    },
                  }))
                }
              />
              <EmphasisField
                label="Valeurs (dates, textes)"
                value={layout.pdfTypography.meta.values}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: {
                      ...L.pdfTypography,
                      meta: { ...L.pdfTypography.meta, values: v },
                    },
                  }))
                }
              />
              <EmphasisField
                label="Petits titres (ex. Valable jusqu’au)"
                value={layout.pdfTypography.meta.smallHeadings}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: {
                      ...L.pdfTypography,
                      meta: { ...L.pdfTypography.meta, smallHeadings: v },
                    },
                  }))
                }
              />
            </TypoBlock>

            <TypoBlock title="Bloc client">
              <EmphasisField
                label="Première ligne"
                value={layout.pdfTypography.client.firstLine}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: {
                      ...L.pdfTypography,
                      client: { ...L.pdfTypography.client, firstLine: v },
                    },
                  }))
                }
              />
              <EmphasisField
                label="Lignes suivantes"
                value={layout.pdfTypography.client.followingLines}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: {
                      ...L.pdfTypography,
                      client: {
                        ...L.pdfTypography.client,
                        followingLines: v,
                      },
                    },
                  }))
                }
              />
            </TypoBlock>

            <TypoBlock title="Modèle Studio">
              <EmphasisField
                label="Colonne latérale (hors lignes client)"
                value={layout.pdfTypography.studioSidebar}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: { ...L.pdfTypography, studioSidebar: v },
                  }))
                }
              />
            </TypoBlock>

            <TypoBlock title="Tableau des lignes">
              <EmphasisField
                label="En-têtes de colonnes"
                value={layout.pdfTypography.lineItems.columnHeaders}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: {
                      ...L.pdfTypography,
                      lineItems: {
                        ...L.pdfTypography.lineItems,
                        columnHeaders: v,
                      },
                    },
                  }))
                }
              />
              <EmphasisField
                label="Lignes du tableau"
                value={layout.pdfTypography.lineItems.rows}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: {
                      ...L.pdfTypography,
                      lineItems: { ...L.pdfTypography.lineItems, rows: v },
                    },
                  }))
                }
              />
            </TypoBlock>

            <TypoBlock title="Totaux">
              <EmphasisField
                label="Lignes de détail (HT, TVA, remises…)"
                value={layout.pdfTypography.totals.detailLines}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: {
                      ...L.pdfTypography,
                      totals: { ...L.pdfTypography.totals, detailLines: v },
                    },
                  }))
                }
              />
              <EmphasisField
                label="Total TTC"
                value={layout.pdfTypography.totals.grandTotal}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: {
                      ...L.pdfTypography,
                      totals: { ...L.pdfTypography.totals, grandTotal: v },
                    },
                  }))
                }
              />
            </TypoBlock>

            <TypoBlock title="Compléments & pied de page">
              <EmphasisField
                label="Compléments"
                value={layout.pdfTypography.complements}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: { ...L.pdfTypography, complements: v },
                  }))
                }
              />
              <EmphasisField
                label="Pied de page"
                value={layout.pdfTypography.footer}
                options={emphasisOptions}
                onChange={(v) =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: { ...L.pdfTypography, footer: v },
                  }))
                }
              />
            </TypoBlock>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setLayout((L) => ({
                    ...L,
                    pdfTypography: defaultPdfTypography(),
                  }))
                }
              >
                Réinitialiser les styles par défaut
              </Button>
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link to="/marketplace/polices#module-pdf-typography">
                  Gérer le module (Marketplace)
                </Link>
              </Button>
            </div>
          </div>
        </details>
      ) : null}

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-[var(--color-border)] p-4">
          <h3 className="text-sm font-medium">Devis (PDF)</h3>
          <ToggleRow
            label="Afficher le logo"
            checked={layout.quote.showLogo}
            onCheckedChange={(v) => setQuote({ showLogo: v })}
          />
          <ToggleRow
            label="Afficher le sous-titre"
            checked={layout.quote.showTagline}
            onCheckedChange={(v) => setQuote({ showTagline: v })}
          />
          <ToggleRow
            label="Pied de page (texte ci-dessous)"
            checked={layout.quote.showLegalFooter}
            onCheckedChange={(v) => setQuote({ showLegalFooter: v })}
          />
          <ToggleRow
            label="Détail des taux de TVA"
            checked={layout.quote.showTaxBreakdown}
            onCheckedChange={(v) => setQuote({ showTaxBreakdown: v })}
          />
          <ToggleRow
            label="Afficher le numéro sur le PDF"
            checked={layout.quote.showDocumentNumberOnPdf}
            onCheckedChange={(v) => setQuote({ showDocumentNumberOnPdf: v })}
          />
        </div>
        <div className="space-y-3 rounded-lg border border-[var(--color-border)] p-4">
          <h3 className="text-sm font-medium">Facture (PDF)</h3>
          <ToggleRow
            label="Afficher le logo"
            checked={layout.invoice.showLogo}
            onCheckedChange={(v) => setInvoice({ showLogo: v })}
          />
          <ToggleRow
            label="Afficher le sous-titre"
            checked={layout.invoice.showTagline}
            onCheckedChange={(v) => setInvoice({ showTagline: v })}
          />
          <ToggleRow
            label="Pied de page (texte ci-dessous)"
            checked={layout.invoice.showLegalFooter}
            onCheckedChange={(v) => setInvoice({ showLegalFooter: v })}
          />
          <ToggleRow
            label="Détail des taux de TVA"
            checked={layout.invoice.showTaxBreakdown}
            onCheckedChange={(v) => setInvoice({ showTaxBreakdown: v })}
          />
          <ToggleRow
            label="Afficher le numéro sur le PDF"
            checked={layout.invoice.showDocumentNumberOnPdf}
            onCheckedChange={(v) =>
              setInvoice({ showDocumentNumberOnPdf: v })
            }
          />
        </div>
      </section>

      {projectsEnabled ? (
        <section className="rounded-lg border border-[var(--color-border)] p-4">
          <h3 className="text-sm font-medium">Projet sur les PDF</h3>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            S’applique aux devis, bons de commande et factures rattachés à un
            projet (sous le titre / slogan sur le PDF).
          </p>
          <div className="mt-3">
            <ToggleRow
              label="Afficher le libellé du projet"
              checked={layout.showProjectOnPdf}
              onCheckedChange={(v) =>
                setLayout((L) => ({ ...L, showProjectOnPdf: v }))
              }
            />
          </div>
        </section>
      ) : (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          <Link
            to={MARKETPLACE_ROUTE_DOCUMENT_PROJECTS}
            className="underline underline-offset-2"
          >
            Activez le module Projets
          </Link>{" "}
          pour afficher le libellé du projet sur les PDF.
        </p>
      )}

      <details className="rounded-lg border border-[var(--color-border)] p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Options avancées
        </summary>
        <div className="mt-3 space-y-2">
          <Label htmlFor="footer-tpl">Texte du pied de page (légal, mentions)</Label>
          <textarea
            id="footer-tpl"
            rows={3}
            className="w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] p-2 text-sm"
            value={layout.footerText}
            onChange={(e) =>
              setLayout((L) => ({ ...L, footerText: e.target.value }))
            }
            placeholder={examplePdfFooterTaxMentionPlaceholder(
              active.countryCode,
            )}
          />
        </div>
      </details>

      <Button type="button" onClick={() => void saveLayout()}>
        Enregistrer la mise en page
      </Button>

      <section className="space-y-4 border-t border-[var(--color-border)] pt-8">
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 h-5 w-5 text-[var(--color-muted-foreground)]" />
          <div>
            <h2 className="text-sm font-medium">Textes enregistrés</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Réutilisez ces blocs dans les devis et factures (compléments
              d’information).
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border border-dashed border-[var(--color-border)] p-4">
          <Label>Nouveau texte</Label>
          <Input
            placeholder="Nom (ex. Conditions de paiement)"
            value={newSnippetName}
            onChange={(e) => setNewSnippetName(e.target.value)}
            className="max-w-md"
          />
          <textarea
            className="min-h-[80px] w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] p-2 text-sm"
            placeholder="Contenu…"
            value={newSnippetBody}
            onChange={(e) => setNewSnippetBody(e.target.value)}
          />
          <Button type="button" size="sm" onClick={() => void addSnippet()}>
            <Plus className="mr-1 h-4 w-4" />
            Ajouter
          </Button>
        </div>

        <ul className="space-y-2">
          {snippets.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-2 rounded border border-[var(--color-border)] p-3 text-sm"
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-muted-foreground)]">
                  {s.body}
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0"
                aria-label="Supprimer"
                onClick={() => void removeSnippet(s.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {snippets.length === 0 && (
            <li className="text-sm text-[var(--color-muted-foreground)]">
              Aucun texte enregistré pour le moment.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-sm font-normal">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function TypoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-md border border-[var(--color-border)] bg-[var(--color-background)]/60 p-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function EmphasisField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: PdfTextEmphasis;
  options: PdfTextEmphasis[];
  onChange: (v: PdfTextEmphasis) => void;
}) {
  const safeValue = options.includes(value) ? value : options[0] ?? "normal";
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-normal text-[var(--color-muted-foreground)]">
        {label}
      </Label>
      <select
        className="h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm"
        value={safeValue}
        onChange={(e) => onChange(e.target.value as PdfTextEmphasis)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {EMPHASIS_LABELS[opt]}
          </option>
        ))}
      </select>
    </div>
  );
}
