import type { Client } from "@/lib/api";

export type ClientBilling = {
  attention?: string | null;
  street1?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  fax?: string | null;
};

export type ClientDetails = {
  clientType?: "company" | "individual";
  salutation?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  mobile?: string | null;
  companyName?: string | null;
  displayName?: string | null;
  website?: string | null;
  currency?: string | null;
  defaultTaxRateId?: string | null;
  billing?: ClientBilling;
  shipping?: string | null;
};

function emptyToNull(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

export function defaultClientDetails(baseCurrency: string): ClientDetails {
  return {
    clientType: "company",
    currency: (baseCurrency || "EUR").trim() || "EUR",
    billing: {},
  };
}

export function parseClientDetails(
  json: string | null | undefined,
  baseCurrency: string,
): ClientDetails {
  const base = defaultClientDetails(baseCurrency);
  if (!json) return base;
  try {
    const o = JSON.parse(json) as Partial<ClientDetails>;
    return {
      ...base,
      ...o,
      billing: { ...base.billing, ...o.billing },
    };
  } catch {
    return base;
  }
}

export function detailsToJsonRecord(d: ClientDetails): Record<string, unknown> {
  const billing = d.billing ?? {};
  const out: Record<string, unknown> = {
    clientType: d.clientType ?? "company",
    salutation: emptyToNull(d.salutation),
    firstName: emptyToNull(d.firstName),
    lastName: emptyToNull(d.lastName),
    mobile: emptyToNull(d.mobile),
    companyName: emptyToNull(d.companyName),
    displayName: emptyToNull(d.displayName),
    website: emptyToNull(d.website),
    currency: emptyToNull(d.currency),
    defaultTaxRateId: emptyToNull(d.defaultTaxRateId),
    shipping: emptyToNull(d.shipping),
  };
  const billingOut: Record<string, string> = {};
  for (const k of [
    "attention",
    "street1",
    "street2",
    "city",
    "state",
    "zip",
    "country",
    "fax",
  ] as const) {
    const v = billing[k];
    const t = v != null ? String(v).trim() : "";
    if (t) billingOut[k] = t;
  }
  if (Object.keys(billingOut).length) out.billing = billingOut;
  return out;
}

/** Aperçu sous le sélecteur client (devis / facture) : contact, adresse de facturation, email, téléphone. */
export type ClientPreviewBlock = {
  contactLine: string | null;
  billingLines: string[];
  email: string | null;
  phone: string | null;
  fallbackName: string;
};

export function getClientPreviewBlock(
  client: Client,
  baseCurrency: string,
): ClientPreviewBlock {
  const d = parseClientDetails(client.detailsJson, baseCurrency);
  const salParts = [
    d.salutation?.trim(),
    d.firstName?.trim(),
    d.lastName?.trim(),
  ].filter((x): x is string => Boolean(x));
  const contactLine = salParts.length ? salParts.join(" ") : null;

  const b = d.billing ?? {};
  const billingLines: string[] = [];
  if (b.attention?.trim()) billingLines.push(b.attention.trim());
  if (b.street1?.trim()) billingLines.push(b.street1.trim());
  if (b.street2?.trim()) billingLines.push(b.street2.trim());
  const zipCity = [b.zip?.trim(), b.city?.trim()].filter(Boolean).join(" ");
  if (zipCity) billingLines.push(zipCity);
  if (b.state?.trim()) billingLines.push(b.state.trim());
  if (b.country?.trim()) billingLines.push(b.country.trim());

  return {
    contactLine,
    billingLines,
    email: client.email?.trim() || null,
    phone: client.phone?.trim() || null,
    fallbackName: client.name.trim() || "—",
  };
}

/**
 * Lignes pour le bloc « Client » sur PDF : même contenu que l’aperçu sous le combobox
 * (nom, formule de politesse + nom, adresse de facturation, email, téléphone).
 */
export function getClientPdfTextLines(
  client: Client,
  baseCurrency: string,
): string[] {
  const b = getClientPreviewBlock(client, baseCurrency);
  const lines: string[] = [b.fallbackName];
  if (b.contactLine) lines.push(b.contactLine);
  for (const line of b.billingLines) lines.push(line);
  if (b.email) lines.push(b.email);
  if (b.phone) lines.push(b.phone);
  return lines;
}

export function computeListName(
  d: ClientDetails,
  email: string | null | undefined,
): string {
  const contact = `${d.firstName?.trim() ?? ""} ${d.lastName?.trim() ?? ""}`.trim();
  const em = email?.trim();
  if (d.clientType === "individual") {
    if (contact) return contact;
    if (d.displayName?.trim()) return d.displayName.trim();
    if (em) return em;
    return "";
  }
  if (d.displayName?.trim()) return d.displayName.trim();
  if (d.companyName?.trim()) return d.companyName.trim();
  if (contact) return contact;
  if (em) return em;
  return "";
}
