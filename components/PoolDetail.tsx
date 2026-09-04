"use client";

import { useStore, poolBasis, poolMid, poolStateOf, poolTvl, pending, refIsLive, SESSION_LABEL } from "@/lib/store";
import { BAND_BPS, LEAVE_BPS, MAX_CLIP } from "@/lib/basis";
import { bps, bpsAsPct, count, px, qty, usd, usdc, timeAgo } from "@/lib/format";
import { BasisGauge, StatePill, TickerAvatar, basisColor, basisTextClass, SectionHead } from "./primitives";
import { FillTape } from "./FillTape";
import { BackIcon, BoltIcon, ShieldIcon, ArrowDownIcon, ArrowUpIcon } from "./icons";

/** The basis, over the recent past, with the no-trade band drawn through it. */
function BasisChart({ history, height = 190 }: { history: number[]; height?: number }) {
  const W = 600;
  // Scale to the bulk of the series, not to its single worst spike. One 500 bps
  // dislocation an hour ago should not flatten the last twenty minutes into a
  // straight line; the outlier clips against the top of the frame instead,
  // where the axis still says how far off the scale it went.
  const sorted = history.map(Math.abs).sort((a, b) => a - b);
  const p92 = sorted[Math.floor(sorted.length * 0.92)] ?? 0;
  const span = Math.max(250, p92 * 1.25);
  const y = (v: number) => height / 2 - (Math.max(-span, Math.min(span, v)) / span) * (height / 2 - 8);
  const x = (i: number) => (i / Math.max(1, history.length - 1)) * W;
  const d = history.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const last = history[history.length - 1] ?? 0;
  const color = basisColor(last);
  const ticks = [span, BAND_BPS, 0, -BAND_BPS, -span].filter((v, i, a) => a.indexOf(v) === i);

  return (
    // The axis sits in its own gutter — a label over the plot is a label that
    // is unreadable exactly when the line goes somewhere interesting.
    <div className="flex items-stretch gap-2">
      <div className="min-w-0 flex-1">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        aria-label="recent basis against the reference price"
        role="img"
      >
        <defs>
          <linearGradient id="basisFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.22" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x={0} y={y(BAND_BPS)} width={W} height={y(-BAND_BPS) - y(BAND_BPS)} fill="rgba(125,143,155,0.08)" />
        {ticks.map((t) => (
          <line
            key={t}
            x1={0}
            y1={y(t)}
            x2={W}
            y2={y(t)}
            stroke={t === 0 ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)"}
            strokeDasharray={t === 0 ? undefined : "3 4"}
          />
        ))}
        <path d={`${d} L ${W} ${y(0)} L 0 ${y(0)} Z`} fill="url(#basisFill)" />
        <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(history.length - 1)} cy={y(last)} r={3.5} fill={color} />
      </svg>
      </div>
      <div className="flex w-12 shrink-0 flex-col justify-between py-px text-right">
        <span className="font-mono text-[10px] text-muted">+{Math.round(span)}</span>
        <span className="font-mono text-[10px] text-muted">fair</span>
        <span className="font-mono text-[10px] text-muted">−{Math.round(span)}</span>
      </div>
    </div>
  );
}

export function PoolDetail({ poolId, onBack }: { poolId: string; onBack: () => void }) {
  const { state } = useStore();
  const pool = state.pools.find((p) => p.id === poolId);

  if (!pool) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted">Pool not found.</p>
        <button onClick={onBack} className="mt-4 text-accent">
          ← back to the board
        </button>
      </div>
    );
  }

  const b = poolBasis(pool);
  const st = poolStateOf(pool);
  const mid = poolMid(pool);
  const fade = pending(pool, state.capital);
  const marketLive = refIsLive(state.session);
  const gap = mid - pool.ref;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
      >
        <BackIcon width={16} height={16} /> the board
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <TickerAvatar symbol={pool.symbol} size={56} radius={14} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-bold">{pool.token}</h1>
            <span className="text-sm text-muted">/ USDC</span>
            <StatePill state={st} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {pool.name} · {pool.venue} · {pool.feeBps / 100}% pool fee · reference is the{" "}
            {pool.symbol} print{marketLive ? "" : `, frozen for the ${SESSION_LABEL[state.session]}`}
          </p>
        </div>
      </div>

      {/* Price line */}
      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-edge bg-card p-5">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">pool price</p>
              <p className="font-mono text-3xl font-bold tnum">{px(mid)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">the stock</p>
              <p className="font-mono text-3xl font-bold text-muted tnum">{px(pool.ref)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">basis</p>
              <p className={`font-mono text-3xl font-bold tnum ${basisTextClass(b)}`}>{bps(b)}</p>
              <p className="font-mono text-[11px] text-muted tnum">
                {bpsAsPct(b)} · {gap >= 0 ? "+" : "−"}
                {px(Math.abs(gap)).slice(1)} a share
              </p>
            </div>
          </div>
          <div className="mt-5">
            <BasisGauge bps={b} height={12} />
            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted">
              <span>cheap · mm buys</span>
              <span>±{BAND_BPS} bps band</span>
              <span>mm sells · rich</span>
            </div>
          </div>
          <div className="mt-5 border-t border-edge pt-4">
            <BasisChart history={pool.history} />
            <p className="mt-1 text-[11px] text-muted">
              Recent basis. The shaded strip is the ±{BAND_BPS} bps band mm leaves
              alone; the notches you can see cut back toward it are mm&apos;s own
              fills.
            </p>
          </div>
        </div>

        {/* What mm does about it */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-edge bg-card p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent">
              <BoltIcon width={14} height={14} /> MM RIGHT NOW
            </div>
            {fade ? (
              <>
                <p
                  className="mt-3 flex items-center gap-2 font-mono text-xl font-bold"
                  style={{ color: fade.side === "sell" ? "var(--color-rich)" : "var(--color-cheap)" }}
                >
                  {fade.side === "sell" ? (
                    <ArrowDownIcon width={18} height={18} />
                  ) : (
                    <ArrowUpIcon width={18} height={18} />
                  )}
                  {fade.side === "sell" ? "SELL" : "BUY"} {qty(fade.qty)} {pool.token}
                </p>
                <p className="text-xs text-muted">
                  {usd(fade.qty * pool.ref)} at the reference, sized off the pool&apos;s
                  own curve
                </p>

                <dl className="mt-4 space-y-2 border-t border-edge pt-3 text-sm">
                  <Row
                    k={fade.side === "sell" ? "proceeds, after pool fee" : "cost, after pool fee"}
                    v={usdc(fade.usd)}
                  />
                  <Row k="avg. execution" v={px(fade.avgPx)} dim />
                  <Row k="same size at the stock" v={usdc(fade.qty * pool.ref)} dim />
                  <div className="flex items-center justify-between border-t border-edge pt-2">
                    <dt className="text-xs text-muted">gross edge</dt>
                    <dd className="font-mono text-sm tnum">{usdc(fade.gross)}</dd>
                  </div>
                  <Row k="gas" v={`−${usdc(fade.gas)}`} dim />
                  <div className="flex items-center justify-between border-t border-edge pt-2">
                    <dt className="text-sm font-semibold">net to this epoch</dt>
                    <dd className="font-mono text-lg font-bold text-accent tnum">+{usdc(fade.net)}</dd>
                  </div>
                </dl>

                <p className="mt-3 rounded-lg bg-white/[0.03] p-2.5 text-[11px] leading-relaxed text-muted">
                  The pool&apos;s LPs keep{" "}
                  <span className="font-mono text-foreground">{usdc(fade.fee)}</span> of this
                  swap — already out of the figures above. Leaves the pool at{" "}
                  <span className="font-mono text-foreground">{bps(fade.bpsAfter)}</span>: mm
                  stops {LEAVE_BPS} bps short of fair on purpose, and never clips
                  more than {usd(MAX_CLIP)} at once.
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 font-mono text-xl font-bold text-muted">NO TRADE</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {Math.abs(b) < BAND_BPS
                    ? `The pool is inside the ±${BAND_BPS} bps band. Anything mm could do here would cost more in fees and gas than it collects, so it waits.`
                    : `The gap is real, but at a ${pool.feeBps / 100}% pool fee it does not survive the cost of crossing at any size worth landing. A thin pool has to be further wrong before it is worth trading. mm waits for it to widen.`}
                </p>
              </>
            )}
          </div>

          <div className="rounded-xl border border-edge bg-card p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted">
              <ShieldIcon width={14} height={14} /> POOL &amp; BOOK
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <Row k="depth, at the stock" v={usd(poolTvl(pool))} />
              <Row k="USDC side" v={usd(pool.rUsd)} dim />
              <Row k={`${pool.token} side`} v={`${qty(pool.rTok)} (${usd(pool.rTok * pool.ref)})`} dim />
              <Row k="fills mm has landed" v={count(pool.fills)} />
              <Row k="notional traded" v={usd(pool.volume)} dim />
              <Row k="edge earned here" v={usd(pool.earned)} />
              <Row k="last fill" v={timeAgo(pool.lastFillTs, state.now)} dim />
            </dl>
          </div>
        </div>
      </div>

      {/* Fills in this pool */}
      <section className="mt-10">
        <SectionHead
          icon={<BoltIcon width={18} height={18} className="text-accent" />}
          title={`Fills in ${pool.token}`}
          tag="this session"
        >
          Only what mm has traded against this pool. Each one fed the epoch it
          landed in, and was paid out at that quarter hour.
        </SectionHead>
        <FillTape limit={10} poolId={pool.id} />
      </section>
    </div>
  );
}

function Row({ k, v, dim }: { k: string; v: string; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className={`font-mono text-sm tnum ${dim ? "text-muted" : "text-foreground"}`}>{v}</dd>
    </div>
  );
}
