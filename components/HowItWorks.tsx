"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SectionHeading, EASE } from "./motion";
import { WalletIcon, SwapIcon, DistributeIcon, MoonMark } from "./icons";
import type { ComponentType, SVGProps } from "react";

type Step = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
};

const steps: Step[] = [
  {
    icon: MoonMark,
    title: "Acquire HOODMOON",
    body: "Swap for HOODMOON on Robinhood Chain through the Hook-enabled pool.",
  },
  {
    icon: WalletIcon,
    title: "Hold in your wallet",
    body: "No staking, no lockups. Your tokens stay in your wallet, fully in your control.",
  },
  {
    icon: SwapIcon,
    title: "Eligible trades interact with the Hook-enabled liquidity pool",
    body: "Every qualifying swap flows through custom Hook logic embedded in the pool itself.",
  },
  {
    icon: DistributeIcon,
    title: "Rewards are distributed according to the protocol's rules",
    body: "Reward logic executes onchain — transparent, automatic, and verifiable by anyone.",
  },
];

export function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section id="how-it-works" className="bg-surface py-28 sm:py-36">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading
          eyebrow="How Rewards Work"
          title="From wallet to reward, entirely onchain."
          lede="A simple flow with no extra steps for holders — the protocol does the work."
        />

        <div className="relative mt-20">
          {/* Flowing connector line, drawn as the timeline scrolls into view */}
          <motion.div
            aria-hidden
            className="absolute left-6 top-0 h-full w-px origin-top bg-gradient-to-b from-transparent via-accent/40 to-transparent sm:left-7"
            initial={{ scaleY: reduce ? 1 : 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.6, ease: EASE }}
          />

          <ol className="flex flex-col gap-14">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <motion.li
                key={title}
                initial={
                  reduce
                    ? { opacity: 0 }
                    : { opacity: 0, x: -24, filter: "blur(6px)" }
                }
                whileInView={
                  reduce
                    ? { opacity: 1 }
                    : { opacity: 1, x: 0, filter: "blur(0px)" }
                }
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
                className="relative flex items-start gap-6 pl-0"
              >
                {/* Glowing node */}
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-background text-accent shadow-[0_0_20px_rgba(204,255,0,0.25)] sm:h-14 sm:w-14">
                  <Icon width={22} height={22} />
                </span>
                <div className="pt-1.5">
                  <span className="font-mono text-xs tracking-widest text-accent/70">
                    STEP {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    {title}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                    {body}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
