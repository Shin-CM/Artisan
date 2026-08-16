import { cn } from "@/lib/utils";
import type { PdfTemplateVariantId } from "@/lib/pdfTemplateVariants";

/** Aperçu miniature (HTML) du rendu PDF — pas d’image externe. */
export function PdfTemplatePreviewThumb({
  variant,
  className,
}: {
  variant: PdfTemplateVariantId;
  className?: string;
}) {
  const base = "relative h-[4.5rem] w-full overflow-hidden rounded border border-[var(--color-border)] bg-white";
  if (variant === "classic") {
    return (
      <div className={cn(base, className)} aria-hidden>
        <div className="absolute left-1 top-1 h-2 w-4 bg-neutral-300" />
        <div className="absolute left-1 top-3.5 right-1 h-0.5 bg-neutral-800" />
        <div className="absolute left-1 top-5 right-1 h-0.5 w-2/3 bg-neutral-400" />
        {/* Tableau : en-tête double filet noir (sans barre colorée avant) */}
        <div className="absolute bottom-2 left-1 right-1">
          <div className="h-0.5 w-full bg-neutral-900" />
          <div className="h-1 w-full" />
          <div className="h-0.5 w-full bg-neutral-900" />
          <div className="mt-0.5 space-y-0.5">
            <div className="h-0.5 w-full bg-neutral-200" />
            <div className="h-0.5 w-full bg-neutral-200" />
          </div>
        </div>
      </div>
    );
  }
  if (variant === "modern") {
    return (
      <div className={cn(base, "p-1", className)} aria-hidden>
        <div className="mb-0.5 h-1.5 w-1/2 rounded-sm bg-neutral-700" />
        {/* Barre d’accent avant le tableau + en-tête bordure gauche épaisse */}
        <div className="mb-0.5 h-1 w-3/4 rounded-sm bg-slate-700" />
        <div className="mb-1 flex h-2 rounded-sm border border-slate-200 border-l-[3px] border-l-slate-600 bg-slate-100" />
        <div className="space-y-0.5">
          <div className="h-0.5 w-full bg-slate-200" />
          <div className="h-0.5 w-full bg-slate-200" />
          <div className="h-0.5 w-3/4 bg-slate-200" />
        </div>
      </div>
    );
  }
  if (variant === "stripe") {
    return (
      <div className={cn(base, "p-0", className)} aria-hidden>
        <div className="h-2.5 w-full bg-blue-600" />
        <div className="p-1">
          <div className="mb-0.5 h-1 w-1/3 bg-neutral-400" />
          <div className="space-y-0.5 pt-0.5">
            <div className="h-0.5 w-full bg-slate-200" />
            <div className="h-0.5 w-full bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }
  if (variant === "studio") {
    return (
      <div
        className={cn(base, "flex flex-row p-0", className)}
        aria-hidden
      >
        <div className="w-1/4 bg-slate-800" />
        <div className="flex-1 p-0.5 pl-1">
          <div className="mb-0.5 h-1 w-2/3 bg-neutral-600" />
          <div className="h-0.5 w-full bg-slate-200" />
          <div className="mt-0.5 h-0.5 w-full bg-slate-200" />
        </div>
      </div>
    );
  }
  /* compact */
  return (
    <div className={cn(base, "p-0.5", className)} aria-hidden>
      <div className="mb-0.5 h-0.5 w-1/2 bg-neutral-700" />
      <div className="space-y-px">
        <div className="h-px w-full bg-neutral-800" />
        <div className="h-px w-full bg-neutral-300" />
        <div className="h-px w-full bg-neutral-300" />
        <div className="h-px w-full bg-neutral-300" />
      </div>
    </div>
  );
}
