"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TideMark, TideIcon } from "./icons";

/**
 * The splash is one honest bin chart.
 *
 * Cyan bars are USDC waiting below the price, violet are the token sitting
 * above it, and the bright one in the middle is where trading is happening.
 * That picture is the entire product, so it goes first — before any claim
 * about yield.
 */
const BARS = [
  0.28, 0.36, 0.44, 0.53, 0.62, 0.71, 0.8, 0.88, 0.94, 0.98, 1, 0.98, 0.94, 0.88, 0.8, 0.71,
  0.62, 0.53, 0.44, 0.36, 0.28,
];
const ACTIVE = 10;

export function Intro({ onEnter }: { onEnter: () => void }) {
  const reduce = useReducedMotion();

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 42%, rgba(168,85,247,0.16), transparent 70%), radial-gradient(45% 40% at 50% 100%, rgba(34,211,238,0.10), transparent 70%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg opacity-60" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full max-w-lg flex-col items-center"
        >
          <div className="flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-soft backdrop-blur">
            <TideIcon width={13} height={13} /> memecoin liquidity · Robinhood Chain
          </div>

          <div className="mt-7 flex items-center gap-3">
            <TideMark width={44} height={44} className="text-foreground" />
            <span className="text-5xl font-bold lowercase tracking-tight sm:text-6xl">tide</span>
          </div>

          {/* The bins */}
          <div className="mt-10 flex h-28 w-full items-end justify-center gap-1.5">
            {BARS.map((h, i) => {
              const isActive = i === ACTIVE;
              const color = isActive
                ? "var(--color-foreground)"
                : i < ACTIVE
                  ? "var(--color-quote)"
                  : "var(--color-base)";
              return (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{ background: color, maxWidth: 18 }}
                  initial={reduce ? { height: `${h * 100}%` } : { height: 0 }}
                  animate={{ height: `${h * 100}%` }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { duration: 0.7, delay: 0.25 + Math.abs(i - ACTIVE) * 0.035, ease: [0.16, 1, 0.3, 1] }
                  }
                />
              );
            })}
          </div>
          <div className="mt-2 flex w-full justify-between px-1 font-mono text-[10px] text-muted">
            <span className="text-quote">USDC below</span>
            <span className="text-foreground">price</span>
            <span style={{ color: "var(--color-base)" }}>token above</span>
          </div>

          <h2 className="mt-9 text-2xl font-semibold leading-tight sm:text-3xl">
            LP the memecoins{" "}
            <span className="bg-gradient-to-r from-accent-soft to-quote bg-clip-text text-transparent">
              without the guesswork
            </span>
            .
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            One tap to a position. One number that tells you whether you actually
            beat holding.
          </p>

          <motion.button
            type="button"
            onClick={onEnter}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="mt-9 rounded-full bg-accent px-10 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_-6px_rgba(168,85,247,0.7)] transition-shadow hover:shadow-[0_0_64px_-4px_rgba(168,85,247,0.9)]"
          >
            Open the pools →
          </motion.button>
        </motion.div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 220px 50px rgba(5,4,10,0.9)" }}
      />
    </div>
  );
}
