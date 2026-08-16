import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientForm } from "@/components/ClientForm";
import * as api from "@/lib/api";
import { toast } from "sonner";

export function QuickClientModal({
  open,
  onOpenChange,
  workspaceId,
  baseCurrency,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workspaceId: string;
  baseCurrency: string;
  onCreated: (client: api.Client) => void;
}) {
  const [taxRates, setTaxRates] = React.useState<api.TaxRate[]>([]);
  const [session, setSession] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    setSession((s) => s + 1);
    void api.listTaxRates(workspaceId).then(setTaxRates);
  }, [open, workspaceId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(85vh,720px)] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-[var(--color-border)] px-6 py-4 text-left">
          <DialogTitle>Nouveau client</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {open && (
            <ClientForm
              key={session}
              baseCurrency={baseCurrency}
              taxRates={taxRates}
              client={null}
              fieldIdPrefix="qc"
              showHelpAside={false}
              className="min-h-0 w-full"
              submitLabel="Créer"
              showCancelButton
              onCancel={() => onOpenChange(false)}
              onSubmit={async (payload) => {
                const c = await api.createClient(workspaceId, payload);
                onCreated(c);
                onOpenChange(false);
                toast.success("Client créé");
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
