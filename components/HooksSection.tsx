"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SectionHeading, FadeIn, EASE } from "./motion";

const stages = [
  {
    title: "Liquidity Pool",
    body: "HOODMOON trades in a Uniswap v4 pool with custom logic attached.",
  },
  {
    title: "Hook Logic",
    body: "Hooks run at key moments of every swap, executing HoodMoon's reward rules.",
  },
  {
    title: "Reward Distribution",
    body: "The protocol allocates rewards transparently, entirely onchain.",
  },
  {
    title: "Holder",
    body: "Long-term holders receive rewards — no staking or claiming rituals.",
  },
];

export function HooksSection() {
  const reduce = useReducedMotion();

  return (
    <section id="hooks" className="relative overflow-hidden bg-background py-28 sm:py-36">
      {/* Ambient glow behind the diagram */}
      <div
        aria-hidden
        className="glow-spot pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="The Technology"
          title="Powered by Uniswap v4 Hooks"
          lede="Hooks make liquidity pools programmable. Custom logic runs directly inside the pool, enabling reward mechanics and onchain experiences that weren't possible before."
        />

        {/* Diagram: four connected stages with a flowing pulse */}
        <FadeIn className="mt-16" delay={0.15}>
          <div className="relative grid gap-6 lg:grid-cols-4">
            {stages.map((stage, i) => (
              <div key={stage.title} className="relative flex lg:flex-col">
                {/* Connector spanning the grid gap (desktop: horizontal, mobile: vertical) */}
                {i < stages.length - 1 && (
                  <>
                    <div
                      aria-hidden
                      className="absolute -bottom-6 left-1/2 h-6 w-px -translate-x-1/2 bg-gradient-to-b from-accent/50 to-accent/15 lg:hidden"
                    />
                    <div
                      aria-hidden
                      className="absolute -right-6 top-1/2 hidden h-px w-6 lg:block"
                    >
                      <div className="h-full w-full bg-gradient-to-r from-accent/50 to-accent/15" />
                      {!reduce && (
                        <motion.div
                          className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-glow shadow-[0_0_8px_rgba(229,255,102,0.8)]"
                          animate={{ left: ["-10%", "110%"], opacity: [0, 1, 0] }}
                          transition={{
                            duration: 1.6,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: "easeInOut",
                          }}
                        />
                      )}
                    </div>
                  </>
                )}

                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="relative flex h-full w-full flex-col gap-3 rounded-3xl border border-edge bg-card p-6 transition-colors duration-500 hover:border-accent/30"
                >
                  <span className="font-mono text-[11px] tracking-widest text-accent/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    {stage.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">
                    {stage.body}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.3} className="mt-12 text-center">
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted">
            Because the logic lives inside the pool itself, rewards require no
            intermediaries, no manual claims, and no trust in offchain
            infrastructure.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
