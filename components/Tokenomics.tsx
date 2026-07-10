"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SectionHeading, Stagger, StaggerItem } from "./motion";

const allocations = [
  {
    label: "Liquidity",
    pct: 40,
    body: "Seeded into the Hook-enabled Uniswap v4 pool.",
  },
  {
    label: "Community Allocation",
    pct: 30,
    body: "Reserved for holders, rewards, and community programs.",
  },
  {
    label: "Development",
    pct: 15,
    body: "Funds ongoing protocol and Hook development.",
  },
  {
    label: "Treasury",
    pct: 15,
    body: "A transparent onchain reserve for long-term growth.",
  },
];

const RADIUS = 34;
const CIRC = 2 * Math.PI * RADIUS;

function ProgressRing({ pct }: { pct: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
        />
        <motion.circle
          cx="40"
          cy="40"
          r={RADIUS}
          fill="none"
          stroke="#00C805"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{
            strokeDashoffset: reduce ? CIRC * (1 - pct / 100) : CIRC,
          }}
          whileInView={{ strokeDashoffset: CIRC * (1 - pct / 100) }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-foreground">
        {pct}%
      </span>
    </div>
  );
}

export function Tokenomics() {
  return (
    <section id="tokenomics" className="bg-surface py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Tokenomics"
          title="Simple, transparent, sustainable."
          lede="A fixed supply with allocations designed to strengthen liquidity and reward the community that holds it."
        />

        {/* Supply headline card */}
        <Stagger className="mt-16">
          <StaggerItem>
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-edge bg-card px-8 py-10 text-center">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                Total Supply
              </span>
              <span className="bg-gradient-to-r from-accent to-glow bg-clip-text font-mono text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
                1,000,000,000
              </span>
              <span className="text-sm text-muted">
                HOODMOON — fixed forever, no inflation
              </span>
            </div>
          </StaggerItem>
        </Stagger>

        <Stagger className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {allocations.map(({ label, pct, body }) => (
            <StaggerItem key={label}>
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="flex h-full flex-col items-center gap-4 rounded-3xl border border-edge bg-card p-8 text-center transition-colors duration-500 hover:border-accent/30"
              >
                <ProgressRing pct={pct} />
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {label}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{body}</p>
              </motion.article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
