import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useTooltipsEnabledForPrimitive } from "@/context/TooltipPreferenceContext";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const enabled = useTooltipsEnabledForPrimitive();
  if (!enabled) {
    return (
      <TooltipPrimitive.Root
        {...props}
        open={false}
        onOpenChange={() => {}}
      />
    );
  }
  return <TooltipPrimitive.Root {...props} />;
}

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-popover)] px-3 py-1.5 text-sm text-[var(--color-popover-foreground)] shadow-md animate-in fade-in-0 zoom-in-95",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
