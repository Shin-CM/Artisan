import { pdf } from "@react-pdf/renderer";
import type { Quote, Invoice, Client } from "@/lib/api";
import {
  resolvePdfTemplateVariant,
  type BrandingState,
  type DocumentLayoutState,
} from "@/lib/documentOptions";
import {
  QuotePdfDocument,
  InvoicePdfDocument,
} from "@/documents/QuoteInvoicePdf";
import { resolvePdfExportBodyFontFamily } from "@/lib/pdfFontResolve";

export type PdfCommonContext = {
  workspaceId: string;
  workspaceName: string;
  branding: BrandingState;
  layout: DocumentLayoutState;
  logoDataUrl: string | null;
  client: Client | null;
  /** Module Marketplace « Typographie PDF » installé et activé. */
  pdfTypographyModuleActive: boolean;
  /** Libellé projet pour le PDF (si option et module actifs). */
  projectPdfLabel: string | null;
};

export async function buildQuotePdfBytes(
  quote: Quote,
  common: PdfCommonContext,
  options?: { quotePdfTitlePrefix?: string },
): Promise<Uint8Array> {
  const { workspaceId, ...commonForDoc } = common;
  const templateVariant = resolvePdfTemplateVariant(
    quote.pdfTemplateVariant,
    common.layout,
  );
  const bodyFontFamily = await resolvePdfExportBodyFontFamily(
    common.branding.pdfFont,
    workspaceId,
  );
  const projectPdfLabel =
    common.layout.showProjectOnPdf && common.projectPdfLabel?.trim()
      ? common.projectPdfLabel.trim()
      : null;
  const doc = (
    <QuotePdfDocument
      quote={quote}
      quotePdfTitlePrefix={options?.quotePdfTitlePrefix}
      {...commonForDoc}
      projectPdfLabel={projectPdfLabel}
      pdfTypographyModuleActive={common.pdfTypographyModuleActive}
      templateVariant={templateVariant}
      bodyFontFamily={bodyFontFamily}
    />
  );
  const blob = await pdf(doc).toBlob();
  return new Uint8Array(await blob.arrayBuffer());
}

export async function buildInvoicePdfBytes(
  invoice: Invoice,
  common: PdfCommonContext,
): Promise<Uint8Array> {
  const { workspaceId, ...commonForDoc } = common;
  const templateVariant = resolvePdfTemplateVariant(
    invoice.pdfTemplateVariant,
    common.layout,
  );
  const bodyFontFamily = await resolvePdfExportBodyFontFamily(
    common.branding.pdfFont,
    workspaceId,
  );
  const projectPdfLabel =
    common.layout.showProjectOnPdf && common.projectPdfLabel?.trim()
      ? common.projectPdfLabel.trim()
      : null;
  const doc = (
    <InvoicePdfDocument
      invoice={invoice}
      {...commonForDoc}
      projectPdfLabel={projectPdfLabel}
      pdfTypographyModuleActive={common.pdfTypographyModuleActive}
      templateVariant={templateVariant}
      bodyFontFamily={bodyFontFamily}
    />
  );
  const blob = await pdf(doc).toBlob();
  return new Uint8Array(await blob.arrayBuffer());
}
