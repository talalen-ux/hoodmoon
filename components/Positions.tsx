"use client";

import { useMemo } from "react";
import { useStore, positionPnl } from "@/lib/store";
import { inRange } from "@/lib/bins";
import { signedUsd, usdc } from "@/lib/format";
import { PositionCard } from "./Position";
import { SectionHead, signClass } from "./primitives";
import { BinsIcon } from "./icons";

export function Positions({ onOpenPool }: { onOpenPool: (id: string) => void }) {
  const { state } = useStore();
  const { pools, positions, now, user } = state;

  const open = positions.filter((p) => !p.closed);
  const closed = positions.filter((p) => p.closed);

  const totals = useMemo(() => {
    let value = 0;
    let fees = 0;
    let il = 0;
    let costs = 0;
    let netVsHold = 0;
    let earning = 0;
    for (const pos of open) {
      const pool = pools.find((p) => p.id === pos.poolId);
      if (!pool) continue;
      const p = positionPnl(pos, pool.price);
      value += p.currentValue;
      fees += p.fees;
      il += p.impermanentLoss;
      costs += p.costs;
      netVsHold += p.netVsHold;
      if (inRange(pos.bins, pool.price)) earning += 1;
    }
    return { value, fees, il, costs, netVsHold, earning };
  }, [open, pools]);

  if (!user.connected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <BinsIcon width={30} height={30} className="mx-auto text-muted" />
        <h2 className="mt-4 text-lg font-semibold">No wallet connected</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Connect one to open a position. In this demo that funds a mock account
          with 5,000 USDC — no keys, no funds, no chain.
        </p>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <BinsIcon width={30} height={30} className="mx-auto text-muted" />
        <h2 className="mt-4 text-lg font-semibold">Nothing open yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Pick a pool and choose a preset. Every position you open shows up here
          with the same headline: whether it is beating simply holding.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <SectionHead
        icon={<BinsIcon width={18} height={18} className="text-accent-soft" />}
        title="My positions"
        tag={`${totals.earning}/${open.length} earning`}
      >
        Fees are the flattering number. The one that matters is at the bottom:
        fees, less impermanent loss, less costs — what providing liquidity
        actually did for you compared to holding the tokens.
      </SectionHead>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-edge bg-card p-5 sm:grid-cols-5">
        <Tot label="Value" value={usdc(totals.value)} />
        <Tot label="Fees earned" value={signedUsd(totals.fees)} cls="text-up" />
        <Tot label="Impermanent loss" value={signedUsd(totals.il)} cls={signClass(totals.il)} />
        <Tot label="Costs" value={signedUsd(-totals.costs)} cls="text-down" />
        <Tot
          label="Net vs. holding"
          value={signedUsd(totals.netVsHold)}
          cls={signClass(totals.netVsHold)}
          big
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {open.map((pos) => {
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

      {closed.length > 0 && (
        <div className="mt-10">
          <SectionHead title="Closed" tag={`${closed.length}`}>
            Kept so the record includes the ones that did not work.
          </SectionHead>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {closed.map((pos) => {
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
        </div>
      )}
    </div>
  );
}

function Tot({
  label,
  value,
  cls = "",
  big,
}: {
  label: string;
  value: string;
  cls?: string;
  big?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-0.5 font-mono font-bold tnum ${big ? "text-xl" : "text-lg"} ${cls}`}>
        {value}
      </p>
    </div>
  );
}
