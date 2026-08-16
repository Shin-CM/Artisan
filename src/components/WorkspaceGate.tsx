import * as React from "react";
import { Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  cityOptionsForCountry,
  isCityInCountryList,
} from "@/data/localePickers";
import * as api from "@/lib/api";
import { useWorkspace } from "@/context/WorkspaceContext";
import { toast } from "sonner";
import { mergeBrandingIntoProfile, parseBranding } from "@/lib/documentOptions";

export function WorkspaceGate() {
  const { workspaces, refresh, openWorkspace } = useWorkspace();
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [entityType, setEntityType] = React.useState<"company" | "individual">(
    "company",
  );
  const [countryCode, setCountryCode] = React.useState("");
  const [baseCurrency, setBaseCurrency] = React.useState("");
  const [city, setCity] = React.useState("");
  const [siret, setSiret] = React.useState("");
  const [ideUid, setIdeUid] = React.useState("");
  const [tvaCh, setTvaCh] = React.useState("");
  const [brandDocumentTitle, setBrandDocumentTitle] = React.useState("");
  const [brandTagline, setBrandTagline] = React.useState("");
  const [pendingLogoSourcePath, setPendingLogoSourcePath] = React.useState<
    string | null
  >(null);
  const [brandingOpen, setBrandingOpen] = React.useState(false);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const countryForFields = countryCode || "CH";
  const currencyForCreate = baseCurrency || "CHF";

  const cityOptions = React.useMemo(
    () => cityOptionsForCountry(countryForFields),
    [countryForFields],
  );

  React.useEffect(() => {
    setCity((prev) =>
      isCityInCountryList(prev, countryForFields) ? prev : "",
    );
  }, [countryForFields]);

  const profileJson = React.useMemo(() => {
    const o: Record<string, unknown> = {
      address: { city, countryCode: countryForFields },
    };
    if (countryForFields === "FR" && siret) o.siret = siret;
    if (countryForFields === "CH") {
      if (ideUid) o.ideUid = ideUid;
      if (tvaCh) o.tvaSwiss = tvaCh;
    }
    return mergeBrandingIntoProfile(o, {
      documentTitle: brandDocumentTitle,
      tagline: brandTagline,
      logoRelativePath: "",
      logoAlignment: "left",
      pdfFont: { kind: "builtin", builtinId: "helvetica" },
      importedWorkspaceFonts: [],
    });
  }, [
    city,
    countryForFields,
    siret,
    ideUid,
    tvaCh,
    brandDocumentTitle,
    brandTagline,
  ]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    try {
      let w = await api.createWorkspace({
        name: name.trim(),
        entityType,
        countryCode: countryForFields,
        baseCurrency: currencyForCreate,
        profileJson,
      });
      if (pendingLogoSourcePath) {
        try {
          const rel = await api.copyWorkspaceLogoFromPath(
            w.id,
            pendingLogoSourcePath,
          );
          let p: Record<string, unknown> = {};
          try {
            p = JSON.parse(w.profileJson || "{}") as Record<string, unknown>;
          } catch {
            p = {};
          }
          const br = parseBranding(w.profileJson);
          br.logoRelativePath = rel;
          p = mergeBrandingIntoProfile(p, br);
          w = await api.updateWorkspace(w.id, {
            name: w.name,
            entityType: w.entityType,
            countryCode: w.countryCode,
            baseCurrency: w.baseCurrency,
            pdfOutputDir: w.pdfOutputDir,
            profileJson: p,
          });
        } catch (logoErr) {
          toast.error(
            `Espace créé, mais le logo n’a pas pu être enregistré : ${String(logoErr)}`,
          );
        }
      }
      await refresh();
      openWorkspace(w);
      setCreating(false);
      setName("");
      setCountryCode("");
      setBaseCurrency("");
      setCity("");
      setSiret("");
      setIdeUid("");
      setTvaCh("");
      setBrandDocumentTitle("");
      setBrandTagline("");
      setPendingLogoSourcePath(null);
      setBrandingOpen(false);
      toast.success("Espace de travail créé");
    } catch (err) {
      toast.error(String(err));
    }
  }

  return (
    <div
      className="box-border flex min-h-[100dvh] min-h-screen w-full flex-col justify-center bg-[var(--color-background)] py-8 sm:py-10"
      style={{
        paddingLeft: "max(1.25rem, env(safe-area-inset-left, 0px))",
        paddingRight: "max(1.25rem, env(safe-area-inset-right, 0px))",
      }}
    >
      <div className="mx-auto w-full max-w-lg min-w-0 space-y-6 px-4 sm:px-6">
        <div className="flex justify-center">
          <PageTitleWithInfo description="Choisissez ou créez un espace de travail">
            <h1 className="text-2xl font-semibold">Artisan</h1>
          </PageTitleWithInfo>
        </div>

        {!creating ? (
          <div className="space-y-3">
            {workspaces.length === 0 ? (
              <p className="text-center text-sm text-[var(--color-muted-foreground)]">
                Aucun espace pour le moment.
              </p>
            ) : (
              <ul className="space-y-2">
                {workspaces.map((w) => (
                  <li key={w.id}>
                    <Button
                      variant="outline"
                      className="h-auto w-full justify-start py-3"
                      onClick={() => openWorkspace(w)}
                    >
                      <span className="font-medium">{w.name}</span>
                      <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">
                        {w.baseCurrency} · {w.countryCode}
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              className="w-full"
              onClick={() => {
                setCountryCode("");
                setBaseCurrency("");
                setCreating(true);
              }}
            >
              Nouvel espace de travail
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleCreate}
            className="flex h-[min(32rem,calc(100svh-6rem))] min-h-0 w-full min-w-0 max-w-full flex-col gap-4 rounded-lg border border-[var(--color-border)] p-4 sm:p-5"
          >
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant={entityType === "company" ? "default" : "outline"}
                size="sm"
                onClick={() => setEntityType("company")}
              >
                <Building2 className="mr-1" /> Entreprise
              </Button>
              <Button
                type="button"
                variant={entityType === "individual" ? "default" : "outline"}
                size="sm"
                onClick={() => setEntityType("individual")}
              >
                <User className="mr-1" /> Particulier
              </Button>
            </div>
            <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-0.5">
              <div>
                <Label htmlFor="ws-name">
                  {entityType === "company" ? "Raison sociale / nom" : "Nom"}
                </Label>
                <Input
                  id="ws-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <SearchableCombobox
                  className="min-w-0"
                  id="ws-country"
                  label="Pays"
                  value={countryCode}
                  onValueChange={setCountryCode}
                  options={COUNTRY_OPTIONS}
                  allowClearSelection
                  placeholder="Suisse"
                />
                <SearchableCombobox
                  className="min-w-0"
                  id="ws-currency"
                  label="Devise"
                  value={baseCurrency}
                  onValueChange={setBaseCurrency}
                  options={CURRENCY_OPTIONS}
                  allowClearSelection
                  placeholder="Franc suisse (CHF)"
                />
              </div>
              <SearchableCombobox
                className="min-w-0"
                id="ws-city"
                label="Ville"
                value={city}
                onValueChange={setCity}
                options={cityOptions}
                allowCustom
                placeholder="Rechercher ou saisir une ville…"
              />
              {countryForFields === "FR" && entityType === "company" && (
                <div>
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              {countryForFields === "CH" && (
                <>
                  <div>
                    <Label htmlFor="ide">Numéro IDE (UID)</Label>
                    <Input
                      id="ide"
                      value={ideUid}
                      onChange={(e) => setIdeUid(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tvach">
                      N° TVA suisse (TVA / MWST / VAT)
                    </Label>
                    <Input
                      id="tvach"
                      value={tvaCh}
                      onChange={(e) => setTvaCh(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
              <details
                open={brandingOpen}
                onToggle={(e) =>
                  setBrandingOpen((e.target as HTMLDetailsElement).open)
                }
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)]/40 px-3 py-2"
              >
                <summary className="cursor-pointer text-sm font-medium text-[var(--color-foreground)]">
                  Apparence sur vos documents (facultatif)
                </summary>
                <div className="mt-3 space-y-3 pb-1">
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Titre et slogan apparaissent sur les devis et factures
                    exportés. Vous pourrez tout modifier dans Paramètres.
                  </p>
                  <div>
                    <Label htmlFor="brand-title">Titre sur les documents</Label>
                    <Input
                      id="brand-title"
                      value={brandDocumentTitle}
                      onChange={(e) => setBrandDocumentTitle(e.target.value)}
                      className="mt-1"
                      placeholder="Ex. Mon activité"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand-tagline">Sous-titre / slogan</Label>
                    <Input
                      id="brand-tagline"
                      value={brandTagline}
                      onChange={(e) => setBrandTagline(e.target.value)}
                      className="mt-1"
                      placeholder="Une phrase courte"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const p = await api.pickLogoFilePath();
                        setPendingLogoSourcePath(p);
                        if (!p) toast.message("Aucun fichier choisi");
                      }}
                    >
                      Choisir un logo
                    </Button>
                    {pendingLogoSourcePath ? (
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        Fichier sélectionné (enregistré à la création)
                      </span>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBrandDocumentTitle("");
                        setBrandTagline("");
                        setPendingLogoSourcePath(null);
                        setBrandingOpen(false);
                      }}
                    >
                      Remplir plus tard
                    </Button>
                  </div>
                </div>
              </details>
            </div>
            <div className="flex shrink-0 gap-2 border-t border-[var(--color-border)] pt-3">
              <Button type="submit">Créer et ouvrir</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCreating(false);
                  setName("");
                  setCountryCode("");
                  setBaseCurrency("");
                  setCity("");
                  setSiret("");
                  setIdeUid("");
                  setTvaCh("");
                  setBrandDocumentTitle("");
                  setBrandTagline("");
                  setPendingLogoSourcePath(null);
                  setBrandingOpen(false);
                }}
              >
                Annuler
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
