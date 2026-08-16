"use client";

import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PlatformCardProps {
  name: string;
  icon: React.ReactNode;
  format: string;
  size: string;
  downloadUrl: string;
  recommended?: boolean;
  requirements: string[];
}

export function PlatformCard({
  name,
  icon,
  format,
  size,
  downloadUrl,
  recommended,
  requirements,
}: PlatformCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex flex-col rounded-2xl border p-8 transition-all duration-300",
        recommended
          ? "border-primary/30 bg-surface glow-sm hover:glow-md"
          : "border-white/[0.06] bg-surface/50 hover:border-white/[0.12]"
      )}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-white border-0 px-3 py-1 text-xs font-semibold">
            Recommandé
          </Badge>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-xl",
            recommended ? "bg-primary/15" : "bg-white/[0.04]"
          )}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">{name}</h3>
          <p className="text-sm text-muted-foreground">
            {format} · {size}
          </p>
        </div>
      </div>

      <div className="mb-8 flex-1">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Configuration requise
        </h4>
        <ul className="space-y-2">
          {requirements.map((req) => (
            <li key={req} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-primary/60 shrink-0" />
              {req}
            </li>
          ))}
        </ul>
      </div>

      <a
        href={downloadUrl}
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full h-12 text-base font-medium",
          recommended
            ? "bg-primary hover:bg-primary/90 text-white glow-sm hover:glow-md transition-shadow"
            : "bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08]"
        )}
      >
        <Download className="mr-2 h-4.5 w-4.5" />
        Télécharger pour {name}
      </a>
    </motion.div>
  );
}
