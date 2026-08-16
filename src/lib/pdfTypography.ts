/** Typographie PDF par blocs (profil `documentLayout.pdfTypography`). */

export type PdfTextEmphasis = "normal" | "bold" | "italic" | "boldItalic";

export type PdfTypographyState = {
  header: {
    documentTitle: PdfTextEmphasis;
    tagline: PdfTextEmphasis;
  };
  stripeBanner: PdfTextEmphasis;
  documentHeading: PdfTextEmphasis;
  meta: {
    labels: PdfTextEmphasis;
    values: PdfTextEmphasis;
    smallHeadings: PdfTextEmphasis;
  };
  client: {
    firstLine: PdfTextEmphasis;
    followingLines: PdfTextEmphasis;
  };
  studioSidebar: PdfTextEmphasis;
  lineItems: {
    columnHeaders: PdfTextEmphasis;
    rows: PdfTextEmphasis;
  };
  totals: {
    detailLines: PdfTextEmphasis;
    grandTotal: PdfTextEmphasis;
  };
  complements: PdfTextEmphasis;
  footer: PdfTextEmphasis;
};

export type PdfTypographyTextStyle = {
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
};

export function emphasisToStyle(e: PdfTextEmphasis): PdfTypographyTextStyle {
  switch (e) {
    case "bold":
      return { fontWeight: "bold", fontStyle: "normal" };
    case "italic":
      return { fontWeight: "normal", fontStyle: "italic" };
    case "boldItalic":
      return { fontWeight: "bold", fontStyle: "italic" };
    default:
      return { fontWeight: "normal", fontStyle: "normal" };
  }
}

export function defaultPdfTypography(): PdfTypographyState {
  return {
    header: { documentTitle: "normal", tagline: "normal" },
    stripeBanner: "bold",
    documentHeading: "bold",
    meta: {
      labels: "normal",
      values: "normal",
      smallHeadings: "normal",
    },
    client: { firstLine: "bold", followingLines: "normal" },
    studioSidebar: "normal",
    lineItems: { columnHeaders: "bold", rows: "normal" },
    totals: { detailLines: "normal", grandTotal: "bold" },
    complements: "normal",
    footer: "normal",
  };
}

function parseEmphasis(raw: unknown, fallback: PdfTextEmphasis): PdfTextEmphasis {
  if (
    raw === "normal" ||
    raw === "bold" ||
    raw === "italic" ||
    raw === "boldItalic"
  ) {
    return raw;
  }
  return fallback;
}

export function parsePdfTypography(raw: unknown): PdfTypographyState {
  const d = defaultPdfTypography();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return d;
  const o = raw as Record<string, unknown>;
  const header = o.header as Record<string, unknown> | undefined;
  const meta = o.meta as Record<string, unknown> | undefined;
  const client = o.client as Record<string, unknown> | undefined;
  const lineItems = o.lineItems as Record<string, unknown> | undefined;
  const totals = o.totals as Record<string, unknown> | undefined;
  return {
    header: {
      documentTitle: parseEmphasis(
        header?.documentTitle,
        d.header.documentTitle,
      ),
      tagline: parseEmphasis(header?.tagline, d.header.tagline),
    },
    stripeBanner: parseEmphasis(o.stripeBanner, d.stripeBanner),
    documentHeading: parseEmphasis(o.documentHeading, d.documentHeading),
    meta: {
      labels: parseEmphasis(meta?.labels, d.meta.labels),
      values: parseEmphasis(meta?.values, d.meta.values),
      smallHeadings: parseEmphasis(meta?.smallHeadings, d.meta.smallHeadings),
    },
    client: {
      firstLine: parseEmphasis(client?.firstLine, d.client.firstLine),
      followingLines: parseEmphasis(
        client?.followingLines,
        d.client.followingLines,
      ),
    },
    studioSidebar: parseEmphasis(o.studioSidebar, d.studioSidebar),
    lineItems: {
      columnHeaders: parseEmphasis(
        lineItems?.columnHeaders,
        d.lineItems.columnHeaders,
      ),
      rows: parseEmphasis(lineItems?.rows, d.lineItems.rows),
    },
    totals: {
      detailLines: parseEmphasis(totals?.detailLines, d.totals.detailLines),
      grandTotal: parseEmphasis(totals?.grandTotal, d.totals.grandTotal),
    },
    complements: parseEmphasis(o.complements, d.complements),
    footer: parseEmphasis(o.footer, d.footer),
  };
}

/** Styles additionnels pour fusion sur les `<Text>` (stratégie B). */
export type PdfTypographyLayer = {
  title: PdfTypographyTextStyle;
  subtitle: PdfTypographyTextStyle;
  stripeBannerText: PdfTypographyTextStyle;
  docTitle: PdfTypographyTextStyle;
  metaLabel: PdfTypographyTextStyle;
  metaValue: PdfTypographyTextStyle;
  metaSmallHeading: PdfTypographyTextStyle;
  clientFirstLine: PdfTypographyTextStyle;
  clientFollowingLine: PdfTypographyTextStyle;
  studioSidebar: PdfTypographyTextStyle;
  tableHeaderText: PdfTypographyTextStyle;
  tableRowText: PdfTypographyTextStyle;
  totalDetail: PdfTypographyTextStyle;
  totalGrand: PdfTypographyTextStyle;
  complements: PdfTypographyTextStyle;
  footer: PdfTypographyTextStyle;
  discountLeading: PdfTypographyTextStyle;
};

export function buildPdfTypographyLayer(
  typo: PdfTypographyState,
): PdfTypographyLayer {
  return {
    title: emphasisToStyle(typo.header.documentTitle),
    subtitle: emphasisToStyle(typo.header.tagline),
    stripeBannerText: emphasisToStyle(typo.stripeBanner),
    docTitle: emphasisToStyle(typo.documentHeading),
    metaLabel: emphasisToStyle(typo.meta.labels),
    metaValue: emphasisToStyle(typo.meta.values),
    metaSmallHeading: emphasisToStyle(typo.meta.smallHeadings),
    clientFirstLine: emphasisToStyle(typo.client.firstLine),
    clientFollowingLine: emphasisToStyle(typo.client.followingLines),
    studioSidebar: emphasisToStyle(typo.studioSidebar),
    tableHeaderText: emphasisToStyle(typo.lineItems.columnHeaders),
    tableRowText: emphasisToStyle(typo.lineItems.rows),
    totalDetail: emphasisToStyle(typo.totals.detailLines),
    totalGrand: emphasisToStyle(typo.totals.grandTotal),
    complements: emphasisToStyle(typo.complements),
    footer: emphasisToStyle(typo.footer),
    discountLeading: emphasisToStyle(typo.totals.detailLines),
  };
}

export function effectivePdfTypographyState(
  layoutPdfTypography: PdfTypographyState | undefined,
  moduleActive: boolean,
): PdfTypographyState {
  if (!moduleActive) return defaultPdfTypography();
  return layoutPdfTypography ?? defaultPdfTypography();
}
