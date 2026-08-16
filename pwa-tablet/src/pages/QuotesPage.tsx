import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw } from "lucide-react";
import { fetchQuotes, type QuoteRow } from "../api";

export function QuotesPage() {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const list = await fetchQuotes();
      setRows(list);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Devis</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800"
            title="Actualiser"
            onClick={() => void load()}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            to="/quotes/new"
            className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Nouveau
          </Link>
        </div>
      </div>
      {loading && <p className="text-sm text-slate-500">Chargement…</p>}
      {err && (
        <p className="rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {err}
        </p>
      )}
      <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
        {rows.map((q) => (
          <li key={q.id}>
            <Link
              to={`/quotes/${q.id}`}
              className="block px-3 py-3 hover:bg-slate-900/80"
            >
              <div className="flex justify-between gap-2">
                <span className="font-mono text-sm text-sky-300">{q.number}</span>
                <span className="text-xs text-slate-500">{q.issueDate}</span>
              </div>
              <p className="text-sm text-slate-200">{q.title || "Sans titre"}</p>
              <p className="text-xs text-slate-500">
                {q.status} · {q.total.toFixed(2)} {q.currency}
              </p>
            </Link>
          </li>
        ))}
        {!loading && rows.length === 0 && !err && (
          <li className="px-3 py-8 text-center text-sm text-slate-500">
            Aucun devis
          </li>
        )}
      </ul>
    </div>
  );
}
