"use client";

import { motion } from "framer-motion";
import { type Pool, statusOf } from "@/lib/store";
import { BUCKETS, poolTotal, impliedProb, bucketForMove } from "@/lib/parimutuel";
import { usd, pct, clockLabel } from "@/lib/format";
import { TickerAvatar, StatusPill, BucketBar, Countdown } from "./primitives";

export function PoolCard({ pool, now, onOpen }: { pool: Pool; now: number; onOpen: () => void }) {
  const status = statusOf(pool, now);
  const total = poolTotal(pool.stakes);

  // Favorite bucket (highest crowd prob), or the winner if settled.
  const favId =
    status === "settled" && pool.winner
      ? pool.winner
      : BUCKETS.reduce((a, b) => (impliedProb(pool.stakes, b.id) > impliedProb(pool.stakes, a.id) ? b : a), BUCKETS[3]).id;
  const fav = BUCKETS.find((b) => b.id === favId)!;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group flex flex-col gap-3 rounded-xl border border-edge bg-card p-4 text-left transition-colors hover:border-edge-strong"
    >
      <div className="flex items-center gap-3">
        <TickerAvatar emoji={pool.emoji} grad={pool.grad} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[15px] font-bold">{pool.symbol}</span>
            <span className="truncate text-xs text-muted">{pool.company}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            prints {clockLabel(pool.printTime)}
          </p>
        </div>
        <StatusPill status={status} />
      </div>

      <BucketBar stakes={pool.stakes} winner={pool.winner} />

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] text-muted">pool</p>
          <p className="font-mono text-sm font-semibold tnum">{usd(total)}</p>
        </div>
        {status === "settled" && pool.actualMove !== undefined ? (
          <div className="text-right">
            <p className="text-[11px] text-muted">printed</p>
            <p className={`font-mono text-sm font-semibold ${pool.actualMove >= 0 ? "text-up" : "text-down"}`}>
              {pct(pool.actualMove)}
            </p>
          </div>
        ) : status === "open" ? (
          <div className="text-right">
            <p className="text-[11px] text-muted">closes in</p>
            <p className="font-mono text-sm font-semibold text-accent tnum">
              <Countdown target={pool.closeTime} />
            </p>
          </div>
        ) : (
          <div className="text-right">
            <p className="text-[11px] text-muted">{status === "locked" ? "prints in" : "settles in"}</p>
            <p className="font-mono text-sm font-semibold text-gold tnum">
              <Countdown target={status === "locked" ? pool.printTime : pool.settleTime} />
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-edge pt-2 text-[11px]">
        <span className="text-muted">{status === "settled" ? "winning bucket" : "crowd favorite"}</span>
        <span
          className={`font-mono font-semibold ${
            fav.dir === "up" ? "text-up" : fav.dir === "down" ? "text-down" : "text-flat"
          }`}
        >
          {fav.short} · {status === "settled" ? "won" : `${Math.round(impliedProb(pool.stakes, favId) * 100)}%`}
        </span>
      </div>
    </motion.button>
  );
}
