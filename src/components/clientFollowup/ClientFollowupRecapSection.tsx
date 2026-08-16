import * as React from "react";
import {
  Banknote,
  Building2,
  Globe,
  Mail,
  MapPin,
  MoreHorizontal,
  Percent,
  Phone,
  Smartphone,
  User,
} from "lucide-react";
import type {
  Client,
  ClientContactEvent,
  TaxRate,
} from "@/lib/api";
import {
  computeListName,
  getClientPreviewBlock,
  parseClientDetails,
} from "@/lib/clientDetails";
import { contactEventKindLabel } from "@/lib/contactEventKinds";
import {
  loadFollowupContactPrefs,
  resolveOpenWithForMail,
  resolveOpenWithForTel,
} from "@/lib/followupContactPrefs";
import { openExternalUrl } from "@/lib/openExternalUrl";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function RecapRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  const content = children;
  const empty =
    content == null ||
    (typeof content === "string" && !content.trim());
  if (empty) return null;
  return (
    <div className="flex gap-3 text-sm">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-[var(--color-muted-foreground)]">{label}</div>
        <div className="break-words font-medium">{content}</div>
      </div>
    </div>
  );
}

function formatNoteWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
    return d.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function ClientFollowupRecapSection({
  client,
  baseCurrency,
  taxRates,
  /** Événements de contact de type « note », les plus récents en premier. */
  noteContactEvents,
  onOpenAddNoteModal,
  onOpenNewReminderModal,
}: {
  client: Client;
  baseCurrency: string;
  taxRates: TaxRate[];
  noteContactEvents: ClientContactEvent[];
  onOpenAddNoteModal: () => void;
  onOpenNewReminderModal: () => void;
}) {
  const [actionsMenuOpen, setActionsMenuOpen] = React.useState(false);
  const d = parseClientDetails(client.detailsJson, baseCurrency);
  const preview = getClientPreviewBlock(client, baseCurrency);
  const taxId = d.defaultTaxRateId?.trim();
  const taxRate = taxId
    ? taxRates.find((x) => x.id === taxId)
    : undefined;
  const typeLabel =
    d.clientType === "individual" ? "Particulier" : "Entreprise";

  const billingBlock =
    preview.billingLines.length > 0 ? (
      <div className="space-y-0.5">
        {preview.billingLines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    ) : null;

  const websiteRaw = d.website?.trim();
  const websiteHref =
    websiteRaw != null && websiteRaw !== ""
      ? websiteRaw.startsWith("http")
        ? websiteRaw
        : `https://${websiteRaw}`
      : "";
  const websiteEl =
    websiteRaw != null && websiteRaw !== "" ? (
      <a
        href={websiteHref}
        onClick={(e) => {
          e.preventDefault();
          void openExternalUrl(websiteHref).catch(() => {
            toast.error("Impossible d’ouvrir le lien.");
          });
        }}
        className="text-[var(--color-primary)] underline"
      >
        {websiteRaw}
      </a>
    ) : null;

  const email = preview.email;
  const emailEl =
    email != null ? (
      <a
        href={`mailto:${email}`}
        onClick={(e) => {
          e.preventDefault();
          void openExternalUrl(`mailto:${email}`, {
            openWith: resolveOpenWithForMail(loadFollowupContactPrefs()),
          }).catch(() => {
            toast.error("Impossible d’ouvrir le courriel.");
          });
        }}
        className="text-[var(--color-primary)] underline"
      >
        {email}
      </a>
    ) : null;

  const phone = preview.phone;
  const phoneHref =
    phone != null ? `tel:${phone.replace(/[\s().-]/g, "")}` : "";
  const phoneEl =
    phone != null && phoneHref.length > "tel:".length ? (
      <a
        href={phoneHref}
        onClick={(e) => {
          e.preventDefault();
          void openExternalUrl(phoneHref, {
            openWith: resolveOpenWithForTel(loadFollowupContactPrefs()),
          }).catch(() => {
            toast.error("Impossible d’ouvrir l’appel téléphonique.");
          });
        }}
        className="underline"
      >
        {phone}
      </a>
    ) : phone != null ? (
      <span className="text-[var(--color-muted-foreground)]">{phone}</span>
    ) : null;

  const mobile = d.mobile?.trim();
  const mobileHref =
    mobile != null && mobile !== ""
      ? `tel:${mobile.replace(/[\s().-]/g, "")}`
      : "";
  const mobileEl =
    mobile != null && mobile !== "" && mobileHref.length > "tel:".length ? (
      <a
        href={mobileHref}
        onClick={(e) => {
          e.preventDefault();
          void openExternalUrl(mobileHref, {
            openWith: resolveOpenWithForTel(loadFollowupContactPrefs()),
          }).catch(() => {
            toast.error("Impossible d’ouvrir l’appel téléphonique.");
          });
        }}
        className="underline"
      >
        {mobile}
      </a>
    ) : mobile != null && mobile !== "" ? (
      <span className="text-[var(--color-muted-foreground)]">{mobile}</span>
    ) : null;

  const listName =
    computeListName(d, client.email).trim() || preview.fallbackName;

  const companyLine =
    d.clientType === "company" && d.companyName?.trim()
      ? d.companyName.trim()
      : null;

  const displayLine =
    d.displayName?.trim() &&
    d.displayName.trim() !== listName &&
    d.displayName.trim() !== companyLine
      ? d.displayName.trim()
      : null;

  const currencyStr = d.currency?.trim();
  const taxStr = taxRate ? `${taxRate.name} (${taxRate.rate} %)` : null;

  const hasLeftMinimal =
    Boolean(listName) ||
    Boolean(companyLine) ||
    Boolean(email) ||
    Boolean(phone) ||
    Boolean(mobile) ||
    Boolean(billingBlock) ||
    Boolean(d.shipping?.trim()) ||
    Boolean(currencyStr) ||
    Boolean(taxStr) ||
    Boolean(websiteEl) ||
    Boolean(client.notes?.trim());

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-sm font-semibold">Récapitulatif client</h2>
        <Popover open={actionsMenuOpen} onOpenChange={setActionsMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="Actions sur le suivi"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1">
            <button
              type="button"
              className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-[var(--color-muted)]"
              onClick={() => {
                setActionsMenuOpen(false);
                onOpenAddNoteModal();
              }}
            >
              Ajouter une note de contact
            </button>
            <button
              type="button"
              className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-[var(--color-muted)]"
              onClick={() => {
                setActionsMenuOpen(false);
                onOpenNewReminderModal();
              }}
            >
              Nouveau rappel
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_min(18rem,38%)] lg:items-start">
        <div className="min-w-0 space-y-6">
          {!hasLeftMinimal ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Aucune information détaillée — complétez la fiche dans les Bases.
            </p>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    Identification
                  </h3>
                  <RecapRow icon={Building2} label="Type">
                    {typeLabel}
                  </RecapRow>
                  <RecapRow icon={User} label="Nom affiché">
                    {listName}
                  </RecapRow>
                  {companyLine ? (
                    <RecapRow icon={Building2} label="Raison sociale">
                      {companyLine}
                    </RecapRow>
                  ) : null}
                  {displayLine ? (
                    <RecapRow icon={User} label="Nom sur mesure">
                      {displayLine}
                    </RecapRow>
                  ) : null}
                  <RecapRow icon={Globe} label="Site web">
                    {websiteEl}
                  </RecapRow>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    Contact
                  </h3>
                  <RecapRow icon={Mail} label="Courriel">
                    {emailEl ?? email}
                  </RecapRow>
                  <RecapRow icon={Phone} label="Téléphone">
                    {phoneEl ?? phone}
                  </RecapRow>
                  <RecapRow icon={Smartphone} label="Mobile">
                    {mobileEl ?? mobile}
                  </RecapRow>
                  <RecapRow icon={Banknote} label="Devise">
                    {currencyStr || null}
                  </RecapRow>
                  <RecapRow icon={Percent} label="Taux de TVA par défaut">
                    {taxStr}
                  </RecapRow>
                </div>
              </div>

              {billingBlock || d.shipping?.trim() ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    Adresses
                  </h3>
                  {billingBlock ? (
                    <RecapRow icon={MapPin} label="Adresse de facturation">
                      {billingBlock}
                    </RecapRow>
                  ) : null}
                  {d.shipping?.trim() ? (
                    <RecapRow icon={MapPin} label="Adresse d’expédition">
                      {d.shipping.trim()}
                    </RecapRow>
                  ) : null}
                </div>
              ) : null}

              {client.notes?.trim() ? (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    Notes internes
                  </h3>
                  <p className="whitespace-pre-wrap rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm">
                    {client.notes.trim()}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>

        <aside className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-3 lg:sticky lg:top-0">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Notes de contact
          </h3>
          <p className="mb-3 text-[11px] leading-snug text-[var(--color-muted-foreground)]">
            Événements enregistrés comme note (suivi). Les autres types
            (appel, e-mail…) restent visibles dans la chronologie.
          </p>
          {noteContactEvents.length === 0 ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Aucune note — utilisez le menu ⋯ pour en ajouter une.
            </p>
          ) : (
            <ul className="max-h-[min(22rem,50vh)] space-y-3 overflow-y-auto pr-0.5">
              {noteContactEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <span className="text-[11px] tabular-nums text-[var(--color-muted-foreground)]">
                      {formatNoteWhen(ev.occurredAt)}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
                        "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
                      )}
                    >
                      {contactEventKindLabel(ev.kind)}
                    </span>
                  </div>
                  {ev.body?.trim() ? (
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-snug">
                      {ev.body.trim()}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] italic text-[var(--color-muted-foreground)]">
                      Sans texte
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
}
