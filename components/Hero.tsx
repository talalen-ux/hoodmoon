"use client";

import { motion } from "framer-motion";
import { OrbitalField } from "./OrbitalField";
import { EASE } from "./motion";

export function Hero() {
  return (
    <section
      id="buy"
      className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background"
    >
      <OrbitalField />

      {/* Soft green horizon glow at the base of the hero */}
      <div
        aria-hidden
        className="glow-spot pointer-events-none absolute inset-x-0 bottom-[-30%] h-[60%]"
      />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-36 text-center sm:pt-40">
        <motion.p
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          className="mb-6 rounded-full border border-edge bg-white/[0.03] px-4 py-1.5 text-xs font-medium tracking-wide text-muted"
        >
          The community token of Robinhood Chain
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          className="text-balance text-6xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-7xl md:text-8xl"
        >
          Hold Longer.
          <br />
          <span className="bg-gradient-to-r from-accent to-glow bg-clip-text text-transparent">
            Earn More.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
          className="mt-8 max-w-2xl text-balance text-base leading-relaxed text-muted sm:text-lg"
        >
          The community token of Robinhood Chain that rewards long-term holders
          through Uniswap v4 Hooks. Simply holding your tokens unlocks onchain
          rewards designed to align long-term participation with ecosystem
          growth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <motion.a
            href="#buy"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-black shadow-[0_0_32px_rgba(204,255,0,0.35)] transition-shadow duration-300 hover:shadow-[0_0_48px_rgba(204,255,0,0.55)]"
          >
            Buy HOODMOON
          </motion.a>
          <motion.a
            href="#rewards"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full border border-edge bg-white/[0.03] px-8 py-3.5 text-sm font-semibold text-foreground transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06]"
          >
            Learn About Rewards
          </motion.a>
        </motion.div>
      </div>

      {/* Fade to black at the bottom so the next section docks cleanly */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background"
      />
    </section>
  );
}
