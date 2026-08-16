import * as React from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useGlobalSearch } from "@/context/GlobalSearchContext";
import {
  globalSearchNormalized,
  quoteMatchesGlobalSearch,
} from "@/lib/globalSearchFilter";
import * as api from "@/lib/api";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { isDocumentPurchaseOrdersConversionAvailable } from "@/lib/marketplaceModules";
import { normalizeDiscountKind } from "@/core/documentMath";
import { computeDocumentDiscountDerived } from "@/pages/documentEditor/documentDiscountTotals";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  type EditableComplement,
} from "@/components/DocumentComplementsEditor";
import {
  defaultDocumentInputPreferences,
  defaultDocumentLayout,
  parseDocumentInputPreferences,
  parseDocumentLayout,
  defaultQuoteWorkspacePreferences,
  parseQuoteWorkspacePreferences,
} from "@/lib/documentOptions";
import { makeCurrencyFormatter } from "@/pages/documentEditor/currency";
import { groupQuotesByDay } from "@/pages/documentEditor/quoteListGrouping";
import {
  buildQuoteForPdf,
  buildQuoteInput,
} from "@/pages/documentEditor/quoteFormPayloads";
import { quoteEditorPersistActions } from "@/pages/documentEditor/quotes/quoteEditorPersistActions";
import {
  emptyQuoteLine,
  type QuoteEditableLine,
} from "@/pages/documentEditor/editableLineTypes";
import { editorLineDiscountFromApi } from "@/pages/documentEditor/lineDiscountPayload";
import { normalizeLineBillingMode } from "@/lib/lineBilling";
import { orderedProjectComboboxOptions } from "@/pages/projects/projectUtils";
import { useOptionalProjectWorkspace } from "@/context/ProjectWorkspaceContext";
import { filterDocumentsByProjectId } from "@/pages/projects/projectWorkspaceFilters";
import { defaultLineTaxRateForCountry } from "@/lib/workspaceDefaultTaxRates";

export function useQuotesPage({
  kind = "quote",
}: {
  kind?: "quote" | "purchase_order";
} = {}) {
  const docWord =
    kind === "purchase_order" ? "bon de commande" : "devis";
  const docWordCap =
    kind === "purchase_order" ? "Bon de commande" : "Devis";
  const sidebarTitle =
    kind === "purchase_order" ? "Bons de commande" : "Devis";
  const { active } = useWorkspace();
  const { query: globalSearchQuery } = useGlobalSearch();
  const lineDefaultTaxRate = React.useMemo(
    () => defaultLineTaxRateForCountry(active?.countryCode ?? ""),
    [active?.countryCode],
  );
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quotes, setQuotes] = React.useState<api.Quote[]>([]);
  const [clients, setClients] = React.useState<api.Client[]>([]);
  const [articles, setArticles] = React.useState<api.Article[]>([]);
  const [categories, setCategories] = React.useState<api.Category[]>([]);
  const [sel, setSel] = React.useState<api.Quote | null>(null);
  const [clientId, setClientId] = React.useState<string>("");
  const [status, setStatus] = React.useState("draft");
  const [taxExempt, setTaxExempt] = React.useState(false);
  const [issueDate, setIssueDate] = React.useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [validUntil, setValidUntil] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [docTitle, setDocTitle] = React.useState("");
  /** Brouillon de référence personnalisée (vide = auto ou conservation du numéro auto existant). */
  const [customRefDraft, setCustomRefDraft] = React.useState("");
  const [quickClientOpen, setQuickClientOpen] = React.useState(false);
  const [quickArticleOpen, setQuickArticleOpen] = React.useState(false);
  const quickArticleLineRef = React.useRef<number | null>(null);
  const [taxRatesModalOpen, setTaxRatesModalOpen] = React.useState(false);
  const [taxRates, setTaxRates] = React.useState<api.TaxRate[]>([]);
  const [lines, setLines] = React.useState<QuoteEditableLine[]>(() => [
    emptyQuoteLine({ defaultTaxRate: lineDefaultTaxRate }),
  ]);
  const [complements, setComplements] = React.useState<EditableComplement[]>(
    [],
  );
  const [snippets, setSnippets] = React.useState<api.TextSnippet[]>([]);
  const [pdfLoading, setPdfLoading] = React.useState(false);
  const [pdfTemplateVariant, setPdfTemplateVariant] = React.useState("");
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
  const [peekedNextQuoteNumber, setPeekedNextQuoteNumber] = React.useState<
    string | null
  >(null);
  const [projects, setProjects] = React.useState<api.Project[]>([]);
  const [projectId, setProjectId] = React.useState("");
  const skipClearProjectForNewFromProjectRef = React.useRef(false);
  const { plugins, projectsEnabled } = useDocumentModules();
  const projectWorkspace = useOptionalProjectWorkspace();
  const lockedProjectId = projectWorkspace?.projectId ?? null;

  const docLayout = React.useMemo(
    () =>
      active
        ? parseDocumentLayout(active.profileJson)
        : defaultDocumentLayout(),
    [active],
  );
  const quotePrefs = React.useMemo(
    () =>
      active
        ? parseQuoteWorkspacePreferences(active.profileJson)
        : defaultQuoteWorkspacePreferences(),
    [active],
  );

  const documentInputPrefs = React.useMemo(
    () =>
      active
        ? parseDocumentInputPreferences(active.profileJson)
        : defaultDocumentInputPreferences(),
    [active],
  );

  /** Conserver une référence perso déjà en base si l’espace a désactivé l’option ensuite. */
  const preservingLegacyCustom =
    !quotePrefs.allowCustomReference && sel?.useCustomNumber === true;

  const useCustomRefPayload =
    preservingLegacyCustom ||
    (quotePrefs.allowCustomReference && customRefDraft.trim().length > 0);

  const refTextForPayload = preservingLegacyCustom
    ? (sel?.number ?? "")
    : customRefDraft;

  const articleById = React.useMemo(() => {
    const m = new Map<string, api.Article>();
    for (const a of articles) m.set(a.id, a);
    return m;
  }, [articles]);

  const clientById = React.useMemo(() => {
    const m = new Map<string, api.Client>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  const selectedClient = clientId ? clientById.get(clientId) : undefined;

  const clientOptions = React.useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name })),
    [clients],
  );

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

  const quotesActive = React.useMemo(
    () => quotes.filter((q) => !q.archived),
    [quotes],
  );

  const clientByIdSearch = React.useMemo(() => {
    const m = new Map<string, api.Client>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  const globalNorm = React.useMemo(
    () => globalSearchNormalized(globalSearchQuery),
    [globalSearchQuery],
  );

  const quotesForSidebar = React.useMemo(() => {
    let base = quotesActive;
    if (lockedProjectId) {
      base = filterDocumentsByProjectId(base, lockedProjectId);
    }
    if (!globalNorm) return base;
    return base.filter((q) => {
      const clientName =
        (q.clientId && clientByIdSearch.get(q.clientId)?.name) || "";
      return quoteMatchesGlobalSearch(q, clientName, globalNorm);
    });
  }, [quotesActive, globalNorm, clientByIdSearch, lockedProjectId]);

  const quoteGroups = React.useMemo(
    () => groupQuotesByDay(quotesForSidebar),
    [quotesForSidebar],
  );

  const load = React.useCallback(async () => {
    if (!active) return;
    const listFn =
      kind === "purchase_order"
        ? api.listPurchaseOrders(active.id)
        : api.listQuotes(active.id);
    const projP = projectsEnabled
      ? api.listProjects(active.id)
      : Promise.resolve([] as api.Project[]);
    const [q, c, a, cat, tr, sn, dp, pr] = await Promise.all([
      listFn,
      api.listClients(active.id),
      api.listArticles(active.id),
      api.listCategories(active.id),
      api.listTaxRates(active.id),
      api.listTextSnippets(active.id),
      api.listDiscountPresets(active.id),
      projP,
    ]);
    setQuotes(q);
    setClients(c);
    setArticles(a);
    setCategories(cat);
    setTaxRates(tr);
    setSnippets(sn);
    setDiscountPresets(dp);
    setProjects(pr);
  }, [active, kind, projectsEnabled]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!active || sel) {
      setPeekedNextQuoteNumber(null);
      return;
    }
    if (useCustomRefPayload) {
      setPeekedNextQuoteNumber(null);
      return;
    }
    let cancelled = false;
    const peekP =
      kind === "purchase_order"
        ? api.peekNextPurchaseOrderNumber(active.id)
        : api.peekNextQuoteNumber(active.id);
    void peekP
      .then((n) => {
        if (!cancelled) setPeekedNextQuoteNumber(n);
      })
      .catch(() => {
        if (!cancelled) setPeekedNextQuoteNumber(null);
      });
    return () => {
      cancelled = true;
    };
  }, [active, sel, useCustomRefPayload, quotes.length, kind]);

  const referenceHeading = React.useMemo(() => {
    if (sel) return sel.number;
    if (useCustomRefPayload) return refTextForPayload.trim();
    return peekedNextQuoteNumber ?? "…";
  }, [sel, useCustomRefPayload, refTextForPayload, peekedNextQuoteNumber]);

  const focusId = searchParams.get("focus");
  React.useEffect(() => {
    if (!focusId || !active) return;
    const f = quotes.find((q) => q.id === focusId);
    if (f) {
      setSel(f);
      setSearchParams({}, { replace: true });
      return;
    }
    const getOne =
      kind === "purchase_order"
        ? api.getPurchaseOrder(focusId)
        : api.getQuote(focusId);
    void getOne
      .then((q) => {
        if (q.workspaceId !== active.id) return;
        setSel(q);
        setSearchParams({}, { replace: true });
      })
      .catch(() => {});
  }, [focusId, quotes, active, setSearchParams, kind]);

  React.useEffect(() => {
    if (!active) return;
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
      setValidUntil(sel.validUntil?.slice(0, 10) ?? "");
      setNotes(sel.notes ?? "");
      setDocTitle(sel.title ?? "");
      setCustomRefDraft(
        sel.useCustomNumber && quotePrefs.allowCustomReference
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
              showNoteOnQuote: l.showNoteOnQuote ?? false,
              ...editorLineDiscountFromApi({
                lineDiscountKind: l.lineDiscountKind ?? "none",
                lineDiscountValue: l.lineDiscountValue ?? 0,
                lineDiscountLabel: l.lineDiscountLabel ?? null,
              }),
            }))
          : [emptyQuoteLine({ defaultTaxRate: lineDefaultTaxRate })],
      );
      setComplements(
        (sel.complements ?? []).map((c) => ({
          id: c.id,
          snippetId: c.snippetId,
          body: c.body,
        })),
      );
      setPdfTemplateVariant(sel.pdfTemplateVariant ?? "");
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
      setValidUntil("");
      setNotes("");
      setDocTitle("");
      setCustomRefDraft(
        quotePrefs.allowCustomReference &&
          quotePrefs.defaultCustomReference.trim().length > 0
          ? quotePrefs.defaultCustomReference.trim()
          : "",
      );
      setLines([emptyQuoteLine({ defaultTaxRate: lineDefaultTaxRate })]);
      setComplements([]);
      setPdfTemplateVariant("");
      setDiscountKind("none");
      setDiscountValue(0);
      setDiscountLabel("");
    }
  }, [
    sel,
    quotePrefs.allowCustomReference,
    quotePrefs.defaultCustomReference,
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

  const previewQuoteNumber =
    sel?.number ??
    (useCustomRefPayload
      ? refTextForPayload.trim()
      : (peekedNextQuoteNumber ?? "BROUILLON"));

  function makeQuoteInput(archived: boolean): api.QuoteInput {
    return buildQuoteInput({
      baseCurrency: active!.baseCurrency,
      docTitle,
      refCustomEnabled: useCustomRefPayload,
      refText: refTextForPayload,
      clientId,
      status,
      taxExempt,
      issueDateYmd: issueDate,
      validUntilYmd: validUntil,
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

  function makeQuoteForPdf(): api.Quote {
    return buildQuoteForPdf({
      workspaceId: active!.id,
      quoteId: sel?.id,
      quoteNumber: previewQuoteNumber,
      quoteArchived: sel?.archived ?? false,
      clientId: clientId || null,
      docTitle,
      refCustomEnabled: useCustomRefPayload,
      status,
      currency: active!.baseCurrency,
      taxExempt,
      issueDateYmd: issueDate,
      validUntilYmd: validUntil,
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
    exportQuotePdf,
    previewQuotePdf,
    handleSave,
    setQuoteArchived,
    archiveQuoteFromList,
    handleDeleteQuote,
    handleConvert,
    handleConvertQuoteToPurchaseOrder,
  } = quoteEditorPersistActions({
    kind,
    active,
    sel,
    setSel,
    clients,
    clientId,
    projectsEnabled,
    setPdfLoading,
    makeQuoteForPdf,
    makeQuoteInput,
    quotePrefs,
    customRefDraft,
    docWord,
    docWordCap,
    load,
    navigate,
    lockedProjectId,
  });


  const quoteDocumentActions = React.useMemo(() => {
    if (!sel || sel.archived) return [];
    const items: { id: string; label: string }[] = [
      { id: "to_invoice", label: "Convertir en facture" },
    ];
    if (
      kind === "quote" &&
      isDocumentPurchaseOrdersConversionAvailable(plugins)
    ) {
      items.push({
        id: "to_purchase_order",
        label: "Convertir en bon de commande",
      });
    }
    return items;
  }, [sel, kind, plugins]);

  function handleQuoteDocumentAction(actionId: string) {
    if (actionId === "to_invoice") void handleConvert();
    else if (actionId === "to_purchase_order")
      void handleConvertQuoteToPurchaseOrder();
  }

  function removeLine(i: number) {
    setLines((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, j) => j !== i);
    });
  }

  function updateLine(i: number, patch: Partial<QuoteEditableLine>) {
    setLines((prev) =>
      prev.map((l, j) => (j === i ? { ...l, ...patch } : l)),
    );
  }

  const currency = active?.baseCurrency ?? "EUR";
  const fmt = React.useMemo(() => makeCurrencyFormatter(currency), [currency]);

  const canUseEditor = !!active;
  return {
    kind,
    active,
    quoteGroups,
    sel,
    setSel,
    fmt,
    archiveQuoteFromList,
    handleDeleteQuote,
    sidebarTitle,
    quotePrefs,
    customRefDraft,
    setCustomRefDraft,
    docTitle,
    setDocTitle,
    clientId,
    setClientId,
    clientOptions,
    selectedClient,
    currency,
    setQuickClientOpen,
    quickArticleLineRef,
    setQuickArticleOpen,
    status,
    setStatus,
    issueDate,
    setIssueDate,
    validUntil,
    setValidUntil,
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
    handleSave,
    previewQuotePdf,
    exportQuotePdf,
    quoteDocumentActions,
    handleQuoteDocumentAction,
    setQuoteArchived,
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
