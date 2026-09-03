"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useStore, statusOf, type Pool } from "@/lib/store";
import {
  BUCKETS,
  poolTotal,
  impliedProb,
  payoutMultiple,
  quote,
  settlePayout,
} from "@/lib/parimutuel";
import { usd, usdFull, pct, mult, prob, clockLabel, timeAgo, shortAddr } from "@/lib/format";
import { TickerAvatar, StatusPill, BucketBar, Countdown } from "./primitives";
import { BackIcon, LockIcon, BoltIcon, CheckIcon } from "./icons";

function dirText(dir: string) {
  return dir === "up" ? "text-up" : dir === "down" ? "text-down" : "text-flat";
}

export function PoolDetail({ poolId, onBack }: { poolId: string; onBack: () => void }) {
  const { state, dispatch } = useStore();
  const pool = state.pools.find((p) => p.id === poolId);
  const now = state.now;
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const total = pool ? poolTotal(pool.stakes) : 0;
  const status = pool ? statusOf(pool, now) : "open";
  const open = status === "open";
  const myPos = pool ? state.user.positions[pool.id]?.staked ?? {} : {};

  const amt = Math.max(0, Number(amount) || 0);
  const q = pool && selected ? quote(pool.stakes, selected, amt, pool.rakeBps) : null;

  const settledPnl = useMemo(() => {
    if (!pool || !pool.winner) return null;
    let staked = 0;
    let payout = 0;
    for (const [b, s] of Object.entries(myPos)) {
      staked += s;
      payout += settlePayout(pool.stakes, b, s, pool.winner, pool.rakeBps);
    }
    if (staked === 0) return null;
    return { staked, payout, pnl: payout - staked };
  }, [pool, myPos]);

  if (!pool) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted">Pool not found.</p>
        <button onClick={onBack} className="mt-4 text-accent">
          ← back to markets
        </button>
      </div>
    );
  }

  const canBet = open && state.user.connected && selected && amt > 0 && amt <= state.user.balance;

  const placeBet = () => {
    if (!canBet || !selected) return;
    dispatch({ type: "BET", poolId: pool.id, bucket: selected, amount: amt });
    setAmount("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
      >
        <BackIcon width={16} height={16} /> markets
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <TickerAvatar emoji={pool.emoji} grad={pool.grad} size={56} radius={14} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-bold">{pool.symbol}</h1>
            <span className="text-sm text-muted">{pool.company}</span>
            <StatusPill status={status} />
          </div>
          <p className="mt-1 text-xs text-muted">
            {pool.sector} · prints {clockLabel(pool.printTime)} · prev close ${pool.prevClose.toFixed(2)} · implied ±
            {pool.impliedVol.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Status strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="pool size" value={usd(total)} sub={usdFull(total)} />
        <Metric label="rake" value={`${pool.rakeBps / 100}%`} sub="house cut" />
        {status === "open" ? (
          <Metric label="closes in" value={<Countdown target={pool.closeTime} />} sub={clockLabel(pool.closeTime)} accent />
        ) : status === "settled" ? (
          <Metric
            label="printed"
            value={<span className={pool.actualMove! >= 0 ? "text-up" : "text-down"}>{pct(pool.actualMove!)}</span>}
            sub="realized move"
          />
        ) : (
          <Metric
            label={status === "locked" ? "prints in" : "settles in"}
            value={<Countdown target={status === "locked" ? pool.printTime : pool.settleTime} />}
            sub="Chainlink settle"
            gold
          />
        )}
        <Metric label="settles" value={clockLabel(pool.settleTime)} sub="print + 4h" />
      </div>

      {/* Settlement banner */}
      {status === "settled" && pool.winner && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-edge bg-card p-4">
          <CheckIcon width={18} height={18} className="text-accent" />
          <span className="text-sm">
            Settled at <span className={`font-mono font-semibold ${pool.actualMove! >= 0 ? "text-up" : "text-down"}`}>{pct(pool.actualMove!)}</span> —
            winning bucket{" "}
            <span className={`font-mono font-semibold ${dirText(BUCKETS.find((b) => b.id === pool.winner)!.dir)}`}>
              {BUCKETS.find((b) => b.id === pool.winner)!.label}
            </span>
          </span>
          {settledPnl && (
            <span className={`ml-auto font-mono text-sm font-semibold ${settledPnl.pnl >= 0 ? "text-up" : "text-down"}`}>
              your P&amp;L {settledPnl.pnl >= 0 ? "+" : ""}
              {usd(settledPnl.pnl, { cents: true })}
            </span>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Bucket ladder */}
        <div>
          <div className="mb-3">
            <BucketBar stakes={pool.stakes} winner={pool.winner} height={10} />
          </div>
          <div className="overflow-hidden rounded-xl border border-edge">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 border-b border-edge bg-white/[0.02] px-4 py-2 text-[11px] uppercase tracking-wide text-muted">
              <span>bucket</span>
              <span className="text-right">crowd</span>
              <span className="text-right">payout</span>
              <span className="text-right">your stake</span>
            </div>
            {BUCKETS.map((b) => {
              const p = impliedProb(pool.stakes, b.id);
              const m = payoutMultiple(pool.stakes, b.id, pool.rakeBps);
              const mine = myPos[b.id] ?? 0;
              const isWin = pool.winner === b.id;
              const isSel = selected === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  disabled={!open}
                  onClick={() => setSelected(b.id)}
                  className={`grid w-full grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-2 border-b border-edge px-4 py-3 text-left transition-colors last:border-b-0 ${
                    isSel ? "bg-accent/10" : "hover:bg-white/[0.02]"
                  } ${!open ? "cursor-default" : ""} ${isWin ? "bg-accent/[0.06]" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full`} style={{ background: `var(--color-${b.dir === "flat" ? "flat" : b.dir})` }} />
                    <span className={`font-mono text-sm font-medium ${dirText(b.dir)}`}>{b.label}</span>
                    {isWin && <CheckIcon width={13} height={13} className="text-accent" />}
                  </span>
                  <span className="text-right font-mono text-sm tnum">{prob(p)}</span>
                  <span className="text-right font-mono text-sm text-muted tnum">{mult(m)}</span>
                  <span className="text-right font-mono text-sm tnum">
                    {mine > 0 ? usd(mine, { cents: false }) : <span className="text-muted/40">—</span>}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live bets */}
          <div className="mt-6">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <BoltIcon width={15} height={15} className="text-accent" /> Live bets
            </h3>
            <div className="flex flex-col gap-1.5">
              {pool.bets.length === 0 && <p className="text-sm text-muted">No bets yet.</p>}
              {pool.bets.slice(0, 12).map((bet) => {
                const b = BUCKETS.find((x) => x.id === bet.bucket)!;
                return (
                  <div key={bet.id} className="flex items-center gap-3 rounded-lg border border-edge bg-card px-3 py-2 text-sm">
                    <span className="font-mono text-xs text-muted">{shortAddr(bet.bettor)}</span>
                    <span className={`font-mono text-xs font-medium ${dirText(b.dir)}`}>{b.short}</span>
                    <span className="ml-auto font-mono text-xs tnum">{usd(bet.amount)}</span>
                    <span className="w-8 text-right text-[11px] text-muted">{timeAgo(bet.ts, now)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bet panel */}
        <div className="lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-xl border border-edge bg-card p-4">
            {status === "open" ? (
              <>
                <h3 className="text-sm font-semibold">Place a bet</h3>
                <p className="mt-0.5 text-xs text-muted">
                  Closes in <Countdown target={pool.closeTime} className="font-mono text-accent" />
                </p>

                <p className="mt-4 mb-1.5 text-[11px] text-muted">1 · pick a bucket</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {BUCKETS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelected(b.id)}
                      className={`rounded-lg border px-2 py-2 text-center font-mono text-xs transition-colors ${
                        selected === b.id
                          ? "border-accent/60 bg-accent/15 text-foreground"
                          : "border-edge text-muted hover:border-edge-strong"
                      }`}
                    >
                      {b.short}
                    </button>
                  ))}
                </div>

                <p className="mb-1.5 mt-4 text-[11px] text-muted">2 · amount (USDC)</p>
                <div className="flex items-center gap-2 rounded-lg border border-edge bg-white/[0.02] px-3 py-2.5 focus-within:border-accent/50">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                    inputMode="decimal"
                    className="w-full bg-transparent font-mono text-lg outline-none tnum"
                  />
                  <span className="font-mono text-xs text-muted">USDC</span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  {[50, 250, 1000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(String(v))}
                      className="flex-1 rounded-lg border border-edge py-1.5 text-xs text-muted transition-colors hover:border-edge-strong hover:text-foreground"
                    >
                      {v}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.floor(state.user.balance)))}
                    disabled={!state.user.connected}
                    className="flex-1 rounded-lg border border-edge py-1.5 text-xs text-muted transition-colors hover:border-edge-strong hover:text-foreground disabled:opacity-40"
                  >
                    max
                  </button>
                </div>

                {q && amt > 0 && selected && (
                  <div className="mt-4 space-y-1.5 rounded-lg bg-white/[0.02] p-3 text-xs">
                    <Row label="bucket" value={<span className={dirText(BUCKETS.find((b) => b.id === selected)!.dir)}>{BUCKETS.find((b) => b.id === selected)!.label}</span>} />
                    <Row label="payout if it hits" value={<span className="text-accent">{mult(q.multiple)}</span>} />
                    <Row label="you'd receive" value={usd(q.grossIfWin, { cents: true })} />
                    <Row label="profit if win" value={<span className="text-up">+{usd(q.profitIfWin, { cents: true })}</span>} />
                    <Row label="new crowd odds" value={prob(q.newProb)} muted />
                  </div>
                )}

                <button
                  type="button"
                  onClick={placeBet}
                  disabled={!canBet}
                  className="mt-4 w-full rounded-lg bg-accent py-3 text-sm font-semibold text-black transition-shadow enabled:hover:shadow-[0_0_24px_rgba(0,230,118,0.45)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {!state.user.connected
                    ? "connect wallet to bet"
                    : !selected
                      ? "pick a bucket"
                      : amt <= 0
                        ? "enter an amount"
                        : amt > state.user.balance
                          ? "insufficient balance"
                          : `Bet ${usd(amt)} on ${BUCKETS.find((b) => b.id === selected)!.short}`}
                </button>
              </>
            ) : (
              <div className="text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-edge bg-white/[0.03]">
                  {status === "settled" ? <CheckIcon className="text-accent" /> : <LockIcon className="text-gold" />}
                </span>
                <p className="mt-3 text-sm font-semibold">
                  {status === "settled" ? "Pool settled" : status === "live" ? "Print is live" : "Betting closed"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {status === "settled"
                    ? "This pool has paid out from Chainlink Data Streams."
                    : status === "live"
                      ? "The number is out and the price is moving. Settlement lands 4 hours after the print."
                      : "The pool closed before the print. Settlement follows the number."}
                </p>
                {status !== "settled" && (
                  <p className="mt-3 font-mono text-sm text-gold tnum">
                    <Countdown target={status === "locked" ? pool.printTime : pool.settleTime} />
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Your position */}
          {Object.keys(myPos).length > 0 && (
            <div className="mt-4 rounded-xl border border-edge bg-card p-4">
              <h3 className="text-sm font-semibold">Your position</h3>
              <div className="mt-2 space-y-1.5">
                {Object.entries(myPos).map(([bid, s]) => {
                  const b = BUCKETS.find((x) => x.id === bid)!;
                  const win = pool.winner === bid;
                  return (
                    <div key={bid} className="flex items-center justify-between text-sm">
                      <span className={`font-mono text-xs ${dirText(b.dir)}`}>{b.short}</span>
                      <span className="font-mono text-xs tnum">
                        {usd(s, { cents: false })}
                        {pool.winner && (
                          <span className={win ? "text-up" : "text-down"}>
                            {" "}
                            → {usd(settlePayout(pool.stakes, bid, s, pool.winner, pool.rakeBps), { cents: false })}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  accent,
  gold,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  accent?: boolean;
  gold?: boolean;
}) {
  return (
    <div className="rounded-xl border border-edge bg-card p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`font-mono text-sm font-semibold tnum ${accent ? "text-accent" : gold ? "text-gold" : ""}`}>{value}</p>
      <p className="font-mono text-[11px] text-muted">{sub}</p>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={`font-mono ${muted ? "text-muted" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
