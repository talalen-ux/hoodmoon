"use client";

import { useEffect, useState } from "react";
import { GRADS, type MarketStatus } from "@/lib/store";
import { poolTotal, type Bucket, type Stakes } from "@/lib/parimutuel";
import { countdown } from "@/lib/format";
import { LOGOS, BRANDS } from "@/lib/logos";
import { LockIcon, CheckIcon } from "./icons";

/** Pick black or white text for legibility on a given background hex. */
function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? "#0a120d" : "#ffffff";
}

export function TickerAvatar({
  emoji,
  grad,
  symbol,
  size = 44,
  radius = 12,
}: {
  emoji: string;
  grad: number;
  symbol?: string;
  size?: number;
  radius?: number;
}) {
  const [broken, setBroken] = useState(false);
  const logo = symbol ? LOGOS[symbol] : undefined;
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
  const brand = symbol ? BRANDS[symbol] : undefined;
  if (brand) {
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
        {symbol!.slice(0, 2)}
      </div>
    );
  }
  const [from, to] = GRADS[grad % GRADS.length];
  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(135deg, ${from}22, ${to}22)`,
        border: `1px solid ${from}44`,
        fontSize: size * 0.46,
        lineHeight: 1,
      }}
      aria-hidden
    >
      <span>{emoji}</span>
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

export function StatusPill({ status }: { status: MarketStatus }) {
  if (status === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" /> OPEN
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold">
        <LockIcon width={11} height={11} /> LOCKED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-edge bg-white/[0.03] px-2 py-0.5 text-[11px] font-semibold text-muted">
      <CheckIcon width={11} height={11} /> SETTLED
    </span>
  );
}

function dirColor(dir: string): string {
  return dir === "up"
    ? "var(--color-up)"
    : dir === "down"
      ? "var(--color-down)"
      : dir === "neutral"
        ? "var(--color-accent)"
        : "var(--color-flat)";
}

/** Stacked distribution of the pool across a market's buckets, low→high. */
export function BucketBar({
  stakes,
  buckets,
  winner,
  height = 8,
}: {
  stakes: Stakes;
  buckets: Bucket[];
  winner?: string;
  height?: number;
}) {
  const total = poolTotal(stakes) || 1;
  return (
    <div
      className="flex w-full overflow-hidden rounded-full"
      style={{ height }}
      role="img"
      aria-label="pool distribution across buckets"
    >
      {buckets.map((b) => {
        const share = (stakes[b.id] ?? 0) / total;
        const isWin = winner === b.id;
        return (
          <div
            key={b.id}
            style={{
              width: `${share * 100}%`,
              background: dirColor(b.dir),
              opacity: winner ? (isWin ? 1 : 0.22) : 0.5 + share,
              boxShadow: isWin ? `0 0 10px ${dirColor(b.dir)}` : undefined,
            }}
            className="h-full border-r border-bg/60 last:border-r-0 transition-opacity"
          />
        );
      })}
    </div>
  );
}

export function dirText(dir: string): string {
  return dir === "up"
    ? "text-up"
    : dir === "down"
      ? "text-down"
      : dir === "neutral"
        ? "text-accent"
        : "text-flat";
}
