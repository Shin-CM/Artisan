import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useGlobalSearch } from "@/context/GlobalSearchContext";
import {
  globalSearchNormalized,
  invoiceMatchesGlobalSearch,
  quoteMatchesGlobalSearch,
} from "@/lib/globalSearchFilter";
import * as api from "@/lib/api";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { toast } from "sonner";
import { normalizeDiscountKind } from "@/core/documentMath";
import { computeDocumentDiscountDerived } from "@/pages/documentEditor/documentDiscountTotals";
import {
  type EditableComplement,
} from "@/components/DocumentComplementsEditor";
import {
  defaultDocumentInputPreferences,
  defaultDocumentLayout,
  defaultInvoiceWorkspacePreferences,
  issuedInvoiceContentLocked,
  parseDocumentInputPreferences,
  parseDocumentLayout,
  parseInvoiceWorkspacePreferences,
} from "@/lib/documentOptions";
import {
  buildInvoiceForPdf,
  buildInvoiceInput,
} from "@/pages/documentEditor/invoiceFormPayloads";
import { mapQuoteLineToInvoiceEditable } from "@/pages/documentEditor/invoiceQuoteImport";
import { makeCurrencyFormatter } from "@/pages/documentEditor/currency";
import { invoiceEditorPersistActions } from "@/pages/documentEditor/invoices/invoiceEditorPersistActions";
import {
  emptyInvoiceLine,
  type InvoiceEditableLine,
} from "@/pages/documentEditor/editableLineTypes";
import { editorLineDiscountFromApi } from "@/pages/documentEditor/lineDiscountPayload";
import { normalizeLineBillingMode } from "@/lib/lineBilling";
import { orderedProjectComboboxOptions } from "@/pages/projects/projectUtils";
import { useOptionalProjectWorkspace } from "@/context/ProjectWorkspaceContext";
import { filterDocumentsByProjectId } from "@/pages/projects/projectWorkspaceFilters";
import { defaultLineTaxRateForCountry } from "@/lib/workspaceDefaultTaxRates";

export function useInvoicesPage({
  documentKind = "invoice",
}: {
  documentKind?: "invoice" | "credit_note";
} = {}) {
  const docLabel = documentKind === "credit_note" ? "Avoir" : "Facture";
  const navigate = useNavigate();
  const { active } = useWorkspace();
  const { creditNotesEnabled, projectsEnabled } = useDocumentModules();
  const { query: globalSearchQuery } = useGlobalSearch();
  const lineDefaultTaxRate = React.useMemo(
    () => defaultLineTaxRateForCountry(active?.countryCode ?? ""),
    [active?.countryCode],
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = React.useState<api.Invoice[]>([]);
  const [quotes, setQuotes] = React.useState<api.Quote[]>([]);
  const [clients, setClients] = React.useState<api.Client[]>([]);
  const [articles, setArticles] = React.useState<api.Article[]>([]);
  const [categories, setCategories] = React.useState<api.Category[]>([]);
  const [taxRates, setTaxRates] = React.useState<api.TaxRate[]>([]);
  const [sel, setSel] = React.useState<api.Invoice | null>(null);
  const [clientId, setClientId] = React.useState<string>("");
  const [status, setStatus] = React.useState("draft");
  const [taxExempt, setTaxExempt] = React.useState(false);
  const [issueDate, setIssueDate] = React.useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = React.useState("");
  const [amountPaid, setAmountPaid] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [lines, setLines] = React.useState<InvoiceEditableLine[]>(() => [
    emptyInvoiceLine({ defaultTaxRate: lineDefaultTaxRate }),
  ]);
  const [complements, setComplements] = React.useState<EditableComplement[]>(
    [],
  );
  const [snippets, setSnippets] = React.useState<api.TextSnippet[]>([]);
  const [pdfLoading, setPdfLoading] = React.useState(false);
  const [pdfTemplateVariant, setPdfTemplateVariant] = React.useState("");
  const [quickClientOpen, setQuickClientOpen] = React.useState(false);
  const [quickArticleOpen, setQuickArticleOpen] = React.useState(false);
  const quickArticleLineRef = React.useRef<number | null>(null);
  const [taxRatesModalOpen, setTaxRatesModalOpen] = React.useState(false);
  const [discountKind, setDiscountKind] = React.useState<
    "none" | "percent" | "fixed"
  >("none");
  const [discountValue, setDiscountValue] = React.useState(0);
  const [discountLabel, setDiscountLabel] = React.useState("");
  const [discountPresets, setDiscountPresets] = React.useState<
    api.DiscountPreset[]
  >([]);
  const [discountPresetsModalOpen, setDiscountPresetsModalOpen] =
    React.useState(false);
  const [discountPresetSelectKey, setDiscountPresetSelectKey] =
    React.useState(0);
  const [lineEntryMode, setLineEntryMode] = React.useState<
    "articles" | "quotes"
  >("articles");
  const [quoteListFilter, setQuoteListFilter] = React.useState("");
  const [customRefDraft, setCustomRefDraft] = React.useState("");
  const [peekedNextInvoiceNumber, setPeekedNextInvoiceNumber] = React.useState<
    string | null
  >(null);
  /** Factures classiques pour lier un avoir (liste déroulante). */
  const [linkableStandardInvoices, setLinkableStandardInvoices] = React.useState<
    api.Invoice[]
  >([]);
  const [creditedInvoiceId, setCreditedInvoiceId] = React.useState("");
  const [projects, setProjects] = React.useState<api.Project[]>([]);
  const [projectId, setProjectId] = React.useState("");
  const skipClearProjectForNewFromProjectRef = React.useRef(false);
  const projectWorkspace = useOptionalProjectWorkspace();
  const lockedProjectId = projectWorkspace?.projectId ?? null;

  const articleById = React.useMemo(() => {
    const m = new Map<string, api.Article>();
    for (const a of articles) m.set(a.id, a);
    return m;
  }, [articles]);

  const clientOptions = React.useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name })),
    [clients],
  );

  const clientById = React.useMemo(() => {
    const m = new Map<string, api.Client>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  const selectedInvoiceClient = clientId ? clientById.get(clientId) : undefined;

  const projectOptions = React.useMemo(
    () => orderedProjectComboboxOptions(projects, clientId),
    [projects, clientId],
  );

  const projectLockedLabel = React.useMemo(() => {
    if (!lockedProjectId) return "";
    const n = projectWorkspace?.project?.name?.trim();
    if (n) return n;
    const opt = projectOptions.find((o) => o.value === lockedProjectId);
    return opt?.label ?? lockedProjectId;
  }, [
    lockedProjectId,
    projectWorkspace?.project?.name,
    projectOptions,
  ]);

  React.useEffect(() => {
    if (!lockedProjectId || !projectsEnabled) return;
    setProjectId(lockedProjectId);
  }, [lockedProjectId, projectsEnabled]);

  const quotesSorted = React.useMemo(
    () => [...quotes].sort((a, b) => b.issueDate.localeCompare(a.issueDate)),
    [quotes],
  );

  const docLayout = React.useMemo(
    () =>
      active
        ? parseDocumentLayout(active.profileJson)
        : defaultDocumentLayout(),
    [active],
  );

  const invoicePrefs = React.useMemo(
    () =>
      active
        ? parseInvoiceWorkspacePreferences(active.profileJson)
        : defaultInvoiceWorkspacePreferences(),
    [active],
  );

  const documentInputPrefs = React.useMemo(
    () =>
      active
        ? parseDocumentInputPreferences(active.profileJson)
        : defaultDocumentInputPreferences(),
    [active],
  );

  const preservingLegacyCustom =
    !invoicePrefs.allowCustomReference &&
    sel?.useCustomNumber === true;

  const useCustomRefPayload =
    preservingLegacyCustom ||
    (invoicePrefs.allowCustomReference && customRefDraft.trim().length > 0);

  const refTextForPayload = preservingLegacyCustom
    ? (sel?.number ?? "")
    : customRefDraft;

  const globalNorm = React.useMemo(
    () => globalSearchNormalized(globalSearchQuery),
    [globalSearchQuery],
  );

  const quotesFiltered = React.useMemo(() => {
    const open = quotesSorted.filter((q) => !q.archived);
    const t = quoteListFilter.trim().toLowerCase();
    let base = open;
    if (lockedProjectId) {
      base = filterDocumentsByProjectId(base, lockedProjectId);
    }
    if (t) {
      base = base.filter((q) => {
        const clientName =
          (q.clientId && clientById.get(q.clientId)?.name) || "";
        const hay = `${q.number} ${q.title} ${clientName}`.toLowerCase();
        return hay.includes(t);
      });
    }
    if (!globalNorm) return base;
    return base.filter((q) => {
      const clientName =
        (q.clientId && clientById.get(q.clientId)?.name) || "";
      return quoteMatchesGlobalSearch(q, clientName, globalNorm);
    });
  }, [quotesSorted, quoteListFilter, clientById, globalNorm, lockedProjectId]);

  const invoicesActive = React.useMemo(
    () => invoices.filter((i) => !i.archived),
    [invoices],
  );

  const invoicesForSidebar = React.useMemo(() => {
    let base = invoicesActive;
    if (lockedProjectId) {
      base = filterDocumentsByProjectId(base, lockedProjectId);
    }
    if (!globalNorm) return base;
    return base.filter((inv) => {
      const clientName =
        (inv.clientId && clientById.get(inv.clientId)?.name) || "";
      return invoiceMatchesGlobalSearch(inv, clientName, globalNorm);
    });
  }, [invoicesActive, globalNorm, clientById, lockedProjectId]);

  const load = React.useCallback(async () => {
    if (!active) return;
    const invListPromise =
      documentKind === "credit_note"
        ? api.listCreditNotes(active.id)
        : api.listInvoices(active.id);
    const linkListPromise =
      documentKind === "credit_note"
        ? api.listInvoices(active.id)
        : Promise.resolve([] as api.Invoice[]);
    const projP = projectsEnabled
      ? api.listProjects(active.id)
      : Promise.resolve([] as api.Project[]);
    const [inv, linkInv, q, c, a, cat, tr, sn, dp, pr] = await Promise.all([
      invListPromise,
      linkListPromise,
      api.listQuotes(active.id),
      api.listClients(active.id),
      api.listArticles(active.id),
      api.listCategories(active.id),
      api.listTaxRates(active.id),
      api.listTextSnippets(active.id),
      api.listDiscountPresets(active.id),
      projP,
    ]);
    setInvoices(inv);
    setLinkableStandardInvoices(linkInv);
    setQuotes(q);
    setClients(c);
    setArticles(a);
    setCategories(cat);
    setTaxRates(tr);
    setSnippets(sn);
    setDiscountPresets(dp);
    setProjects(pr);
  }, [active, documentKind, projectsEnabled]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!active || sel) {
      setPeekedNextInvoiceNumber(null);
      return;
    }
    if (useCustomRefPayload) {
      setPeekedNextInvoiceNumber(null);
      return;
    }
    let cancelled = false;
    const peekFn =
      documentKind === "credit_note"
        ? api.peekNextCreditNoteNumber(active.id)
        : api.peekNextInvoiceNumber(active.id);
    void peekFn
      .then((n) => {
        if (!cancelled) setPeekedNextInvoiceNumber(n);
      })
      .catch(() => {
        if (!cancelled) setPeekedNextInvoiceNumber(null);
      });
    return () => {
      cancelled = true;
    };
  }, [active, sel, useCustomRefPayload, invoices.length, documentKind]);

  const focusId = searchParams.get("focus");
  React.useEffect(() => {
    if (!focusId || !active) return;
    const f = invoices.find((i) => i.id === focusId);
    if (f) {
      const kind = f.documentKind ?? "invoice";
      if (documentKind === "credit_note" && kind !== "credit_note") return;
      if (documentKind === "invoice" && kind === "credit_note") return;
      setSel(f);
      setSearchParams({}, { replace: true });
      return;
    }
    void api
      .getInvoice(focusId)
      .then((inv) => {
        if (inv.workspaceId !== active.id) return;
        const kind = inv.documentKind ?? "invoice";
        if (documentKind === "credit_note" && kind !== "credit_note") return;
        if (documentKind === "invoice" && kind === "credit_note") return;
        setSel(inv);
        setSearchParams({}, { replace: true });
      })
      .catch(() => {});
  }, [focusId, invoices, active, setSearchParams, documentKind]);

  React.useEffect(() => {
    if (!active || documentKind !== "invoice") return;
    if (searchParams.get("focus")) return;
    if (searchParams.get("new") !== "1") return;
    const pid =
      searchParams.get("projectId")?.trim() ||
      lockedProjectId ||
      "";
    if (!pid) return;
    const cid = searchParams.get("clientId")?.trim() ?? "";

    setSearchParams({}, { replace: true });
    skipClearProjectForNewFromProjectRef.current = true;
    setSel(null);
    if (projectsEnabled) setProjectId(pid);
    if (cid) setClientId(cid);
    queueMicrotask(() => {
      skipClearProjectForNewFromProjectRef.current = false;
    });
  }, [
    active,
    documentKind,
    searchParams,
    setSearchParams,
    projectsEnabled,
    lockedProjectId,
  ]);

  React.useEffect(() => {
    if (sel) {
      setClientId(sel.clientId ?? "");
      setStatus(sel.status);
      setTaxExempt(sel.taxExempt);
      setIssueDate(sel.issueDate.slice(0, 10));
      setDueDate(sel.dueDate?.slice(0, 10) ?? "");
      setAmountPaid(sel.amountPaid);
      setCreditedInvoiceId(sel.creditedInvoiceId ?? "");
      setNotes(sel.notes ?? "");
      setCustomRefDraft(
        sel.useCustomNumber === true && invoicePrefs.allowCustomReference
          ? sel.number
          : "",
      );
      setLines(
        sel.lines.length
          ? sel.lines.map((l) => ({
              id: l.id,
              articleId: l.articleId,
              description: l.description,
              optionsSnapshotJson: l.optionsSnapshotJson ?? "{}",
              billingMode: normalizeLineBillingMode(l.billingMode),
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              taxRate: l.taxRate,
              taxManual: undefined,
              lineNote: l.lineNote ?? "",
              showNoteOnInvoice: l.showNoteOnInvoice ?? false,
              ...editorLineDiscountFromApi({
                lineDiscountKind: l.lineDiscountKind ?? "none",
                lineDiscountValue: l.lineDiscountValue ?? 0,
                lineDiscountLabel: l.lineDiscountLabel ?? null,
              }),
            }))
          : [emptyInvoiceLine({ defaultTaxRate: lineDefaultTaxRate })],
      );
      setComplements(
        (sel.complements ?? []).map((c) => ({
          id: c.id,
          snippetId: c.snippetId,
          body: c.body,
        })),
      );
      setPdfTemplateVariant(sel.pdfTemplateVariant ?? "");
      setLineEntryMode("articles");
      const dk = normalizeDiscountKind(sel.discountKind);
      setDiscountKind(dk);
      setDiscountValue(sel.discountValue ?? 0);
      setDiscountLabel(sel.discountLabel ?? "");
      setProjectId(sel.projectId ?? "");
    } else {
      if (!skipClearProjectForNewFromProjectRef.current) {
        setClientId("");
        if (!lockedProjectId) setProjectId("");
        else if (projectsEnabled) setProjectId(lockedProjectId);
      }
      setStatus("draft");
      setTaxExempt(false);
      setIssueDate(new Date().toISOString().slice(0, 10));
      setDueDate("");
      setAmountPaid(0);
      setCreditedInvoiceId("");
      setNotes("");
      setLines([emptyInvoiceLine({ defaultTaxRate: lineDefaultTaxRate })]);
      setComplements([]);
      setLineEntryMode("articles");
      setPdfTemplateVariant("");
      setDiscountKind("none");
      setDiscountValue(0);
      setDiscountLabel("");
      setCustomRefDraft(
        invoicePrefs.allowCustomReference &&
          invoicePrefs.defaultCustomReference.trim().length > 0
          ? invoicePrefs.defaultCustomReference.trim()
          : "",
      );
    }
  }, [
    sel,
    invoicePrefs.allowCustomReference,
    invoicePrefs.defaultCustomReference,
    lockedProjectId,
    projectsEnabled,
    lineDefaultTaxRate,
  ]);

  const {
    lineInputs,
    discKindNorm,
    discValSafe,
    totals,
    discountBefore,
  } = computeDocumentDiscountDerived(
    lines,
    taxExempt,
    discountKind,
    discountValue,
    discountLabel,
  );

  const effectiveAmountPaid =
    status === "paid" || status === "partially_paid" ? amountPaid : 0;

  function makeInvoiceInput(archived: boolean): api.InvoiceInput {
    return buildInvoiceInput({
      documentKind,
      creditedInvoiceId:
        documentKind === "credit_note" ? creditedInvoiceId : null,
      baseCurrency: active!.baseCurrency,
      refCustomEnabled: useCustomRefPayload,
      refText: refTextForPayload,
      clientId,
      quoteId: sel?.quoteId ?? null,
      status,
      taxExempt,
      issueDateYmd: issueDate,
      dueDateYmd: dueDate,
      amountPaid: effectiveAmountPaid,
      notes,
      pdfTemplateVariant,
      archived,
      lines,
      complements,
      discKindNorm,
      discValSafe,
      discountLabel,
      projectId: projectsEnabled ? projectId : null,
    });
  }

  const previewInvoiceNumber =
    sel?.number ??
    (useCustomRefPayload
      ? refTextForPayload.trim()
      : (peekedNextInvoiceNumber ?? "BROUILLON"));

  function makeInvoiceForPdf(): api.Invoice {
    return buildInvoiceForPdf({
      documentKind,
      creditedInvoiceId:
        documentKind === "credit_note" ? creditedInvoiceId : null,
      workspaceId: active!.id,
      invoiceId: sel?.id,
      quoteId: sel?.quoteId ?? null,
      invoiceNumber: previewInvoiceNumber,
      refCustomForPdf: useCustomRefPayload,
      invoiceArchived: sel?.archived ?? false,
      clientId: clientId || null,
      status,
      currency: active!.baseCurrency,
      taxExempt,
      issueDateYmd: issueDate,
      dueDateYmd: dueDate,
      amountPaid: effectiveAmountPaid,
      notes,
      pdfTemplateVariant,
      lines,
      lineInputs,
      complements,
      discKindNorm,
      discValSafe,
      discountLabel,
      projectId: projectsEnabled ? projectId : null,
    });
  }

  const {
    exportInvoicePdf,
    previewInvoicePdf,
    handleSave,
    setInvoiceArchived,
    handleDeleteInvoice,
  } = invoiceEditorPersistActions({
    active,
    sel,
    setSel,
    clients,
    clientId,
    projectsEnabled,
    setPdfLoading,
    makeInvoiceForPdf,
    makeInvoiceInput,
    invoicePrefs,
    customRefDraft,
    docLabel,
    load,
  });


  async function handleCreateCreditNoteFromInvoice() {
    if (!active || !sel || documentKind !== "invoice") return;
    if (sel.archived) return;
    if (!clientId.trim()) {
      toast.error("Indiquez un client avant de créer un avoir.");
      return;
    }
    const linesForNew = lines.map((l) => ({ ...l, id: null }));
    const complementsForNew = complements.map((c) => ({ ...c, id: null }));
    const input = buildInvoiceInput({
      documentKind: "credit_note",
      creditedInvoiceId: sel.id,
      baseCurrency: active.baseCurrency,
      refCustomEnabled: false,
      refText: "",
      clientId,
      quoteId: null,
      status: "draft",
      taxExempt,
      issueDateYmd: new Date().toISOString().slice(0, 10),
      dueDateYmd: "",
      amountPaid: 0,
      notes: notes || "",
      pdfTemplateVariant,
      archived: false,
      lines: linesForNew,
      complements: complementsForNew,
      discKindNorm,
      discValSafe,
      discountLabel,
      projectId: projectsEnabled ? projectId : null,
    });
    try {
      const created = await api.createInvoice(active.id, input);
      toast.success(`Avoir ${created.number} créé`);
      if (lockedProjectId) {
        navigate(
          `/home/projects/${lockedProjectId}/invoices/edit?focus=${encodeURIComponent(created.id)}&docKind=credit_note`,
        );
      } else {
        navigate(`/home/credit-notes?focus=${created.id}`);
      }
    } catch (e) {
      toast.error(String(e));
    }
  }

  const invoiceDocumentActions = React.useMemo(() => {
    if (documentKind !== "invoice" || !sel || sel.archived) return [];
    if (!creditNotesEnabled) return [];
    return [
      {
        id: "create_credit_note",
        label: "Créer un avoir à partir de cette facture",
      },
    ];
  }, [documentKind, sel, creditNotesEnabled]);

  function handleInvoiceDocumentAction(actionId: string) {
    if (actionId === "create_credit_note")
      void handleCreateCreditNoteFromInvoice();
  }

  function removeLine(i: number) {
    setLines((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, j) => j !== i);
    });
  }

  function updateLine(i: number, patch: Partial<InvoiceEditableLine>) {
    setLines((prev) =>
      prev.map((l, j) => (j === i ? { ...l, ...patch } : l)),
    );
  }

  function importWholeQuote(quoteId: string) {
    if (issuedInvoiceContentLocked(sel, invoicePrefs)) return;
    const q = quotes.find((x) => x.id === quoteId);
    if (!q?.lines?.length) {
      toast.error("Ce devis n’a aucune ligne à importer.");
      return;
    }
    const mapped = q.lines.map((ql) =>
      mapQuoteLineToInvoiceEditable(ql, taxRates),
    );
    setLines(mapped);
    setComplements(
      (q.complements ?? []).map((c) => ({
        id: null,
        snippetId: c.snippetId,
        body: c.body,
      })),
    );
    if (!clientId && q.clientId) {
      setClientId(q.clientId);
    }
    setPdfTemplateVariant(q.pdfTemplateVariant ?? "");
    setLineEntryMode("articles");
    const dk = normalizeDiscountKind(q.discountKind);
    setDiscountKind(dk);
    setDiscountValue(q.discountValue ?? 0);
    setDiscountLabel(q.discountLabel ?? "");
    if (projectsEnabled) {
      setProjectId(q.projectId ?? "");
    }
    toast.success(
      `${mapped.length} ligne(s) importée(s) depuis le devis ${q.number}.`,
    );
  }

  const currency = active?.baseCurrency ?? "EUR";
  const fmt = React.useMemo(() => makeCurrencyFormatter(currency), [currency]);

  const remaining = totals.total - effectiveAmountPaid;

  const creditedInvoiceOptions = React.useMemo(() => {
    if (documentKind !== "credit_note") return [];
    return linkableStandardInvoices.map((inv) => {
      const name =
        (inv.clientId && clientById.get(inv.clientId)?.name) || "—";
      return { value: inv.id, label: `${inv.number} — ${name}` };
    });
  }, [documentKind, linkableStandardInvoices, clientById]);

  const referenceHeading = React.useMemo(() => {
    if (sel) return sel.number;
    if (useCustomRefPayload) return refTextForPayload.trim();
    return peekedNextInvoiceNumber ?? "…";
  }, [sel, useCustomRefPayload, refTextForPayload, peekedNextInvoiceNumber]);
  const canUseEditor = !!active;
  const contentLocked = issuedInvoiceContentLocked(sel, invoicePrefs);
  return {
    documentKind,
    docLabel,
    active,
    invoicesForSidebar,
    sel,
    setSel,
    fmt,
    creditedInvoiceOptions,
    creditedInvoiceId,
    setCreditedInvoiceId,
    invoicePrefs,
    customRefDraft,
    setCustomRefDraft,
    clientId,
    setClientId,
    clientOptions,
    selectedInvoiceClient,
    currency,
    setQuickClientOpen,
    quickArticleLineRef,
    setQuickArticleOpen,
    status,
    setStatus,
    issueDate,
    setIssueDate,
    dueDate,
    setDueDate,
    amountPaid,
    setAmountPaid,
    lineEntryMode,
    setLineEntryMode,
    taxExempt,
    setTaxExempt,
    setTaxRatesModalOpen,
    documentInputPrefs,
    lines,
    updateLine,
    removeLine,
    articles,
    categories,
    articleById,
    taxRates,
    quotes,
    quotesFiltered,
    quoteListFilter,
    setQuoteListFilter,
    clientById,
    importWholeQuote,
    setLines,
    lineDefaultTaxRate,
    discountPresets,
    discountPresetSelectKey,
    discountKind,
    setDiscountKind,
    discountValue,
    setDiscountValue,
    discountLabel,
    setDiscountLabel,
    setDiscountPresetsModalOpen,
    setDiscountPresetSelectKey,
    totals,
    discountBefore,
    remaining,
    complements,
    setComplements,
    snippets,
    notes,
    setNotes,
    pdfTemplateVariant,
    setPdfTemplateVariant,
    docLayout,
    pdfLoading,
    canUseEditor,
    contentLocked,
    handleSave,
    previewInvoicePdf,
    exportInvoicePdf,
    setInvoiceArchived,
    handleDeleteInvoice,
    invoiceDocumentActions,
    handleInvoiceDocumentAction,
    projectsEnabled,
    projectId,
    setProjectId,
    projectOptions,
    lockedProjectId,
    projectLockedLabel,
    quickClientOpen,
    load,
    quickArticleOpen,
    taxRatesModalOpen,
    discountPresetsModalOpen,
    referenceHeading,
  };
}
