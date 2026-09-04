"use client";

import { useMemo } from "react";
import { useStore, poolBasis } from "@/lib/store";
import { bps } from "@/lib/format";
import { basisColor } from "./primitives";
import { stateOf } from "@/lib/basis";

/** Basis tape — every watched pool, marked against its stock, left to right. */
export function Ticker() {
  const { state } = useStore();

  const items = useMemo(
    () =>
      state.pools.map((p) => {
        const b = poolBasis(p);
        return { token: p.token, b, state: stateOf(b) };
      }),
    [state.pools]
  );

  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-edge bg-surface">
      <div className="flex w-max animate-marquee items-center gap-5 py-2">
        {doubled.map((it, i) => (
          <span key={`${it.token}-${i}`} className="flex items-center gap-2 whitespace-nowrap text-xs">
            <span className="font-mono font-semibold text-foreground">{it.token}</span>
            <span className="font-mono tnum" style={{ color: basisColor(it.b) }}>
              {bps(it.b)}
            </span>
            {it.state !== "fair" && (
              <span
                className="rounded px-1 py-px font-mono text-[9px] uppercase"
                style={{ background: `${basisColor(it.b)}1f`, color: basisColor(it.b) }}
              >
                {it.state}
              </span>
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
