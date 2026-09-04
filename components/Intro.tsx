"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TickerAvatar, basisColor } from "./primitives";
import { MmMark, RadarIcon } from "./icons";

type Card = { sym: string; token: string; pool: number; ref: number };

/**
 * The splash makes the argument before the app does: every card is the same
 * two numbers — what the pool says, what the stock says — and the gap between
 * them. Odd count so the arc has a clean centre.
 */
const CARDS: Card[] = [
  { sym: "COIN", token: "tCOIN", pool: 310.55, ref: 305.2 },
  { sym: "TSLA", token: "tTSLA", pool: 333.63, ref: 340.1 },
  { sym: "MU", token: "tMU", pool: 121.85, ref: 118.7 },
  { sym: "NVDA", token: "tNVDA", pool: 182.68, ref: 178.4 },
  { sym: "AAPL", token: "tAAPL", pool: 231.11, ref: 232.5 },
  { sym: "HOOD", token: "tHOOD", pool: 116.09, ref: 112.6 },
  { sym: "MARA", token: "tMARA", pool: 22.6, ref: 21.4 },
];

function StockCard({ card }: { card: Card }) {
  const b = (card.pool / card.ref - 1) * 10_000;
  const color = basisColor(b);
  const rich = b > 0;
  return (
    <div className="w-48 rounded-2xl border border-white/10 bg-elevated/90 p-3.5 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.9)] backdrop-blur">
      <div className="flex items-center gap-2.5">
        <TickerAvatar symbol={card.sym} size={32} radius={9} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="font-mono text-sm font-bold">{card.token}</p>
          <p className="truncate text-[10px] text-muted">pool vs. stock</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-muted">pool</span>
          <span className="font-mono text-sm font-semibold tnum">${card.pool.toFixed(2)}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-muted">stock</span>
          <span className="font-mono text-sm text-muted tnum">${card.ref.toFixed(2)}</span>
        </div>
      </div>

      {/* The gap, drawn */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, (Math.abs(b) / 600) * 100)}%`,
            marginLeft: rich ? "50%" : undefined,
            marginRight: rich ? undefined : "50%",
            marginInlineStart: rich ? "50%" : `${Math.max(0, 50 - (Math.abs(b) / 600) * 100)}%`,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="font-mono text-xs font-semibold" style={{ color }}>
          {b > 0 ? "+" : ""}
          {Math.round(b)} bps
        </span>
        <span className="text-[10px] uppercase tracking-wide" style={{ color }}>
          {b > 150 ? "sell it" : b < -150 ? "buy it" : "fair"}
        </span>
      </div>
    </div>
  );
}

export function Intro({ onEnter }: { onEnter: () => void }) {
  const reduce = useReducedMotion();
  const n = CARDS.length;
  const mid = (n - 1) / 2;
  const step = 15; // degrees between cards
  const R = 660; // arc pivot distance

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-bg">
      {/* Ambient light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(65% 55% at 50% 40%, rgba(0,229,154,0.12), transparent 70%), radial-gradient(45% 45% at 50% 108%, rgba(255,166,46,0.10), transparent 70%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg opacity-60" />

      {/* Fanned arc of pools, gently swaying in 3D */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: 1600 }}>
        <motion.div
          className="relative scale-[0.46] sm:scale-75 lg:scale-100"
          style={{ transformStyle: "preserve-3d" }}
          initial={reduce ? undefined : { rotateY: -16, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { rotateY: [-16, 16, -16], opacity: 1 }}
          transition={
            reduce
              ? { duration: 0.6 }
              : {
                  rotateY: { duration: 16, ease: "easeInOut", repeat: Infinity },
                  opacity: { duration: 1.2 },
                }
          }
        >
          {CARDS.map((card, i) => {
            const angle = (i - mid) * step;
            const rad = (angle * Math.PI) / 180;
            const x = Math.sin(rad) * R;
            // Dome: centre highest, edges lower. Lifted so the fan crowns the
            // wordmark instead of colliding with the sentence underneath it.
            const y = (1 - Math.cos(rad)) * R - 235;
            const depth = -Math.abs(i - mid) * 60; // outer cards pushed back
            return (
              // Outer holds the fan placement; inner motion bobs (no transform clash).
              <div
                key={card.sym}
                className="absolute left-1/2 top-1/2"
                style={{
                  transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${depth}px) rotate(${angle * 0.5}deg)`,
                }}
              >
                <motion.div
                  animate={reduce ? {} : { y: [0, i % 2 ? -12 : 12, 0] }}
                  transition={reduce ? undefined : { duration: 4.5 + (i % 3), ease: "easeInOut", repeat: Infinity }}
                >
                  <StockCard card={card} />
                </motion.div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Centre spotlight so the arc recedes behind the wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(6,9,12,0.96) 30%, rgba(6,9,12,0.72) 52%, transparent 76%)" }}
      />
      {/* Floor: the type below the wordmark always lands on clean ground. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%]"
        style={{ background: "linear-gradient(to top, #06090c 42%, rgba(6,9,12,0.86) 68%, transparent)" }}
      />

      {/* Center hero */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pt-40 text-center sm:pt-48">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent backdrop-blur">
            <RadarIcon width={13} height={13} /> the basis desk · Robinhood Chain
          </div>
          <div className="mt-6 flex items-center gap-3">
            <MmMark width={46} height={46} className="text-foreground" />
            <span className="text-5xl font-bold lowercase tracking-tight sm:text-6xl">mm</span>
          </div>
          <h2 className="mt-4 max-w-lg text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            When a pool trades{" "}
            <span className="bg-gradient-to-r from-rich to-rich-hot bg-clip-text text-transparent">
              above the stock
            </span>
            , mm sells into it.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            The profit goes to holders every 15 minutes, on-chain.
          </p>

          <motion.button
            type="button"
            onClick={onEnter}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="mt-9 rounded-full bg-accent px-10 py-3.5 text-sm font-semibold text-black shadow-[0_0_40px_-6px_rgba(0,229,154,0.6)] transition-shadow hover:shadow-[0_0_64px_-4px_rgba(0,229,154,0.85)]"
          >
            Open the book →
          </motion.button>
        </motion.div>
      </div>

      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 220px 50px rgba(3,5,7,0.92)" }}
      />
    </div>
  );
}
