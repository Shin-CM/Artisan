"use client";

import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/motion-wrapper";

interface FeatureDetail {
  text: string;
}

interface FeatureSectionProps {
  id?: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  details: FeatureDetail[];
  reversed?: boolean;
  accentColor?: "violet" | "cyan";
}

export function FeatureSection({
  id,
  icon: Icon,
  title,
  subtitle,
  description,
  details,
  reversed = false,
  accentColor = "violet",
}: FeatureSectionProps) {
  const isViolet = accentColor === "violet";

  return (
    <section id={id} className="py-16 sm:py-20 scroll-mt-24">
      <div
        className={cn(
          "grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center",
          reversed && "lg:[direction:rtl] lg:*:[direction:ltr]"
        )}
      >
        <FadeIn direction={reversed ? "right" : "left"}>
          <div>
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 mb-4",
                isViolet
                  ? "border-primary/20 bg-primary/[0.06]"
                  : "border-neon-cyan/20 bg-neon-cyan/[0.06]"
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  isViolet ? "text-primary" : "text-neon-cyan"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  isViolet ? "text-primary" : "text-neon-cyan"
                )}
              >
                {subtitle}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              {title}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {description}
            </p>

            <ul className="space-y-3">
              {details.map((detail, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-2 h-1.5 w-1.5 rounded-full shrink-0",
                      isViolet ? "bg-primary" : "bg-neon-cyan"
                    )}
                  />
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    {detail.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>

        <FadeIn direction={reversed ? "left" : "right"} delay={0.15}>
          <div
            className={cn(
              "relative rounded-xl border border-white/[0.06] bg-surface/50 p-6 overflow-hidden",
              isViolet ? "glow-sm" : "glow-cyan-sm"
            )}
          >
            <div
              className={cn(
                "absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] opacity-30 pointer-events-none",
                isViolet ? "bg-primary" : "bg-neon-cyan"
              )}
            />
            <div className="relative space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3"
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-md shrink-0",
                      isViolet ? "bg-primary/20" : "bg-neon-cyan/20"
                    )}
                  />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className="h-2.5 rounded-full bg-white/[0.08]"
                      style={{ width: `${70 + i * 8}%` }}
                    />
                    <div
                      className="h-2 rounded-full bg-white/[0.04]"
                      style={{ width: `${50 + i * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
