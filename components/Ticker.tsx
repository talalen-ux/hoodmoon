"use client";

import { useMemo } from "react";
import { useStore, statusOf } from "@/lib/store";
import { usd, pct } from "@/lib/format";

/** Ticker tape: this week's prints with pool size and implied move. */
export function Ticker() {
  const { state } = useStore();

  const items = useMemo(() => {
    const rows = state.pools.map((p) => {
      const total = Object.values(p.stakes).reduce((a, b) => a + b, 0);
      return {
        symbol: p.symbol,
        total,
        iv: p.impliedVol,
        status: statusOf(p, state.now),
        move: p.actualMove,
      };
    });
    return rows;
  }, [state.pools, state.now]);

  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-edge bg-surface">
      <div className="flex w-max animate-marquee items-center gap-6 py-2">
        {doubled.map((it, i) => (
          <span key={`${it.symbol}-${i}`} className="flex items-center gap-2 whitespace-nowrap text-xs">
            <span className="font-mono font-semibold text-foreground">{it.symbol}</span>
            {it.status === "settled" && it.move !== undefined ? (
              <span className={`font-mono ${it.move >= 0 ? "text-up" : "text-down"}`}>{pct(it.move)}</span>
            ) : (
              <span className="font-mono text-muted">±{it.iv.toFixed(1)}%</span>
            )}
            <span className="font-mono text-muted/70 tnum">{usd(it.total)}</span>
            <span className="text-edge-strong">·</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface to-transparent" />
    </div>
  );
}
