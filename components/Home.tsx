"use client";

import { useMemo } from "react";
import {
  useStore,
  currentFeeBps,
  poolYield,
  safetyFlags,
  positionPnl,
  PRESETS,
  type Pool,
} from "@/lib/store";
import { inRange } from "@/lib/bins";
import { QUOTE, tokenMeta } from "@/lib/tokens";
import { bigPct, feePct, pct, price as fmtPrice, signedUsd, usd, usdc } from "@/lib/format";
import { BinChart, SectionHead, Sparkline, TokenAvatar, signClass } from "./primitives";
import { PositionCard } from "./Position";
import {
  AlertIcon,
  BinsIcon,
  BoltIcon,
  ClockIcon,
  ScaleIcon,
  ShieldIcon,
  TideIcon,
} from "./icons";

export function Home({
  onOpenPool,
  onPositions,
}: {
  onOpenPool: (id: string) => void;
  onPositions: () => void;
}) {
  const { state } = useStore();
  const { pools, positions, now, user } = state;

  const open = positions.filter((p) => !p.closed);

  const totals = useMemo(() => {
    const tvl = pools.reduce((a, p) => a + p.tvl, 0);
    const vol = pools.reduce((a, p) => a + p.volume24h, 0);
    const fees = pools.reduce((a, p) => a + p.fees24h, 0);
    let value = 0;
    let netVsHold = 0;
    let earning = 0;
    for (const pos of open) {
      const pool = pools.find((p) => p.id === pos.poolId);
      if (!pool) continue;
      const pnl = positionPnl(pos, pool.price);
      value += pnl.currentValue;
      netVsHold += pnl.netVsHold;
      if (inRange(pos.bins, pool.price)) earning += 1;
    }
    return { tvl, vol, fees, value, netVsHold, earning };
  }, [pools, open]);

  const ranked = useMemo(() => [...pools].sort((a, b) => b.volume24h - a.volume24h), [pools]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      {/* Hero */}
      <section className="grid-bg relative overflow-hidden rounded-2xl border border-edge px-5 py-9 sm:px-9 sm:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.20), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.13), transparent 70%)" }}
        />
        <div className="relative grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-soft">
              <TideIcon width={13} height={13} /> {pools.length} memecoin pools · Robinhood Chain
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-[3.4rem]">
              LP the memecoins{" "}
              <span className="bg-gradient-to-r from-accent-soft to-quote bg-clip-text text-transparent">
                without the guesswork
              </span>
              .
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Concentrated liquidity earns real fees on the tokens that actually
              trade — and quietly loses money if you pick the wrong range, drift
              out of it, or never check what impermanent loss took.{" "}
              <span className="text-foreground">
                tide is one tap to a position, and one number that tells you the
                truth: whether you beat simply holding.
              </span>
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href="#pools"
                className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition-shadow hover:shadow-[0_0_28px_rgba(168,85,247,0.45)]"
              >
                Browse pools
              </a>
              <a
                href="#how"
                className="rounded-lg border border-edge px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-edge-strong"
              >
                How it works
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-edge pt-5 sm:grid-cols-4">
              <Hero label="pools" value={String(pools.length)} sub="all memecoin/USDC" />
              <Hero label="depth" value={usd(totals.tvl)} sub="across the board" />
              <Hero label="24h volume" value={usd(totals.vol)} sub="what pays the fees" />
              <Hero label="24h fees" value={usd(totals.fees)} sub="paid to LPs" accent />
            </div>
          </div>

          <HeroCard />
        </div>
      </section>

      {/* Your positions, if any */}
      {user.connected && open.length > 0 && (
        <section className="mt-10">
          <SectionHead
            icon={<BinsIcon width={18} height={18} className="text-accent-soft" />}
            title="Your positions"
            tag={`${totals.earning}/${open.length} earning`}
          >
            The headline is the same one every card leads with: net of fees,
            impermanent loss and costs, are you ahead of where you would be
            holding the tokens?
          </SectionHead>
          <div className="mb-4 flex flex-wrap items-center gap-6 rounded-xl border border-edge bg-card p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Total value</p>
              <p className="font-mono text-xl font-bold tnum">{usdc(totals.value)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Net vs. holding</p>
              <p className={`font-mono text-xl font-bold tnum ${signClass(totals.netVsHold)}`}>
                {signedUsd(totals.netVsHold)}
              </p>
            </div>
            <button
              onClick={onPositions}
              className="ml-auto rounded-lg border border-edge px-4 py-2 text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              See all positions
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {open.slice(0, 3).map((pos) => {
              const pool = pools.find((p) => p.id === pos.poolId)!;
              return (
                <PositionCard
                  key={pos.id}
                  position={pos}
                  pool={pool}
                  now={now}
                  onOpen={() => onOpenPool(pos.poolId)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* The board */}
      <section id="pools" className="mt-12 scroll-mt-20">
        <SectionHead
          icon={<BinsIcon width={18} height={18} className="text-accent-soft" />}
          title="Pools"
          tag="by 24h volume"
        >
          Volume is what pays you, so the board is ranked by it rather than by
          headline yield. The fee column is what swaps are being charged right
          now — it rises with volatility, which is when LPs need paying most.
        </SectionHead>

        <div className="overflow-x-auto rounded-xl border border-edge bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="py-2.5 pl-4 pr-3 font-medium">pool</th>
                <th className="px-3 py-2.5 text-right font-medium">price</th>
                <th className="px-3 py-2.5 text-right font-medium">24h</th>
                <th className="hidden px-3 py-2.5 lg:table-cell" />
                <th className="px-3 py-2.5 text-right font-medium">volume</th>
                <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">depth</th>
                <th className="px-3 py-2.5 text-right font-medium">fee now</th>
                <th className="px-3 py-2.5 text-right font-medium">24h fees / depth</th>
                <th className="py-2.5 pl-3 pr-4 text-right font-medium">checks</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((pool) => (
                <PoolRow key={pool.id} pool={pool} onOpen={() => onOpenPool(pool.id)} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          The last column shows fees paid over the last 24 hours as a share of
          pool depth — the honest version of APR. Annualising it would multiply
          by 365 and produce a number nobody has ever been paid.
        </p>
      </section>

      {/* Presets */}
      <section className="mt-12">
        <SectionHead
          icon={<ScaleIcon width={18} height={18} className="text-accent-soft" />}
          title="Four ways to provide"
          tag="pick one, change it later"
        >
          Each is a real liquidity shape underneath. Every one of them has a
          downside, and it is written on the card rather than in a docs page.
        </SectionHead>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PRESETS.map((p) => (
            <div key={p.id} className="flex flex-col rounded-xl border border-edge bg-card p-5">
              <h3 className="text-sm font-semibold">{p.label}</h3>
              <p className="mt-0.5 text-xs text-accent-soft">{p.tagline}</p>
              <p className="mt-3 flex-1 text-xs leading-relaxed text-muted">{p.body}</p>
              <p className="mt-3 flex items-start gap-1.5 border-t border-edge pt-3 text-[11px] leading-relaxed text-outrange">
                <AlertIcon width={12} height={12} className="mt-0.5 shrink-0" />
                <span>{p.risk}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mt-14 scroll-mt-20">
        <SectionHead
          icon={<ClockIcon width={18} height={18} className="text-accent-soft" />}
          title="How it works"
        >
          Binned liquidity, explained once.
        </SectionHead>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              Icon: BinsIcon,
              title: "A pool is a ladder of bins",
              body: "Each bin is a single price. Trades inside one move the price not at all — the pool only steps when a bin is emptied. Below the current price a bin holds USDC; above it, the token. That is why your position changes composition as price moves through it.",
            },
            {
              n: "02",
              Icon: TideIcon,
              title: "You only earn in range",
              body: "Fees go to whoever has liquidity in the bin being traded, and nobody else. A tight range owns more of that bin and earns more — until price leaves, at which point it earns exactly nothing. That trade-off is the entire game.",
            },
            {
              n: "03",
              Icon: BoltIcon,
              title: "Fees rise with volatility",
              body: "The pool charges a base fee plus a surcharge that climbs as it steps between bins. Volatility is when impermanent loss is worst, so it is also when swaps pay most — a flat fee would get picked off on exactly the candles that hurt.",
            },
          ].map(({ n, Icon, title, body }) => (
            <div key={n} className="rounded-xl border border-edge bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge bg-accent/10 text-accent-soft">
                  <Icon width={20} height={20} />
                </span>
                <span className="font-mono text-2xl font-bold text-white/10">{n}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-down/20 bg-down/[0.05] p-5">
          <AlertIcon width={20} height={20} className="mt-0.5 shrink-0 text-down" />
          <div>
            <p className="text-sm font-semibold">
              Providing liquidity to memecoins loses money more often than it makes it.
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              The fees are genuinely large, and so is the impermanent loss they
              are compensating for. A position can collect fees every hour, show
              a green total because the token went up, and still have been worse
              than doing nothing. tide will not hide that from you — it is the
              number on the front of every card — but it cannot make it untrue.
            </p>
          </div>
        </div>
      </section>

      {/* On-chain */}
      <section id="onchain" className="mt-14 scroll-mt-20">
        <SectionHead
          icon={<ShieldIcon width={18} height={18} className="text-accent-soft" />}
          title="What runs on-chain"
          tag="no oracle, no custodian, no keeper"
        >
          Worth being precise about, because most yield products are not.
        </SectionHead>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-inrange/20 bg-inrange/[0.04] p-5">
            <h3 className="text-sm font-semibold text-inrange">Enforced by contract</h3>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
              {[
                "Bins, swaps, fee accrual and the variable fee — all pool state, all on-chain.",
                "Your position, its range and its shape, held as a token you own.",
                "The rebalance rule you agreed at deposit: when to recenter, how far, max slippage. Committed on-chain, so it cannot be changed underneath you.",
                "Recentering runs as a permissionless crank with a bounty — anyone can call it, the contract checks the rule was satisfied. There is no privileged keeper and nobody who can move your funds.",
                "Withdrawal, always, without asking anyone.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-inrange" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-edge bg-card p-5">
            <h3 className="text-sm font-semibold">Off-chain, and only this</h3>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
              {[
                "The indexer behind the charts and history. It reads public events — anyone can rebuild it and check the numbers.",
                "This interface. It can be pinned to IPFS; the contracts do not depend on it existing.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-edge pt-3 text-xs leading-relaxed text-muted">
              There is no price oracle, because the pool is the price. No
              custodian, because the tokens are native rather than a claim on
              someone. No hedge leg, so no broker. Those three are what usually
              force a DeFi product to trust somebody, and none of them appear
              here.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function PoolRow({ pool, onOpen }: { pool: Pool; onOpen: () => void }) {
  const chg = (pool.price / pool.price24hAgo - 1) * 100;
  const y = poolYield(pool);
  const flags = safetyFlags(pool.safety);
  const tint = tokenMeta(pool.symbol).color;

  return (
    <tr
      onClick={onOpen}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer border-b border-edge/60 transition-colors last:border-0 hover:bg-white/[0.025]"
    >
      <td className="whitespace-nowrap py-2.5 pl-4 pr-3">
        <div className="flex items-center gap-2.5">
          <TokenAvatar symbol={pool.symbol} size={30} />
          <div className="leading-tight">
            <p className="text-sm font-semibold">
              {pool.symbol}
              <span className="text-muted">/{QUOTE}</span>
            </p>
            <p className="text-[11px] text-muted">{pool.binStep} bps bins</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-sm tnum">{fmtPrice(pool.price)}</td>
      <td className={`px-3 py-2.5 text-right font-mono text-sm tnum ${chg >= 0 ? "text-up" : "text-down"}`}>
        {pct(chg, true, 1)}
      </td>
      <td className="hidden px-3 py-2.5 lg:table-cell">
        <Sparkline values={pool.history} width={78} height={24} color={tint} />
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-sm tnum">{usd(pool.volume24h)}</td>
      <td className="hidden px-3 py-2.5 text-right font-mono text-sm text-muted tnum sm:table-cell">
        {usd(pool.tvl)}
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-sm text-accent-soft tnum">
        {feePct(currentFeeBps(pool))}
      </td>
      <td className="px-3 py-2.5 text-right">
        <span className="font-mono text-sm font-semibold tnum">{y.period.toFixed(2)}%</span>
        <span className="ml-1 hidden text-[10px] text-muted xl:inline">24h</span>
      </td>
      <td className="whitespace-nowrap py-2.5 pl-3 pr-4 text-right">
        {flags.failed === 0 ? (
          <span className="font-mono text-[11px] text-inrange">{flags.total}/{flags.total}</span>
        ) : (
          <span
            className="font-mono text-[11px] text-down"
            title={`${flags.failed} on-chain check${flags.failed === 1 ? "" : "s"} fail`}
          >
            {flags.total - flags.failed}/{flags.total}
          </span>
        )}
      </td>
    </tr>
  );
}

/** The hero's live illustration — a real pool, drawn from the live sim. */
function HeroCard() {
  const { state } = useStore();
  const pool = useMemo(
    () => [...state.pools].sort((a, b) => b.volume24h - a.volume24h)[0],
    [state.pools]
  );
  if (!pool) return null;
  const y = poolYield(pool);
  return (
    <div className="rounded-2xl border border-edge bg-card/70 p-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <TokenAvatar symbol={pool.symbol} size={36} />
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {pool.symbol}
            <span className="text-muted">/{QUOTE}</span>
          </p>
          <p className="text-[11px] text-muted">deepest pool on the board</p>
        </div>
        <p className="font-mono text-lg font-semibold tnum">{fmtPrice(pool.price)}</p>
      </div>
      <div className="mt-4">
        <BinChart pool={pool} height={104} span={30} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-edge pt-3">
        <div>
          <p className="text-[11px] text-muted">fee now</p>
          <p className="font-mono text-sm font-semibold text-accent-soft tnum">
            {feePct(currentFeeBps(pool))}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted">24h fees / depth</p>
          <p className="font-mono text-sm font-semibold tnum">{y.period.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-[11px] text-muted">annualised</p>
          <p className="font-mono text-sm font-semibold text-outrange tnum">{bigPct(y.apr)}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        Both are the same number. One of them is honest.
      </p>
    </div>
  );
}

function Hero({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`font-mono text-xl font-bold tnum ${accent ? "text-accent-soft" : ""}`}>
        {value}
      </p>
      <p className="text-[11px] text-muted">{sub}</p>
    </div>
  );
}
