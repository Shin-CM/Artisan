"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { FadeIn } from "@/components/motion-wrapper";

const stats = [
  { value: 5, suffix: "", label: "Modèles PDF professionnels" },
  { value: 100, suffix: "%", label: "Hors ligne — vos données restent chez vous" },
  { value: 3, suffix: "", label: "Modes de tarification par article" },
  { value: 0, suffix: "€", label: "Libre et sans abonnement — MIT", prefix: true },
];

function AnimatedNumber({
  value,
  suffix,
  prefix,
}: {
  value: number;
  suffix: string;
  prefix?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (value === 0) {
      setDisplay(0);
      return;
    }
    let start = 0;
    const duration = 1200;
    const step = duration / value;
    const timer = setInterval(() => {
      start++;
      setDisplay(start);
      if (start >= value) clearInterval(timer);
    }, step);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix && suffix}
      {display}
      {!prefix && suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="rounded-2xl border border-white/[0.06] bg-surface/50 backdrop-blur-sm p-8 sm:p-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
                    <AnimatedNumber
                      value={stat.value}
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
