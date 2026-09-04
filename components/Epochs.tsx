"use client";

import { useEffect, useState } from "react";
import { useStore, SUPPLY, EPOCH_MS } from "@/lib/store";
import { splitEpoch, KEEPER_BPS, shareOf } from "@/lib/basis";
import { usd, usdc, count, hhmm, shortTx, countdown } from "@/lib/format";
import { ClockIcon, LinkIcon } from "./icons";

/**
 * The clock the product runs on. Fifteen minutes of realized edge accrues in
 * the open epoch; at the quarter hour it is swept and paid. Boundaries are
 * wall-clock, so every holder is on the same schedule.
 */
export function EpochClock() {
  const { state } = useStore();
  const { live, user } = state;
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const elapsed = Math.max(0, Math.min(EPOCH_MS, nowTick - live.startTs));
  const frac = elapsed / EPOCH_MS;
  const remaining = Math.max(0, live.endTs - nowTick);
  const { keeper, holders } = splitEpoch(live.net);
  const mine = user.connected ? shareOf(holders, user.mm) : 0;

  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-b from-accent/[0.07] to-transparent p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,229,154,0.16), transparent 70%)" }}
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        {/* The ring */}
        <div className="relative shrink-0 self-center">
          <svg width={128} height={128} viewBox="0 0 128 128" aria-hidden>
            <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
            <circle
              cx="64"
              cy="64"
              r={R}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - frac)}
              transform="rotate(-90 64 64)"
              style={{ transition: "stroke-dashoffset 0.5s linear", filter: "drop-shadow(0 0 6px rgba(0,229,154,0.5))" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-bold tnum text-accent">{countdown(remaining)}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted">to sweep</span>
          </div>
        </div>

        {/* The pot */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent">
            <ClockIcon width={14} height={14} />
            EPOCH {hhmm(live.startTs)}–{hhmm(live.endTs)}
          </div>
          <p className="mt-2 font-mono text-3xl font-bold tnum sm:text-4xl">
            {usdc(holders)}
          </p>
          <p className="text-xs text-muted">
            realized this epoch, going to holders — {count(live.fills)} fills,{" "}
            {usd(live.volume)} traded
          </p>

          <div className="mt-4 grid grid-cols-3 gap-x-6 gap-y-3">
            <Line label="gross edge" value={usdc(live.gross)} />
            <Line label="less gas" value={`−${usdc(live.gas)}`} dim />
            <Line label={`less keeper ${KEEPER_BPS / 100}%`} value={`−${usdc(keeper)}`} dim />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            The pools&apos; LPs kept {usdc(live.fees)} of these swaps, already out
            of the gross.
          </p>

          {user.connected ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-edge pt-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted">your share, this epoch</p>
                <p className="font-mono text-lg font-semibold text-accent tnum">{usdc(mine)}</p>
              </div>
              <p className="text-[11px] text-muted">
                {((user.mm / SUPPLY) * 100).toFixed(3)}% of supply · paid automatically at{" "}
                {hhmm(live.endTs)}
              </p>
            </div>
          ) : (
            <p className="mt-4 border-t border-edge pt-3 text-xs text-muted">
              Holding mm is the entire position. Connect to see your cut of this
              epoch accrue in real time.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Line({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`font-mono text-sm font-semibold tnum ${dim ? "text-muted" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

/** The receipt: every quarter hour that has closed, and what it paid. */
export function DistributionLog({ limit }: { limit?: number }) {
  const { state } = useStore();
  const rows = limit ? state.epochs.slice(0, limit) : state.epochs;
  const connected = state.user.connected;

  if (rows.length === 0) {
    return <p className="text-sm text-muted">No epochs have closed yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-edge bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-edge text-left text-[11px] uppercase tracking-wide text-muted">
            <th className="px-4 py-2.5 font-medium">epoch</th>
            <th className="px-4 py-2.5 font-medium">fills</th>
            <th className="px-4 py-2.5 text-right font-medium">volume</th>
            <th className="px-4 py-2.5 text-right font-medium">net</th>
            <th className="px-4 py-2.5 text-right font-medium">to holders</th>
            <th className="px-4 py-2.5 text-right font-medium">per 10k mm</th>
            {connected && <th className="px-4 py-2.5 text-right font-medium">yours</th>}
            <th className="px-4 py-2.5 text-right font-medium">tx</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.index} className="border-b border-edge/60 last:border-0">
              <td className="whitespace-nowrap px-4 py-2.5">
                <span className="font-mono text-xs">{hhmm(e.startTs)}</span>
                <span className="ml-2 text-[11px] text-muted">#{count(e.index)}</span>
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted tnum">{count(e.fills)}</td>
              <td className="px-4 py-2.5 text-right font-mono text-xs text-muted tnum">{usd(e.volume)}</td>
              <td className="px-4 py-2.5 text-right font-mono text-xs tnum">{usdc(e.net)}</td>
              <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold text-accent tnum">
                {usdc(e.holders)}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-xs text-muted tnum">
                {usdc(shareOf(e.holders, 10_000))}
              </td>
              {connected && (
                <td className="px-4 py-2.5 text-right font-mono text-xs tnum">
                  {usdc(shareOf(e.holders, state.user.mm))}
                </td>
              )}
              <td className="px-4 py-2.5 text-right">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted">
                  <LinkIcon width={11} height={11} />
                  {shortTx(e.tx)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Headline numbers for the payout stream, above the log. */
export function DistributionSummary() {
  const { state } = useStore();
  const { epochs, lifetime } = state;
  const recent = epochs.slice(0, 8);
  const avg = recent.length ? recent.reduce((a, e) => a + e.holders, 0) / recent.length : 0;
  // 96 quarter hours in a day. Trailing, and labelled as such — the book does
  // not promise this, it is simply what the last two hours actually paid.
  const perDay = avg * 96;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: "paid, all time", value: usd(lifetime.distributed), tone: "accent" as const },
        { label: "avg. per epoch", value: usdc(avg), sub: "last 8 sweeps" },
        { label: "trailing 24h rate", value: usd(perDay), sub: "at the recent pace" },
        { label: "epochs settled", value: count(lifetime.epochs), sub: "since launch" },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-edge bg-card p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted">{s.label}</p>
          <p
            className={`mt-1 font-mono text-xl font-semibold tnum ${
              s.tone === "accent" ? "text-accent" : "text-foreground"
            }`}
          >
            {s.value}
          </p>
          {s.sub && <p className="text-[11px] text-muted">{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}

