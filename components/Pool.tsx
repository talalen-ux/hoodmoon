"use client";

import { motion } from "framer-motion";
import { pending, poolBasis, poolMid, poolStateOf, poolTvl, type Pool } from "@/lib/store";
import { bps, bpsAsPct, px, usd, usdc, timeAgo } from "@/lib/format";
import { BasisGauge, BasisSpark, StatePill, TickerAvatar, basisColor, basisTextClass } from "./primitives";
import { ArrowDownIcon, ArrowUpIcon } from "./icons";

/**
 * What mm intends to do to this pool right now, in one phrase.
 *
 * Standing still has two different reasons and they are worth telling apart:
 * a pool inside the band is simply priced, while a pool outside it that mm
 * still will not touch is one whose gap does not survive the pool's own fee at
 * any size worth landing. The second is a finding, not a shrug.
 */
export function Intent({ pool, capital }: { pool: Pool; capital: number }) {
  const f = pending(pool, capital);
  if (!f) {
    const off = poolStateOf(pool) !== "fair";
    return (
      <span
        className="font-mono text-xs text-muted"
        title={
          off
            ? "Outside the band, but the gap does not clear this pool's fee and gas at a size worth landing."
            : "Inside the band. Nothing here is worth paying gas for."
        }
      >
        — {off ? "too thin to cross" : "watching"}
      </span>
    );
  }
  const color = f.side === "sell" ? "var(--color-rich)" : "var(--color-cheap)";
  const Arrow = f.side === "sell" ? ArrowDownIcon : ArrowUpIcon;
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap font-mono text-xs" style={{ color }}>
      <Arrow width={12} height={12} />
      {f.side === "sell" ? "sell" : "buy"} {usd(f.qty * pool.ref)}
      <span className="text-accent">+{usdc(f.net)}</span>
    </span>
  );
}

/** One line of the scanner. Dense on purpose — this is a book, not a feed. */
export function PoolRow({
  pool,
  capital,
  now,
  onOpen,
}: {
  pool: Pool;
  capital: number;
  now: number;
  onOpen: () => void;
}) {
  const b = poolBasis(pool);
  const st = poolStateOf(pool);
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
          <TickerAvatar symbol={pool.symbol} size={30} radius={8} />
          <div className="leading-tight">
            <p className="font-mono text-sm font-bold">{pool.token}</p>
            <p className="text-[11px] text-muted">{pool.venue}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-sm tnum">{px(poolMid(pool))}</td>
      <td className="px-3 py-2.5 text-right font-mono text-sm text-muted tnum">{px(pool.ref)}</td>
      <td className="px-3 py-2.5 text-right">
        <span className={`font-mono text-sm font-semibold tnum ${basisTextClass(b)}`}>{bps(b)}</span>
        <span className="ml-1.5 hidden font-mono text-[11px] text-muted tnum lg:inline">
          {bpsAsPct(b)}
        </span>
      </td>
      <td className="hidden px-3 py-2.5 md:table-cell">
        <div className="w-28">
          <BasisGauge bps={b} height={8} />
        </div>
      </td>
      <td className="hidden px-3 py-2.5 lg:table-cell">
        <BasisSpark history={pool.history} width={92} height={26} />
      </td>
      <td className="hidden px-3 py-2.5 text-right font-mono text-xs text-muted tnum sm:table-cell">
        {usd(poolTvl(pool))}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-3">
          <StatePill state={st} size="sm" />
          <span className="hidden xl:inline">
            <Intent pool={pool} capital={capital} />
          </span>
        </div>
      </td>
      <td className="hidden whitespace-nowrap py-2.5 pl-3 pr-4 text-right font-mono text-[11px] text-muted lg:table-cell">
        {timeAgo(pool.lastFillTs, now)}
      </td>
    </tr>
  );
}

/** A dislocated pool, given room to breathe. Used for the top of the board. */
export function PoolCard({
  pool,
  capital,
  onOpen,
}: {
  pool: Pool;
  capital: number;
  onOpen: () => void;
}) {
  const b = poolBasis(pool);
  const st = poolStateOf(pool);
  const f = pending(pool, capital);
  const color = basisColor(b);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex flex-col gap-3 rounded-xl border border-edge bg-card p-4 text-left transition-colors hover:border-edge-strong"
      style={{ borderColor: st !== "fair" ? `${color}33` : undefined }}
    >
      <div className="flex items-center gap-3">
        <TickerAvatar symbol={pool.symbol} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[15px] font-bold">{pool.token}</span>
            <span className="truncate text-xs text-muted">{pool.name}</span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {pool.venue} · {pool.feeBps / 100}% fee
          </p>
        </div>
        <StatePill state={st} />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">basis</p>
          <p className="font-mono text-2xl font-bold tnum" style={{ color }}>
            {bps(b)}
          </p>
        </div>
        <BasisSpark history={pool.history} width={112} height={36} />
      </div>

      <BasisGauge bps={b} height={9} />

      <div className="grid grid-cols-3 gap-2 border-t border-edge pt-2.5 text-[11px]">
        <div>
          <p className="text-muted">pool</p>
          <p className="font-mono text-xs font-semibold tnum">{px(poolMid(pool))}</p>
        </div>
        <div>
          <p className="text-muted">stock</p>
          <p className="font-mono text-xs font-semibold text-muted tnum">{px(pool.ref)}</p>
        </div>
        <div className="text-right">
          <p className="text-muted">depth</p>
          <p className="font-mono text-xs font-semibold tnum">{usd(poolTvl(pool))}</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-2">
        <span className="text-[11px] text-muted">mm now</span>
        {f ? (
          <span className="font-mono text-xs" style={{ color: f.side === "sell" ? "var(--color-rich)" : "var(--color-cheap)" }}>
            {f.side === "sell" ? "selling" : "buying"} {usd(f.qty * pool.ref)}{" "}
            <span className="text-accent">→ +{usdc(f.net)}</span>
          </span>
        ) : poolStateOf(pool) !== "fair" ? (
          <span className="font-mono text-xs text-muted">
            off the mark — but too thin to cross
          </span>
        ) : (
          <span className="font-mono text-xs text-muted">inside the band — watching</span>
        )}
      </div>
    </motion.button>
  );
}
