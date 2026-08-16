import { useSearchParams } from "react-router-dom";
import { InvoicesPage } from "@/pages/InvoicesPage";

export function ProjectInvoicesEditRoute() {
  const [searchParams] = useSearchParams();
  const documentKind =
    searchParams.get("docKind") === "credit_note" ? "credit_note" : "invoice";
  return <InvoicesPage key={documentKind} documentKind={documentKind} />;
}
