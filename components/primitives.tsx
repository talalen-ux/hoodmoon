"use client";

import { useEffect, useState } from "react";
import { BAND_BPS } from "@/lib/basis";
import type { PoolState } from "@/lib/basis";
import { countdown } from "@/lib/format";
import { LOGOS, BRANDS } from "@/lib/logos";

/** Pick black or white text for legibility on a given background hex. */
function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? "#06090c" : "#ffffff";
}

export function TickerAvatar({
  symbol,
  size = 40,
  radius = 11,
}: {
  symbol: string;
  size?: number;
  radius?: number;
}) {
  const [broken, setBroken] = useState(false);
  const logo = LOGOS[symbol];
  if (logo && !broken) {
    return (
      <img
        src={logo}
        alt={symbol}
        width={size}
        height={size}
        onError={() => setBroken(true)}
        className="shrink-0 object-contain"
        style={{ width: size, height: size, borderRadius: radius, background: "#fff" }}
      />
    );
  }
  // Brand-colored monogram tile — a placeholder, not a logo reproduction.
  const brand = BRANDS[symbol] ?? "#2a3540";
  return (
    <div
      className="flex shrink-0 items-center justify-center font-mono font-bold"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: brand,
        color: readableOn(brand),
        fontSize: size * 0.34,
        letterSpacing: "-0.02em",
      }}
      aria-hidden
    >
      {symbol.slice(0, 2)}
    </div>
  );
}

/** Self-ticking countdown to a target timestamp. */
export function Countdown({ target, className }: { target: number; className?: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className={className}>{countdown(target - Date.now())}</span>;
}

// ── Basis presentation ──────────────────────────────────────────────────────

/** How rich is rich. Past 400 bps the pool is properly dislocated. */
export function basisColor(b: number): string {
  if (b >= 400) return "var(--color-rich-hot)";
  if (b >= BAND_BPS) return "var(--color-rich)";
  if (b <= -BAND_BPS) return "var(--color-cheap)";
  return "var(--color-fair)";
}

export function basisTextClass(b: number): string {
  if (b >= 400) return "text-rich-hot";
  if (b >= BAND_BPS) return "text-rich";
  if (b <= -BAND_BPS) return "text-cheap";
  return "text-fair";
}

const STATE_COPY: Record<PoolState, { label: string; note: string }> = {
  rich: { label: "RICH", note: "pool above the stock — mm sells into it" },
  cheap: { label: "CHEAP", note: "pool below the stock — mm buys out of it" },
  fair: { label: "FAIR", note: "inside the band — nothing to do" },
};

export function StatePill({ state, size = "md" }: { state: PoolState; size?: "sm" | "md" }) {
  const c = STATE_COPY[state];
  const color =
    state === "rich" ? "var(--color-rich)" : state === "cheap" ? "var(--color-cheap)" : "var(--color-fair)";
  const pad = size === "sm" ? "px-1.5 py-px text-[10px]" : "px-2 py-0.5 text-[11px]";
  return (
    <span
      title={c.note}
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${pad}`}
      style={{ borderColor: `${color}44`, background: `${color}14`, color }}
    >
      {state !== "fair" && (
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full" style={{ background: color }} />
      )}
      {c.label}
    </span>
  );
}

/**
 * Where the pool sits relative to the stock, on a fixed ±600 bps scale.
 * The shaded middle is the no-trade band; a marker outside it is money.
 */
export function BasisGauge({
  bps,
  height = 10,
  scale = 600,
  showBand = true,
}: {
  bps: number;
  height?: number;
  scale?: number;
  showBand?: boolean;
}) {
  const clamped = Math.max(-scale, Math.min(scale, bps));
  const pos = ((clamped + scale) / (2 * scale)) * 100;
  const bandW = (BAND_BPS / scale) * 50;
  const color = basisColor(bps);
  return (
    <div
      className="relative w-full overflow-hidden rounded-full bg-white/[0.045]"
      style={{ height }}
      role="img"
      aria-label={`${Math.round(bps)} basis points versus the stock`}
    >
      {/* cheap ← | → rich, tinted so the direction reads without a legend */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(77,163,255,0.22), rgba(125,143,155,0.05) 40%, rgba(125,143,155,0.05) 60%, rgba(255,166,46,0.22))",
        }}
      />
      {showBand && (
        <div
          aria-hidden
          className="absolute inset-y-0 border-x border-dashed border-white/15 bg-white/[0.03]"
          style={{ left: `${50 - bandW}%`, width: `${bandW * 2}%` }}
        />
      )}
      <div aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/25" />
      <div
        aria-hidden
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500"
        style={{
          left: `${pos}%`,
          width: height + 2,
          height: height + 2,
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
    </div>
  );
}

/** Recent basis, in bps, with the fair line drawn through it. */
export function BasisSpark({
  history,
  width = 160,
  height = 40,
  scale,
}: {
  history: number[];
  width?: number;
  height?: number;
  scale?: number;
}) {
  if (history.length < 2) return <div style={{ width, height }} />;
  const span = scale ?? Math.max(200, ...history.map((h) => Math.abs(h) * 1.15));
  const y = (v: number) => height / 2 - (Math.max(-span, Math.min(span, v)) / span) * (height / 2 - 2);
  const x = (i: number) => (i / (history.length - 1)) * width;
  const d = history.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const last = history[history.length - 1];
  const color = basisColor(last);
  const bandTop = y(BAND_BPS);
  const bandBottom = y(-BAND_BPS);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="overflow-visible">
      <rect x={0} y={bandTop} width={width} height={bandBottom - bandTop} fill="rgba(125,143,155,0.09)" />
      <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.18)" strokeDasharray="2 3" />
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(history.length - 1)} cy={y(last)} r={2.4} fill={color} />
    </svg>
  );
}

/** A labelled figure. The workhorse of every panel on the site. */
export function Stat({
  label,
  value,
  sub,
  tone = "default",
  mono = true,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "accent" | "rich" | "muted";
  mono?: boolean;
}) {
  const cls =
    tone === "accent"
      ? "text-accent"
      : tone === "rich"
        ? "text-rich"
        : tone === "muted"
          ? "text-muted"
          : "text-foreground";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tnum ${mono ? "font-mono" : ""} ${cls}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-edge bg-card ${className}`}>{children}</div>
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
