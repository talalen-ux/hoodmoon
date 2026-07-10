"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { SectionHeading, Stagger, StaggerItem } from "./motion";

const metrics = [
  { label: "Holders", value: 12840, prefix: "", suffix: "" },
  { label: "Market Cap", value: 4200000, prefix: "$", suffix: "" },
  { label: "24h Volume", value: 385000, prefix: "$", suffix: "" },
  { label: "Rewards Distributed", value: 1260000, prefix: "$", suffix: "" },
];

function formatCompact(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m >= 10 ? m.toFixed(1) : m.toFixed(2)}M`;
  }
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString("en-US");
}

function Counter({
  value,
  prefix,
  suffix,
}: {
  value: number;
  prefix: string;
  suffix: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const duration = 1800;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic — fast start, gentle landing
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {prefix}
      {formatCompact(display)}
      {suffix}
    </span>
  );
}

export function LiveMetrics() {
  return (
    <section aria-label="Live metrics" className="bg-background py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Live Metrics"
          title="A protocol in motion."
        />

        <Stagger className="mt-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {metrics.map(({ label, value, prefix, suffix }) => (
            <StaggerItem key={label}>
              <div className="flex h-full flex-col items-center gap-3 rounded-3xl border border-edge bg-card px-6 py-10 text-center">
                <span className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  <Counter value={value} prefix={prefix} suffix={suffix} />
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  {label}
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <p className="mt-8 text-center text-xs text-muted/60">
          Illustrative figures shown ahead of launch. Live onchain data will
          appear here.
        </p>
      </div>
    </section>
  );
}
