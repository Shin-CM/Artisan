import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { ClientContactEventInput, ClientTimelineEntry } from "@/lib/api";
import {
  CONTACT_EVENT_KIND_OPTIONS,
  toDatetimeLocalValue,
} from "@/lib/contactEventKinds";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function entryTypeLabel(kind: string): string {
  switch (kind) {
    case "quote":
      return "Devis";
    case "invoice":
      return "Facture";
    case "credit_note":
      return "Avoir";
    case "contact_event":
      return "Contact";
    case "reminder":
      return "Rappel";
    case "crm_opportunity":
      return "Opportunité";
    default:
      return kind;
  }
}

function parseContactKindFromTimelineEntry(e: ClientTimelineEntry): string {
  const m = e.meta?.trim();
  if (m) return m;
  const re = /^Contact \(([^)]+)\)/.exec(e.title);
  return re ? re[1].trim() : "note";
}

export function ClientFollowupTimeline({
  entries,
  className,
  onDeleteContactEvent,
  onUpdateContactEvent,
}: {
  entries: ClientTimelineEntry[];
  className?: string;
  onDeleteContactEvent?: (eventId: string) => void | Promise<void>;
  onUpdateContactEvent?: (
    eventId: string,
    input: ClientContactEventInput,
  ) => void | Promise<void>;
}) {
  const [editEntry, setEditEntry] = React.useState<ClientTimelineEntry | null>(
    null,
  );
  const [editKind, setEditKind] = React.useState("note");
  const [editBody, setEditBody] = React.useState("");
  const [editWhen, setEditWhen] = React.useState("");
  const [editSaving, setEditSaving] = React.useState(false);

  React.useEffect(() => {
    if (!editEntry) return;
    setEditKind(parseContactKindFromTimelineEntry(editEntry));
    setEditBody(editEntry.subtitle?.trim() ?? "");
    setEditWhen(toDatetimeLocalValue(editEntry.occurredAt));
  }, [editEntry]);

  async function submitEdit() {
    if (!editEntry || !onUpdateContactEvent || !editWhen.trim()) return;
    const iso = new Date(editWhen).toISOString();
    if (Number.isNaN(new Date(iso).getTime())) return;
    setEditSaving(true);
    try {
      await onUpdateContactEvent(editEntry.id, {
        kind: editKind,
        body: editBody.trim() || null,
        occurredAt: iso,
      });
      setEditEntry(null);
    } finally {
      setEditSaving(false);
    }
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Aucun événement dans la chronologie.
      </p>
    );
  }

  return (
    <>
      <div className={cn("overflow-x-auto rounded-md border border-[var(--color-border)]", className)}>
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="bg-[var(--color-muted)]/35">
            <tr className="border-b border-[var(--color-border)] text-left">
              <th className="whitespace-nowrap p-2 font-medium">Date</th>
              <th className="whitespace-nowrap p-2 font-medium">Type</th>
              <th className="min-w-[8rem] p-2 font-medium">Objet</th>
              <th className="min-w-[10rem] p-2 font-medium">Détail</th>
              <th className="w-[5.5rem] p-2 text-right font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={`${e.kind}-${e.id}`}
                className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-muted)]/25"
              >
                <td className="whitespace-nowrap p-2 align-top tabular-nums text-xs text-[var(--color-muted-foreground)]">
                  {e.occurredAt.slice(0, 16).replace("T", " ")}
                </td>
                <td className="whitespace-nowrap p-2 align-top">
                  <span className="rounded bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
                    {entryTypeLabel(e.kind)}
                  </span>
                </td>
                <td className="p-2 align-top font-medium">{e.title}</td>
                <td className="p-2 align-top text-[var(--color-muted-foreground)]">
                  {e.subtitle ? (
                    <span className="line-clamp-4 whitespace-pre-wrap text-xs">
                      {e.subtitle}
                    </span>
                  ) : (
                    <span className="text-xs italic">—</span>
                  )}
                </td>
                <td className="p-2 align-top text-right">
                  {e.kind === "contact_event" &&
                  (onDeleteContactEvent || onUpdateContactEvent) ? (
                    <div className="inline-flex justify-end gap-0.5">
                      {onUpdateContactEvent ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Modifier ce contact"
                          onClick={() => setEditEntry(e)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {onDeleteContactEvent ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Retirer de la chronologie"
                          onClick={() => void onDeleteContactEvent(e.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-[var(--color-muted-foreground)]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={editEntry != null} onOpenChange={(o) => !o && setEditEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le contact</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="tl-edit-kind">Type</Label>
              <select
                id="tl-edit-kind"
                value={editKind}
                onChange={(ev) => setEditKind(ev.target.value)}
                disabled={editSaving}
                className="flex h-9 w-full min-w-0 rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-1 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {CONTACT_EVENT_KIND_OPTIONS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tl-edit-when">Date et heure</Label>
              <Input
                id="tl-edit-when"
                type="datetime-local"
                value={editWhen}
                onChange={(ev) => setEditWhen(ev.target.value)}
                disabled={editSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tl-edit-body">Détail</Label>
              <textarea
                id="tl-edit-body"
                className="min-h-[88px] w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-sm"
                value={editBody}
                onChange={(ev) => setEditBody(ev.target.value)}
                disabled={editSaving}
                placeholder="Optionnel"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={editSaving}
              onClick={() => setEditEntry(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={editSaving || !editWhen.trim()}
              onClick={() => void submitEdit()}
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
