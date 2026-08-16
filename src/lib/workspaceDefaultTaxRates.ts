/**
 * Taux TVA insérés à la **création** d’un espace de travail selon le pays (aligné Rust `create_workspace`).
 * Autres pays : aucun taux prédéfini.
 */
export function defaultTaxRatesForCountry(countryCode: string): {
  name: string;
  rate: number;
}[] {
  const cc = countryCode.trim().toUpperCase();
  if (cc === "FR") {
    return [
      { name: "TVA normale", rate: 20 },
      { name: "TVA intermédiaire", rate: 10 },
      { name: "TVA réduite", rate: 5.5 },
    ];
  }
  if (cc === "CH") {
    return [
      { name: "TVA 8,1 % (normal)", rate: 8.1 },
      { name: "TVA 2,6 % (réduit)", rate: 2.6 },
      { name: "TVA 3,7 % (hébergement)", rate: 3.7 },
    ];
  }
  return [];
}

/** Premier taux prédéfini du pays pour une nouvelle ligne (sinon 20 %, comportement historique). */
export function defaultLineTaxRateForCountry(countryCode: string): number {
  const rates = defaultTaxRatesForCountry(countryCode);
  return rates.length > 0 ? rates[0].rate : 20;
}

/** Valeur initiale / placeholder du champ « taux (%) » (ex. modal d’ajout de taux). */
export function primaryPresetTaxRateFormString(countryCode: string): string {
  const r = defaultLineTaxRateForCountry(countryCode);
  return Number.isInteger(r) ? String(r) : String(r);
}

/** Libellé d’exemple pour un nouveau taux TVA selon le pays du workspace. */
export function exampleNewTaxRateNamePlaceholder(countryCode: string): string {
  const cc = countryCode.trim().toUpperCase();
  if (cc === "CH") return "Ex. TVA 2,6 % (taux réduit)";
  if (cc === "FR") return "Ex. TVA super-réduite";
  return "Ex. Taux réduit";
}

/** Exemple de mention légale en pied de page PDF selon le pays. */
export function examplePdfFooterTaxMentionPlaceholder(
  countryCode: string,
): string {
  const cc = countryCode.trim().toUpperCase();
  if (cc === "CH")
    return "Ex. Franchise de la TVA (art. 10 LTVA)…";
  if (cc === "FR")
    return "Ex. TVA non applicable, art. 293 B du CGI…";
  return "Ex. Mentions légales relatives aux taxes…";
}
