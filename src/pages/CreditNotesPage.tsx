import { DocumentModulePageGate } from "@/components/DocumentModulePageGate";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { InvoicesPage } from "@/pages/InvoicesPage";

/** Écran dédié aux avoirs (même éditeur que les factures, `document_kind = credit_note`). */
export function CreditNotesPage() {
  const { loading, creditNotesEnabled } = useDocumentModules();

  return (
    <DocumentModulePageGate
      loading={loading}
      enabled={creditNotesEnabled}
      redirectTo="/marketplace/documents"
      redirectToast="Activez « Avoirs » dans Marketplace (onglet Documents)."
    >
      <InvoicesPage documentKind="credit_note" />
    </DocumentModulePageGate>
  );
}
