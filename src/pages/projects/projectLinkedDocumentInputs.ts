import type * as api from "@/lib/api";
import { buildInvoiceInput } from "@/pages/documentEditor/invoiceFormPayloads";
import { buildQuoteInput } from "@/pages/documentEditor/quoteFormPayloads";
import {
  emptyInvoiceLine,
  emptyQuoteLine,
} from "@/pages/documentEditor/editableLineTypes";
import {
  parseInvoiceWorkspacePreferences,
  parseQuoteWorkspacePreferences,
} from "@/lib/documentOptions";
import { defaultLineTaxRateForCountry } from "@/lib/workspaceDefaultTaxRates";

/** Brouillon devis / BDC aligné sur l’éditeur (une ligne vide, projet + client du projet). */
export function buildDraftQuoteInputForProject(
  workspace: api.Workspace,
  project: api.Project,
  projectsEnabled: boolean,
): api.QuoteInput {
  const quotePrefs = parseQuoteWorkspacePreferences(workspace.profileJson);
  const today = new Date().toISOString().slice(0, 10);
  const customDraft =
    quotePrefs.allowCustomReference &&
    quotePrefs.defaultCustomReference.trim().length > 0
      ? quotePrefs.defaultCustomReference.trim()
      : "";
  const useCustom =
    quotePrefs.allowCustomReference && customDraft.length > 0;
  return buildQuoteInput({
    baseCurrency: workspace.baseCurrency,
    docTitle: project.name.trim() || "Projet",
    refCustomEnabled: useCustom,
    refText: customDraft,
    clientId: project.clientId ?? "",
    status: "draft",
    taxExempt: false,
    issueDateYmd: today,
    validUntilYmd: "",
    notes: "",
    pdfTemplateVariant: "",
    archived: false,
    lines: [
      emptyQuoteLine({
        defaultTaxRate: defaultLineTaxRateForCountry(workspace.countryCode),
      }),
    ],
    complements: [],
    discKindNorm: "none",
    discValSafe: 0,
    discountLabel: "",
    projectId: projectsEnabled ? project.id : null,
  });
}

/** Brouillon facture classique (même principe). */
export function buildDraftInvoiceInputForProject(
  workspace: api.Workspace,
  project: api.Project,
  projectsEnabled: boolean,
): api.InvoiceInput {
  const invoicePrefs = parseInvoiceWorkspacePreferences(workspace.profileJson);
  const today = new Date().toISOString().slice(0, 10);
  const customDraft =
    invoicePrefs.allowCustomReference &&
    invoicePrefs.defaultCustomReference.trim().length > 0
      ? invoicePrefs.defaultCustomReference.trim()
      : "";
  const useCustom =
    invoicePrefs.allowCustomReference && customDraft.length > 0;
  return buildInvoiceInput({
    documentKind: "invoice",
    creditedInvoiceId: null,
    baseCurrency: workspace.baseCurrency,
    refCustomEnabled: useCustom,
    refText: customDraft,
    clientId: project.clientId ?? "",
    quoteId: null,
    status: "draft",
    taxExempt: false,
    issueDateYmd: today,
    dueDateYmd: "",
    amountPaid: 0,
    notes: "",
    pdfTemplateVariant: "",
    archived: false,
    lines: [
      emptyInvoiceLine({
        defaultTaxRate: defaultLineTaxRateForCountry(workspace.countryCode),
      }),
    ],
    complements: [],
    discKindNorm: "none",
    discValSafe: 0,
    discountLabel: "",
    projectId: projectsEnabled ? project.id : null,
  });
}
