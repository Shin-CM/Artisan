import type { ComboboxOption } from "@/components/SearchableCombobox";
import citiesJson from "./citiesByCountry.json";

/** Libellés FR + code ISO 3166-1 alpha-2 (liste orientée Europe / Amérique du Nord). */
export const COUNTRY_OPTIONS: ComboboxOption[] = [
  { value: "FR", label: "France" },
  { value: "CH", label: "Suisse" },
  { value: "BE", label: "Belgique" },
  { value: "LU", label: "Luxembourg" },
  { value: "DE", label: "Allemagne" },
  { value: "AT", label: "Autriche" },
  { value: "IT", label: "Italie" },
  { value: "ES", label: "Espagne" },
  { value: "PT", label: "Portugal" },
  { value: "NL", label: "Pays-Bas" },
  { value: "GB", label: "Royaume-Uni" },
  { value: "IE", label: "Irlande" },
  { value: "US", label: "États-Unis" },
  { value: "CA", label: "Canada" },
  { value: "MC", label: "Monaco" },
  { value: "AD", label: "Andorre" },
  { value: "PL", label: "Pologne" },
  { value: "CZ", label: "Tchéquie" },
  { value: "SK", label: "Slovaquie" },
  { value: "HU", label: "Hongrie" },
  { value: "RO", label: "Roumanie" },
  { value: "BG", label: "Bulgarie" },
  { value: "GR", label: "Grèce" },
  { value: "SE", label: "Suède" },
  { value: "NO", label: "Norvège" },
  { value: "DK", label: "Danemark" },
  { value: "FI", label: "Finlande" },
  { value: "IS", label: "Islande" },
  { value: "EE", label: "Estonie" },
  { value: "LV", label: "Lettonie" },
  { value: "LT", label: "Lituanie" },
  { value: "SI", label: "Slovénie" },
  { value: "HR", label: "Croatie" },
  { value: "RS", label: "Serbie" },
  { value: "BA", label: "Bosnie-Herzégovine" },
  { value: "ME", label: "Monténégro" },
  { value: "MK", label: "Macédoine du Nord" },
  { value: "AL", label: "Albanie" },
  { value: "TR", label: "Turquie" },
  { value: "MA", label: "Maroc" },
  { value: "TN", label: "Tunisie" },
  { value: "DZ", label: "Algérie" },
  { value: "SN", label: "Sénégal" },
  { value: "CI", label: "Côte d'Ivoire" },
  { value: "CM", label: "Cameroun" },
  { value: "RE", label: "La Réunion" },
  { value: "GP", label: "Guadeloupe" },
  { value: "MQ", label: "Martinique" },
  { value: "GF", label: "Guyane" },
  { value: "PF", label: "Polynésie française" },
  { value: "NC", label: "Nouvelle-Calédonie" },
  { value: "AU", label: "Australie" },
  { value: "NZ", label: "Nouvelle-Zélande" },
  { value: "JP", label: "Japon" },
  { value: "CN", label: "Chine" },
  { value: "IN", label: "Inde" },
  { value: "BR", label: "Brésil" },
  { value: "MX", label: "Mexique" },
  { value: "AR", label: "Argentine" },
  { value: "CL", label: "Chili" },
  { value: "CO", label: "Colombie" },
];

/** ISO 4217 — devises courantes. */
export const CURRENCY_OPTIONS: ComboboxOption[] = [
  { value: "EUR", label: "Euro (EUR)" },
  { value: "CHF", label: "Franc suisse (CHF)" },
  { value: "USD", label: "Dollar US (USD)" },
  { value: "GBP", label: "Livre sterling (GBP)" },
  { value: "CAD", label: "Dollar canadien (CAD)" },
  { value: "AUD", label: "Dollar australien (AUD)" },
  { value: "NZD", label: "Dollar néo-zélandais (NZD)" },
  { value: "JPY", label: "Yen (JPY)" },
  { value: "CNY", label: "Yuan (CNY)" },
  { value: "INR", label: "Roupie indienne (INR)" },
  { value: "BRL", label: "Real brésilien (BRL)" },
  { value: "MXN", label: "Peso mexicain (MXN)" },
  { value: "PLN", label: "Zloty (PLN)" },
  { value: "CZK", label: "Couronne tchèque (CZK)" },
  { value: "HUF", label: "Forint (HUF)" },
  { value: "RON", label: "Leu roumain (RON)" },
  { value: "BGN", label: "Lev bulgare (BGN)" },
  { value: "SEK", label: "Couronne suédoise (SEK)" },
  { value: "NOK", label: "Couronne norvégienne (NOK)" },
  { value: "DKK", label: "Couronne danoise (DKK)" },
  { value: "ISK", label: "Couronne islandaise (ISK)" },
  { value: "TRY", label: "Livre turque (TRY)" },
  { value: "MAD", label: "Dirham marocain (MAD)" },
  { value: "TND", label: "Dinar tunisien (TND)" },
  { value: "DZD", label: "Dinar algérien (DZD)" },
  { value: "XOF", label: "Franc CFA BCEAO (XOF)" },
  { value: "XPF", label: "Franc CFP (XPF)" },
  { value: "ARS", label: "Peso argentin (ARS)" },
  { value: "CLP", label: "Peso chilien (CLP)" },
  { value: "COP", label: "Peso colombien (COP)" },
];

/** Villes proposées par pays (données : `citiesByCountry.json`). */
export const CITIES_BY_COUNTRY = citiesJson as Record<string, string[]>;

export function cityOptionsForCountry(countryCode: string): ComboboxOption[] {
  const list = CITIES_BY_COUNTRY[countryCode.toUpperCase()] ?? [];
  const seen = new Set<string>();
  const out: ComboboxOption[] = [];
  for (const name of list) {
    const k = name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ value: name, label: name });
  }
  return out;
}

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

function normKey(s: string): string {
  return stripDiacritics(s).toLowerCase().trim();
}

/** Si le pays a une liste de villes et que la ville actuelle n’y figure pas, elle est considérée invalide après changement de pays. */
export function isCityInCountryList(city: string, countryCode: string): boolean {
  const list = CITIES_BY_COUNTRY[countryCode.toUpperCase()];
  if (!list?.length) return true;
  const c = normKey(city);
  if (!c) return true;
  return list.some((x) => normKey(x) === c);
}
