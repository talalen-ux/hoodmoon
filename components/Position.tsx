"use client";

import { motion } from "framer-motion";
import {
  useStore,
  positionPnl,
  presetById,
  simAge,
  timeInRange,
  poolLiquidityInBin,
  type Position,
  type Pool,
} from "@/lib/store";
import { feeReturn, inRange, holdingsAt, binIdAt } from "@/lib/bins";
import { amount, bigPct, duration, pct, price as fmtPrice, signedUsd, usdc } from "@/lib/format";
import { QUOTE, tokenMeta } from "@/lib/tokens";
import { BinChart, RangePill, TokenAvatar, signClass } from "./primitives";
import { AlertIcon, BoltIcon, ClockIcon, InfoIcon } from "./icons";

/**
 * The panel this product exists for.
 *
 * Every LP interface shows fees earned, and most stop there. Fees are the
 * flattering half of the story: a position can collect them steadily and
 * still be worth less than the tokens it was built from, because the pool
 * sold the winner on the way up and bought the loser all the way down.
 *
 * So the ladder is laid out in the order that makes it impossible to miss —
 * what you earned, what the curve took, what the rebalancing cost, and the
 * one line that nets them: whether providing liquidity beat doing nothing.
 * Price movement is deliberately quarantined below it, because a token that
 * doubled will paint a green total over a position that badly lost to hold.
 */
export function PnlPanel({ position, pool }: { position: Position; pool: Pool }) {
  const p = positionPnl(position, pool.price);
  const beat = p.netVsHold >= 0;

  return (
    <div className="rounded-xl border border-edge bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-accent-soft">
        <InfoIcon width={14} height={14} /> POSITION P&amp;L
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-sm text-muted">Position value now</span>
        <span className="font-mono text-xl font-semibold tnum">{usdc(p.currentValue)}</span>
      </div>

      <dl className="mt-4 space-y-2 border-t border-edge pt-3">
        <Row k="Fees earned" v={signedUsd(p.fees)} cls="text-up" />
        <Row
          k="Impermanent loss"
          v={signedUsd(p.impermanentLoss)}
          cls={signClass(p.impermanentLoss)}
          hint="What the pool's rebalancing cost you: it sold the token as price rose and bought it as price fell. Unavoidable for any LP, and larger the tighter your range."
        />
        {p.costs > 0 && (
          <Row
            k="Entry &amp; rebalance costs"
            v={signedUsd(-p.costs)}
            cls="text-down"
            hint="Swap fees and gas paid to open the position and to recenter it each time price left your range."
          />
        )}
      </dl>

      {/* The answer. */}
      <div
        className="mt-4 rounded-lg border p-4"
        style={{
          borderColor: beat ? "rgba(52,211,153,0.28)" : "rgba(251,113,133,0.28)",
          background: beat ? "rgba(52,211,153,0.07)" : "rgba(251,113,133,0.07)",
        }}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold">Net vs. just holding</span>
          <span className={`font-mono text-2xl font-bold tnum ${signClass(p.netVsHold)}`}>
            {signedUsd(p.netVsHold)}
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          {beat ? (
            <>
              Fees have more than covered the impermanent loss and costs. You are{" "}
              <span className="text-up">{usdc(Math.abs(p.netVsHold))}</span> ahead of where
              you would be if you had simply held the two tokens.
            </>
          ) : (
            <>
              Fees have not covered the impermanent loss and costs. You would have{" "}
              <span className="text-down">{usdc(Math.abs(p.netVsHold))}</span> more right now
              if you had simply held the two tokens and never provided liquidity.
            </>
          )}{" "}
          ({pct(p.netVsHoldPct)} of what you put in.)
        </p>
      </div>

      {/* Price is real money, but it is not a verdict on the LP decision. */}
      <dl className="mt-4 space-y-2 border-t border-edge pt-3">
        <Row
          k="Price movement"
          v={signedUsd(p.pricePnl)}
          cls={signClass(p.pricePnl)}
          hint="What your deposited tokens did on their own. You would have had this whether or not you provided liquidity — it says nothing about whether LPing was the right call."
        />
        <div className="flex items-center justify-between border-t border-edge pt-2">
          <dt className="text-sm font-semibold">Total P&amp;L</dt>
          <dd className={`font-mono text-lg font-bold tnum ${signClass(p.total)}`}>
            {signedUsd(p.total)}{" "}
            <span className="text-xs font-normal text-muted">({pct(p.totalPct)})</span>
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        Deposited {usdc(p.entryValue)} at {fmtPrice(position.entryPrice)}. Holding those same
        tokens instead would be worth {usdc(p.holdValue)} today.
      </p>
    </div>
  );
}

function Row({
  k,
  v,
  cls = "",
  hint,
}: {
  k: string;
  v: string;
  cls?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-sm text-muted">
        <span dangerouslySetInnerHTML={{ __html: k }} />
        {hint && (
          <span title={hint} className="cursor-help text-muted/60">
            <InfoIcon width={12} height={12} />
          </span>
        )}
      </dt>
      <dd className={`font-mono text-sm tnum ${cls}`}>{v}</dd>
    </div>
  );
}

/** One position, summarised. The bin chart carries most of the meaning. */
export function PositionCard({
  position,
  pool,
  now,
  onOpen,
}: {
  position: Position;
  pool: Pool;
  now: number;
  onOpen: () => void;
}) {
  const preset = presetById(position.preset);
  const p = positionPnl(position, pool.price);
  const live = inRange(position.bins, pool.price);
  const tir = timeInRange(position);
  const age = simAge(position, now);
  const ret = feeReturn(p.fees, p.entryValue, Math.max(age, 60_000));
  const h = holdingsAt(position.bins, pool.price);

  if (position.closed) {
    return (
      <div className="rounded-xl border border-edge bg-card p-4 opacity-70">
        <div className="flex items-center gap-3">
          <TokenAvatar symbol={position.symbol} size={32} />
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {position.symbol} <span className="text-muted">· {preset.label}</span>
            </p>
            <p className="text-[11px] text-muted">closed · withdrew {usdc(position.closed.value)}</p>
          </div>
          <span className={`font-mono text-sm font-semibold tnum ${signClass(p.netVsHold)}`}>
            {signedUsd(p.netVsHold)}
            <span className="ml-1 text-[10px] font-normal text-muted">vs hold</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex flex-col gap-3 rounded-xl border border-edge bg-card p-4 text-left transition-colors hover:border-edge-strong"
    >
      <div className="flex items-center gap-3">
        <TokenAvatar symbol={position.symbol} size={36} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {position.symbol}/{QUOTE}
          </p>
          <p className="text-[11px] text-muted">
            {preset.label} · {duration(age)} old
          </p>
        </div>
        <RangePill inRange={live} />
      </div>

      <BinChart pool={pool} position={position.bins} height={64} span={26} showAxis={false} />

      <div className="grid grid-cols-2 gap-3 border-t border-edge pt-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Net vs. holding</p>
          <p className={`font-mono text-lg font-bold tnum ${signClass(p.netVsHold)}`}>
            {signedUsd(p.netVsHold)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted">Value</p>
          <p className="font-mono text-lg font-semibold tnum">{usdc(p.currentValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <Mini label="fees" value={usdc(p.fees)} cls="text-up" />
        <Mini label="IL" value={usdc(p.impermanentLoss)} cls={signClass(p.impermanentLoss)} />
        <Mini
          label="in range"
          value={`${tir.toFixed(0)}%`}
          cls={tir > 70 ? "text-inrange" : "text-outrange"}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-2 text-[11px]">
        <span className="text-muted">
          {ret.period.toFixed(2)}% in fees over {duration(age)}
        </span>
        {position.rebalances > 0 && (
          <span className="flex items-center gap-1 text-muted">
            <BoltIcon width={11} height={11} />
            {position.rebalances} rebalance{position.rebalances === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </motion.button>
  );
}

function Mini({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div>
      <p className="text-muted">{label}</p>
      <p className={`font-mono font-semibold tnum ${cls ?? ""}`}>{value}</p>
    </div>
  );
}

/** Everything a live position is made of, for the detail view. */
export function PositionDetail({ position, pool }: { position: Position; pool: Pool }) {
  const { dispatch } = useStore();
  const preset = presetById(position.preset);
  const h = holdingsAt(position.bins, pool.price);
  const live = inRange(position.bins, pool.price);
  const tir = timeInRange(position);
  const tint = tokenMeta(pool.symbol).color;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-xl border border-edge bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{preset.label} position</h3>
            <RangePill inRange={live} />
          </div>
          <span className="font-mono text-[11px] text-muted">
            {tir.toFixed(0)}% of its life in range
          </span>
        </div>

        <BinChart pool={pool} position={position.bins} height={140} span={30} />

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-edge pt-3 sm:grid-cols-4">
          <Held label={`${pool.symbol} held`} value={amount(h.base)} color={tint} />
          <Held label={`${QUOTE} held`} value={usdc(h.quote)} color="var(--color-quote)" />
          <Held label="Rebalances" value={String(position.rebalances)} />
          <Held label="Costs paid" value={usdc(position.costs)} />
        </div>

        {!live && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-outrange/25 bg-outrange/[0.06] p-3">
            <AlertIcon width={16} height={16} className="mt-0.5 shrink-0 text-outrange" />
            <p className="text-xs leading-relaxed text-muted">
              <span className="font-semibold text-foreground">Price has left your range.</span>{" "}
              This position is earning nothing right now.{" "}
              {preset.follow
                ? "Follow will recenter it on the next block — that costs a swap fee and gas, and locks in the impermanent loss so far."
                : "It will start earning again only if price comes back inside. Nothing is lost by waiting, but nothing is earned either."}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => dispatch({ type: "CLOSE", positionId: position.id })}
          className="mt-4 w-full rounded-lg border border-edge py-2.5 text-sm font-medium text-muted transition-colors hover:border-down/40 hover:text-down"
        >
          Withdraw everything to {QUOTE}
        </button>
        <p className="mt-1.5 text-center text-[11px] text-muted/70">
          Selling the {pool.symbol} side back to {QUOTE} pays the pool&apos;s fee, which is
          added to your costs.
        </p>
      </div>

      <PnlPanel position={position} pool={pool} />
    </div>
  );
}

function Held({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">
        {color && <span className="h-2 w-2 rounded-sm" style={{ background: color }} />}
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm font-semibold tnum">{value}</p>
    </div>
  );
}
