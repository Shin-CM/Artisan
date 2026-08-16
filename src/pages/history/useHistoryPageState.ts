import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useGlobalSearch } from "@/context/GlobalSearchContext";
import {
  globalSearchNormalized,
  invoiceMatchesGlobalSearch,
  quoteMatchesGlobalSearch,
} from "@/lib/globalSearchFilter";
import * as api from "@/lib/api";
import { makeCurrencyFormatter } from "@/pages/documentEditor/currency";
import { toast } from "sonner";
import {
  issueDateYear,
  monthLabel,
  splitAnnualTotalEuros,
  type ArchiveDocYearFilter,
  type HistorySection,
  type ManualPastYearsGrouped,
} from "./historyUtils";

export function useHistoryPageState() {
  const { active } = useWorkspace();
  const { query: globalSearchQuery } = useGlobalSearch();
  const navigate = useNavigate();
  const [section, setSection] = React.useState<HistorySection>("archives");
  const [archiveDocYearFilter, setArchiveDocYearFilter] =
    React.useState<ArchiveDocYearFilter>("all");

  const [invoices, setInvoices] = React.useState<api.Invoice[]>([]);
  const [quotes, setQuotes] = React.useState<api.Quote[]>([]);
  const [purchaseOrders, setPurchaseOrders] = React.useState<api.Quote[]>([]);
  const [clients, setClients] = React.useState<api.Client[]>([]);
  const [manualEntries, setManualEntries] = React.useState<
    api.ManualRevenueEntry[]
  >([]);

  const [formYear, setFormYear] = React.useState(() =>
    new Date().getFullYear(),
  );
  const [formMonth, setFormMonth] = React.useState(
    () => new Date().getMonth() + 1,
  );
  const [formAmount, setFormAmount] = React.useState("");
  const [formNotes, setFormNotes] = React.useState("");

  const [spreadYear, setSpreadYear] = React.useState(() =>
    new Date().getFullYear(),
  );
  const [spreadTotal, setSpreadTotal] = React.useState("");
  const [spreadBusy, setSpreadBusy] = React.useState(false);

  const loadArchives = React.useCallback(async () => {
    if (!active) return;
    const [inv, cred, q, po, c] = await Promise.all([
      api.listInvoices(active.id),
      api.listCreditNotes(active.id),
      api.listQuotes(active.id),
      api.listPurchaseOrders(active.id),
      api.listClients(active.id),
    ]);
    setInvoices([...inv, ...cred].filter((i) => i.archived === true));
    setQuotes(q.filter((x) => x.archived === true));
    setPurchaseOrders(po.filter((x) => x.archived === true));
    setClients(c);
  }, [active]);

  const loadManual = React.useCallback(async () => {
    if (!active) return;
    const rows = await api.listManualRevenueEntries(active.id);
    setManualEntries(rows);
  }, [active]);

  const load = React.useCallback(async () => {
    if (!active) return;
    await Promise.all([loadArchives(), loadManual()]);
  }, [active, loadArchives, loadManual]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (section === "manual") void loadManual();
  }, [section, loadManual]);

  const resetManualForm = React.useCallback(() => {
    setFormYear(new Date().getFullYear());
    setFormMonth(new Date().getMonth() + 1);
    setFormAmount("");
    setFormNotes("");
  }, []);

  const clientById = React.useMemo(() => {
    const m = new Map<string, api.Client>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  const currency = active?.baseCurrency ?? "EUR";
  const fmt = React.useMemo(() => makeCurrencyFormatter(currency), [currency]);

  const currentCalendarYear = new Date().getFullYear();
  const archivedInvoicesFiltered = React.useMemo(() => {
    const base =
      archiveDocYearFilter === "past_years"
        ? invoices.filter(
            (i) => issueDateYear(i.issueDate) < currentCalendarYear,
          )
        : invoices;
    return [...base].sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }, [invoices, archiveDocYearFilter, currentCalendarYear]);

  const archivedQuotesFiltered = React.useMemo(() => {
    const base =
      archiveDocYearFilter === "past_years"
        ? quotes.filter(
            (q) => issueDateYear(q.issueDate) < currentCalendarYear,
          )
        : quotes;
    return [...base].sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }, [quotes, archiveDocYearFilter, currentCalendarYear]);

  const globalNorm = React.useMemo(
    () => globalSearchNormalized(globalSearchQuery),
    [globalSearchQuery],
  );

  const archivedInvoicesDisplay = React.useMemo(() => {
    if (!globalNorm) return archivedInvoicesFiltered;
    return archivedInvoicesFiltered.filter((inv) => {
      const clientName =
        (inv.clientId && clientById.get(inv.clientId)?.name) || "";
      return invoiceMatchesGlobalSearch(inv, clientName, globalNorm);
    });
  }, [archivedInvoicesFiltered, globalNorm, clientById]);

  const archivedQuotesDisplay = React.useMemo(() => {
    if (!globalNorm) return archivedQuotesFiltered;
    return archivedQuotesFiltered.filter((q) => {
      const clientName =
        (q.clientId && clientById.get(q.clientId)?.name) || "";
      return quoteMatchesGlobalSearch(q, clientName, globalNorm);
    });
  }, [archivedQuotesFiltered, globalNorm, clientById]);

  const archivedPurchaseOrdersFiltered = React.useMemo(() => {
    const base =
      archiveDocYearFilter === "past_years"
        ? purchaseOrders.filter(
            (q) => issueDateYear(q.issueDate) < currentCalendarYear,
          )
        : purchaseOrders;
    return [...base].sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }, [purchaseOrders, archiveDocYearFilter, currentCalendarYear]);

  const archivedPurchaseOrdersDisplay = React.useMemo(() => {
    if (!globalNorm) return archivedPurchaseOrdersFiltered;
    return archivedPurchaseOrdersFiltered.filter((q) => {
      const clientName =
        (q.clientId && clientById.get(q.clientId)?.name) || "";
      return quoteMatchesGlobalSearch(q, clientName, globalNorm);
    });
  }, [archivedPurchaseOrdersFiltered, globalNorm, clientById]);

  const manualEntriesSearchFiltered = React.useMemo(() => {
    if (!globalNorm) return manualEntries;
    return manualEntries.filter((e) => {
      const blob = `${e.year} ${monthLabel(e.month)} ${e.notes ?? ""} ${e.amount}`
        .toLowerCase()
        .replace(/\s+/g, " ");
      return blob.includes(globalNorm);
    });
  }, [manualEntries, globalNorm]);

  const manualPastYearsGrouped = React.useMemo((): ManualPastYearsGrouped => {
    const past = manualEntriesSearchFiltered.filter(
      (e) => e.year < currentCalendarYear,
    );
    const byYear = new Map<number, api.ManualRevenueEntry[]>();
    for (const e of past) {
      const arr = byYear.get(e.year) ?? [];
      arr.push(e);
      byYear.set(e.year, arr);
    }
    for (const arr of byYear.values()) {
      arr.sort((a, b) => b.month - a.month);
    }
    const yearsDesc = [...byYear.keys()].sort((a, b) => b - a);
    return { byYear, yearsDesc };
  }, [manualEntriesSearchFiltered, currentCalendarYear]);

  async function submitManualForm(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    const amount = Number(formAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Indiquez un montant valide (≥ 0).");
      return;
    }
    try {
      await api.upsertManualRevenueEntry(active.id, {
        year: formYear,
        month: formMonth,
        amount,
        currency: active.baseCurrency,
        notes: formNotes.trim() || null,
      });
      toast.success("CA manuel enregistré");
      resetManualForm();
      void loadManual();
    } catch (err) {
      toast.error(String(err));
    }
  }

  async function deleteManual(id: string) {
    if (!active) return;
    try {
      await api.deleteManualRevenueEntry(active.id, id);
      toast.success("Entrée supprimée");
      void loadManual();
    } catch (err) {
      toast.error(String(err));
    }
  }

  function fillFormFromRow(row: api.ManualRevenueEntry) {
    setFormYear(row.year);
    setFormMonth(row.month);
    setFormAmount(String(row.amount));
    setFormNotes(row.notes ?? "");
  }

  function editManualFromArchives(row: api.ManualRevenueEntry) {
    fillFormFromRow(row);
    setSection("manual");
  }

  async function spreadAnnual() {
    if (!active) return;
    const total = Number(spreadTotal.replace(",", "."));
    if (!Number.isFinite(total) || total < 0) {
      toast.error("Indiquez un total annuel valide (≥ 0).");
      return;
    }
    setSpreadBusy(true);
    try {
      const parts = splitAnnualTotalEuros(total);
      for (let m = 0; m < 12; m++) {
        await api.upsertManualRevenueEntry(active.id, {
          year: spreadYear,
          month: m + 1,
          amount: parts[m]!,
          currency: active.baseCurrency,
          notes: `Répartition 1/12 du total ${fmt(total)} (${spreadYear})`,
        });
      }
      toast.success("12 mois enregistrés");
      setSpreadTotal("");
      void loadManual();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSpreadBusy(false);
    }
  }

  return {
    active,
    navigate,
    section,
    setSection,
    archiveDocYearFilter,
    setArchiveDocYearFilter,
    invoices,
    quotes,
    purchaseOrders,
    clients,
    manualEntries,
    clientById,
    currency,
    fmt,
    currentCalendarYear,
    archivedInvoicesFiltered,
    archivedInvoicesDisplay,
    archivedQuotesFiltered,
    archivedQuotesDisplay,
    archivedPurchaseOrdersFiltered,
    archivedPurchaseOrdersDisplay,
    globalNorm,
    manualEntriesSearchFiltered,
    manualPastYearsGrouped,
    formYear,
    setFormYear,
    formMonth,
    setFormMonth,
    formAmount,
    setFormAmount,
    formNotes,
    setFormNotes,
    spreadYear,
    setSpreadYear,
    spreadTotal,
    setSpreadTotal,
    spreadBusy,
    resetManualForm,
    submitManualForm,
    deleteManual,
    fillFormFromRow,
    editManualFromArchives,
    spreadAnnual,
  };
}

export type HistoryPageState = ReturnType<typeof useHistoryPageState>;
