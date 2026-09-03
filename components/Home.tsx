"use client";

import { useMemo } from "react";
import { useStore, statusOf, type Market, type MarketKind } from "@/lib/store";
import { poolTotal, impliedProb } from "@/lib/parimutuel";
import { usd } from "@/lib/format";
import { MarketCard } from "./MarketCard";
import { Countdown, BucketBar, dirText } from "./primitives";
import { KIND_META } from "./kinds";
import { GapIcon, ClockIcon, BoltIcon, LayersIcon, TrendUpIcon } from "./icons";

const SECTIONS: { kinds: MarketKind[]; key: string }[] = [
  { key: "gap", kinds: ["gap"] },
  { key: "close", kinds: ["close"] },
  { key: "round", kinds: ["round"] },
  { key: "season", kinds: ["breadth", "macro"] },
  { key: "earnings", kinds: ["earnings"] },
];

export function Home({ onOpen }: { onOpen: (id: string) => void }) {
  const { state } = useStore();
  const { markets, now } = state;

  const gapHero = useMemo(() => {
    const gaps = markets.filter((m) => m.kind === "gap" && statusOf(m, now) === "open");
    return (
      gaps.find((m) => m.headline) ??
      [...gaps].sort((a, b) => a.closeTime - b.closeTime)[0] ??
      null
    );
  }, [markets, now]);

  const stats = useMemo(() => {
    const staked = markets.reduce((a, m) => a + poolTotal(m.stakes), 0);
    const openCount = markets.filter((m) => statusOf(m, now) === "open").length;
    const nextRound = markets
      .filter((m) => m.kind === "round" && statusOf(m, now) === "open")
      .sort((a, b) => a.closeTime - b.closeTime)[0];
    return { staked, openCount, nextRound };
  }, [markets, now]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
      {/* Hero — lead on the gap */}
      <section className="relative overflow-hidden rounded-2xl border border-edge bg-gradient-to-b from-accent/[0.06] to-transparent px-6 py-9 sm:px-10 sm:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(39,238,68,0.16), transparent 70%)" }}
        />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <GapIcon width={13} height={13} /> the daily gap · the market only this chain can run
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-[1.03] tracking-tight sm:text-6xl">
              Trade the{" "}
              <span className="bg-gradient-to-r from-accent to-accent-dim bg-clip-text text-transparent">gap</span>.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              The token trades all night. The stock doesn&apos;t. So every weekday
              there&apos;s a question with a hard answer at 9:30: where does the
              real market open versus where the token drifted overnight? Two
              guaranteed events a day — <span className="text-foreground">the gap at the open, the close at the bell</span> —
              plus rounds running underneath. Earnings are just the peak.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-5">
              <a
                href="#gap"
                className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-black transition-shadow hover:shadow-[0_0_28px_rgba(39,238,68,0.45)]"
              >
                Trade today&apos;s gaps
              </a>
              <div className="flex items-center gap-5 text-sm">
                <Stat label="open markets" value={String(stats.openCount)} />
                <Stat label="staked today" value={usd(stats.staked)} />
                {stats.nextRound && (
                  <Stat label="next round" value={<Countdown target={stats.nextRound.closeTime} />} accent />
                )}
              </div>
            </div>
          </div>

          {gapHero && <GapSpotlight market={gapHero} onOpen={() => onOpen(gapHero.id)} />}
        </div>
      </section>

      {/* Daily rhythm */}
      <Rhythm />

      {/* Sections */}
      {SECTIONS.map(({ key, kinds }) => {
        const list = markets
          .filter((m) => kinds.includes(m.kind))
          .sort((a, b) => sortMarket(a, b, now));
        if (list.length === 0) return null;
        const primary = KIND_META[kinds[0]];
        const anchorId = key === "gap" ? "gap" : key === "round" ? "rounds" : undefined;
        return (
          <section key={key} id={anchorId} className="mt-10 scroll-mt-20">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <primary.Icon width={18} height={18} className="text-accent" />
                {key === "season" ? "Macro & breadth" : primary.label}
              </h2>
              <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[11px] text-muted">
                {key === "season" ? "seasoning" : primary.tag}
              </span>
              {key === "earnings" && (
                <span className="rounded-md border border-edge px-2 py-0.5 text-[11px] text-muted">
                  seasonal — the peak, not the engine
                </span>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
              {key === "season"
                ? "High-attention macro prints and a daily market-breadth round to punctuate the calendar."
                : primary.blurb}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((m) => (
                <MarketCard key={m.id} market={m} now={now} onOpen={() => onOpen(m.id)} />
              ))}
            </div>
          </section>
        );
      })}

      {/* The thesis */}
      <section id="how" className="mt-14 scroll-mt-20">
        <h2 className="text-lg font-semibold">How the clock works</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              Icon: GapIcon,
              title: "The gap leads",
              body: "A direct bet on the seam between a 24/7 token and a 9:30-to-4:00 world. Monday's gap absorbs a whole weekend of drift with no underlying to correct it — the weekly headline.",
            },
            {
              Icon: ClockIcon,
              title: "Two anchors a day",
              body: "The gap settles at the open, the close settles at the bell. Guaranteed events every weekday, forever — the earnings calendar can't offer that.",
            },
            {
              Icon: BoltIcon,
              title: "Rounds fill the gaps",
              body: "Rotating 15–30-minute pools across 2,000+ instruments keep something always closing. Low rake — retention, not revenue.",
            },
            {
              Icon: TrendUpIcon,
              title: "Earnings are the peak",
              body: "Four dense weeks a quarter, then dead air. Treated as the marquee event, not the engine — with CPI, jobs and FOMC to punctuate the calendar between.",
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
          <LayersIcon width={20} height={20} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-sm leading-relaxed text-muted">
            <span className="font-semibold text-foreground">The timezone works in your favor.</span>{" "}
            The overnight window is US night — daytime across Asia and the Gulf,
            the chain&apos;s actual user base. The gap market is live and building
            its pot exactly when your audience is awake and the US is asleep.
          </p>
        </div>
      </section>
    </div>
  );
}

function sortMarket(a: Market, b: Market, now: number): number {
  const rank = (m: Market) => (statusOf(m, now) === "settled" ? 1 : 0);
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  return a.closeTime - b.closeTime;
}

function GapSpotlight({ market, onOpen }: { market: Market; onOpen: () => void }) {
  const top = [...market.buckets]
    .map((b) => ({ b, p: impliedProb(market.stakes, b.id) }))
    .sort((x, y) => y.p - x.p)
    .slice(0, 3);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-2xl border border-edge bg-card/80 p-5 text-left backdrop-blur transition-colors hover:border-accent/40"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-accent">
        <GapIcon width={14} height={14} /> HEADLINE GAP · {market.symbol}
      </div>
      <p className="mt-2 text-sm text-foreground">{market.title}</p>
      <p className="mt-1 text-[11px] text-muted">{market.refLabel}</p>
      <div className="mt-4">
        <BucketBar stakes={market.stakes} buckets={market.buckets} height={10} />
      </div>
      <div className="mt-3 space-y-1.5">
        {top.map(({ b, p }) => (
          <div key={b.id} className="flex items-center justify-between text-xs">
            <span className={`font-mono ${dirText(b.dir)}`}>{b.label}</span>
            <span className="font-mono tnum text-muted">{Math.round(p * 100)}%</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-edge pt-3">
        <span className="text-[11px] text-muted">pool {usd(poolTotal(market.stakes))}</span>
        <span className="font-mono text-sm font-semibold text-accent tnum">
          closes <Countdown target={market.closeTime} />
        </span>
      </div>
    </button>
  );
}

function Rhythm() {
  const beats = [
    { t: "3:00 AM", label: "token drifts overnight", tone: "muted" },
    { t: "9:30 AM", label: "THE GAP settles", tone: "accent" },
    { t: "all day", label: "rounds rotate", tone: "muted" },
    { t: "4:00 PM", label: "THE CLOSE settles", tone: "accent" },
  ];
  return (
    <div className="mt-6 overflow-x-auto no-scrollbar">
      <div className="flex min-w-max items-center gap-2 rounded-xl border border-edge bg-surface p-3">
        {beats.map((b, i) => (
          <div key={b.t} className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className={`font-mono text-xs font-semibold ${b.tone === "accent" ? "text-accent" : "text-muted"}`}>
                {b.t}
              </span>
              <span className="text-[11px] text-muted">{b.label}</span>
            </div>
            {i < beats.length - 1 && <span className="mx-1 h-px w-8 bg-edge-strong sm:w-12" />}
          </div>
        ))}
        <span className="ml-3 hidden rounded-md border border-edge px-2 py-1 text-[11px] text-muted lg:inline">
          overnight = Asia / Gulf daytime
        </span>
      </div>
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
