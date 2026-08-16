import { QuotesPageView } from "@/pages/documentEditor/quotes/QuotesPageView";
import { useQuotesPage } from "@/pages/documentEditor/quotes/useQuotesPage";

export function QuotesPage({
  kind = "quote",
}: {
  kind?: "quote" | "purchase_order";
} = {}) {
  const vm = useQuotesPage({ kind });
  return <QuotesPageView {...vm} />;
}
