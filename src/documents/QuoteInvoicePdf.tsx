import type { ReactNode } from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import type { Quote, Invoice, Client } from "@/lib/api";
import {
  discountAmountHt,
  normalizeDiscountKind,
  sumLineCatalogueGrossHt,
  sumLineDiscountsHtAmount,
  type LineInput,
} from "@/core/documentMath";
import { normalizeLineBillingMode } from "@/lib/lineBilling";
import type {
  BrandingLogoAlignment,
  BrandingState,
  DocumentLayoutState,
} from "@/lib/documentOptions";
import type { PdfTemplateVariantId } from "@/lib/pdfTemplateVariants";
import { stylesForPdfVariant } from "@/documents/pdfVariantStyles";
import { getClientPdfTextLines } from "@/lib/clientDetails";
import {
  buildPdfTypographyLayer,
  effectivePdfTypographyState,
  type PdfTypographyLayer,
} from "@/lib/pdfTypography";

type PdfVariantStyles = ReturnType<typeof stylesForPdfVariant>;

function invoiceStatusLabelFr(status: string): string {
  const m: Record<string, string> = {
    draft: "Brouillon",
    issued: "Émise",
    paid: "Payée",
    partially_paid: "Partiellement payée",
    overdue: "En retard",
  };
  return m[status] ?? status;
}

/** Bloc client PDF : nom + détails (aligné sur l’aperçu écran). */
function PdfClientBlock({
  S,
  T,
  client,
  currency,
  mode,
}: {
  S: PdfVariantStyles;
  T: PdfTypographyLayer;
  client: Client;
  currency: string;
  mode: "sidebar" | "row" | "stack";
}) {
  const lines = getClientPdfTextLines(client, currency);
  if (mode === "sidebar") {
    return (
      <View>
        {lines.map((line, i) => (
          <Text
            key={i}
            style={[
              S.sidebarText,
              i === 0 ? T.clientFirstLine : T.clientFollowingLine,
            ]}
          >
            {line}
          </Text>
        ))}
      </View>
    );
  }
  if (mode === "stack") {
    return (
      <View>
        {lines.map((line, i) => (
          <Text
            key={i}
            style={[
              {
                marginBottom: i < lines.length - 1 ? 3 : 0,
              },
              i === 0 ? T.clientFirstLine : T.clientFollowingLine,
            ]}
          >
            {line}
          </Text>
        ))}
      </View>
    );
  }
  return (
    <View style={{ alignItems: "flex-start" }}>
      {lines.map((line, i) => (
        <Text
          key={i}
          style={[
            {
              marginBottom: i < lines.length - 1 ? 3 : 0,
            },
            i === 0 ? T.clientFirstLine : T.clientFollowingLine,
          ]}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}

function logoAlignItems(
  align: BrandingLogoAlignment,
): "flex-start" | "center" | "flex-end" {
  if (align === "center") return "center";
  if (align === "right") return "flex-end";
  return "flex-start";
}

function PdfHeaderLogo({
  show,
  logoDataUrl,
  align,
  S,
}: {
  show: boolean;
  logoDataUrl: string | null;
  align: BrandingLogoAlignment;
  S: PdfVariantStyles;
}) {
  if (!show || !logoDataUrl) return null;
  return (
    <View style={{ width: "100%", alignItems: logoAlignItems(align) }}>
      <Image src={logoDataUrl} style={S.logo} />
    </View>
  );
}

/**
 * Montants pour react-pdf : ne pas utiliser `toLocaleString("fr-FR")`, qui insère
 * U+202F (espace fine insécable) entre milliers — glyphe absent des polices PDF
 * type Helvetica, d’où un caractère de substitution (souvent « / »).
 */
function formatMoney(n: number, currency: string): string {
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(Number(n));
  if (!Number.isFinite(v)) return `—\u00A0${currency}`;
  const [intPart, frac = "00"] = v.toFixed(2).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  /** Espace insécable avant la devise : évite la fusion « 10,00CHF » en colonne étroite (react-pdf). */
  return `${sign}${grouped},${frac}\u00A0${currency}`;
}

type CommonProps = {
  workspaceName: string;
  branding: BrandingState;
  layout: DocumentLayoutState;
  logoDataUrl: string | null;
  client: Client | null;
  templateVariant: PdfTemplateVariantId;
  /** Famille react-pdf (intégrée ou nom dynamique enregistré via `Font.register`). */
  bodyFontFamily: string;
  pdfTypographyModuleActive: boolean;
  /** Affiché sous le slogan si renseigné (module Projets + préférence PDF). */
  projectPdfLabel?: string | null;
};

type LineLike = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
  billingMode?: string;
  lineDiscountKind?: string;
  lineDiscountValue?: number;
};

function pdfLineDescription(l: LineLike): string {
  const mode = normalizeLineBillingMode(l.billingMode);
  const d = l.description;
  if (mode === "flat") return `${d} — Forfait`;
  if (mode === "hourly") return `${d} — À l’heure`;
  return d;
}

function pdfShowLineRemiseColumn(
  lines: Array<{ lineDiscountKind?: string; lineDiscountValue?: number }>,
): boolean {
  return lines.some((l) => {
    const k = normalizeDiscountKind(l.lineDiscountKind);
    const v = l.lineDiscountValue ?? 0;
    return k !== "none" && Number.isFinite(v) && v > 0;
  });
}

function pdfLineRemiseText(l: LineLike, currency: string): string {
  const k = normalizeDiscountKind(l.lineDiscountKind);
  const v = l.lineDiscountValue ?? 0;
  if (k === "none" || !Number.isFinite(v) || v <= 0) return "—";
  if (k === "percent") return `−${v} %`;
  return `−${formatMoney(v, currency)}`;
}

function PdfLineTable({
  S,
  T,
  lines,
  currency,
  taxExempt,
  showTaxBreakdown,
  showLineRemiseColumn,
}: {
  S: ReturnType<typeof stylesForPdfVariant>;
  T: PdfTypographyLayer;
  lines: LineLike[];
  currency: string;
  taxExempt: boolean;
  showTaxBreakdown: boolean;
  showLineRemiseColumn: boolean;
}) {
  const colDescStyle = showLineRemiseColumn
    ? { ...S.colDesc, flex: 2.2 as const }
    : S.colDesc;
  const colRemise = { flex: 1 as const, textAlign: "right" as const, minWidth: 56 };
  const tr = T.tableRowText;
  const th = [S.tableHeaderText, T.tableHeaderText] as const;
  return (
    <>
      <View style={S.tableHeader}>
        <Text style={[colDescStyle, ...th]}>Description</Text>
        <Text style={[S.colNum, ...th]}>Qté</Text>
        <Text style={[S.colNum, ...th]}>P.U. HT</Text>
        {showLineRemiseColumn ? (
          <Text style={[colRemise, ...th]}>Remise</Text>
        ) : null}
        {showTaxBreakdown ? (
          <Text style={[S.colNum, ...th]}>TVA %</Text>
        ) : null}
        <Text style={[S.colNum, ...th]}>Montant TTC</Text>
      </View>
      {lines.map((l) => (
        <View key={l.id} style={S.tableRow} wrap={false}>
          <Text style={[colDescStyle, tr]}>{pdfLineDescription(l)}</Text>
          <Text style={[S.colNum, tr]}>{l.quantity}</Text>
          <Text style={[S.colNum, tr]}>{formatMoney(l.unitPrice, currency)}</Text>
          {showLineRemiseColumn ? (
            <Text style={[colRemise, tr]}>{pdfLineRemiseText(l, currency)}</Text>
          ) : null}
          {showTaxBreakdown ? (
            <Text style={[S.colNum, tr]}>
              {taxExempt ? "—" : `${l.taxRate} %`}
            </Text>
          ) : null}
          <Text style={[S.colNum, tr]}>{formatMoney(l.lineTotal, currency)}</Text>
        </View>
      ))}
    </>
  );
}

function pdfLineInputsFromDocLines(doc: Quote | Invoice): LineInput[] {
  return doc.lines.map((l) => ({
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRatePercent: l.taxRate,
    lineDiscountKind: l.lineDiscountKind ?? "none",
    lineDiscountValue: l.lineDiscountValue ?? 0,
  }));
}

function pdfDiscountLeading(
  doc: Quote | Invoice,
  currency: string,
  S: ReturnType<typeof stylesForPdfVariant>,
  T: PdfTypographyLayer,
): ReactNode | null {
  const EPS = 1e-6;
  const inputs = pdfLineInputsFromDocLines(doc);
  const catalogueHt = sumLineCatalogueGrossHt(inputs);
  const lineDiscHt = sumLineDiscountsHtAmount(inputs);
  const netLinesHt = doc.lines.reduce((s, l) => s + l.lineSubtotal, 0);
  const hasLineDisc = lineDiscHt > EPS;

  const docKind = normalizeDiscountKind(doc.discountKind);
  const docVal = doc.discountValue ?? 0;
  const docDiscHt =
    docKind !== "none" && Number.isFinite(docVal) && docVal > 0
      ? discountAmountHt(netLinesHt, docKind, docVal)
      : 0;
  const hasDocDisc = docDiscHt > EPS;

  if (!hasLineDisc && !hasDocDisc) return null;

  const docLabel = doc.discountLabel?.trim() || "Réduction commerciale";

  const td = T.discountLeading;
  return (
    <>
      {hasLineDisc ? (
        <>
          <View style={S.totalLine}>
            <Text style={td}>Total HT brut (lignes)</Text>
            <Text style={td}>{formatMoney(catalogueHt, currency)}</Text>
          </View>
          <View style={S.totalLine}>
            <Text style={td}>Remises articles</Text>
            <Text style={td}>−{formatMoney(lineDiscHt, currency)}</Text>
          </View>
        </>
      ) : null}
      {hasDocDisc ? (
        <>
          <View style={S.totalLine}>
            <Text style={td}>Total HT (lignes)</Text>
            <Text style={td}>{formatMoney(netLinesHt, currency)}</Text>
          </View>
          <View style={S.totalLine}>
            <Text style={td}>{docLabel}</Text>
            <Text style={td}>−{formatMoney(docDiscHt, currency)}</Text>
          </View>
        </>
      ) : null}
    </>
  );
}

function PdfTotals({
  S,
  T,
  subtotal,
  taxTotal,
  total,
  currency,
  showTaxBreakdown,
  extraRows,
  discountLeading,
}: {
  S: ReturnType<typeof stylesForPdfVariant>;
  T: PdfTypographyLayer;
  subtotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  showTaxBreakdown: boolean;
  extraRows?: ReactNode;
  discountLeading?: ReactNode;
}) {
  const d = T.totalDetail;
  const g = T.totalGrand;
  return (
    <View style={S.totals}>
      {discountLeading}
      <View style={S.totalLine}>
        <Text style={d}>{discountLeading ? "Sous-total HT" : "Total HT"}</Text>
        <Text style={d}>{formatMoney(subtotal, currency)}</Text>
      </View>
      {showTaxBreakdown ? (
        <View style={S.totalLine}>
          <Text style={d}>TVA</Text>
          <Text style={d}>{formatMoney(taxTotal, currency)}</Text>
        </View>
      ) : null}
      <View style={S.totalLine}>
        <Text style={g}>Total TTC</Text>
        <Text style={g}>{formatMoney(total, currency)}</Text>
      </View>
      {extraRows}
    </View>
  );
}

export function QuotePdfDocument({
  quote,
  /** Libellé avant le numéro sur le PDF (ex. « Devis », « Bon de commande »). */
  quotePdfTitlePrefix = "Devis",
  ...common
}: CommonProps & { quote: Quote; quotePdfTitlePrefix?: string }) {
  const S = stylesForPdfVariant(
    common.templateVariant,
    common.bodyFontFamily,
  );
  const T = buildPdfTypographyLayer(
    effectivePdfTypographyState(
      common.layout.pdfTypography,
      common.pdfTypographyModuleActive,
    ),
  );
  const toggles = common.layout.quote;
  const v = common.templateVariant;
  const showDocNumber = toggles.showDocumentNumberOnPdf;
  /** Réf. personnalisée : toujours afficher sur le PDF même si « numéro sur PDF » est désactivé. */
  const quoteReferencePdfVisible =
    showDocNumber ||
    (quote.useCustomNumber === true && quote.number.trim().length > 0);
  const title =
    common.branding.documentTitle.trim() || common.workspaceName;

  const metaBlock =
    v !== "studio" && common.client ? (
      <>
        {v !== "stripe" && quoteReferencePdfVisible ? (
          <Text style={[S.docTitle, T.docTitle]}>
            {quotePdfTitlePrefix} {quote.number}
          </Text>
        ) : null}
        <View style={S.quoteMetaGrid}>
          <View style={S.quoteMetaCol}>
            <PdfClientBlock
              S={S}
              T={T}
              client={common.client}
              currency={quote.currency}
              mode="stack"
            />
          </View>
          <View style={S.quoteMetaCol}>
            <View style={S.metaDateRow}>
              <View style={{ flex: 1 }}>
                <Text style={T.metaValue}>{quote.issueDate.slice(0, 10)}</Text>
              </View>
              {quote.validUntil ? (
                <View style={{ flex: 1 }}>
                  <Text style={[S.metaColHeading, T.metaSmallHeading]}>
                    Valable jusqu’au
                  </Text>
                  <Text style={T.metaValue}>
                    {quote.validUntil.slice(0, 10)}
                  </Text>
                </View>
              ) : null}
            </View>
            {quote.title.trim() ? (
              <View style={[S.row, { alignItems: "flex-start" }]}>
                <Text style={[S.label, T.metaLabel]}>Objet</Text>
                <View style={{ flex: 1 }}>
                  <Text style={T.metaValue}>{quote.title.trim()}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </>
    ) : (
      <>
        {v !== "stripe" && quoteReferencePdfVisible ? (
          <Text style={[S.docTitle, T.docTitle]}>
            {quotePdfTitlePrefix} {quote.number}
          </Text>
        ) : null}
        <View style={{ marginBottom: 4 }}>
          <Text style={T.metaValue}>{quote.issueDate.slice(0, 10)}</Text>
        </View>
        {quote.validUntil ? (
          <View style={S.row}>
            <Text style={[S.label, T.metaLabel]}>Valable jusqu’au</Text>
            <Text style={T.metaValue}>{quote.validUntil.slice(0, 10)}</Text>
          </View>
        ) : null}
        {quote.title.trim() ? (
          <View style={[S.row, { alignItems: "flex-start" }]}>
            <Text style={[S.label, T.metaLabel]}>Objet</Text>
            <View style={{ flex: 1 }}>
              <Text style={T.metaValue}>{quote.title.trim()}</Text>
            </View>
          </View>
        ) : null}
      </>
    );

  const bodyRest = (
    <>
      <View style={S.preTableAccent} />
      <PdfLineTable
        S={S}
        T={T}
        lines={quote.lines}
        currency={quote.currency}
        taxExempt={quote.taxExempt}
        showTaxBreakdown={toggles.showTaxBreakdown}
        showLineRemiseColumn={pdfShowLineRemiseColumn(quote.lines)}
      />
      <PdfTotals
        S={S}
        T={T}
        subtotal={quote.subtotal}
        taxTotal={quote.taxTotal}
        total={quote.total}
        currency={quote.currency}
        showTaxBreakdown={toggles.showTaxBreakdown}
        discountLeading={pdfDiscountLeading(quote, quote.currency, S, T)}
      />
      {quote.complements
        .filter((c) => c.body.trim())
        .map((c) => (
          <View key={c.id} wrap={false}>
            <Text style={[S.blockText, T.complements]}>{c.body.trim()}</Text>
          </View>
        ))}
      {toggles.showLegalFooter && common.layout.footerText.trim() ? (
        <Text style={[S.footer, T.footer]} fixed>
          {common.layout.footerText.trim()}
        </Text>
      ) : null}
    </>
  );

  const logoTitle = (
    <>
      <PdfHeaderLogo
        show={toggles.showLogo}
        logoDataUrl={common.logoDataUrl}
        align={common.branding.logoAlignment}
        S={S}
      />
      <Text style={[S.title, T.title]}>{title}</Text>
      {toggles.showTagline && common.branding.tagline.trim() ? (
        <Text style={[S.subtitle, T.subtitle]}>
          {common.branding.tagline.trim()}
        </Text>
      ) : null}
      {common.projectPdfLabel?.trim() ? (
        <Text style={[T.metaValue, { marginTop: 4 }]}>
          Projet : {common.projectPdfLabel.trim()}
        </Text>
      ) : null}
    </>
  );

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {v === "stripe" && quoteReferencePdfVisible ? (
          <View style={S.stripeBanner} fixed>
            <Text style={[S.stripeBannerText, T.stripeBannerText]}>
              {quotePdfTitlePrefix} {quote.number}
            </Text>
          </View>
        ) : null}

        {v === "studio" ? (
          <View style={{ flexDirection: "row" }}>
            <View style={S.sidebar}>
              {common.client ? (
                <PdfClientBlock
                  S={S}
                  T={T}
                  client={common.client}
                  currency={quote.currency}
                  mode="sidebar"
                />
              ) : (
                <Text style={[S.sidebarText, T.studioSidebar]}>—</Text>
              )}
            </View>
            <View style={S.mainColumn}>
              {logoTitle}
              {metaBlock}
              {bodyRest}
            </View>
          </View>
        ) : (
          <>
            {logoTitle}
            {metaBlock}
            {bodyRest}
          </>
        )}
      </Page>
    </Document>
  );
}

export function InvoicePdfDocument({
  invoice,
  ...common
}: CommonProps & { invoice: Invoice }) {
  const docTitleFr =
    invoice.documentKind === "credit_note" ? "Avoir" : "Facture";
  const S = stylesForPdfVariant(
    common.templateVariant,
    common.bodyFontFamily,
  );
  const T = buildPdfTypographyLayer(
    effectivePdfTypographyState(
      common.layout.pdfTypography,
      common.pdfTypographyModuleActive,
    ),
  );
  const toggles = common.layout.invoice;
  const v = common.templateVariant;
  const showDocNumber = toggles.showDocumentNumberOnPdf;
  const invoiceReferencePdfVisible =
    showDocNumber ||
    (invoice.useCustomNumber === true && invoice.number.trim().length > 0);
  const title =
    common.branding.documentTitle.trim() || common.workspaceName;

  const metaBlock =
    v !== "studio" && common.client ? (
      <>
        {v !== "stripe" && invoiceReferencePdfVisible ? (
          <Text style={[S.docTitle, T.docTitle]}>
            {docTitleFr} {invoice.number}
          </Text>
        ) : null}
        <View style={S.quoteMetaGrid}>
          <View style={S.quoteMetaCol}>
            <PdfClientBlock
              S={S}
              T={T}
              client={common.client}
              currency={invoice.currency}
              mode="stack"
            />
          </View>
          <View style={S.quoteMetaCol}>
            <View style={S.metaDateRow}>
              <View style={{ flex: 1 }}>
                <Text style={T.metaValue}>
                  {invoice.issueDate.slice(0, 10)}
                </Text>
              </View>
              {invoice.dueDate ? (
                <View style={{ flex: 1 }}>
                  <Text style={[S.metaColHeading, T.metaSmallHeading]}>
                    Échéance
                  </Text>
                  <Text style={T.metaValue}>
                    {invoice.dueDate.slice(0, 10)}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={{ marginBottom: 4 }}>
              <Text style={T.metaValue}>
                {invoiceStatusLabelFr(invoice.status)}
              </Text>
            </View>
          </View>
        </View>
      </>
    ) : (
      <>
        {v !== "stripe" && invoiceReferencePdfVisible ? (
          <Text style={[S.docTitle, T.docTitle]}>
            {docTitleFr} {invoice.number}
          </Text>
        ) : null}
        <View style={{ marginBottom: 4 }}>
          <Text style={T.metaValue}>{invoice.issueDate.slice(0, 10)}</Text>
        </View>
        {invoice.dueDate ? (
          <View style={S.row}>
            <Text style={[S.label, T.metaLabel]}>Échéance</Text>
            <Text style={T.metaValue}>{invoice.dueDate.slice(0, 10)}</Text>
          </View>
        ) : null}
        <View style={{ marginBottom: 4 }}>
          <Text style={T.metaValue}>
            {invoiceStatusLabelFr(invoice.status)}
          </Text>
        </View>
      </>
    );

  const bodyRest = (
    <>
      <View style={S.preTableAccent} />
      <PdfLineTable
        S={S}
        T={T}
        lines={invoice.lines}
        currency={invoice.currency}
        taxExempt={invoice.taxExempt}
        showTaxBreakdown={toggles.showTaxBreakdown}
        showLineRemiseColumn={pdfShowLineRemiseColumn(invoice.lines)}
      />
      <PdfTotals
        S={S}
        T={T}
        subtotal={invoice.subtotal}
        taxTotal={invoice.taxTotal}
        total={invoice.total}
        currency={invoice.currency}
        showTaxBreakdown={toggles.showTaxBreakdown}
        discountLeading={pdfDiscountLeading(invoice, invoice.currency, S, T)}
        extraRows={
          invoice.amountPaid > 1e-6 ? (
            <View style={S.totalLine}>
              <Text style={T.totalDetail}>Déjà payé</Text>
              <Text style={T.totalDetail}>
                {formatMoney(invoice.amountPaid, invoice.currency)}
              </Text>
            </View>
          ) : null
        }
      />
      {invoice.complements
        .filter((c) => c.body.trim())
        .map((c) => (
          <View key={c.id} wrap={false}>
            <Text style={[S.blockText, T.complements]}>{c.body.trim()}</Text>
          </View>
        ))}
      {toggles.showLegalFooter && common.layout.footerText.trim() ? (
        <Text style={[S.footer, T.footer]} fixed>
          {common.layout.footerText.trim()}
        </Text>
      ) : null}
    </>
  );

  const logoTitle = (
    <>
      <PdfHeaderLogo
        show={toggles.showLogo}
        logoDataUrl={common.logoDataUrl}
        align={common.branding.logoAlignment}
        S={S}
      />
      <Text style={[S.title, T.title]}>{title}</Text>
      {toggles.showTagline && common.branding.tagline.trim() ? (
        <Text style={[S.subtitle, T.subtitle]}>
          {common.branding.tagline.trim()}
        </Text>
      ) : null}
      {common.projectPdfLabel?.trim() ? (
        <Text style={[T.metaValue, { marginTop: 4 }]}>
          Projet : {common.projectPdfLabel.trim()}
        </Text>
      ) : null}
    </>
  );

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {v === "stripe" && invoiceReferencePdfVisible ? (
          <View style={S.stripeBanner} fixed>
            <Text style={[S.stripeBannerText, T.stripeBannerText]}>
              {docTitleFr} {invoice.number}
            </Text>
          </View>
        ) : null}

        {v === "studio" ? (
          <View style={{ flexDirection: "row" }}>
            <View style={S.sidebar}>
              {common.client ? (
                <PdfClientBlock
                  S={S}
                  T={T}
                  client={common.client}
                  currency={invoice.currency}
                  mode="sidebar"
                />
              ) : (
                <Text style={[S.sidebarText, T.studioSidebar]}>—</Text>
              )}
            </View>
            <View style={S.mainColumn}>
              {logoTitle}
              {metaBlock}
              {bodyRest}
            </View>
          </View>
        ) : (
          <>
            {logoTitle}
            {metaBlock}
            {bodyRest}
          </>
        )}
      </Page>
    </Document>
  );
}
