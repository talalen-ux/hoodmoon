"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  binIdAt,
  binPrice,
  binProgress,
  hiBin,
  type BinLiquidity,
} from "@/lib/bins";
import { poolLiquidityInBin, type Pool } from "@/lib/store";
import { tokenMeta, QUOTE } from "@/lib/tokens";
import { price as fmtPrice, usd } from "@/lib/format";

/** Black or white text, whichever survives on a given background. */
function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? "#0a0812" : "#ffffff";
}

export function TokenAvatar({
  symbol,
  size = 36,
  radius = 999,
}: {
  symbol: string;
  size?: number;
  radius?: number;
}) {
  const m = tokenMeta(symbol);
  return (
    <div
      className="flex shrink-0 items-center justify-center font-bold"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: m.color,
        color: readableOn(m.color),
        fontSize: size * 0.38,
        letterSpacing: "-0.03em",
      }}
      aria-hidden
    >
      {symbol.slice(0, 1)}
    </div>
  );
}

// ── The bin chart ───────────────────────────────────────────────────────────

/**
 * The picture the whole product is built around.
 *
 * Each bar is one price bin. Below the current price a bin holds USDC (cyan);
 * above it, the token (violet); the bin price is standing in holds both and is
 * drawn bright. Where a position is supplied, its own liquidity is overlaid
 * inside the pool's bars — so "am I in range, and how much of this pool is
 * actually mine" is answered by looking, not by reading a number.
 */
export function BinChart({
  pool,
  position,
  height = 128,
  span = 34,
  showAxis = true,
  positionOnly = false,
}: {
  pool: Pool;
  position?: BinLiquidity;
  height?: number;
  span?: number;
  showAxis?: boolean;
  positionOnly?: boolean;
}) {
  const active = binIdAt(pool.price, pool.binStep);
  const tint = tokenMeta(pool.symbol).color;

  const bars = useMemo(() => {
    // Widen the window if the position reaches past the default view.
    let lo = active - span;
    let hi = active + span;
    if (position) {
      lo = Math.min(lo, position.lo - 2);
      hi = Math.max(hi, hiBin(position) + 2);
    }
    const out = [];
    for (let id = lo; id <= hi; id++) {
      const poolL = positionOnly ? 0 : poolLiquidityInBin(pool, id);
      const k = position ? id - position.lo : -1;
      const mine = position && k >= 0 && k < position.l.length ? position.l[k] : 0;
      out.push({ id, poolL, mine });
    }
    return out;
  }, [pool, position, active, span, positionOnly]);

  // Two scales, deliberately. Pool depth is context and your position is the
  // subject; drawn on one shared axis a retail-sized position against a
  // multi-million-dollar pool is a flat line one pixel high, which tells you
  // nothing about the thing you actually came to look at — where your
  // liquidity sits. The pool keeps its own shape behind it.
  const poolMax = Math.max(...bars.map((b) => b.poolL), 1);
  const mineMax = Math.max(...bars.map((b) => b.mine), 1);
  const hasMine = bars.some((b) => b.mine > 0);
  const loPrice = binPrice(bars[0].id, pool.binStep);
  const hiPrice = binPrice(bars[bars.length - 1].id, pool.binStep);

  return (
    <div>
      <div className="flex items-end gap-px" style={{ height }} role="img"
        aria-label={`Liquidity by price bin around ${fmtPrice(pool.price)}`}>
        {bars.map((b) => {
          const isActive = b.id === active;
          const side = b.id < active ? "quote" : "base";
          const color = isActive
            ? "var(--color-foreground)"
            : side === "quote"
              ? "var(--color-quote)"
              : tint;
          const poolH = (b.poolL / poolMax) * height;
          const mineH = b.mine > 0 ? (b.mine / mineMax) * height * 0.82 : 0;
          return (
            <div key={b.id} className="relative flex-1" style={{ height }}>
              {/* The pool's own depth, receding into the background. */}
              {poolH > 0 && (
                <div
                  className="absolute bottom-0 w-full rounded-t-[2px]"
                  style={{
                    height: Math.max(1, poolH),
                    background: color,
                    // Faint behind a position so the overlay reads, but legible
                    // on its own when the chart is just showing pool depth.
                    opacity: mineH > 0 ? (isActive ? 0.36 : 0.18) : isActive ? 0.6 : 0.4,
                  }}
                />
              )}
              {/* Your share of it, solid. */}
              {mineH > 0 && (
                <div
                  className="absolute bottom-0 w-full rounded-t-[2px] transition-[height] duration-500"
                  style={{
                    height: Math.max(2, mineH),
                    background: color,
                    boxShadow: isActive ? `0 0 8px ${color}` : undefined,
                  }}
                />
              )}
              {isActive && (
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 top-0 border-x border-dashed"
                  style={{ borderColor: "rgba(238,236,247,0.28)" }}
                />
              )}
            </div>
          );
        })}
      </div>
      {showAxis && (
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted">
          <span>{fmtPrice(loPrice)}</span>
          <span className="text-foreground">{fmtPrice(pool.price)}</span>
          <span>{fmtPrice(hiPrice)}</span>
        </div>
      )}
      {hasMine && !positionOnly && (
        <p className="mt-1 text-[10px] leading-relaxed text-muted/70">
          Solid bars are your liquidity, drawn to its own scale; the faint bars
          behind are the pool&apos;s depth. Heights are not comparable between
          the two.
        </p>
      )}
    </div>
  );
}

/** Which colour means what. Shown once, near the first chart. */
export function BinLegend({ symbol }: { symbol: string }) {
  const tint = tokenMeta(symbol).color;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
      <Swatch color="var(--color-quote)" label={`${QUOTE} — bins below price`} />
      <Swatch color={tint} label={`${symbol} — bins above price`} />
      <Swatch color="var(--color-foreground)" label="the bin price is in" />
    </div>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

// ── Small pieces ────────────────────────────────────────────────────────────

export function Sparkline({
  values,
  width = 88,
  height = 26,
  color,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (values.length < 2) return <div style={{ width, height }} />;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const range = hi - lo || 1;
  const y = (v: number) => height - 2 - ((v - lo) / range) * (height - 4);
  const x = (i: number) => (i / (values.length - 1)) * width;
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const up = values[values.length - 1] >= values[0];
  const stroke = color ?? (up ? "var(--color-up)" : "var(--color-down)");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function RangePill({ inRange: ir }: { inRange: boolean }) {
  const color = ir ? "var(--color-inrange)" : "var(--color-outrange)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
      style={{ borderColor: `${color}44`, background: `${color}14`, color }}
      title={ir ? "Price is inside your range — this position is earning fees." : "Price has left your range. This position is earning nothing until it comes back."}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${ir ? "animate-pulse-dot" : ""}`}
        style={{ background: color }}
      />
      {ir ? "EARNING" : "IDLE"}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-0.5 font-mono text-lg font-semibold tnum ${className}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  );
}

export function SectionHead({
  icon,
  title,
  tag,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  tag?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          {icon}
          {title}
        </h2>
        {tag && (
          <span className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[11px] text-muted">
            {tag}
          </span>
        )}
      </div>
      {children && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

/** Colour a number by its sign, the way a PnL column should be read. */
export function signClass(n: number): string {
  return n > 0 ? "text-up" : n < 0 ? "text-down" : "text-muted";
}



/**
 * Render into `document.body`, escaping the current subtree.
 *
 * Any ancestor carrying a transform, filter or backdrop-filter becomes the
 * containing block for `position: fixed` descendants — so a modal nested
 * inside the blurred sticky header gets clipped to a 56px-tall strip instead
 * of covering the viewport. Overlays go through here so no styling decision
 * further up the tree can quietly break them.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
