"use client";

import { useMemo, useState } from "react";
import {
  useStore,
  poolBasis,
  poolStateOf,
  poolTvl,
  refIsLive,
  SESSION_LABEL,
  SUPPLY,
  type Pool,
} from "@/lib/store";
import { BAND_BPS, LEAVE_BPS, shareOf } from "@/lib/basis";
import { bps, count, usd, usdc, tokens, pct } from "@/lib/format";
import { PoolCard, PoolRow } from "./Pool";
import { FillTape } from "./FillTape";
import { EpochClock, DistributionLog, DistributionSummary } from "./Epochs";
import { SectionHead, basisTextClass } from "./primitives";
import {
  RadarIcon,
  BasisIcon,
  BoltIcon,
  SplitIcon,
  ShieldIcon,
  ClockIcon,
  PoolIcon,
  LayersIcon,
} from "./icons";

type Filter = "all" | "rich" | "cheap" | "acting";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "all pools" },
  { id: "acting", label: "mm acting" },
  { id: "rich", label: "rich" },
  { id: "cheap", label: "cheap" },
];

export function Home({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useStore();
  const { pools, live, epochs, lifetime, capital, session, user, now } = state;
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = useMemo(
    () => [...pools].sort((a, b) => Math.abs(poolBasis(b)) - Math.abs(poolBasis(a))),
    [pools]
  );

  const shown = useMemo(
    () =>
      sorted.filter((p) => {
        const st = poolStateOf(p);
        if (filter === "all") return true;
        if (filter === "acting") return st !== "fair";
        return st === filter;
      }),
    [sorted, filter]
  );

  const spotlight = sorted.slice(0, 3);

  const stats = useMemo(() => {
    const acting = pools.filter((p) => poolStateOf(p) !== "fair").length;
    const tvl = pools.reduce((a, p) => a + poolTvl(p), 0);
    const widest = sorted[0] ? poolBasis(sorted[0]) : 0;
    const recent = epochs.slice(0, 8);
    const avg = recent.length ? recent.reduce((a, e) => a + e.holders, 0) / recent.length : 0;
    return { acting, tvl, widest, avg };
  }, [pools, sorted, epochs]);

  const marketLive = refIsLive(session);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="grid-bg relative overflow-hidden rounded-2xl border border-edge px-5 py-8 sm:px-9 sm:py-11">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,229,154,0.14), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,166,46,0.10), transparent 70%)" }}
        />
        <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <RadarIcon width={13} height={13} /> watching {count(pools.length)} pools · Robinhood Chain
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-[3.4rem]">
              The market maker for{" "}
              <span className="bg-gradient-to-r from-rich to-rich-hot bg-clip-text text-transparent">
                mispriced
              </span>{" "}
              equities.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Tokenized stocks trade around the clock in thin pools. The stocks
              they track do not. So the pools drift — sometimes a long way — from
              what the shares are actually worth.{" "}
              <span className="text-foreground">
                When a pool runs far above the real price, mm sells into it.
              </span>{" "}
              Every fill is hedged at the reference, so the edge is booked on the
              spot. The profit goes to holders every 15 minutes, on-chain.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href="#board"
                className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-black transition-shadow hover:shadow-[0_0_28px_rgba(0,229,154,0.45)]"
              >
                See the board
              </a>
              <a
                href="#distributions"
                className="rounded-lg border border-edge px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-edge-strong"
              >
                Every payout, logged
              </a>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-edge pt-5 sm:grid-cols-4">
              <Hero
                label="pools off the mark"
                value={count(stats.acting)}
                tone={stats.acting > 0 ? "rich" : "muted"}
                sub={`of ${count(pools.length)} watched`}
              />
              <Hero
                label="widest basis"
                value={bps(stats.widest)}
                className={basisTextClass(stats.widest)}
                sub="right now"
              />
              <Hero label="avg. per sweep" value={usdc(stats.avg)} tone="accent" sub="last 8 epochs" />
              <Hero label="paid, all time" value={usd(lifetime.distributed)} tone="accent" sub={`${count(lifetime.epochs)} epochs`} />
            </div>
          </div>

          <EpochClock />
        </div>
      </section>

      {/* ── Session note — the reason the whole thing works ───────────────── */}
      <div
        className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-3 text-xs"
        style={{
          borderColor: marketLive ? "var(--color-edge)" : "rgba(255,166,46,0.28)",
          background: marketLive ? undefined : "rgba(255,166,46,0.06)",
        }}
      >
        <span
          className={`h-2 w-2 rounded-full ${marketLive ? "animate-pulse-dot bg-up" : "bg-rich"}`}
          aria-hidden
        />
        <span className="font-semibold text-foreground">{SESSION_LABEL[session]}</span>
        <span className="text-muted">
          {marketLive
            ? "The stock is printing, so the reference moves with it and real arbitrageurs compete for the same gaps. Bases stay tight and mm works for smaller clips."
            : "The stock is shut and its last print is frozen. The pools keep trading anyway — with nothing to arbitrage against, the basis runs wide. These are mm's best hours."}
        </span>
      </div>

      {/* ── Spotlight ────────────────────────────────────────────────────── */}
      <section className="mt-10">
        <SectionHead
          icon={<BasisIcon width={18} height={18} className="text-rich" />}
          title="Furthest from fair"
          tag="live"
        >
          The three pools sitting furthest from the stock they track. mm sizes
          each fade to walk the pool back toward the reference — stopping{" "}
          {LEAVE_BPS} bps short, because the last basis points cost more in
          slippage than they pay.
        </SectionHead>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spotlight.map((p) => (
            <PoolCard key={p.id} pool={p} capital={capital} onOpen={() => onOpen(p.id)} />
          ))}
        </div>
      </section>

      {/* ── The board ────────────────────────────────────────────────────── */}
      <section id="board" className="mt-12 scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHead
            icon={<PoolIcon width={18} height={18} className="text-accent" />}
            title="The board"
            tag={`${count(pools.length)} pools · ${usd(stats.tvl)} depth`}
          >
            Every pool where a tokenized equity trades, marked against the real
            stock. Outside a ±{BAND_BPS} bps band mm has a trade; inside it there
            is nothing worth paying gas for.
          </SectionHead>
          <div className="mb-4 flex gap-1 rounded-lg border border-edge bg-card p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.id ? "bg-white/[0.08] text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-edge bg-card">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="py-2.5 pl-4 pr-3 font-medium">pool</th>
                <th className="px-3 py-2.5 text-right font-medium">pool price</th>
                <th className="px-3 py-2.5 text-right font-medium">stock</th>
                <th className="px-3 py-2.5 text-right font-medium">basis</th>
                <th className="hidden px-3 py-2.5 font-medium md:table-cell">cheap · fair · rich</th>
                <th className="hidden px-3 py-2.5 font-medium lg:table-cell">recent</th>
                <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">depth</th>
                <th className="px-3 py-2.5 text-right font-medium">mm</th>
                <th className="hidden py-2.5 pl-3 pr-4 text-right font-medium lg:table-cell">last fill</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <PoolRow key={p.id} pool={p} capital={capital} now={now} onOpen={() => onOpen(p.id)} />
              ))}
            </tbody>
          </table>
          {shown.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No pool is {filter === "acting" ? "outside the band" : filter} right now.
            </p>
          )}
        </div>
      </section>

      {/* ── Fills ────────────────────────────────────────────────────────── */}
      <section id="fills" className="mt-12 scroll-mt-20">
        <SectionHead
          icon={<BoltIcon width={18} height={18} className="text-accent" />}
          title="Fills"
          tag="live tape"
        >
          Each row is one trade against one pool. mm sold above the stock, or
          bought below it, and the edge is realized at the fill — the hedge is
          on the other side, so nothing here is waiting for a price to come
          back.
        </SectionHead>
        <FillTape limit={12} />
        <p className="mt-2 text-[11px] text-muted">
          This epoch: {count(live.fills)} fills · {usd(live.volume)} traded ·{" "}
          <span className="text-accent">{usdc(live.net)}</span> realized.
        </p>
      </section>

      {/* ── Distributions ────────────────────────────────────────────────── */}
      <section id="distributions" className="mt-12 scroll-mt-20">
        <SectionHead
          icon={<SplitIcon width={18} height={18} className="text-accent" />}
          title="Distributions"
          tag="every 15 minutes"
        >
          At every quarter hour the epoch closes, the realized profit is swept,
          and it is paid to mm holders pro rata. Boundaries are wall-clock, so
          everyone is on the same schedule whether or not they are watching.
        </SectionHead>
        <DistributionSummary />
        <div className="mt-4">
          <DistributionLog limit={10} />
        </div>
        <p className="mt-2 text-[11px] text-muted">
          Trailing figures describe what the book has already paid. They are not
          a forecast — when the pools track the stocks closely, there is nothing
          to collect and an epoch pays little or nothing.
        </p>
      </section>

      {/* ── Holders ──────────────────────────────────────────────────────── */}
      <section className="mt-12">
        <SectionHead
          icon={<LayersIcon width={18} height={18} className="text-accent" />}
          title="Holding mm"
          tag={`${tokens(SUPPLY)} fixed supply`}
        >
          mm is a claim on the profit stream, not on the vault. Supply is fixed;
          your share of every sweep is exactly your share of supply. There is
          nothing to stake, lock, or vest.
        </SectionHead>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Panel label="supply" value={tokens(SUPPLY)} sub="fixed, no emissions" />
            <Panel label="working capital" value={usd(capital)} sub="the book mm trades" />
            <Panel label="cadence" value="15 min" sub="96 sweeps a day" />
            <Panel label="holder cut" value="90%" sub="10% to keepers" />
          </div>
          <div className="rounded-xl border border-edge bg-card p-5">
            {user.connected ? (
              <>
                <p className="text-[11px] uppercase tracking-wide text-muted">your position</p>
                <p className="mt-1 font-mono text-2xl font-bold tnum">
                  {tokens(user.mm)} <span className="text-base text-muted">mm</span>
                </p>
                <p className="text-xs text-muted">
                  {pct((user.mm / SUPPLY) * 100, false, 3)} of supply
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-edge pt-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted">claimable</p>
                    <p className="font-mono text-lg font-semibold text-accent tnum">
                      {usdc(user.claimable)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted">claimed</p>
                    <p className="font-mono text-lg font-semibold tnum">{usdc(user.paid)}</p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-muted">
                  At the last eight sweeps, a position this size earned{" "}
                  <span className="font-mono text-foreground">
                    {usdc(shareOf(stats.avg, user.mm))}
                  </span>{" "}
                  per epoch.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold">Not connected</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Connect a wallet to watch your cut of the open epoch accrue and
                  to claim what has already been swept. In this demo, connecting
                  mints a mock holder — no keys, no funds, no chain.
                </p>
                <p className="mt-4 rounded-lg bg-white/[0.03] p-3 font-mono text-[11px] text-muted">
                  10,000 mm earned {usdc(shareOf(stats.avg, 10_000))} in the
                  average of the last eight sweeps.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="mt-14 scroll-mt-20">
        <SectionHead icon={<ClockIcon width={18} height={18} className="text-accent" />} title="How it works">
          Three steps, repeated ninety-six times a day.
        </SectionHead>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              Icon: RadarIcon,
              title: "Watch every pool",
              body: `mm indexes every pool where a tokenized equity trades and marks each one against the real stock print. The distance between the two is the basis, quoted in basis points. Inside ±${BAND_BPS} bps there is nothing to do.`,
            },
            {
              n: "02",
              Icon: BasisIcon,
              title: "Sell into what is rich",
              body: "When a pool runs far above the stock, mm sells the token into it and hedges the same exposure at the reference. It is not a bet on reversion: mm is selling something for more than it costs to source, and the difference is booked at the fill.",
            },
            {
              n: "03",
              Icon: SplitIcon,
              title: "Pay it out, every 15 minutes",
              body: "At the quarter hour the epoch closes. Realized profit, net of the pool fees and gas it took to earn, is swept on-chain and split across mm holders in proportion to what they hold.",
            },
          ].map(({ n, Icon, title, body }) => (
            <div key={n} className="rounded-xl border border-edge bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge bg-accent/10 text-accent">
                  <Icon width={20} height={20} />
                </span>
                <span className="font-mono text-2xl font-bold text-white/10">{n}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-rich/20 bg-rich/[0.05] p-5">
            <ClockIcon width={20} height={20} className="mt-0.5 shrink-0 text-rich" />
            <p className="text-sm leading-relaxed text-muted">
              <span className="font-semibold text-foreground">
                The best hours are the ones the market is shut.
              </span>{" "}
              A tokenized stock trades 24/7; the share it tracks trades 09:30 to
              16:00, five days a week. Overnight and at weekends the reference is
              frozen and there is no underlying to arbitrage against — so the
              pools wander, and they wander furthest exactly when Asia and the
              Gulf are awake and the US is asleep.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/[0.05] p-5">
            <ShieldIcon width={20} height={20} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-sm leading-relaxed text-muted">
              <span className="font-semibold text-foreground">
                Every fade is hedged, and sized to the pool.
              </span>{" "}
              Size comes from the pool&apos;s own curve — the exact quantity that
              walks it back toward the reference — capped by a per-clip limit, so
              no single dislocation can take the book. mm carries basis risk, not
              a directional view on any stock.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Hero({
  label,
  value,
  sub,
  tone,
  className,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "accent" | "rich" | "muted";
  className?: string;
}) {
  const cls =
    className ??
    (tone === "accent" ? "text-accent" : tone === "muted" ? "text-muted" : "text-rich");
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`font-mono text-xl font-bold tnum ${cls}`}>{value}</p>
      <p className="text-[11px] text-muted">{sub}</p>
    </div>
  );
}

function Panel({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-edge bg-card p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold tnum">{value}</p>
      <p className="text-[11px] text-muted">{sub}</p>
    </div>
  );
}
