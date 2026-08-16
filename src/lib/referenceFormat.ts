/** Jetons : `{PREFIX}`, `{AUTO}` (ex. prochain DEV-xxxxx / FAC-xxxxx), `{YYYY}`, `{YY}`, `{MM}`, `{DD}` (date d’émission). */

export type ReferenceFormatContext = {
  /** Valeur du champ « Code court » (Paramètres). */
  prefix: string;
  /** Prochain numéro auto sans consommer le compteur (ex. `peekNextQuoteNumber` / `peekNextInvoiceNumber`). */
  autoNumber: string;
  /** Date d’émission `YYYY-MM-DD` (sinon date du jour). */
  issueDateYmd: string;
};

function dateParts(issueDateYmd: string): { y: string; yy: string; m: string; d: string } {
  const raw = issueDateYmd.trim();
  const d = raw
    ? new Date(`${raw}T12:00:00`)
    : new Date();
  if (Number.isNaN(d.getTime())) {
    const n = new Date();
    const y = n.getFullYear();
    const m = String(n.getMonth() + 1).padStart(2, "0");
    const day = String(n.getDate()).padStart(2, "0");
    return {
      y: String(y),
      yy: String(y).slice(-2),
      m,
      d: day,
    };
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return {
    y: String(y),
    yy: String(y).slice(-2),
    m,
    d: day,
  };
}

/**
 * Remplace les jetons dans `template`. Si `template` est vide, renvoie `ctx.autoNumber`.
 */
export function formatReferenceTemplate(
  template: string,
  ctx: ReferenceFormatContext,
): string {
  const t = template.trim();
  if (!t) return ctx.autoNumber.trim();
  const { y, yy, m, d } = dateParts(ctx.issueDateYmd);
  return t
    .replaceAll("{PREFIX}", ctx.prefix.trim())
    .replaceAll("{AUTO}", ctx.autoNumber.trim())
    .replaceAll("{YYYY}", y)
    .replaceAll("{YY}", yy)
    .replaceAll("{MM}", m)
    .replaceAll("{DD}", d);
}
