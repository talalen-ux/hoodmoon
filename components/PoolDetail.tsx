"use client";

import { useMemo, useState } from "react";
import {
  useStore,
  currentFeeBps,
  openPosition,
  poolYield,
  safetyFlags,
  PRESETS,
  presetById,
  type Pool,
  type PresetId,
  type Safety,
} from "@/lib/store";
import { binIdAt, binPrice, buildPosition, holdingsAt, variableFeeBps } from "@/lib/bins";
import { QUOTE, tokenMeta } from "@/lib/tokens";
import {
  amount,
  bigPct,
  count,
  feePct,
  pct,
  price as fmtPrice,
  stamp,
  usd,
  usdc,
} from "@/lib/format";
import { BinChart, BinLegend, SectionHead, Sparkline, TokenAvatar } from "./primitives";
import { PositionCard, PositionDetail } from "./Position";
import { AlertIcon, BackIcon, BinsIcon, BoltIcon, CheckIcon, CrossIcon, ShieldIcon } from "./icons";

/**
 * The safety checklist.
 *
 * These are facts read straight off the chain, not a rating. There is
 * deliberately no score and no letter grade: a token can satisfy every line
 * here and still go to zero next week, and a single number invites people to
 * read a judgement that nobody is in a position to make. What the panel can
 * honestly do is put the checks in front of someone before they deposit.
 */
export function SafetyPanel({ safety, symbol }: { safety: Safety; symbol: string }) {
  const checks = [
    {
      ok: safety.ownershipRenounced,
      label: "Ownership renounced",
      good: "No one can change the token contract any more.",
      bad: "The deployer can still change the contract — including, on many tokens, the ability to mint more or block your sells.",
    },
    {
      ok: safety.liquidityLocked,
      label: `Liquidity locked (${safety.lockedPct}%)`,
      good: "The bulk of pool liquidity is locked and cannot simply be pulled.",
      bad: "Liquidity is not locked. Whoever holds it can withdraw it at any moment, and the price goes with it.",
    },
    {
      ok: safety.noTransferTax,
      label: "No transfer tax",
      good: "Transfers are clean, so your position accounts exactly as shown.",
      bad: "This token taxes transfers, which quietly eats into every rebalance and withdrawal.",
    },
    {
      ok: safety.topHolderPct < 10,
      label: `Largest holder ${safety.topHolderPct.toFixed(1)}%`,
      good: "No single wallet holds enough to move the price on its own.",
      bad: "One wallet holds a large share of supply. If it sells, you are the exit liquidity.",
    },
    {
      ok: safety.ageDays >= 7,
      label: `Pool age ${count(safety.ageDays)} days`,
      good: "The pool has enough history to have been looked at.",
      bad: "This pool is only days old. Most tokens this young do not survive the month.",
    },
  ];
  const failed = checks.filter((c) => !c.ok);

  return (
    <div className="rounded-xl border border-edge bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-accent-soft">
        <ShieldIcon width={14} height={14} /> ON-CHAIN CHECKS
      </div>
      <ul className="mt-3 space-y-2.5">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2.5">
            <span
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
              style={{
                background: c.ok ? "rgba(52,211,153,0.16)" : "rgba(251,113,133,0.16)",
                color: c.ok ? "var(--color-inrange)" : "var(--color-down)",
              }}
            >
              {c.ok ? <CheckIcon width={10} height={10} /> : <CrossIcon width={10} height={10} />}
            </span>
            <div className="min-w-0">
              <p className={`text-xs font-medium ${c.ok ? "text-foreground" : "text-down"}`}>
                {c.label}
              </p>
              <p className="text-[11px] leading-relaxed text-muted">{c.ok ? c.good : c.bad}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-edge pt-3 text-[11px] leading-relaxed text-muted">
        {failed.length === 0 ? (
          <>
            Every check passes. That is worth knowing and it is not a
            recommendation — {symbol} can still go to zero, and most memecoins
            eventually do.
          </>
        ) : (
          <>
            <span className="font-semibold text-down">
              {failed.length} of {checks.length} checks fail.
            </span>{" "}
            These are facts about the contract, not predictions. Read them and
            decide for yourself.
          </>
        )}
      </p>
    </div>
  );
}

/** Fee yield, stated as what it is before it is annualised. */
export function YieldPanel({ pool }: { pool: Pool }) {
  const y = poolYield(pool);
  return (
    <div className="rounded-xl border border-edge bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-accent-soft">
        <BinsIcon width={14} height={14} /> FEE YIELD
      </div>
      <p className="mt-3 font-mono text-3xl font-bold tnum">{y.period.toFixed(2)}%</p>
      <p className="text-xs text-muted">
        of pool value paid out as fees in the last 24 hours — {usd(pool.fees24h)} on{" "}
        {usd(pool.tvl)}
      </p>
      <div className="mt-4 rounded-lg border border-outrange/20 bg-outrange/[0.05] p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-muted">Annualised, that reads</span>
          <span className="font-mono text-lg font-bold text-outrange tnum">
            {bigPct(y.apr)} APR
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          Which assumes today repeats 365 times. It will not. Memecoin volume
          arrives in bursts and this number moves by an order of magnitude
          between a quiet week and a live one — treat the 24-hour figure above
          as the real one.
        </p>
      </div>
      <dl className="mt-4 space-y-2 border-t border-edge pt-3">
        <li className="flex justify-between text-xs">
          <span className="text-muted">Base fee</span>
          <span className="font-mono tnum">{feePct(pool.baseFeeBps)}</span>
        </li>
        <li className="flex justify-between text-xs">
          <span className="text-muted">Volatility surcharge, now</span>
          <span className="font-mono tnum text-accent-soft">
            +{feePct(variableFeeBps(pool.volatility, pool.binStep))}
          </span>
        </li>
        <li className="flex justify-between border-t border-edge pt-2 text-xs font-semibold">
          <span>Swaps are paying</span>
          <span className="font-mono tnum">{feePct(currentFeeBps(pool))}</span>
        </li>
      </dl>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        The surcharge rises with how hard the pool is moving. That is deliberate:
        volatility is exactly when impermanent loss is worst, so it had better
        also be when LPs are paid most.
      </p>
    </div>
  );
}

// ── Deposit ─────────────────────────────────────────────────────────────────

const AMOUNTS = [100, 250, 500, 1000];

function DepositPanel({ pool }: { pool: Pool }) {
  const { state, dispatch } = useStore();
  const [presetId, setPresetId] = useState<PresetId>("follow");
  const [amt, setAmt] = useState(250);
  const [ack, setAck] = useState(false);

  const preset = presetById(presetId);
  const flags = safetyFlags(pool.safety);
  const needsAck = flags.failed > 0;
  const connected = state.user.connected;
  const enough = amt > 0 && amt <= state.user.usdc;

  // Preview the exact bins this deposit would create.
  const preview = useMemo(() => {
    const active = binIdAt(pool.price, pool.binStep);
    const lo = active - preset.halfWidth;
    const hi = preset.oneSided ? active - 1 : active + preset.halfWidth;
    const half = preset.oneSided ? 0 : amt / 2;
    const swapFee = half * (currentFeeBps(pool) / 10_000);
    const bins = buildPosition({
      binStep: pool.binStep,
      activeBin: active,
      lo,
      hi,
      shape: preset.shape,
      amountBase: preset.oneSided ? 0 : (half - swapFee) / pool.price,
      amountQuote: preset.oneSided ? amt : half,
      price: pool.price,
    });
    return {
      bins,
      lo,
      hi,
      swapFee,
      loPrice: binPrice(lo, pool.binStep),
      hiPrice: binPrice(hi, pool.binStep),
    };
  }, [pool, preset, amt]);

  const widthPct = ((preview.hiPrice - preview.loPrice) / pool.price) * 100;

  return (
    <div className="rounded-xl border border-edge bg-card p-5">
      <h3 className="text-sm font-semibold">Provide liquidity</h3>
      <p className="mt-1 text-xs text-muted">
        Deposit {QUOTE}. Everything below is what actually happens to it.
      </p>

      {/* Preset */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPresetId(p.id)}
            className={`rounded-lg border p-2.5 text-left transition-colors ${
              presetId === p.id
                ? "border-accent/60 bg-accent/10"
                : "border-edge bg-white/[0.02] hover:border-edge-strong"
            }`}
          >
            <p className="text-xs font-semibold">{p.label}</p>
            <p className="mt-0.5 text-[10px] leading-tight text-muted">{p.tagline}</p>
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-lg bg-white/[0.03] p-3">
        <p className="text-[11px] leading-relaxed text-muted">{preset.body}</p>
        <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-outrange">
          <AlertIcon width={12} height={12} className="mt-0.5 shrink-0" />
          <span>{preset.risk}</span>
        </p>
      </div>

      {/* Amount */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label htmlFor="amt" className="text-xs text-muted">
            Amount
          </label>
          <span className="font-mono text-[11px] text-muted tnum">
            wallet {usdc(state.user.usdc)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-lg border border-edge bg-white/[0.02] px-3">
            <span className="text-sm text-muted">$</span>
            <input
              id="amt"
              type="number"
              min={0}
              value={amt}
              onChange={(e) => setAmt(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-transparent py-2.5 pl-1 font-mono text-sm outline-none tnum"
            />
          </div>
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmt(a)}
              className={`rounded-lg border px-2.5 py-2 font-mono text-xs transition-colors ${
                amt === a ? "border-accent/60 text-accent-soft" : "border-edge text-muted hover:text-foreground"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* What you are about to own */}
      <div className="mt-4 rounded-lg border border-edge bg-white/[0.02] p-3">
        <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">
          Your bins, if you deposit now
        </p>
        <BinChart pool={pool} position={preview.bins} height={72} span={26} positionOnly />
        <dl className="mt-3 space-y-1.5 border-t border-edge pt-2.5 text-xs">
          <li className="flex justify-between">
            <span className="text-muted">Price range</span>
            <span className="font-mono tnum">
              {fmtPrice(preview.loPrice)} – {fmtPrice(preview.hiPrice)}
            </span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted">Width around price</span>
            <span className="font-mono tnum">±{(widthPct / 2).toFixed(1)}%</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted">Bins used</span>
            <span className="font-mono tnum">{preview.hi - preview.lo + 1}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted">
              {preset.oneSided ? "Swap needed" : "Swap into " + pool.symbol}
            </span>
            <span className="font-mono tnum">
              {preset.oneSided ? "none" : `${usdc(amt / 2)} · fee ${usdc(preview.swapFee)}`}
            </span>
          </li>
        </dl>
      </div>

      {needsAck && (
        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-lg border border-down/25 bg-down/[0.06] p-3">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--color-down)]"
          />
          <span className="text-[11px] leading-relaxed text-muted">
            <span className="font-semibold text-down">
              {flags.failed} of {flags.total} on-chain checks fail for {pool.symbol}.
            </span>{" "}
            I have read them and I want to provide liquidity anyway.
          </span>
        </label>
      )}

      <button
        type="button"
        disabled={!connected || !enough || (needsAck && !ack)}
        onClick={() => dispatch({ type: "OPEN", poolId: pool.id, preset: presetId, amountUsd: amt })}
        className="mt-4 w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-shadow hover:shadow-[0_0_28px_rgba(168,85,247,0.45)] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
      >
        {!connected
          ? "Connect a wallet"
          : !enough
            ? "Not enough USDC"
            : `Provide ${usdc(amt)} on ${preset.label}`}
      </button>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-muted/70">
        You can withdraw at any time. Fees accrue only while price is inside your
        range.
      </p>
    </div>
  );
}


/**
 * The swaps paying the fees.
 *
 * Every yield number on this page is downstream of this tape: someone traded,
 * the pool charged them, and whoever held liquidity in the bin they crossed
 * got paid. Showing it makes the fee column checkable rather than asserted.
 */
function PoolActivity({ poolId, symbol }: { poolId: string; symbol: string }) {
  const { state } = useStore();
  const rows = state.swaps.filter((s) => s.poolId === poolId).slice(0, 8);

  return (
    <div className="rounded-xl border border-edge bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-accent-soft">
        <BoltIcon width={14} height={14} /> SWAPS PAYING THE FEES
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-muted">Waiting for the next swap…</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="pb-2 font-medium">time</th>
              <th className="pb-2 font-medium">side</th>
              <th className="pb-2 text-right font-medium">size</th>
              <th className="pb-2 text-right font-medium">fee rate</th>
              <th className="pb-2 text-right font-medium">fee paid</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-edge/60">
                <td className="py-1.5 font-mono text-xs text-muted tnum">{stamp(s.ts)}</td>
                <td className="py-1.5">
                  <span
                    className={`font-mono text-xs font-semibold ${
                      s.side === "buy" ? "text-up" : "text-down"
                    }`}
                  >
                    {s.side === "buy" ? "BUY" : "SELL"} {symbol}
                  </span>
                </td>
                <td className="py-1.5 text-right font-mono text-xs tnum">{usd(s.sizeQuote)}</td>
                <td className="py-1.5 text-right font-mono text-xs text-accent-soft tnum">
                  {feePct(s.feeBps)}
                </td>
                <td className="py-1.5 text-right font-mono text-xs text-up tnum">
                  {usdc(s.feeQuote)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-3 border-t border-edge pt-2.5 text-[11px] leading-relaxed text-muted">
        Each fee goes only to liquidity sitting in the bin that swap crossed. A
        position out of range collects nothing from any of these.
      </p>
    </div>
  );
}

// ── The page ────────────────────────────────────────────────────────────────

export function PoolDetail({ poolId, onBack }: { poolId: string; onBack: () => void }) {
  const { state } = useStore();
  const pool = state.pools.find((p) => p.id === poolId);
  const positions = state.positions.filter((p) => p.poolId === poolId && !p.closed);

  if (!pool) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted">Pool not found.</p>
        <button onClick={onBack} className="mt-4 text-accent-soft">
          ← back to pools
        </button>
      </div>
    );
  }

  const chg = (pool.price / pool.price24hAgo - 1) * 100;
  const tint = tokenMeta(pool.symbol).color;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
      >
        <BackIcon width={16} height={16} /> pools
      </button>

      <div className="flex flex-wrap items-center gap-4">
        <TokenAvatar symbol={pool.symbol} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">
            {pool.symbol}
            <span className="text-muted">/{QUOTE}</span>
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {tokenMeta(pool.symbol).name} · {pool.binStep} bps bins ·{" "}
            {feePct(currentFeeBps(pool))} fee now
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold tnum">{fmtPrice(pool.price)}</p>
          <p className={`font-mono text-sm tnum ${chg >= 0 ? "text-up" : "text-down"}`}>
            {pct(chg)} 24h
          </p>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-edge bg-card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Liquidity by price</h2>
              <Sparkline values={pool.history} width={110} height={28} color={tint} />
            </div>
            <BinChart pool={pool} height={168} span={38} />
            <div className="mt-3 border-t border-edge pt-3">
              <BinLegend symbol={pool.symbol} />
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Each bar is one price bin, {pool.binStep} bps wide. Trades inside a
                bin move the price not at all — it only moves when a bin is
                emptied and the pool steps to the next one. Fees are paid only to
                whoever has liquidity in the bin being traded.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-edge pt-3 sm:grid-cols-4">
              <Fact label="Pool depth" value={usd(pool.tvl)} />
              <Fact label="24h volume" value={usd(pool.volume24h)} />
              <Fact label="24h fees" value={usd(pool.fees24h)} />
              <Fact label="Bin width" value={`${(pool.binStep / 100).toFixed(2)}%`} />
            </div>
          </div>

          <PoolActivity poolId={pool.id} symbol={pool.symbol} />
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <DepositPanel pool={pool} />
          <YieldPanel pool={pool} />
          <SafetyPanel safety={pool.safety} symbol={pool.symbol} />
        </div>
      </div>

      {positions.length > 0 && (
        <section className="mt-10">
          <SectionHead
            title={`Your ${pool.symbol} positions`}
            tag={`${positions.length}`}
          >
            The chart shows where your liquidity sits against the pool&apos;s.
            The panel beside it is the only scoreboard that matters.
          </SectionHead>
          <div className="flex flex-col gap-4">
            {positions.map((p) => (
              <PositionDetail key={p.id} position={p} pool={pool} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tnum">{value}</p>
    </div>
  );
}
