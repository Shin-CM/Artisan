import { InvoicesPageView } from "@/pages/documentEditor/invoices/InvoicesPageView";
import { useInvoicesPage } from "@/pages/documentEditor/invoices/useInvoicesPage";

export function InvoicesPage({
  documentKind = "invoice",
}: {
  documentKind?: "invoice" | "credit_note";
} = {}) {
  const vm = useInvoicesPage({ documentKind });
  return <InvoicesPageView {...vm} />;
}
