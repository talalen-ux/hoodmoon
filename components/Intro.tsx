"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TickerAvatar } from "./primitives";
import { PrintMark, GapIcon } from "./icons";

type Card = { sym: string; co: string; px: number; chg: number };

// Cinematic deck fanned around the wordmark. Odd count → clean centre.
const CARDS: Card[] = [
  { sym: "COIN", co: "Coinbase", px: 314.6, chg: 3.1 },
  { sym: "TSLA", co: "Tesla", px: 332.3, chg: -2.3 },
  { sym: "MU", co: "Micron", px: 120.1, chg: 1.2 },
  { sym: "NVDA", co: "NVIDIA", px: 181.61, chg: 1.8 },
  { sym: "AAPL", co: "Apple", px: 231.6, chg: -0.4 },
  { sym: "HOOD", co: "Robinhood", px: 113.6, chg: 0.9 },
  { sym: "NFLX", co: "Netflix", px: 1208.5, chg: 2.4 },
];

/** Deterministic sparkline path from the symbol (no RNG → SSR-safe). */
function sparkPath(sym: string, up: boolean, w = 148, h = 40): string {
  const n = 16;
  let seed = 0;
  for (let i = 0; i < sym.length; i++) seed = (seed * 31 + sym.charCodeAt(i)) % 9973;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed % 1000) / 1000;
  };
  const pts: number[] = [];
  let v = 0.5;
  for (let i = 0; i < n; i++) {
    v += (rnd() - 0.5) * 0.26 + (up ? 0.03 : -0.03);
    v = Math.max(0.08, Math.min(0.92, v));
    pts.push(v);
  }
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${((i / (n - 1)) * w).toFixed(1)} ${(h - p * h).toFixed(1)}`)
    .join(" ");
}

function StockCard({ card }: { card: Card }) {
  const up = card.chg >= 0;
  const color = up ? "var(--color-up)" : "var(--color-down)";
  return (
    <div className="w-44 rounded-2xl border border-white/10 bg-elevated/90 p-3.5 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.9)] backdrop-blur">
      <div className="flex items-center gap-2.5">
        <TickerAvatar emoji="📈" grad={0} symbol={card.sym} size={34} radius={9} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="font-mono text-sm font-bold">{card.sym}</p>
          <p className="truncate text-[10px] text-muted">{card.co}</p>
        </div>
      </div>
      <div className="mt-2.5">
        <svg viewBox="0 0 148 40" className="h-9 w-full" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={`g-${card.sym}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.35" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${sparkPath(card.sym, up)} L 148 40 L 0 40 Z`} fill={`url(#g-${card.sym})`} stroke="none" />
          <path d={sparkPath(card.sym, up)} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between">
        <span className="font-mono text-sm font-semibold">${card.px.toFixed(2)}</span>
        <span className="font-mono text-xs font-semibold" style={{ color }}>
          {up ? "▲" : "▼"} {up ? "+" : ""}
          {card.chg.toFixed(1)}%
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
      {/* Ambient cinematic light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(65% 55% at 50% 40%, rgba(39,238,68,0.12), transparent 70%), radial-gradient(45% 45% at 50% 108%, rgba(36,59,46,0.7), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ background: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "42px 42px" }}
      />

      {/* Fanned arc of stock cards, gently swaying in 3D */}
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
            const y = (1 - Math.cos(rad)) * R; // dome: centre highest, edges lower
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
        className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(7,9,13,0.97) 32%, rgba(7,9,13,0.6) 55%, transparent 74%)" }}
      />

      {/* Center hero */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent backdrop-blur">
            <GapIcon width={13} height={13} /> the daily gap · Robinhood Chain
          </div>
          <div className="mt-6 flex items-center gap-3">
            <PrintMark width={44} height={44} className="text-foreground" />
            <span className="text-5xl font-bold tracking-tight sm:text-6xl">Print</span>
          </div>
          <h2 className="mt-4 max-w-md text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            Trade the{" "}
            <span className="bg-gradient-to-r from-accent to-accent-dim bg-clip-text text-transparent">gap</span>.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Pari-mutuel markets on the seam between a 24/7 token and the 9:30 open.
          </p>

          <motion.button
            type="button"
            onClick={onEnter}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="mt-9 rounded-full bg-accent px-10 py-3.5 text-sm font-semibold text-black shadow-[0_0_40px_-6px_rgba(39,238,68,0.6)] transition-shadow hover:shadow-[0_0_64px_-4px_rgba(39,238,68,0.85)]"
          >
            Enter the floor →
          </motion.button>
        </motion.div>
      </div>

      {/* Vignette */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 220px 50px rgba(4,8,6,0.92)" }} />
    </div>
  );
}
