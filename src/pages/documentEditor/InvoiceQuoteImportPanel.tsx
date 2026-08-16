import type * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InvoiceQuoteImportPanel({
  quotes,
  quotesFiltered,
  quoteListFilter,
  onQuoteListFilterChange,
  clientById,
  fmt,
  onImportQuote,
}: {
  quotes: api.Quote[];
  quotesFiltered: api.Quote[];
  quoteListFilter: string;
  onQuoteListFilterChange: (v: string) => void;
  clientById: Map<string, api.Client>;
  fmt: (n: number) => string;
  onImportQuote: (quoteId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Sélectionnez un devis : ses lignes remplaceront toutes les lignes
        actuelles de la facture. Vous pourrez ensuite revenir à « Saisir les
        articles » pour les ajuster.
      </p>
      <Input
        className="max-w-md"
        placeholder="Filtrer par n°, intitulé ou client…"
        value={quoteListFilter}
        onChange={(e) => onQuoteListFilterChange(e.target.value)}
        aria-label="Filtrer les devis"
      />
      <div className="max-h-[min(24rem,50vh)] overflow-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-[1] border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium">N°</th>
              <th className="px-2 py-2 text-left text-xs font-medium">
                Intitulé
              </th>
              <th className="hidden px-2 py-2 text-left text-xs font-medium sm:table-cell">
                Client
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium">Date</th>
              <th className="px-2 py-2 text-right text-xs font-medium">
                Total TTC
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {quotesFiltered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-sm text-[var(--color-muted-foreground)]"
                >
                  {quotes.length === 0
                    ? "Aucun devis dans cet espace."
                    : "Aucun devis ne correspond au filtre."}
                </td>
              </tr>
            ) : (
              quotesFiltered.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)]/20"
                >
                  <td className="whitespace-nowrap px-2 py-2 font-mono text-xs">
                    {q.number}
                  </td>
                  <td className="max-w-[12rem] truncate px-2 py-2">
                    {q.title.trim() || "Sans titre"}
                  </td>
                  <td className="hidden max-w-[10rem] truncate px-2 py-2 sm:table-cell">
                    {q.clientId
                      ? (clientById.get(q.clientId)?.name ?? "—")
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-xs text-[var(--color-muted-foreground)]">
                    {q.issueDate.slice(0, 10)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums">
                    {fmt(q.total)}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={!q.lines?.length}
                      onClick={() => onImportQuote(q.id)}
                    >
                      Importer
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
