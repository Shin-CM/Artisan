import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import { cn } from "@/lib/utils";
import {
  PROJECT_STATUS_VALUES,
  projectStatusLabel,
} from "@/pages/projects/projectUtils";

export function ProjectDetailSettingsForm({
  name,
  onNameChange,
  code,
  onCodeChange,
  status,
  onStatusChange,
  clientId,
  onClientIdChange,
  clientOptions,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  budget,
  onBudgetChange,
  notes,
  onNotesChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  code: string;
  onCodeChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  clientId: string;
  onClientIdChange: (v: string) => void;
  clientOptions: Array<{ value: string; label: string }>;
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
  budget: string;
  onBudgetChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
}) {
  return (
<div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="proj-name">Nom</Label>
              <Input
                id="proj-name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-code">Code (optionnel)</Label>
              <Input
                id="proj-code"
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-status">Statut</Label>
              <select
                id="proj-status"
                className={cn(
                  "flex h-9 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm",
                )}
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
              >
                {PROJECT_STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {projectStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <SearchableCombobox
                id="proj-client"
                label="Client (optionnel)"
                hideLabel={false}
                value={clientId}
                onValueChange={onClientIdChange}
                options={clientOptions}
                placeholder="Aucun client"
                allowClearSelection
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-start">Début</Label>
              <Input
                id="proj-start"
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-end">Fin</Label>
              <Input
                id="proj-end"
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-budget">Budget estimé (HT)</Label>
              <Input
                id="proj-budget"
                inputMode="decimal"
                value={budget}
                onChange={(e) => onBudgetChange(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-notes">Notes</Label>
            <textarea
              id="proj-notes"
              rows={3}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onNotesChange(e.target.value)
              }
              className="min-h-[4.5rem] w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 py-1.5 text-sm"
            />
          </div>
        </div>
  );
}
