import * as React from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

async function copyStringToClipboard(
  text: string,
  options: { emptyMessage: string; successMessage: string },
) {
  if (!text.trim()) {
    toast.error(options.emptyMessage);
    return;
  }
  await navigator.clipboard.writeText(text);
  toast.success(options.successMessage);
}

export function CopyCornerButton({
  getText,
  emptyCopyMessage = "Rien à copier.",
  successCopyMessage = "Copié dans le presse-papiers.",
  copyAriaLabel,
  copyTitle,
  className,
}: {
  getText: () => string;
  emptyCopyMessage?: string;
  successCopyMessage?: string;
  copyAriaLabel: string;
  copyTitle?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
        className,
      )}
      aria-label={copyAriaLabel}
      title={copyTitle ?? copyAriaLabel}
      onClick={() =>
        void copyStringToClipboard(getText(), {
          emptyMessage: emptyCopyMessage,
          successMessage: successCopyMessage,
        })
      }
    >
      <Copy className="h-4 w-4" aria-hidden />
    </Button>
  );
}

export type TextareaWithCopyButtonProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    emptyCopyMessage?: string;
    successCopyMessage?: string;
    copyButtonAriaLabel: string;
    copyButtonTitle?: string;
    wrapperClassName?: string;
  };

/**
 * Textarea avec icône de copie en haut à droite (même principe que la chaîne v1: export).
 */
export const TextareaWithCopyButton = React.forwardRef<
  HTMLTextAreaElement,
  TextareaWithCopyButtonProps
>(function TextareaWithCopyButton(
  {
    className,
    wrapperClassName,
    emptyCopyMessage = "Rien à copier.",
    successCopyMessage = "Copié dans le presse-papiers.",
    copyButtonAriaLabel,
    copyButtonTitle,
    value,
    ...rest
  },
  ref,
) {
  const str = typeof value === "string" ? value : "";
  return (
    <div className={cn("relative", wrapperClassName)}>
      <textarea
        ref={ref}
        value={value}
        className={cn(
          "w-full rounded-md border border-[var(--color-input)] py-2 pl-2 pr-10 font-mono text-xs focus:outline-none",
          className,
        )}
        {...rest}
      />
      <CopyCornerButton
        className="absolute right-1 top-1"
        getText={() => str}
        emptyCopyMessage={emptyCopyMessage}
        successCopyMessage={successCopyMessage}
        copyAriaLabel={copyButtonAriaLabel}
        copyTitle={copyButtonTitle}
      />
    </div>
  );
});
