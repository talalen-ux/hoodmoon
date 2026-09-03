"use client";

import { useMemo } from "react";
import { useStore, statusOf } from "@/lib/store";
import { poolTotal } from "@/lib/parimutuel";
import { usd, pct } from "@/lib/format";

const KIND_SHORT: Record<string, string> = {
  gap: "GAP",
  close: "CLOSE",
  round: "RND",
  breadth: "BRDTH",
  macro: "MACRO",
  earnings: "ERN",
};

/** Ticker tape across all live markets. */
export function Ticker() {
  const { state } = useStore();

  const items = useMemo(
    () =>
      state.markets.map((m) => ({
        symbol: m.symbol,
        kind: m.kind,
        total: poolTotal(m.stakes),
        status: statusOf(m, state.now),
        metric: m.metric,
      })),
    [state.markets, state.now]
  );

  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-edge bg-surface">
      <div className="flex w-max animate-marquee items-center gap-5 py-2">
        {doubled.map((it, i) => (
          <span key={`${it.symbol}-${i}`} className="flex items-center gap-2 whitespace-nowrap text-xs">
            <span className="rounded bg-white/[0.05] px-1 py-px font-mono text-[9px] text-muted">
              {KIND_SHORT[it.kind]}
            </span>
            <span className="font-mono font-semibold text-foreground">{it.symbol}</span>
            {it.status === "settled" && it.metric !== undefined ? (
              <span className={`font-mono ${it.kind === "breadth" || it.kind === "macro" ? "text-muted" : it.metric >= 0 ? "text-up" : "text-down"}`}>
                {it.kind === "breadth" ? `${it.metric}g` : it.kind === "macro" ? `${it.metric}%` : pct(it.metric)}
              </span>
            ) : (
              <span className="font-mono text-muted/70 tnum">{usd(it.total)}</span>
            )}
            <span className="text-edge-strong">·</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface to-transparent" />
    </div>
  );
}
