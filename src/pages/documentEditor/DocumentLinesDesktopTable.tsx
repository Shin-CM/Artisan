import * as React from "react";
import { ChevronDown, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArticleVariantLinePicker } from "@/components/ArticleVariantLinePicker";
import { LineDecimalInput } from "@/pages/documentEditor/LineDecimalInput";
import type {
  InvoiceEditableLine,
  LineDiscountFormKind,
  QuoteEditableLine,
} from "@/pages/documentEditor/editableLineTypes";
import { formatTaxPct, rateMatches } from "@/pages/documentEditor/taxFormat";
import { computeLine } from "@/core/documentMath";
import { normalizeLineBillingMode, type LineBillingMode } from "@/lib/lineBilling";
import type {
  EditableDocumentLine,
  LineCommonViewProps,
  LineDesktopStateProps,
} from "@/pages/documentEditor/documentLineViewTypes";

type Props = LineCommonViewProps & LineDesktopStateProps;

export function DocumentLinesDesktopTable({
  variant,
  linePricesFractionDigits,
  taxExempt,
  formatLineAmount,
  onOpenQuickArticle,
  lines,
  articles,
  categories,
  taxRates,
  isMdViewport,
  lineDetailsInPopover,
  noteIdPrefix,
  discOpenByLine,
  setDiscOpenByLine,
  noteOpenByLine,
  setNoteOpenByLine,
  openLinePopoverKey,
  setOpenLinePopoverKey,
  focusedLineKey,
  setFocusedLineKey,
  updateLine,
  removeLine,
  linePanelKey,
  combinedArticleVariantValue,
  applyArticleVariantSelection,
  applyBillingModeChange,
  lineTdClassName,
  lineThClassName,
  selectClassName,
  inputClassName,
  inputDescClassName,
}: Props) {
  return (
    <div
      className={cn(
        "hidden min-w-0 overflow-x-hidden md:block",
        lineDetailsInPopover
          ? "border-y border-[var(--color-border)]"
          : "rounded-md border border-[var(--color-border)]",
      )}
    >
      <table className="w-full min-w-0 table-fixed text-sm">
        <colgroup>
          <col className="min-w-0 w-[36%]" />
          <col className="min-w-0 w-[11%]" />
          <col className="min-w-0 w-[7%]" />
          <col className="min-w-0 w-[11%]" />
          <col className="min-w-0 w-[15%]" />
          <col className="min-w-0 w-[9%]" />
          <col className="min-w-0 w-[11%]" />
        </colgroup>
        <thead>
          <tr
            className={cn(
              "border-b border-[var(--color-border)]",
              lineDetailsInPopover ? "bg-transparent" : "bg-[var(--color-muted)]/30",
            )}
          >
            <th className={lineThClassName}>
              <span className="hidden lg:inline">Article / Variante</span>
              <span className="lg:hidden">Article</span>
            </th>
            <th className={lineThClassName}>
              <span className="hidden lg:inline">Facturation</span>
              <span className="lg:hidden">Mode</span>
            </th>
            <th className={lineThClassName}>Qté</th>
            <th className={lineThClassName}>
              <span className="hidden lg:inline">Prix u. HT</span>
              <span className="lg:hidden">P.U.</span>
            </th>
            <th className={lineThClassName}>
              <span className="hidden lg:inline">TVA %</span>
              <span className="lg:hidden">TVA</span>
            </th>
            <th className="px-0 py-2 text-right align-middle text-xs font-medium">
              Montant
            </th>
            <th
              className={`${lineThClassName} pl-2.5 text-center`}
              aria-label="Actions"
            />
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => {
            const billing = normalizeLineBillingMode(l.billingMode);
            const panelKey = linePanelKey(l.id, i);
            const discOpen = discOpenByLine[panelKey] ?? false;
            const noteOpen = noteOpenByLine[panelKey] ?? false;
            const { lineTotal } = computeLine(
              {
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                taxRatePercent: l.taxRate,
                lineDiscountKind: l.lineDiscountKind,
                lineDiscountValue: l.lineDiscountValue,
              },
              taxExempt,
            );
            return (
              <React.Fragment key={l.id ?? `new-${i}`}>
                <tr
                  className={cn(
                    "border-b border-[var(--color-border)]",
                    lineDetailsInPopover &&
                      focusedLineKey === panelKey &&
                      "bg-[var(--color-muted)]/25",
                  )}
                  onClick={
                    lineDetailsInPopover
                      ? (e) => {
                          if (
                            (e.target as HTMLElement).closest(
                              "input,select,button,textarea,a,[role='combobox']",
                            )
                          ) {
                            return;
                          }
                          setFocusedLineKey(panelKey);
                        }
                      : undefined
                  }
                >
                  <td className={`${lineTdClassName} min-w-0 py-1`}>
                    <ArticleVariantLinePicker
                      id={`doc-line-article-${variant}-${i}`}
                      aria-label="Article ou variante"
                      value={combinedArticleVariantValue(
                        l.articleId,
                        l.optionsSnapshotJson,
                      )}
                      triggerClassName={selectClassName}
                      articles={articles}
                      categories={categories}
                      onSelect={(raw) => applyArticleVariantSelection(i, l, billing, raw)}
                      onOpenQuickArticle={
                        onOpenQuickArticle
                          ? () => onOpenQuickArticle(i)
                          : undefined
                      }
                    />
                  </td>
                  <td className={`${lineTdClassName} min-w-0 max-w-full`}>
                    <select
                      className={`${selectClassName} w-full min-w-0 max-w-full`}
                      aria-label="Mode de facturation"
                      value={billing}
                      onChange={(e) =>
                        applyBillingModeChange(i, l, e.target.value as LineBillingMode)
                      }
                    >
                      <option value="unit">Unitaire</option>
                      <option value="flat">Forfait</option>
                      <option value="hourly">À l&apos;heure</option>
                    </select>
                  </td>
                  <td className={`${lineTdClassName} min-w-0`}>
                    <LineDecimalInput
                      id={`doc-line-qty-${variant}-${i}`}
                      title={
                        billing === "hourly"
                          ? "Nombre d’heures (décimal autorisé)"
                          : billing === "flat"
                            ? "Souvent 1 pour un forfait"
                            : undefined
                      }
                      className={`${inputClassName} text-left tabular-nums`}
                      value={l.quantity}
                      placeholder="0"
                      selectAllOnFocus
                      onCommit={(quantity) => updateLine(i, { quantity })}
                    />
                  </td>
                  <td className={`${lineTdClassName} min-w-0 max-w-full`}>
                    <LineDecimalInput
                      id={`doc-line-pu-${variant}-${i}`}
                      className={`${inputClassName} w-full min-w-0 max-w-full text-left tabular-nums`}
                      value={l.unitPrice}
                      placeholder="0"
                      fractionDigits={linePricesFractionDigits}
                      onCommit={(unitPrice) => updateLine(i, { unitPrice })}
                    />
                  </td>
                  <td className={`${lineTdClassName} min-w-0 pr-1`}>
                    {taxRates.length === 0 ? (
                      <LineDecimalInput
                        id={`doc-line-tva-${variant}-${i}`}
                        className={`${inputClassName} w-full min-w-0 text-right tabular-nums`}
                        value={l.taxRate}
                        placeholder="Taux"
                        title="Taux de TVA (%)"
                        onCommit={(taxRate) => updateLine(i, { taxRate })}
                      />
                    ) : (
                      <div className="flex min-w-0 flex-col gap-1">
                        <select
                          className={`${selectClassName} w-full min-w-0 max-w-full truncate text-left`}
                          aria-label="Taux de TVA"
                          title={
                            l.taxManual === true
                              ? "Saisie manuelle du taux"
                              : (taxRates.find((r) =>
                                    rateMatches(r.rate, l.taxRate),
                                  )?.name ?? "Taux de TVA")
                          }
                          value={(() => {
                            if (l.taxManual === true) return "";
                            const m = taxRates.find((r) => rateMatches(r.rate, l.taxRate));
                            return m?.id ?? "";
                          })()}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!v) {
                              updateLine(i, { taxManual: true });
                              return;
                            }
                            const r = taxRates.find((x) => x.id === v);
                            if (r) updateLine(i, { taxRate: r.rate, taxManual: false });
                          }}
                        >
                          <option value="">Saisie manuelle</option>
                          {taxRates.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({formatTaxPct(r.rate)} %)
                            </option>
                          ))}
                        </select>
                        {(l.taxManual === true ||
                          !taxRates.some((r) => rateMatches(r.rate, l.taxRate))) && (
                          <LineDecimalInput
                            id={`doc-line-tva-manual-${variant}-${i}`}
                            className={`${inputClassName} w-full min-w-0 text-right tabular-nums`}
                            value={l.taxRate}
                            placeholder="Taux"
                            title="Taux de TVA (%) — saisie manuelle"
                            onCommit={(taxRate) =>
                              updateLine(i, { taxRate, taxManual: true })
                            }
                          />
                        )}
                      </div>
                    )}
                  </td>
                  <td
                    className="min-w-0 whitespace-nowrap px-0 py-1.5 align-middle text-right tabular-nums text-[var(--color-foreground)]"
                    title={`Montant TTC ligne : ${formatLineAmount(lineTotal)}`}
                  >
                    {formatLineAmount(lineTotal)}
                  </td>
                  <td
                    className={`${lineTdClassName} min-w-0 whitespace-nowrap pl-2.5 text-center`}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {lineDetailsInPopover ? (
                        <Popover
                          modal
                          open={
                            isMdViewport && openLinePopoverKey === panelKey
                          }
                          onOpenChange={(open) =>
                            setOpenLinePopoverKey(open ? panelKey : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                              aria-label="Options de la ligne : description, remise, note"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            side="bottom"
                            align="end"
                            sideOffset={4}
                            collisionPadding={16}
                            className="max-h-[min(22rem,72vh)] w-[min(100vw-1.5rem,18.5rem)] space-y-2 overflow-y-auto p-2 text-[11px] leading-snug"
                            onOpenAutoFocus={(ev) => ev.preventDefault()}
                          >
                            <div>
                              <Label
                                htmlFor={`doc-line-desc-pop-${variant}-${i}`}
                                className="text-[11px] font-medium text-[var(--color-foreground)]"
                              >
                                Description (PDF)
                              </Label>
                              <textarea
                                id={`doc-line-desc-pop-${variant}-${i}`}
                                rows={2}
                                className="mt-0.5 w-full rounded border border-[var(--color-input)] bg-[var(--color-background)] px-1.5 py-1 text-[11px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none"
                                value={l.description}
                                onChange={(e) =>
                                  updateLine(i, { description: e.target.value })
                                }
                                placeholder="Libellé document"
                              />
                            </div>
                            <div className="border-t border-[var(--color-border)] pt-2">
                              <p className="text-[11px] font-medium text-[var(--color-foreground)]">
                                Remise ligne (HT)
                              </p>
                              <div className="mt-1.5 flex flex-col gap-1.5">
                                <div>
                                  <Label
                                    htmlFor={`doc-line-disc-type-pop-${variant}-${i}`}
                                    className="text-[10px] font-normal text-[var(--color-muted-foreground)]"
                                  >
                                    Type
                                  </Label>
                                  <select
                                    id={`doc-line-disc-type-pop-${variant}-${i}`}
                                    className={`${selectClassName} mt-0.5 h-7 min-h-7 w-full text-[11px]`}
                                    value={l.lineDiscountKind}
                                    onChange={(e) =>
                                      updateLine(i, {
                                        lineDiscountKind: e.target.value as LineDiscountFormKind,
                                      })
                                    }
                                  >
                                    <option value="none">Aucune</option>
                                    <option value="percent">Pourcentage</option>
                                    <option value="fixed">Montant HT fixe</option>
                                  </select>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  <div className="min-w-[4.5rem] flex-1">
                                    <Label
                                      htmlFor={`doc-line-disc-val-pop-${variant}-${i}`}
                                      className="text-[10px] font-normal text-[var(--color-muted-foreground)]"
                                    >
                                      Valeur
                                    </Label>
                                    <LineDecimalInput
                                      id={`doc-line-disc-val-pop-${variant}-${i}`}
                                      className={`${inputClassName} mt-0.5 h-7 min-h-7 w-full text-right text-[11px] tabular-nums`}
                                      value={l.lineDiscountValue}
                                      onCommit={(n) =>
                                        updateLine(i, { lineDiscountValue: n })
                                      }
                                      placeholder={
                                        l.lineDiscountKind === "percent" ? "%" : "HT"
                                      }
                                      title={
                                        l.lineDiscountKind === "percent"
                                          ? "Pourcentage de remise sur le HT de la ligne"
                                          : "Montant HT de remise sur la ligne"
                                      }
                                      disabled={l.lineDiscountKind === "none"}
                                    />
                                  </div>
                                  <div className="min-w-0 flex-[2]">
                                    <Label
                                      htmlFor={`doc-line-disc-label-pop-${variant}-${i}`}
                                      className="text-[10px] font-normal text-[var(--color-muted-foreground)]"
                                    >
                                      Libellé PDF
                                    </Label>
                                    <Input
                                      id={`doc-line-disc-label-pop-${variant}-${i}`}
                                      className={`${inputDescClassName} mt-0.5 h-7 min-h-7 w-full text-[11px]`}
                                      value={l.lineDiscountLabel}
                                      onChange={(e) =>
                                        updateLine(i, {
                                          lineDiscountLabel: e.target.value,
                                        })
                                      }
                                      disabled={l.lineDiscountKind === "none"}
                                      placeholder="ex. Promo"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="border-t border-[var(--color-border)] pt-2">
                              <Label
                                htmlFor={`${noteIdPrefix}-pop-${variant}-${i}`}
                                className="text-[11px] font-medium text-[var(--color-foreground)]"
                              >
                                Note (optionnel)
                              </Label>
                              <textarea
                                id={`${noteIdPrefix}-pop-${variant}-${i}`}
                                rows={2}
                                className="mt-0.5 w-full rounded border border-[var(--color-input)] bg-[var(--color-background)] px-1.5 py-1 text-[11px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none"
                                placeholder="Détail, délai…"
                                value={l.lineNote}
                                onChange={(e) =>
                                  updateLine(i, { lineNote: e.target.value })
                                }
                              />
                              <div className="mt-1.5 flex items-center gap-1.5">
                                {variant === "quote" ? (
                                  <>
                                    <Switch
                                      id={`${noteIdPrefix}-show-pop-${variant}-${i}`}
                                      className="scale-90"
                                      checked={(l as QuoteEditableLine).showNoteOnQuote}
                                      onCheckedChange={(v) =>
                                        updateLine(i, {
                                          showNoteOnQuote: v,
                                        } as Partial<EditableDocumentLine>)
                                      }
                                      aria-label="Afficher la note sur le devis PDF"
                                    />
                                    <Label
                                      htmlFor={`${noteIdPrefix}-show-pop-${variant}-${i}`}
                                      className="cursor-pointer text-[11px] font-normal leading-tight"
                                    >
                                      Visible sur le PDF
                                    </Label>
                                  </>
                                ) : (
                                  <>
                                    <Switch
                                      id={`${noteIdPrefix}-show-pop-${variant}-${i}`}
                                      className="scale-90"
                                      checked={
                                        (l as InvoiceEditableLine).showNoteOnInvoice
                                      }
                                      onCheckedChange={(v) =>
                                        updateLine(i, {
                                          showNoteOnInvoice: v,
                                        } as Partial<EditableDocumentLine>)
                                      }
                                      aria-label="Afficher la note sur la facture PDF"
                                    />
                                    <Label
                                      htmlFor={`${noteIdPrefix}-show-pop-${variant}-${i}`}
                                      className="cursor-pointer text-[11px] font-normal leading-tight"
                                    >
                                      Visible sur le PDF
                                    </Label>
                                  </>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : null}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-[var(--color-muted-foreground)] hover:text-destructive"
                        aria-label="Supprimer cette ligne"
                        disabled={lines.length <= 1}
                        onClick={() => removeLine(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
                {!lineDetailsInPopover ? (
                  <>
                    <tr className="border-b border-[var(--color-border)]">
                      <td colSpan={7} className={`${lineTdClassName} py-1`}>
                        <div className="flex min-w-0 w-full items-center gap-2">
                          <Label htmlFor={`doc-line-desc-${variant}-${i}`} className="mb-0 shrink-0 text-left text-xs font-medium">
                            Description
                          </Label>
                          <Input
                            id={`doc-line-desc-${variant}-${i}`}
                            value={l.description}
                            onChange={(e) => updateLine(i, { description: e.target.value })}
                            className={`${inputDescClassName} min-w-0 flex-1 text-left`}
                          />
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/10">
                      <td colSpan={7} className="px-2 py-1.5">
                        <button
                          type="button"
                          id={`doc-line-disc-toggle-${variant}-${i}`}
                          className="flex w-full min-w-0 items-center gap-1.5 rounded-md py-1 text-left text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                          aria-expanded={discOpen}
                          aria-controls={`doc-line-disc-panel-${variant}-${i}`}
                          onClick={() =>
                            setDiscOpenByLine((prev) => ({
                              ...prev,
                              [panelKey]: !(prev[panelKey] ?? false),
                            }))
                          }
                        >
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-200",
                              !discOpen && "-rotate-90",
                            )}
                            aria-hidden
                          />
                          <span className="min-w-0 leading-snug">
                            Remise sur cette ligne (HT, avant la réduction globale)
                          </span>
                        </button>
                        {discOpen ? (
                          <div
                            id={`doc-line-disc-panel-${variant}-${i}`}
                            role="region"
                            aria-labelledby={`doc-line-disc-toggle-${variant}-${i}`}
                            className="space-y-2 pb-1 pt-2"
                          >
                            <div className="flex flex-wrap items-end gap-2 sm:gap-3">
                              <div className="min-w-[7.5rem]">
                                <Label
                                  htmlFor={`doc-line-disc-type-${variant}-${i}`}
                                  className="text-xs font-normal text-[var(--color-muted-foreground)]"
                                >
                                  Type
                                </Label>
                                <select
                                  id={`doc-line-disc-type-${variant}-${i}`}
                                  className={`${selectClassName} mt-1`}
                                  value={l.lineDiscountKind}
                                  onChange={(e) =>
                                    updateLine(i, {
                                      lineDiscountKind: e.target.value as LineDiscountFormKind,
                                    })
                                  }
                                >
                                  <option value="none">Aucune</option>
                                  <option value="percent">Pourcentage</option>
                                  <option value="fixed">Montant HT fixe</option>
                                </select>
                              </div>
                              <div className="w-[5.5rem] min-w-0">
                                <Label
                                  htmlFor={`doc-line-disc-val-${variant}-${i}`}
                                  className="text-xs font-normal text-[var(--color-muted-foreground)]"
                                >
                                  Valeur
                                </Label>
                                <LineDecimalInput
                                  id={`doc-line-disc-val-${variant}-${i}`}
                                  className={`${inputClassName} mt-1 text-right tabular-nums`}
                                  value={l.lineDiscountValue}
                                  onCommit={(n) => updateLine(i, { lineDiscountValue: n })}
                                  placeholder={l.lineDiscountKind === "percent" ? "%" : "HT"}
                                  title={
                                    l.lineDiscountKind === "percent"
                                      ? "Pourcentage de remise sur le HT de la ligne"
                                      : "Montant HT de remise sur la ligne"
                                  }
                                  disabled={l.lineDiscountKind === "none"}
                                />
                              </div>
                              <div className="min-w-0 flex-1 basis-[12rem]">
                                <Label
                                  htmlFor={`doc-line-disc-label-${variant}-${i}`}
                                  className="text-xs font-normal text-[var(--color-muted-foreground)]"
                                >
                                  Libellé (PDF, optionnel)
                                </Label>
                                <Input
                                  id={`doc-line-disc-label-${variant}-${i}`}
                                  className={`${inputDescClassName} mt-1 w-full`}
                                  value={l.lineDiscountLabel}
                                  onChange={(e) =>
                                    updateLine(i, { lineDiscountLabel: e.target.value })
                                  }
                                  disabled={l.lineDiscountKind === "none"}
                                  placeholder="ex. Promo printemps"
                                />
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/15">
                      <td colSpan={7} className="px-2 py-1.5">
                        <button
                          type="button"
                          id={`${noteIdPrefix}-toggle-${i}`}
                          className="flex w-full min-w-0 items-center gap-1.5 rounded-md py-1 text-left text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                          aria-expanded={noteOpen}
                          aria-controls={`${noteIdPrefix}-panel-${i}`}
                          onClick={() =>
                            setNoteOpenByLine((prev) => ({
                              ...prev,
                              [panelKey]: !(prev[panelKey] ?? false),
                            }))
                          }
                        >
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-200",
                              !noteOpen && "-rotate-90",
                            )}
                            aria-hidden
                          />
                          <span className="min-w-0 leading-snug">Note sur la ligne (optionnel)</span>
                        </button>
                        {noteOpen ? (
                          <div
                            id={`${noteIdPrefix}-panel-${i}`}
                            role="region"
                            aria-labelledby={`${noteIdPrefix}-toggle-${i}`}
                            className="flex flex-col gap-2 pb-2 pt-2"
                          >
                            <textarea
                              id={`${noteIdPrefix}-${i}`}
                              rows={2}
                              className="w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] p-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none"
                              placeholder="Détail, variante, délai…"
                              value={l.lineNote}
                              onChange={(e) => updateLine(i, { lineNote: e.target.value })}
                            />
                            <div className="flex items-center gap-2">
                              {variant === "quote" ? (
                                <>
                                  <Switch
                                    id={`${noteIdPrefix}-show-${i}`}
                                    checked={(l as QuoteEditableLine).showNoteOnQuote}
                                    onCheckedChange={(v) =>
                                      updateLine(i, {
                                        showNoteOnQuote: v,
                                      } as Partial<EditableDocumentLine>)
                                    }
                                    aria-label="Afficher la note sur le devis"
                                  />
                                  <Label htmlFor={`${noteIdPrefix}-show-${i}`} className="cursor-pointer text-xs font-normal">
                                    Afficher cette note sur le devis (PDF / impression)
                                  </Label>
                                </>
                              ) : (
                                <>
                                  <Switch
                                    id={`${noteIdPrefix}-show-${i}`}
                                    checked={(l as InvoiceEditableLine).showNoteOnInvoice}
                                    onCheckedChange={(v) =>
                                      updateLine(i, {
                                        showNoteOnInvoice: v,
                                      } as Partial<EditableDocumentLine>)
                                    }
                                    aria-label="Afficher la note sur la facture"
                                  />
                                  <Label htmlFor={`${noteIdPrefix}-show-${i}`} className="cursor-pointer text-xs font-normal">
                                    Afficher cette note sur la facture (PDF / impression)
                                  </Label>
                                </>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  </>
                ) : null}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
