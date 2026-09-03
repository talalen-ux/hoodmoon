"use client";

import { motion } from "framer-motion";
import { type Market, statusOf } from "@/lib/store";
import { poolTotal, impliedProb } from "@/lib/parimutuel";
import { usd, pct } from "@/lib/format";
import { TickerAvatar, StatusPill, BucketBar, Countdown, dirText } from "./primitives";

/** Format the settled metric per kind (breadth is a count, others are %). */
function metricText(m: Market): string {
  if (m.metric === undefined) return "";
  if (m.kind === "breadth") return `${m.metric} green`;
  if (m.kind === "macro") return `${m.metric}%`;
  return pct(m.metric);
}

export function MarketCard({ market, now, onOpen }: { market: Market; now: number; onOpen: () => void }) {
  const status = statusOf(market, now);
  const total = poolTotal(market.stakes);

  const favId =
    status === "settled" && market.winner
      ? market.winner
      : market.buckets.reduce(
          (a, b) => (impliedProb(market.stakes, b.id) > impliedProb(market.stakes, a.id) ? b : a),
          market.buckets[0]
        ).id;
  const fav = market.buckets.find((b) => b.id === favId)!;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group flex flex-col gap-3 rounded-xl border border-edge bg-card p-4 text-left transition-colors hover:border-edge-strong"
    >
      <div className="flex items-center gap-3">
        <TickerAvatar emoji={market.emoji} grad={market.grad} symbol={market.symbol} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[15px] font-bold">{market.symbol}</span>
            <span className="truncate text-xs text-muted">{market.name}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">{market.metricLabel}</p>
        </div>
        <StatusPill status={status} />
      </div>

      <BucketBar stakes={market.stakes} buckets={market.buckets} winner={market.winner} />

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] text-muted">pool</p>
          <p className="font-mono text-sm font-semibold tnum">{usd(total)}</p>
        </div>
        {status === "settled" && market.metric !== undefined ? (
          <div className="text-right">
            <p className="text-[11px] text-muted">settled</p>
            <p
              className={`font-mono text-sm font-semibold ${
                market.kind === "breadth" || market.kind === "macro"
                  ? "text-foreground"
                  : market.metric >= 0
                    ? "text-up"
                    : "text-down"
              }`}
            >
              {metricText(market)}
            </p>
          </div>
        ) : status === "open" ? (
          <div className="text-right">
            <p className="text-[11px] text-muted">closes in</p>
            <p className="font-mono text-sm font-semibold text-accent tnum">
              <Countdown target={market.closeTime} />
            </p>
          </div>
        ) : (
          <div className="text-right">
            <p className="text-[11px] text-muted">settles in</p>
            <p className="font-mono text-sm font-semibold text-gold tnum">
              <Countdown target={market.settleTime} />
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-edge pt-2 text-[11px]">
        <span className="text-muted">{status === "settled" ? "winning bucket" : "crowd favorite"}</span>
        <span className={`font-mono font-semibold ${dirText(fav.dir)}`}>
          {fav.short} · {status === "settled" ? "won" : `${Math.round(impliedProb(market.stakes, favId) * 100)}%`}
        </span>
      </div>
    </motion.button>
  );
}
