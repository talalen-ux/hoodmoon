"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useStore, statusOf, type Pool, type PoolStatus } from "@/lib/store";
import { poolTotal } from "@/lib/parimutuel";
import { usd, dayLabel, dayKey, clockLabel } from "@/lib/format";
import { PoolCard } from "./PoolCard";
import { Countdown } from "./primitives";
import { ScaleIcon, LayersIcon, BoltIcon, CalendarIcon, TrendUpIcon } from "./icons";

type Filter = "all" | "open" | "locked" | "live" | "settled";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "locked", label: "Locked" },
  { key: "live", label: "Live" },
  { key: "settled", label: "Settled" },
];

export function Home({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useStore();
  const { pools, now } = state;
  const [filter, setFilter] = useState<Filter>("all");

  const stats = useMemo(() => {
    const staked = pools.reduce((a, p) => a + poolTotal(p.stakes), 0);
    const open = pools.filter((p) => statusOf(p, now) === "open").length;
    const next = pools
      .filter((p) => statusOf(p, now) === "open")
      .sort((a, b) => a.closeTime - b.closeTime)[0];
    return { staked, open, next, count: pools.length };
  }, [pools, now]);

  const grouped = useMemo(() => {
    const arr = pools.filter((p) => (filter === "all" ? true : statusOf(p, now) === filter));
    const order = (p: Pool) => {
      const s = statusOf(p, now);
      return s === "settled" ? p.settleTime + 1e15 : p.printTime; // upcoming first, settled last
    };
    arr.sort((a, b) => order(a) - order(b));
    const groups: { key: string; ts: number; pools: Pool[] }[] = [];
    for (const p of arr) {
      const k = dayKey(p.printTime);
      let g = groups.find((x) => x.key === k);
      if (!g) {
        g = { key: k, ts: p.printTime, pools: [] };
        groups.push(g);
      }
      g.pools.push(p);
    }
    return groups;
  }, [pools, now, filter]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-edge bg-gradient-to-b from-accent/[0.06] to-transparent px-6 py-10 sm:px-10 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(39,238,68,0.18), transparent 70%)" }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-white/[0.03] px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" /> settled on-chain via Chainlink Data Streams
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-[1.03] tracking-tight sm:text-6xl">
            Trade the{" "}
            <span className="bg-gradient-to-r from-accent to-accent-dim bg-clip-text text-transparent">print</span>.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Pari-mutuel pools on the post-earnings move. Pick a bucket — ±3%, ±6%,
            ±10% — before the pool closes. Winners split the pot; there are no LPs
            and no market makers, so you&apos;re only ever counterparty to other
            traders. Every print, every week, on Robinhood Chain.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-6">
            <a
              href="#calendar"
              className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-black transition-shadow hover:shadow-[0_0_28px_rgba(39,238,68,0.45)]"
            >
              See this week&apos;s prints
            </a>
            <div className="flex items-center gap-6 text-sm">
              <Stat label="open pools" value={String(stats.open)} />
              <Stat label="staked this week" value={usd(stats.staked)} />
              {stats.next && (
                <Stat
                  label={`next close · ${stats.next.symbol}`}
                  value={<Countdown target={stats.next.closeTime} />}
                  accent
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Calendar */}
      <section id="calendar" className="mt-10 scroll-mt-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarIcon width={18} height={18} className="text-accent" /> This week&apos;s earnings
          </h2>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  filter === f.key
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-edge text-muted hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {grouped.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted">No pools in this view.</p>
        ) : (
          grouped.map((g) => (
            <div key={g.key} className="mt-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">{dayLabel(g.ts)}</span>
                <span className="text-xs text-muted">{g.pools.length} print{g.pools.length > 1 ? "s" : ""}</span>
                <span className="h-px flex-1 bg-edge" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.pools.map((p) => (
                  <PoolCard key={p.id} pool={p} now={now} onOpen={() => onOpen(p.id)} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* How it works */}
      <section id="how" className="mt-14 scroll-mt-20">
        <h2 className="text-lg font-semibold">How Print works</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              Icon: CalendarIcon,
              title: "The calendar is the pipeline",
              body: "Every earnings date opens a pool. NVDA prints Wednesday 4:20 PM — the pool opens days ahead and closes at 4:00, before the number lands.",
            },
            {
              Icon: LayersIcon,
              title: "Pick a bucket",
              body: "Stake USDC on where the stock lands after the print: ±3%, ±6%, ±10%, or beyond. Seven buckets, from ≤ −10% to ≥ +10%.",
            },
            {
              Icon: ScaleIcon,
              title: "Pari-mutuel, not an order book",
              body: "No LPs, no market makers, no protocol risk. Everyone in the winning bucket splits the whole pool pro-rata. The house takes a 3% rake.",
            },
            {
              Icon: BoltIcon,
              title: "Settled the instant it's real",
              body: "Four hours after the print, the realized move comes off Chainlink Data Streams on-chain and the pool pays out automatically.",
            },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-edge bg-card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-edge bg-accent/10 text-accent">
                <Icon width={20} height={20} />
              </span>
              <h3 className="mt-4 text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/[0.05] p-5">
          <TrendUpIcon width={20} height={20} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-sm leading-relaxed text-muted">
            <span className="font-semibold text-foreground">A scheduled liquidity event, every week, forever.</span>{" "}
            The earnings calendar is a recurring reason to show up — no need to
            bootstrap liquidity or chase mercenary yield. Print is the only venue
            where the reaction to the number is tradeable the instant it lands.
          </p>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div>
      <p className={`font-mono text-sm font-semibold tnum ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
