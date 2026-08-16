import * as React from "react";
import { FolderOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import * as api from "@/lib/api";
import {
  mergeWorkspaceProfile,
  parseProfileFields,
} from "@/lib/workspaceProfile";
import {
  mergeDocumentInputPreferencesIntoProfile,
  mergeInvoiceWorkspacePreferencesIntoProfile,
  mergeQuoteWorkspacePreferencesIntoProfile,
  parseDocumentInputPreferences,
  parseInvoiceWorkspacePreferences,
  parseQuoteWorkspacePreferences,
  LINE_PRICES_FRACTION_DIGITS_MAX,
  LINE_PRICES_FRACTION_DIGITS_MIN,
} from "@/lib/documentOptions";
import { DocumentReferenceSettingsBlock } from "@/components/DocumentReferenceSettingsBlock";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { WorkspaceSettingsHelpAside } from "@/components/WorkspaceSettingsHelpAside";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  cityOptionsForCountry,
  isCityInCountryList,
} from "@/data/localePickers";
import { toast } from "sonner";
import { useResponsiveHelpAside } from "@/hooks/useResponsiveHelpAside";

export function SettingsWorkspacePage() {
  const { active, refresh, refreshActiveWorkspace } = useWorkspace();
  const [name, setName] = React.useState("");
  const [entityType, setEntityType] = React.useState("company");
  const [countryCode, setCountryCode] = React.useState("FR");
  const [baseCurrency, setBaseCurrency] = React.useState("EUR");
  const [city, setCity] = React.useState("");
  const [siret, setSiret] = React.useState("");
  const [ideUid, setIdeUid] = React.useState("");
  const [tvaCh, setTvaCh] = React.useState("");
  const [pdfDir, setPdfDir] = React.useState("");
  const [allowCustomQuoteReference, setAllowCustomQuoteReference] =
    React.useState(false);
  const [customRefPrefix, setCustomRefPrefix] = React.useState("");
  const [customRefTemplate, setCustomRefTemplate] = React.useState("");
  const [defaultCustomRef, setDefaultCustomRef] = React.useState("");
  const [allowCustomInvoiceReference, setAllowCustomInvoiceReference] =
    React.useState(false);
  const [invRefPrefix, setInvRefPrefix] = React.useState("");
  const [invRefTemplate, setInvRefTemplate] = React.useState("");
  const [invDefaultRef, setInvDefaultRef] = React.useState("");
  const [lockIssuedInvoices, setLockIssuedInvoices] = React.useState(true);
  const [linePricesFractionDigits, setLinePricesFractionDigits] =
    React.useState(LINE_PRICES_FRACTION_DIGITS_MIN);
  const { isHelpOpen, toggleHelp } = useResponsiveHelpAside();

  const cityOptions = React.useMemo(
    () => cityOptionsForCountry(countryCode),
    [countryCode],
  );

  React.useEffect(() => {
    if (!active) return;
    setName(active.name);
    setEntityType(active.entityType);
    setCountryCode(active.countryCode);
    setBaseCurrency(active.baseCurrency);
    setPdfDir(active.pdfOutputDir ?? "");
    const f = parseProfileFields(active.profileJson);
    const quotePrefs = parseQuoteWorkspacePreferences(active.profileJson);
    const invoicePrefs = parseInvoiceWorkspacePreferences(active.profileJson);
    setCity(f.city);
    setSiret(f.siret);
    setIdeUid(f.ideUid);
    setTvaCh(f.tvaCh);
    setAllowCustomQuoteReference(quotePrefs.allowCustomReference);
    setCustomRefPrefix(quotePrefs.customReferencePrefix);
    setCustomRefTemplate(quotePrefs.customReferenceTemplate);
    setDefaultCustomRef(quotePrefs.defaultCustomReference);
    setAllowCustomInvoiceReference(invoicePrefs.allowCustomReference);
    setInvRefPrefix(invoicePrefs.customReferencePrefix);
    setInvRefTemplate(invoicePrefs.customReferenceTemplate);
    setInvDefaultRef(invoicePrefs.defaultCustomReference);
    setLockIssuedInvoices(invoicePrefs.lockIssuedInvoices);
    const docInput = parseDocumentInputPreferences(active.profileJson);
    setLinePricesFractionDigits(docInput.linePricesFractionDigits);
  }, [active]);

  React.useEffect(() => {
    setCity((prev) =>
      isCityInCountryList(prev, countryCode) ? prev : "",
    );
  }, [countryCode]);

  async function saveWorkspace() {
    if (!active) return;
    const cc = countryCode.toUpperCase();
    const mergedLegal = mergeWorkspaceProfile(active.profileJson, {
      countryCode: cc,
      entityType,
      city,
      siret,
      ideUid,
      tvaCh,
    });
    const withQuotes = mergeQuoteWorkspacePreferencesIntoProfile(mergedLegal, {
      allowCustomReference: allowCustomQuoteReference,
      customReferencePrefix: customRefPrefix.trim(),
      customReferenceTemplate: customRefTemplate.trim(),
      defaultCustomReference: defaultCustomRef.trim(),
    });
    const mergedProfile = mergeInvoiceWorkspacePreferencesIntoProfile(withQuotes, {
      allowCustomReference: allowCustomInvoiceReference,
      customReferencePrefix: invRefPrefix.trim(),
      customReferenceTemplate: invRefTemplate.trim(),
      defaultCustomReference: invDefaultRef.trim(),
      lockIssuedInvoices,
    });
    const withDocInput = mergeDocumentInputPreferencesIntoProfile(mergedProfile, {
      linePricesFractionDigits,
    });
    try {
      await api.updateWorkspace(active.id, {
        name: name.trim(),
        entityType,
        countryCode: cc,
        baseCurrency: baseCurrency.toUpperCase(),
        pdfOutputDir: pdfDir.trim() || null,
        profileJson: withDocInput,
      });
      await refresh();
      await refreshActiveWorkspace();
      toast.success("Espace de travail enregistré");
    } catch (e) {
      toast.error(String(e));
    }
  }

  if (!active) return null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-6">
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between gap-3">
        <PageTitleWithInfo
          className="min-w-0 flex-1"
          description={
            <>
              Nom, identité légale (mêmes règles qu’à la création : SIRET si
              entreprise en France, IDE / TVA si Suisse), dossier d&apos;export PDF.
              Branding (logo, titres, police PDF) :{" "}
              <span className="font-medium text-[var(--color-foreground)]">
                Branding
              </span>
              .
            </>
          }
        >
          <h1 className="text-xl font-semibold">Espace de travail</h1>
        </PageTitleWithInfo>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8 shrink-0"
          aria-label={isHelpOpen ? "Fermer l’aide" : "Ouvrir l’aide"}
          onClick={toggleHelp}
        >
          {isHelpOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="sn">Nom affiché</Label>
          <Input
            id="sn"
            className="mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="set">Type</Label>
          <select
            id="set"
            className="mt-1 flex h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm focus:outline-none sm:max-w-xs"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          >
            <option value="company">Entreprise</option>
            <option value="individual">Particulier</option>
          </select>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <SearchableCombobox
            className="min-w-0"
            id="set-country"
            label="Pays"
            value={countryCode}
            onValueChange={setCountryCode}
            options={COUNTRY_OPTIONS}
            placeholder="Rechercher un pays…"
          />
          <SearchableCombobox
            className="min-w-0"
            id="set-currency"
            label="Devise"
            value={baseCurrency}
            onValueChange={setBaseCurrency}
            options={CURRENCY_OPTIONS}
            placeholder="Rechercher une devise…"
          />
        </div>
        <SearchableCombobox
          className="min-w-0"
          id="set-city"
          label="Ville"
          value={city}
          onValueChange={setCity}
          options={cityOptions}
          allowCustom
          placeholder="Rechercher ou saisir une ville…"
        />
        {countryCode.toUpperCase() === "FR" && entityType === "company" && (
          <div>
            <Label htmlFor="set-siret">SIRET</Label>
            <Input
              id="set-siret"
              className="mt-1"
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
            />
          </div>
        )}
        {countryCode.toUpperCase() === "CH" && (
          <>
            <div>
              <Label htmlFor="set-ide">Numéro IDE (UID)</Label>
              <Input
                id="set-ide"
                className="mt-1"
                value={ideUid}
                onChange={(e) => setIdeUid(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="set-tva">
                N° TVA suisse (TVA / MWST / VAT)
              </Label>
              <Input
                id="set-tva"
                className="mt-1"
                value={tvaCh}
                onChange={(e) => setTvaCh(e.target.value)}
              />
            </div>
          </>
        )}
        <div className="space-y-3">
          <DocumentReferenceSettingsBlock
            idPrefix="ws-quote-ref"
            title="Référence des devis"
            docName="devis"
            enabled={allowCustomQuoteReference}
            onEnabledChange={setAllowCustomQuoteReference}
            prefix={customRefPrefix}
            onPrefixChange={setCustomRefPrefix}
            template={customRefTemplate}
            onTemplateChange={setCustomRefTemplate}
            defaultRef={defaultCustomRef}
            onDefaultRefChange={setDefaultCustomRef}
          />
          <DocumentReferenceSettingsBlock
            idPrefix="ws-inv-ref"
            title="Référence des factures"
            docName="facture"
            enabled={allowCustomInvoiceReference}
            onEnabledChange={setAllowCustomInvoiceReference}
            prefix={invRefPrefix}
            onPrefixChange={setInvRefPrefix}
            template={invRefTemplate}
            onTemplateChange={setInvRefTemplate}
            defaultRef={invDefaultRef}
            onDefaultRefChange={setInvDefaultRef}
          />
          <div className="rounded-lg border border-[var(--color-border)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <Label htmlFor="ws-lock-invoices" className="text-sm font-medium">
                  Verrouiller les factures émises
                </Label>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Activé par défaut. Une fois le statut autre que brouillon, le
                  contenu (lignes, client, dates, notes) ne peut plus être
                  modifié. Le statut, le montant payé et l’archivage restent
                  possibles ; pour corriger une facture, créez un avoir.
                </p>
              </div>
              <Switch
                id="ws-lock-invoices"
                checked={lockIssuedInvoices}
                onCheckedChange={setLockIssuedInvoices}
                className="mt-0.5 shrink-0"
              />
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="line-prices-fraction-digits">
            Décimales — prix unitaire HT (lignes devis / facture)
          </Label>
          <select
            id="line-prices-fraction-digits"
            className="mt-1 flex h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm focus:outline-none sm:max-w-xs"
            value={linePricesFractionDigits}
            onChange={(e) =>
              setLinePricesFractionDigits(Number(e.target.value))
            }
          >
            {Array.from(
              {
                length:
                  LINE_PRICES_FRACTION_DIGITS_MAX -
                  LINE_PRICES_FRACTION_DIGITS_MIN +
                  1,
              },
              (_, i) => LINE_PRICES_FRACTION_DIGITS_MIN + i,
            ).map((d) => (
              <option key={d} value={d}>
                {d === LINE_PRICES_FRACTION_DIGITS_MIN
                  ? `${d} (défaut)`
                  : String(d)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Arrondi et affichage du champ « Prix u. HT » : catalogue, variantes
            et saisie. Les totaux PDF utilisent toujours deux décimales pour la
            devise.
          </p>
        </div>
        <div>
          <Label htmlFor="pdf">Dossier de sortie PDF (chemin)</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="pdf"
              className="min-w-0 flex-1"
              value={pdfDir}
              onChange={(e) => setPdfDir(e.target.value)}
              placeholder="/chemin/vers/dossier"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label="Choisir un dossier"
                  onClick={() => {
                    void (async () => {
                      try {
                        const p = await api.pickPdfOutputDir();
                        if (p) setPdfDir(p);
                      } catch (e) {
                        toast.error(String(e));
                      }
                    })();
                  }}
                >
                  <FolderOpen className="h-4 w-4" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                Parcourir… (sélecteur de dossier système)
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Les PDF exportés depuis un devis ou une facture sont enregistrés ici.
            Collez un chemin absolu ou utilisez le bouton pour ouvrir le sélecteur
            (Finder sur macOS, Explorateur sur Windows).
          </p>
        </div>
        <Button type="button" onClick={() => void saveWorkspace()}>
          Enregistrer
        </Button>
      </div>
        </div>
      </div>
      {isHelpOpen ? <WorkspaceSettingsHelpAside /> : null}
    </div>
  );
}
