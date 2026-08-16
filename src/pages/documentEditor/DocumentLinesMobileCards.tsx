import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { computeLine } from "@/core/documentMath";
import { normalizeLineBillingMode, type LineBillingMode } from "@/lib/lineBilling";
import { formatTaxPct, rateMatches } from "@/pages/documentEditor/taxFormat";
import type {
  EditableDocumentLine,
  LineCommonViewProps,
  LineMobileStateProps,
} from "@/pages/documentEditor/documentLineViewTypes";

type Props = LineCommonViewProps & LineMobileStateProps;

export function DocumentLinesMobileCards({
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
  openLinePopoverKey,
  setOpenLinePopoverKey,
  updateLine,
  removeLine,
  linePanelKey,
  combinedArticleVariantValue,
  applyArticleVariantSelection,
  applyBillingModeChange,
  selectClassName,
  inputClassName,
  inputDescClassName,
}: Props) {
  return (
    <div className="space-y-2 md:hidden">
      {lines.map((l, i) => {
        const billing = normalizeLineBillingMode(l.billingMode);
        const panelKey = linePanelKey(l.id, i);
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
          <div
            key={l.id ?? `mobile-${i}`}
            className="rounded-md border border-[var(--color-border)] p-2"
          >
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-[var(--color-muted-foreground)]">
                  Article / Variante
                </Label>
                <ArticleVariantLinePicker
                  id={`doc-line-article-mobile-${variant}-${i}`}
                  aria-label="Article ou variante"
                  value={combinedArticleVariantValue(l.articleId, l.optionsSnapshotJson)}
                  triggerClassName={`${selectClassName} mt-1`}
                  articles={articles}
                  categories={categories}
                  onSelect={(raw) => applyArticleVariantSelection(i, l, billing, raw)}
                  onOpenQuickArticle={
                    onOpenQuickArticle ? () => onOpenQuickArticle(i) : undefined
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-[var(--color-muted-foreground)]">
                    Facturation
                  </Label>
                  <select
                    className={`${selectClassName} mt-1`}
                    aria-label="Mode de facturation"
                    value={billing}
                    onChange={(e) =>
                      applyBillingModeChange(i, l, e.target.value as LineBillingMode)
                    }
                  >
                    <option value="unit">Unitaire</option>
                    <option value="flat">Forfait</option>
                    <option value="hourly">A l&apos;heure</option>
                  </select>
                </div>
                <div className="min-w-0">
                  <Label className="text-xs text-[var(--color-muted-foreground)]">
                    TVA %
                  </Label>
                  {taxRates.length === 0 ? (
                    <LineDecimalInput
                      id={`doc-line-tva-mobile-${variant}-${i}`}
                      className={`${inputClassName} mt-1 text-right tabular-nums`}
                      value={l.taxRate}
                      placeholder="Taux"
                      title="Taux de TVA (%)"
                      onCommit={(taxRate) => updateLine(i, { taxRate })}
                    />
                  ) : (
                    <div className="mt-1 flex min-w-0 flex-col gap-1">
                      <select
                        className={selectClassName}
                        aria-label="Taux de TVA"
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
                        <option value="">Manuel</option>
                        {taxRates.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({formatTaxPct(r.rate)} %)
                          </option>
                        ))}
                      </select>
                      {(l.taxManual === true ||
                        !taxRates.some((r) => rateMatches(r.rate, l.taxRate))) && (
                        <LineDecimalInput
                          id={`doc-line-tva-manual-mobile-${variant}-${i}`}
                          className={`${inputClassName} text-right tabular-nums`}
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
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-[var(--color-muted-foreground)]">
                    Qte
                  </Label>
                  <LineDecimalInput
                    id={`doc-line-qty-mobile-${variant}-${i}`}
                    className={`${inputClassName} mt-1 text-left tabular-nums`}
                    value={l.quantity}
                    placeholder="0"
                    selectAllOnFocus
                    onCommit={(quantity) => updateLine(i, { quantity })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-[var(--color-muted-foreground)]">
                    Prix u. HT
                  </Label>
                  <LineDecimalInput
                    id={`doc-line-pu-mobile-${variant}-${i}`}
                    className={`${inputClassName} mt-1 text-left tabular-nums`}
                    value={l.unitPrice}
                    placeholder="0"
                    fractionDigits={linePricesFractionDigits}
                    onCommit={(unitPrice) => updateLine(i, { unitPrice })}
                  />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2 border-t border-[var(--color-border)] pt-2">
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  Montant (TTC)
                </span>
                <span
                  className="text-sm font-medium tabular-nums text-[var(--color-foreground)]"
                  title={formatLineAmount(lineTotal)}
                >
                  {formatLineAmount(lineTotal)}
                </span>
              </div>

              <div>
                <Label
                  htmlFor={`doc-line-desc-mobile-${variant}-${i}`}
                  className="text-xs text-[var(--color-muted-foreground)]"
                >
                  Description (PDF)
                </Label>
                <Input
                  id={`doc-line-desc-mobile-${variant}-${i}`}
                  value={l.description}
                  onChange={(e) => updateLine(i, { description: e.target.value })}
                  className={`${inputDescClassName} mt-1 w-full`}
                />
              </div>

              <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-[var(--color-muted-foreground)]">
                      Remise
                    </Label>
                    <select
                      className={`${selectClassName} mt-1`}
                      value={l.lineDiscountKind}
                      onChange={(e) =>
                        updateLine(i, {
                          lineDiscountKind: e.target.value as LineDiscountFormKind,
                        })
                      }
                    >
                      <option value="none">Aucune</option>
                      <option value="percent">%</option>
                      <option value="fixed">HT</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-[var(--color-muted-foreground)]">
                      Valeur
                    </Label>
                    <LineDecimalInput
                      id={`doc-line-disc-val-mobile-${variant}-${i}`}
                      className={`${inputClassName} mt-1 text-right tabular-nums`}
                      value={l.lineDiscountValue}
                      onCommit={(n) => updateLine(i, { lineDiscountValue: n })}
                      placeholder={l.lineDiscountKind === "percent" ? "%" : "HT"}
                      disabled={l.lineDiscountKind === "none"}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[var(--color-muted-foreground)]">
                      Libelle
                    </Label>
                    <Input
                      id={`doc-line-disc-label-mobile-${variant}-${i}`}
                      className={`${inputDescClassName} mt-1 w-full`}
                      value={l.lineDiscountLabel}
                      onChange={(e) =>
                        updateLine(i, { lineDiscountLabel: e.target.value })
                      }
                      disabled={l.lineDiscountKind === "none"}
                      placeholder="ex. Promo"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {lineDetailsInPopover ? (
                    <Popover
                      modal
                      open={
                        !isMdViewport && openLinePopoverKey === panelKey
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
                        className="max-h-[min(18rem,70vh)] w-[min(100vw-1.5rem,18.5rem)] space-y-2 overflow-y-auto p-2 text-[11px] leading-snug"
                        onOpenAutoFocus={(ev) => ev.preventDefault()}
                      >
                        <div>
                          <Label
                            htmlFor={`doc-line-desc-pop-mobile-${variant}-${i}`}
                            className="text-[11px] font-medium text-[var(--color-foreground)]"
                          >
                            Description (PDF)
                          </Label>
                          <textarea
                            id={`doc-line-desc-pop-mobile-${variant}-${i}`}
                            rows={2}
                            className="mt-0.5 w-full rounded border border-[var(--color-input)] bg-[var(--color-background)] px-1.5 py-1 text-[11px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none"
                            value={l.description}
                            onChange={(e) =>
                              updateLine(i, { description: e.target.value })
                            }
                          />
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
              </div>

              <div>
                <Label
                  htmlFor={`line-note-mobile-${variant}-${i}`}
                  className="text-xs text-[var(--color-muted-foreground)]"
                >
                  Note interne / ligne
                </Label>
                <textarea
                  id={`line-note-mobile-${variant}-${i}`}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] p-2 text-xs"
                  placeholder="Detail, delai..."
                  value={l.lineNote}
                  onChange={(e) => updateLine(i, { lineNote: e.target.value })}
                />
                <div className="mt-2 flex items-center gap-2">
                  {variant === "quote" ? (
                    <>
                      <Switch
                        id={`line-note-show-mobile-${variant}-${i}`}
                        checked={(l as QuoteEditableLine).showNoteOnQuote}
                        onCheckedChange={(v) =>
                          updateLine(i, {
                            showNoteOnQuote: v,
                          } as Partial<EditableDocumentLine>)
                        }
                        aria-label="Afficher la note sur le devis PDF"
                      />
                      <Label
                        htmlFor={`line-note-show-mobile-${variant}-${i}`}
                        className="cursor-pointer text-xs font-normal"
                      >
                        Afficher sur le PDF
                      </Label>
                    </>
                  ) : (
                    <>
                      <Switch
                        id={`line-note-show-mobile-${variant}-${i}`}
                        checked={(l as InvoiceEditableLine).showNoteOnInvoice}
                        onCheckedChange={(v) =>
                          updateLine(i, {
                            showNoteOnInvoice: v,
                          } as Partial<EditableDocumentLine>)
                        }
                        aria-label="Afficher la note sur la facture PDF"
                      />
                      <Label
                        htmlFor={`line-note-show-mobile-${variant}-${i}`}
                        className="cursor-pointer text-xs font-normal"
                      >
                        Afficher sur le PDF
                      </Label>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
