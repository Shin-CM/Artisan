import * as React from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useGlobalSearch } from "@/context/GlobalSearchContext";
import {
  clientMatchesGlobalSearch,
  globalSearchNormalized,
} from "@/lib/globalSearchFilter";
import * as api from "@/lib/api";
import { ClientForm } from "@/components/ClientForm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useResponsiveHelpAside } from "@/hooks/useResponsiveHelpAside";

function SortableClientRow({
  client,
  selected,
  onSelect,
}: {
  client: api.Client;
  selected: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className={cn(isDragging && "z-10 opacity-80")}>
      <div
        className={cn(
          "flex w-full items-center gap-0.5 rounded text-left",
          selected && "bg-[var(--color-muted)] font-medium",
        )}
      >
        <button
          type="button"
          className="flex h-8 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] active:cursor-grabbing"
          aria-label="Glisser pour réordonner"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          className={cn(
            "min-w-0 flex-1 rounded px-1 py-1.5 text-left hover:bg-[var(--color-muted)]",
          )}
          onClick={onSelect}
        >
          <span className="truncate">{client.name}</span>
        </button>
      </div>
    </li>
  );
}

export function ClientsPage() {
  const { active } = useWorkspace();
  const { query: globalSearchQuery } = useGlobalSearch();
  const [clients, setClients] = React.useState<api.Client[]>([]);
  const [taxRates, setTaxRates] = React.useState<api.TaxRate[]>([]);
  const [sel, setSel] = React.useState<api.Client | null>(null);
  const { isHelpOpen, toggleHelp } = useResponsiveHelpAside();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const load = React.useCallback(async () => {
    if (!active) return;
    const [list, rates] = await Promise.all([
      api.listClients(active.id),
      api.listTaxRates(active.id),
    ]);
    setClients(list);
    setTaxRates(rates);
  }, [active]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleClientDragEnd(event: DragEndEvent) {
    if (!active) return;
    const { active: a, over } = event;
    if (!over || a.id === over.id) return;
    const oldIndex = clients.findIndex((c) => c.id === a.id);
    const newIndex = clients.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(clients, oldIndex, newIndex);
    setClients(next);
    try {
      await api.reorderClients(
        active.id,
        next.map((c) => c.id),
      );
    } catch (e) {
      toast.error(String(e));
      void load();
    }
  }

  const globalNorm = React.useMemo(
    () => globalSearchNormalized(globalSearchQuery),
    [globalSearchQuery],
  );

  const clientsFiltered = React.useMemo(() => {
    if (!globalNorm) return clients;
    return clients.filter((c) => clientMatchesGlobalSearch(c, globalNorm));
  }, [clients, globalNorm]);

  if (!active) return null;

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-h-0 w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-muted)]/20 p-2">
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <span className="text-sm font-medium">Clients</span>
          <Button size="sm" variant="outline" onClick={() => setSel(null)}>
            +
          </Button>
        </div>
        {globalNorm ? (
          <ul className="min-h-0 flex-1 space-y-0.5 overflow-auto text-sm">
            {clientsFiltered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded px-2 py-1.5 text-left hover:bg-[var(--color-muted)]",
                    sel?.id === c.id && "bg-[var(--color-muted)] font-medium",
                  )}
                  onClick={() => setSel(c)}
                >
                  <span className="truncate">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => void handleClientDragEnd(e)}
            >
              <SortableContext
                items={clientsFiltered.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="min-h-0 flex-1 space-y-0.5 overflow-auto text-sm">
                  {clientsFiltered.map((c) => (
                    <SortableClientRow
                      key={c.id}
                      client={c}
                      selected={sel?.id === c.id}
                      onSelect={() => setSel(c)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ClientForm
            baseCurrency={active.baseCurrency}
            taxRates={taxRates}
            client={sel}
            fieldIdPrefix="c"
            showHelpAside={isHelpOpen}
            className="min-h-0 min-w-0 flex-1"
            title={sel ? "Modifier le client" : "Nouveau client"}
            headerAction={
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8"
                aria-label={isHelpOpen ? "Fermer l’aide" : "Ouvrir l’aide"}
                onClick={toggleHelp}
              >
                {isHelpOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>
            }
            submitLabel="Enregistrer"
            showDeleteButton={!!sel}
            onSubmit={async (payload) => {
              if (sel) {
                await api.updateClient(sel.id, payload);
                toast.success("Client mis à jour");
              } else {
                await api.createClient(active.id, payload);
                toast.success("Client créé");
              }
              setSel(null);
              void load();
            }}
            onDelete={
              sel
                ? async () => {
                    await api.deleteClient(sel.id);
                    setSel(null);
                    void load();
                    toast.success("Supprimé");
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
