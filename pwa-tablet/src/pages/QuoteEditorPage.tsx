import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  createQuote,
  fetchClients,
  fetchProducts,
  fetchQuote,
  fetchTaxRates,
  updateQuote,
  type ClientRow,
  type ArticleRow,
  type QuoteInput,
  type QuoteLineInput,
  type TaxRateRow,
} from "../api";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function lineFromApi(l: Record<string, unknown>): QuoteLineInput {
  let optionsSnapshotJson: Record<string, unknown> = {};
  const o = l.optionsSnapshotJson;
  if (typeof o === "string") {
    try {
      optionsSnapshotJson = JSON.parse(o) as Record<string, unknown>;
    } catch {
      optionsSnapshotJson = {};
    }
  } else if (o && typeof o === "object") {
    optionsSnapshotJson = o as Record<string, unknown>;
  }
  return {
    id: typeof l.id === "string" ? l.id : undefined,
    articleId: (l.articleId as string) ?? null,
    description: String(l.description ?? ""),
    quantity: Number(l.quantity ?? 1),
    unitPrice: Number(l.unitPrice ?? 0),
    taxRate: Number(l.taxRate ?? 0),
    billingMode: String(l.billingMode || "unit"),
    optionsSnapshotJson,
    lineNote: (l.lineNote as string) ?? undefined,
    showNoteOnQuote: Boolean(l.showNoteOnQuote),
    lineDiscountKind: (l.lineDiscountKind as string) ?? "none",
    lineDiscountValue: Number(l.lineDiscountValue ?? 0),
    lineDiscountLabel: (l.lineDiscountLabel as string) ?? undefined,
  };
}

function quoteFromApi(q: Record<string, unknown>): QuoteInput {
  const linesRaw = (q.lines as Record<string, unknown>[]) ?? [];
  return {
    title: (q.title as string) || "",
    clientId: (q.clientId as string) ?? null,
    status: String(q.status ?? "draft"),
    currency: String(q.currency ?? "EUR"),
    taxExempt: Boolean(q.taxExempt),
    issueDate: String(q.issueDate ?? today()),
    validUntil: (q.validUntil as string) ?? null,
    notes: (q.notes as string) ?? null,
    lines: linesRaw.map(lineFromApi),
    useCustomNumber: Boolean(q.useCustomNumber),
    customNumber: (q.customNumber as string) ?? undefined,
    complements: (q.complements as unknown[]) ?? [],
    archived: Boolean(q.archived),
    discountKind: (q.discountKind as string) ?? undefined,
    discountValue:
      q.discountValue !== undefined ? Number(q.discountValue) : undefined,
    discountLabel: (q.discountLabel as string) ?? undefined,
    projectId: (q.projectId as string) ?? undefined,
    pdfTemplateVariant: (q.pdfTemplateVariant as string) ?? undefined,
  };
}

function defaultLine(rate: number): QuoteLineInput {
  return {
    description: "Prestation",
    quantity: 1,
    unitPrice: 0,
    taxRate: rate,
    billingMode: "unit",
    articleId: null,
    optionsSnapshotJson: {},
    showNoteOnQuote: false,
    lineDiscountKind: "none",
    lineDiscountValue: 0,
  };
}

export function QuoteEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRateRow[]>([]);
  const [input, setInput] = useState<QuoteInput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const defaultTax = taxRates.find((t) => t.isDefault)?.rate ?? 20;

  useEffect(() => {
    void (async () => {
      try {
        const [c, a, t] = await Promise.all([
          fetchClients(),
          fetchProducts(),
          fetchTaxRates(),
        ]);
        setClients(c);
        setArticles(a);
        setTaxRates(t);
        const defRate = t.find((x) => x.isDefault)?.rate ?? 20;
        if (isNew) {
          setInput({
            title: "",
            clientId: null,
            status: "draft",
            currency: "EUR",
            taxExempt: false,
            issueDate: today(),
            validUntil: null,
            notes: null,
            lines: [defaultLine(defRate)],
            useCustomNumber: false,
            complements: [],
            archived: false,
          });
        } else {
          const q = (await fetchQuote(id!)) as unknown as Record<
            string,
            unknown
          >;
          setInput(quoteFromApi(q));
        }
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  async function onSave() {
    if (!input) return;
    setBusy(true);
    setErr(null);
    try {
      if (isNew) {
        const created = await createQuote(input);
        nav(`/quotes/${created.id}`);
      } else {
        await updateQuote(id!, input);
        nav("/quotes");
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  function setLine(i: number, patch: Partial<QuoteLineInput>) {
    setInput((prev) => {
      if (!prev) return prev;
      const lines = [...prev.lines];
      lines[i] = { ...lines[i], ...patch };
      return { ...prev, lines };
    });
  }

  function addLine() {
    setInput((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lines: [...prev.lines, defaultLine(defaultTax)],
      };
    });
  }

  function removeLine(i: number) {
    setInput((prev) => {
      if (!prev || prev.lines.length <= 1) return prev;
      return {
        ...prev,
        lines: prev.lines.filter((_, j) => j !== i),
      };
    });
  }

  function applyArticle(i: number, articleId: string) {
    const a = articles.find((x) => x.id === articleId);
    if (!a) return;
    setLine(i, {
      articleId,
      description: a.name,
      unitPrice: a.basePrice,
    });
  }

  if (loading || !input) {
    return <p className="text-sm text-slate-500">Chargement…</p>;
  }

  return (
    <div className="space-y-4 pb-24">
      <Link
        to="/quotes"
        className="inline-flex items-center gap-1 text-sm text-sky-400 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Liste
      </Link>
      <h1 className="text-lg font-semibold">
        {isNew ? "Nouveau devis" : "Modifier le devis"}
      </h1>
      {err && (
        <p className="rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {err}
        </p>
      )}

      <label className="block text-sm text-slate-400">
        Titre / objet
        <input
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={input.title ?? ""}
          onChange={(e) =>
            setInput({ ...input, title: e.target.value })
          }
        />
      </label>

      <label className="block text-sm text-slate-400">
        Client
        <select
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={input.clientId ?? ""}
          onChange={(e) =>
            setInput({
              ...input,
              clientId: e.target.value || null,
            })
          }
        >
          <option value="">—</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm text-slate-400">
          Date
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={input.issueDate}
            onChange={(e) =>
              setInput({ ...input, issueDate: e.target.value })
            }
          />
        </label>
        <label className="block text-sm text-slate-400">
          Statut
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={input.status}
            onChange={(e) =>
              setInput({ ...input, status: e.target.value })
            }
          >
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyé</option>
            <option value="accepted">Accepté</option>
            <option value="rejected">Refusé</option>
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={input.taxExempt}
          onChange={(e) =>
            setInput({ ...input, taxExempt: e.target.checked })
          }
        />
        Document hors taxes
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">Lignes</h2>
          <button
            type="button"
            className="text-sm text-sky-400 hover:underline"
            onClick={addLine}
          >
            + Ligne
          </button>
        </div>
        {input.lines.map((line, i) => (
          <div
            key={i}
            className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-3"
          >
            <div className="flex justify-between gap-2">
              <span className="text-xs text-slate-500">Ligne {i + 1}</span>
              {input.lines.length > 1 && (
                <button
                  type="button"
                  className="text-red-400"
                  title="Supprimer"
                  onClick={() => removeLine(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <label className="block text-xs text-slate-500">
              Article catalogue
              <select
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                value={line.articleId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) applyArticle(i, v);
                  else setLine(i, { articleId: null });
                }}
              >
                <option value="">— Saisie libre</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-slate-500">
              Description
              <input
                className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                value={line.description}
                onChange={(e) =>
                  setLine(i, { description: e.target.value })
                }
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="block text-xs text-slate-500">
                Qté
                <input
                  type="number"
                  step="any"
                  className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                  value={line.quantity}
                  onChange={(e) =>
                    setLine(i, {
                      quantity: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="block text-xs text-slate-500">
                PU HT
                <input
                  type="number"
                  step="any"
                  className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                  value={line.unitPrice}
                  onChange={(e) =>
                    setLine(i, {
                      unitPrice: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </label>
              <label className="block text-xs text-slate-500">
                TVA %
                <input
                  type="number"
                  step="any"
                  className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                  value={line.taxRate}
                  onChange={(e) =>
                    setLine(i, {
                      taxRate: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            disabled={busy}
            className="w-full rounded-lg bg-sky-600 py-3 text-sm font-medium text-white disabled:opacity-50"
            onClick={() => void onSave()}
          >
            {isNew ? "Créer le devis" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
