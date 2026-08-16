import * as React from "react";
import { ChevronDown } from "lucide-react";
import * as api from "@/lib/api";
import {
  computeListName,
  defaultClientDetails,
  detailsToJsonRecord,
  parseClientDetails,
  type ClientBilling,
  type ClientDetails,
} from "@/lib/clientDetails";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import { CURRENCY_OPTIONS } from "@/data/localePickers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpAsidePanel } from "@/components/HelpAsidePanel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ClientFormPayload = {
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  detailsJson: Record<string, unknown>;
};

const selectLike =
  "flex h-9 w-full min-w-0 rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-1 text-sm shadow-sm focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

const textareaLike =
  "min-h-[72px] w-full min-w-0 rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm shadow-sm placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus-visible:outline-none disabled:opacity-50";

const SALUTATION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "— Aucune —" },
  { value: "M.", label: "M." },
  { value: "Mme", label: "Mme" },
  { value: "Mlle", label: "Mlle" },
  { value: "Dr", label: "Dr" },
  { value: "Dre", label: "Dre" },
  { value: "Pr", label: "Pr" },
  { value: "Me", label: "Me" },
  { value: "M. et Mme", label: "M. et Mme" },
  { value: "Mesdames", label: "Mesdames" },
  { value: "Messieurs", label: "Messieurs" },
];

const CLIENT_FORM_HELP: { title: string; items: { label: string; body: string }[] }[] =
  [
    {
      title: "Informations principales",
      items: [
        {
          label: "Type de client",
          body: "Entreprise : personne morale — affiche les champs société. Individuel : personne physique — le nom du contact sert surtout à l’identifier.",
        },
        {
          label: "Nom de l’entreprise",
          body: "Raison sociale légale ou nom commercial enregistré, tel qu’il peut figurer sur une facture.",
        },
        {
          label: "Nom d’affichage",
          body: "Nom utilisé par défaut pour le client dans les listes et sur les documents si vous le distinguez du nom légal.",
        },
        {
          label: "Site web",
          body: "URL du site (https://…). Optionnel, à titre de référence.",
        },
        {
          label: "Formule de politesse",
          body: "Civilité ou titre pour le contact (en-têtes de courrier, etc.). Choisissez une entrée dans la liste.",
        },
        {
          label: "Prénom / Nom",
          body: "Identité du contact principal. Aide à personnaliser les échanges et peut servir au libellé du client.",
        },
        {
          label: "Courriel",
          body: "Adresse e-mail de contact pour relances et envois. Format standard nom@domaine.",
        },
        {
          label: "Téléphone",
          body: "Numéro de ligne fixe ou principal, avec indicatif si besoin.",
        },
      ],
    },
    {
      title: "Options avancées",
      items: [
        {
          label: "Mobile",
          body: "Numéro de portable distinct du téléphone fixe, si utile pour joindre le contact.",
        },
        {
          label: "Devise",
          body: "Code devise ISO (ex. CHF, EUR) pour ce client. Peut différer de celle du workspace ; recherche ou saisie d’un code.",
        },
        {
          label: "Taux de TVA par défaut",
          body: "Taux de TVA proposé par défaut sur les nouvelles lignes de devis et de facture pour ce client (selon les taux définis dans l’espace).",
        },
        {
          label: "Adresse de facturation",
          body: "Adresse postale complète pour factures et mentions légales : destinataire (Attention), voies, ville, région, code postal, pays, fax si besoin.",
        },
        {
          label: "Adresse d’expédition",
          body: "Si différente de la facturation : lieu de livraison ou mention libre (entrepôt, BP, etc.).",
        },
        {
          label: "Notes internes",
          body: "Texte visible uniquement dans l’application, non imprimé sur les documents clients.",
        },
      ],
    },
  ];

function Field({
  id,
  label,
  children,
  className,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {id ? (
        <Label htmlFor={id}>{label}</Label>
      ) : (
        <span className="text-sm font-medium leading-none">{label}</span>
      )}
      {children}
    </div>
  );
}

export type ClientFormProps = {
  baseCurrency: string;
  taxRates: api.TaxRate[];
  /** Client en édition, ou `null` pour une création. */
  client: api.Client | null;
  /** Préfixe des `id` HTML (ex. `c` page Clients, `qc` modale). */
  fieldIdPrefix: string;
  showHelpAside?: boolean;
  className?: string;
  onSubmit: (payload: ClientFormPayload) => Promise<void>;
  showDeleteButton?: boolean;
  onDelete?: () => Promise<void>;
  submitLabel?: string;
  /** Bouton secondaire à gauche du principal (ex. Fermer en modale). */
  showCancelButton?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  title?: React.ReactNode;
  headerAction?: React.ReactNode;
};

export function ClientForm({
  baseCurrency,
  taxRates,
  client,
  fieldIdPrefix,
  showHelpAside = false,
  className,
  onSubmit,
  showDeleteButton = false,
  onDelete,
  submitLabel = "Enregistrer",
  showCancelButton = false,
  cancelLabel = "Fermer",
  onCancel,
  title,
  headerAction,
}: ClientFormProps) {
  const pid = (s: string) => `${fieldIdPrefix}-${s}`;

  const [details, setDetails] = React.useState<ClientDetails>(() =>
    defaultClientDetails(baseCurrency),
  );
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (client) {
      setDetails(parseClientDetails(client.detailsJson, baseCurrency));
      setEmail(client.email ?? "");
      setPhone(client.phone ?? "");
      setNotes(client.notes ?? "");
    } else {
      setDetails(defaultClientDetails(baseCurrency));
      setEmail("");
      setPhone("");
      setNotes("");
    }
  }, [client?.id, client, baseCurrency]);

  const listNamePreview = React.useMemo(
    () => computeListName(details, email),
    [details, email],
  );

  const setBill = React.useCallback((key: keyof ClientBilling, value: string) => {
    setDetails((d) => ({
      ...d,
      billing: { ...d.billing, [key]: value },
    }));
  }, []);

  const salutationSelectOptions = React.useMemo(() => {
    const opts = [...SALUTATION_OPTIONS];
    const cur = details.salutation?.trim() ?? "";
    if (cur && !opts.some((o) => o.value === cur)) {
      opts.splice(1, 0, {
        value: cur,
        label: `${cur} (personnalisé)`,
      });
    }
    return opts;
  }, [details.salutation]);

  async function handleSubmit() {
    const name = listNamePreview.trim();
    if (!name) {
      toast.error(
        "Indiquez au moins un nom affiché, une entreprise, un contact ou un courriel.",
      );
      return;
    }
    const payload: ClientFormPayload = {
      name,
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
      detailsJson: detailsToJsonRecord(details),
    };
    setBusy(true);
    try {
      await onSubmit(payload);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setBusy(true);
    try {
      await onDelete();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(false);
    }
  }

  const typeName = pid("clientType");

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 gap-6",
        showHelpAside && "flex-col lg:flex-row lg:items-stretch",
        className,
      )}
    >
      <div
        className={cn(
          "min-h-0 min-w-0 overflow-y-auto pr-1",
          showHelpAside
            ? "w-full flex-1 basis-0 lg:min-w-0"
            : "flex-1",
        )}
      >
        <div className="space-y-6 pb-6">
          {(title || headerAction) && (
            <div className="flex items-center justify-between gap-3">
              {title ? (
                <h1 className="text-xl font-semibold">{title}</h1>
              ) : (
                <div aria-hidden />
              )}
              {headerAction}
            </div>
          )}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              Informations principales
            </h3>
            <Field label="Type de client">
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={typeName}
                    checked={details.clientType === "company"}
                    onChange={() =>
                      setDetails((d) => ({ ...d, clientType: "company" }))
                    }
                  />
                  Entreprise
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={typeName}
                    checked={details.clientType === "individual"}
                    onChange={() =>
                      setDetails((d) => ({ ...d, clientType: "individual" }))
                    }
                  />
                  Individuel
                </label>
              </div>
            </Field>

            {details.clientType === "company" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id={pid("company")} label="Nom de l’entreprise" className="sm:col-span-2">
                  <Input
                    id={pid("company")}
                    className="mt-0"
                    value={details.companyName ?? ""}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, companyName: e.target.value }))
                    }
                    placeholder="Cliquez pour entrer"
                  />
                </Field>
                <Field id={pid("display")} label="Nom d’affichage">
                  <Input
                    id={pid("display")}
                    value={details.displayName ?? ""}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, displayName: e.target.value }))
                    }
                    placeholder="Tel qu’affiché sur les documents"
                  />
                </Field>
                <Field id={pid("web")} label="Site web">
                  <Input
                    id={pid("web")}
                    type="url"
                    value={details.website ?? ""}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, website: e.target.value }))
                    }
                    placeholder="https://"
                  />
                </Field>
              </div>
            )}

            <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
              <p className="text-sm font-medium">Contact principal</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field id={pid("salutation")} label="Formule de politesse">
                  <select
                    id={pid("salutation")}
                    className={selectLike}
                    value={details.salutation ?? ""}
                    onChange={(e) =>
                      setDetails((d) => ({
                        ...d,
                        salutation: e.target.value.trim() || null,
                      }))
                    }
                  >
                    {salutationSelectOptions.map((o) => (
                      <option key={o.value || "__none__"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id={pid("first")} label="Prénom">
                  <Input
                    id={pid("first")}
                    value={details.firstName ?? ""}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, firstName: e.target.value }))
                    }
                  />
                </Field>
                <Field id={pid("last")} label="Nom">
                  <Input
                    id={pid("last")}
                    value={details.lastName ?? ""}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, lastName: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field id={pid("email")} label="Courriel">
                <Input
                  id={pid("email")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field id={pid("phone")} label="Téléphone">
                <Input
                  id={pid("phone")}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
            </div>
          </section>

          <details className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/40 p-3">
            <summary className="flex cursor-pointer list-none items-center text-sm font-semibold">
              <ChevronDown className="mr-1 h-4 w-4 transition-transform group-open:rotate-0 -rotate-90" />
              Options avancées
            </summary>
            <div className="mt-4 space-y-4">
              <Field id={pid("mobile")} label="Mobile">
                <Input
                  id={pid("mobile")}
                  type="tel"
                  value={details.mobile ?? ""}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, mobile: e.target.value }))
                  }
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id={pid("currency")} label="Devise">
                  <SearchableCombobox
                    className="min-w-0"
                    id={pid("currency")}
                    label="Devise"
                    hideLabel
                    value={
                      details.currency?.trim()
                        ? details.currency.trim().toUpperCase()
                        : ""
                    }
                    onValueChange={(v) => {
                      const code = v.trim().toUpperCase().slice(0, 8);
                      setDetails((d) => ({ ...d, currency: code || null }));
                    }}
                    options={CURRENCY_OPTIONS}
                    placeholder="Rechercher une devise…"
                    allowCustom
                  />
                </Field>
                <Field id={pid("tax")} label="Taux de TVA par défaut">
                  <select
                    id={pid("tax")}
                    className={selectLike}
                    value={details.defaultTaxRateId ?? ""}
                    onChange={(e) =>
                      setDetails((d) => ({
                        ...d,
                        defaultTaxRateId: e.target.value || null,
                      }))
                    }
                  >
                    <option value="">— Aucun —</option>
                    {taxRates.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.rate}%)
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
                <p className="text-sm font-medium">Adresse de facturation</p>
                <Field id={pid("attn")} label="Attention">
                  <Input
                    id={pid("attn")}
                    value={details.billing?.attention ?? ""}
                    onChange={(e) => setBill("attention", e.target.value)}
                  />
                </Field>
                <Field id={pid("st1")} label="Rue 1">
                  <Input
                    id={pid("st1")}
                    value={details.billing?.street1 ?? ""}
                    onChange={(e) => setBill("street1", e.target.value)}
                  />
                </Field>
                <Field id={pid("st2")} label="Rue 2">
                  <Input
                    id={pid("st2")}
                    value={details.billing?.street2 ?? ""}
                    onChange={(e) => setBill("street2", e.target.value)}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id={pid("city")} label="Ville">
                    <Input
                      id={pid("city")}
                      value={details.billing?.city ?? ""}
                      onChange={(e) => setBill("city", e.target.value)}
                    />
                  </Field>
                  <Field id={pid("state")} label="État / province">
                    <Input
                      id={pid("state")}
                      value={details.billing?.state ?? ""}
                      onChange={(e) => setBill("state", e.target.value)}
                    />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id={pid("zip")} label="Code postal">
                    <Input
                      id={pid("zip")}
                      value={details.billing?.zip ?? ""}
                      onChange={(e) => setBill("zip", e.target.value)}
                    />
                  </Field>
                  <Field id={pid("country")} label="Pays / région">
                    <Input
                      id={pid("country")}
                      value={details.billing?.country ?? ""}
                      onChange={(e) => setBill("country", e.target.value)}
                    />
                  </Field>
                </div>
                <Field id={pid("fax")} label="Fax">
                  <Input
                    id={pid("fax")}
                    value={details.billing?.fax ?? ""}
                    onChange={(e) => setBill("fax", e.target.value)}
                  />
                </Field>
              </div>

                <Field id={pid("ship")} label="Adresse d’expédition">
                <textarea
                  id={pid("ship")}
                  className={textareaLike}
                  rows={3}
                  value={details.shipping ?? ""}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, shipping: e.target.value }))
                  }
                  placeholder="Texte libre ou complément d’adresse"
                />
              </Field>

              <Field id={pid("notes")} label="Notes internes">
                <textarea
                  id={pid("notes")}
                  className={textareaLike}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
            </div>
          </details>

          <div className="flex flex-wrap gap-2">
            {showCancelButton && onCancel && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={onCancel}
              >
                {cancelLabel}
              </Button>
            )}
            <Button
              type="button"
              disabled={busy}
              onClick={() => void handleSubmit()}
            >
              {submitLabel}
            </Button>
            {showDeleteButton && onDelete && (
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => void handleDelete()}
              >
                Supprimer
              </Button>
            )}
          </div>
        </div>
      </div>

      {showHelpAside ? (
        <HelpAsidePanel
          ariaLabel="Aide sur les champs"
          sections={CLIENT_FORM_HELP}
          className="w-full border-l-0 border-t border-[var(--color-border)] pl-0 pt-5 lg:w-72 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"
        />
      ) : null}
    </div>
  );
}
