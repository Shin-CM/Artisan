import * as React from "react";
import { Check, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  BrandingImportedWorkspaceFont,
  BrandingState,
} from "@/lib/documentOptions";

export type FontLibraryRowProps = {
  font: BrandingImportedWorkspaceFont;
  indent: boolean;
  branding: BrandingState;
  selectedFontRelPaths: string[];
  setSelectedFontRelPaths: React.Dispatch<React.SetStateAction<string[]>>;
  fontImportBusy: boolean;
  fontLibraryBusy: boolean;
};

export function FontLibraryRow({
  font: f,
  indent,
  branding,
  selectedFontRelPaths,
  setSelectedFontRelPaths,
  fontImportBusy,
  fontLibraryBusy,
}: FontLibraryRowProps) {
  const isActive =
    branding.pdfFont.kind === "workspace" &&
    branding.pdfFont.relativePath === f.relativePath;
  const rowChecked = selectedFontRelPaths.includes(f.relativePath);
  return (
    <li role="listitem">
      <div
        className={cn(
          "group flex min-h-9 items-center gap-2 py-1.5 pr-2 transition-colors hover:bg-[var(--color-muted)]/40",
          indent ? "pl-7" : "pl-2",
        )}
      >
        <div className="flex w-8 shrink-0 justify-center">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-[var(--color-input)]"
            checked={rowChecked}
            disabled={fontImportBusy || fontLibraryBusy}
            onChange={() => {
              setSelectedFontRelPaths((prev) =>
                prev.includes(f.relativePath)
                  ? prev.filter((p) => p !== f.relativePath)
                  : [...prev, f.relativePath],
              );
            }}
            aria-label={`Sélectionner ${f.label}`}
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Type
            className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)] opacity-80"
            aria-hidden
          />
          <span className="min-w-0 truncate text-[var(--color-foreground)]">
            {f.label}
          </span>
        </div>
        <div className="flex w-10 shrink-0 justify-center">
          {isActive ? (
            <span
              className="inline-flex text-[var(--color-primary)]"
              title="Police active pour le PDF"
            >
              <Check
                className="h-3.5 w-3.5"
                strokeWidth={2.5}
                aria-label="Police active pour le PDF"
              />
            </span>
          ) : (
            <span
              className="text-[var(--color-muted-foreground)]/50"
              aria-hidden
            >
              ·
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
