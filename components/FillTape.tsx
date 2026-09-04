"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { bps, px, qty, stamp, usd, usdc, shortTx } from "@/lib/format";
import { basisColor } from "./primitives";
import { ArrowDownIcon, ArrowUpIcon, LinkIcon } from "./icons";

/**
 * Every fill mm lands, as it lands. The columns are the argument: mm sold at
 * `avg`, the stock was at `stock`, and the difference is `edge`. Nothing is
 * waiting on a price to come back.
 */
export function FillTape({ limit = 12, poolId }: { limit?: number; poolId?: string }) {
  const { state } = useStore();
  const rows = state.fills.filter((f) => !poolId || f.poolId === poolId).slice(0, limit);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-edge bg-card p-6 text-center text-sm text-muted">
        No fills yet — every pool is inside the band.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-edge bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wide text-muted">
            <th className="px-4 py-2.5 font-medium">time</th>
            <th className="px-3 py-2.5 font-medium">action</th>
            {!poolId && <th className="px-3 py-2.5 font-medium">pool</th>}
            <th className="px-3 py-2.5 text-right font-medium">size</th>
            <th className="px-3 py-2.5 text-right font-medium">avg</th>
            <th className="px-3 py-2.5 text-right font-medium">stock</th>
            <th className="px-3 py-2.5 text-right font-medium">basis</th>
            <th className="px-3 py-2.5 text-right font-medium">edge</th>
            <th className="px-4 py-2.5 text-right font-medium">tx</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((f) => {
              const sell = f.side === "sell";
              const Arrow = sell ? ArrowDownIcon : ArrowUpIcon;
              const color = sell ? "var(--color-rich)" : "var(--color-cheap)";
              return (
                <motion.tr
                  key={f.id}
                  layout
                  initial={{ opacity: 0, backgroundColor: "rgba(0,229,154,0.14)" }}
                  animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="border-b border-edge/60 last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-muted tnum">
                    {stamp(f.ts)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex items-center gap-1 font-mono text-xs font-semibold"
                      style={{ color }}
                    >
                      <Arrow width={12} height={12} />
                      {sell ? "SOLD" : "BOUGHT"}
                    </span>
                  </td>
                  {!poolId && (
                    <td className="px-3 py-2.5 font-mono text-xs font-semibold">{f.token}</td>
                  )}
                  <td className="px-3 py-2.5 text-right font-mono text-xs tnum">
                    {qty(f.qty)}
                    <span className="ml-1 text-muted">({usd(f.notional)})</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs tnum">{px(f.avgPx)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-muted tnum">
                    {px(f.ref)}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right font-mono text-xs tnum"
                    style={{ color: basisColor(f.bps) }}
                    title={`pushed to ${Math.round(f.bpsAfter)} bps`}
                  >
                    {bps(f.bps)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold text-accent tnum">
                    +{usdc(f.net)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted">
                      <LinkIcon width={11} height={11} />
                      {shortTx(f.tx)}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
