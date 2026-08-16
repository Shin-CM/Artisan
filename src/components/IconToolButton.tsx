import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function IconToolButton({
  label,
  children,
  onClick,
  active,
  tooltipSide = "bottom",
  ...rest
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  tooltipSide?: React.ComponentProps<typeof TooltipContent>["side"];
} & Omit<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={active ? "secondary" : "ghost"}
          size="icon"
          aria-label={label}
          onClick={onClick}
          {...rest}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}
