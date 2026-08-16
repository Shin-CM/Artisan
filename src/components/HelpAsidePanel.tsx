import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type HelpAsideSection = {
  title: string;
  items: { label: string; body: ReactNode }[];
};

export function HelpAsidePanel({
  ariaLabel,
  sections,
  className,
}: {
  ariaLabel: string;
  sections: HelpAsideSection[];
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "min-h-0 w-72 shrink-0 overflow-y-auto border-l border-[var(--color-border)] pl-5 text-xs",
        className,
      )}
      aria-label={ariaLabel}
    >
      <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        Aide
      </p>
      <div className="space-y-5 text-[var(--color-foreground)]">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-2 text-sm font-semibold">{section.title}</h2>
            <dl className="space-y-3">
              {section.items.map((item) => (
                <div key={item.label}>
                  <dt className="font-medium text-[var(--color-foreground)]">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 leading-snug text-[var(--color-muted-foreground)]">
                    {item.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </aside>
  );
}
