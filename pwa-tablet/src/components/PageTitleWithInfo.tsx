import * as React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

export function PageTitleWithInfo({
  children,
  description,
  className = "",
  infoAriaLabel = "Informations sur cette page",
}: {
  children: React.ReactNode;
  description: React.ReactNode;
  className?: string;
  infoAriaLabel?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0 ${className}`}
    >
      {children}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            aria-label={infoAriaLabel}
          >
            <Info className="h-4 w-4" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          {description}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
