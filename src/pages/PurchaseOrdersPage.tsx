import { DocumentModulePageGate } from "@/components/DocumentModulePageGate";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { QuotesPage } from "@/pages/QuotesPage";

export function PurchaseOrdersPage() {
  const { loading, purchaseOrdersEnabled } = useDocumentModules();

  return (
    <DocumentModulePageGate
      loading={loading}
      enabled={purchaseOrdersEnabled}
      redirectTo="/marketplace/documents"
      redirectToast="Activez « Bons de commande » dans Marketplace (onglet Documents)."
    >
      <QuotesPage kind="purchase_order" />
    </DocumentModulePageGate>
  );
}
