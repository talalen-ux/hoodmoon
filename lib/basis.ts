/**
 * Basis engine for mm.
 *
 * A tokenized equity trades in a constant-product pool against USDC, 24/7.
 * The equity it tracks trades 09:30–16:00 ET, five days a week. The pool has
 * no idea what the stock is worth — it only knows its own reserves — so the
 * two prices drift apart. That gap is the basis, and closing it is the whole
 * business:
 *
 *   pool price   P = rUsd / rTok
 *   reference    R = the real stock print (oracle)
 *   basis        (P / R − 1), quoted in bps
 *
 * When a pool trades far above the stock (P ≫ R), mm sells the token into the
 * pool: it hands the pool tokens it hedges at R and takes out USDC at the
 * pool's inflated price. The difference is the edge, and it is booked at the
 * fill — mm is not betting on reversion, it is selling something for more than
 * it costs to source.
 *
 * The size is not a guess. On a constant-product curve with reserves
 * (rTok, rUsd) and k = rTok · rUsd, selling x tokens leaves the price at
 * k / (rTok + x)², so pushing the pool from P down to a target T means
 *
 *   x = rTok · (√(P / T) − 1)
 *
 * mm stops short of fair on purpose (see LEAVE_BPS) — walking a pool all the
 * way to the reference pays the last basis points to slippage and leaves
 * nothing on the book for the next quarter-hour.
 */

/** Reserves are all we need to price a pool. */
export type Reserves = { rTok: number; rUsd: number };

/** Spot price of the pool, in USDC per token. */
export function poolPrice(p: Reserves): number {
  return p.rUsd / p.rTok;
}

/** How far the pool sits from the real stock, in basis points. */
export function basisBps(p: Reserves, ref: number): number {
  if (ref <= 0) return 0;
  return (poolPrice(p) / ref - 1) * 10_000;
}

/** Pool depth: the USDC side is the honest measure of what it can absorb. */
export function depth(p: Reserves): number {
  return p.rUsd;
}

/** What one side of the book is worth at the reference, not at the pool. */
export function tvlAtRef(p: Reserves, ref: number): number {
  return p.rUsd + p.rTok * ref;
}

export type PoolState = "rich" | "fair" | "cheap";

/** mm acts outside this band and watches inside it. */
export const BAND_BPS = 150;

export function stateOf(bps: number): PoolState {
  if (bps >= BAND_BPS) return "rich";
  if (bps <= -BAND_BPS) return "cheap";
  return "fair";
}

/**
 * Premium mm deliberately leaves on the table. Sizing to the last basis point
 * costs more in slippage than it collects, and a pool pinned exactly to the
 * oracle stops attracting the flow mm earns from.
 */
export const LEAVE_BPS = 35;

/** Largest single clip, in USDC notional. Keeps one pool from eating the book. */
export const MAX_CLIP = 400_000;

/**
 * How long mm waits before touching the same pool again. A rate limit, not a
 * strategy: ping-ponging one pool every block burns gas, crowds out the flow
 * mm earns from, and turns one clean fade into ten scrappy ones.
 */
export const COOLDOWN_MS = 90_000;

/** Flat cost of landing a fill on Robinhood Chain. */
export const GAS_USD = 0.42;

/**
 * Floor on what a fill has to be worth before mm bothers. Gas is cheap here,
 * but a trade that nets a couple of dollars is not worth the inventory it
 * moves or the block space it takes — and on a 1% pool the fee eats a thin
 * gap whole. mm waits for the basis to be worth crossing.
 */
export const MIN_NET = 8;

/** A priced, executable fade — everything needed to book the trade. */
export type Fade = {
  side: "sell" | "buy";
  qty: number; // tokens mm sends to (sell) or takes from (buy) the pool
  usd: number; // USDC out of (sell) or into (buy) the pool
  avgPx: number; // realized execution price
  /**
   * What the pool's LPs kept on the swap. Reported for the record only — it is
   * already taken out of `usd`, and therefore out of `gross`. Do not subtract
   * it again.
   */
  fee: number;
  /** Execution against the reference, already net of the pool fee. */
  gross: number;
  gas: number;
  /** What reaches the epoch: gross − gas. */
  net: number;
  after: Reserves;
  bpsAfter: number;
};

/**
 * Price the trade that walks `p` from wherever it is toward `ref`, stopping
 * LEAVE_BPS short and never risking more than `maxUsd` of notional.
 *
 * Returns null when the pool is inside the band, or when the edge left after
 * the pool's own fee and gas is too thin to be worth crossing (see MIN_NET).
 */
export function priceFade(
  p: Reserves,
  ref: number,
  feeBps: number,
  maxUsd: number = MAX_CLIP
): Fade | null {
  const bps = basisBps(p, ref);
  const side: "sell" | "buy" = bps > 0 ? "sell" : "buy";
  if (Math.abs(bps) < BAND_BPS) return null;

  const P = poolPrice(p);
  const k = p.rTok * p.rUsd;
  const f = feeBps / 10_000;

  // Stop short of the reference, on whichever side of it we are.
  const target = side === "sell" ? ref * (1 + LEAVE_BPS / 10_000) : ref * (1 - LEAVE_BPS / 10_000);

  if (side === "sell") {
    // Sell tokens in, take USDC out. Fee is charged on the token input.
    let qty = p.rTok * (Math.sqrt(P / target) - 1);
    if (qty <= 0) return null;
    // Clip on notional, valued at the reference — the capital actually at risk.
    const cap = Math.min(maxUsd, MAX_CLIP) / ref;
    if (qty > cap) qty = cap;

    const usdNoFee = p.rUsd - k / (p.rTok + qty);
    const usd = p.rUsd - k / (p.rTok + qty * (1 - f));
    const fee = usdNoFee - usd;
    const gross = usd - qty * ref; // sold above fair by this much
    const net = gross - GAS_USD;
    if (net < MIN_NET) return null;

    const after = { rTok: p.rTok + qty, rUsd: p.rUsd - usd };
    return {
      side,
      qty,
      usd,
      avgPx: usd / qty,
      fee,
      gross,
      gas: GAS_USD,
      net,
      after,
      bpsAfter: basisBps(after, ref),
    };
  }

  // Pool is cheap: buy tokens out of it with USDC, hedge the other way.
  let usdIn = p.rUsd * (Math.sqrt(target / P) - 1);
  if (usdIn <= 0) return null;
  if (usdIn > Math.min(maxUsd, MAX_CLIP)) usdIn = Math.min(maxUsd, MAX_CLIP);

  const qtyNoFee = p.rTok - k / (p.rUsd + usdIn);
  const qty = p.rTok - k / (p.rUsd + usdIn * (1 - f));
  const feeTokens = qtyNoFee - qty;
  const fee = feeTokens * ref;
  const gross = qty * ref - usdIn; // bought below fair by this much
  const net = gross - GAS_USD;
  if (net < MIN_NET) return null;

  const after = { rTok: p.rTok - qty, rUsd: p.rUsd + usdIn };
  return {
    side,
    qty,
    usd: usdIn,
    avgPx: usdIn / qty,
    fee,
    gas: GAS_USD,
    gross,
    net,
    after,
    bpsAfter: basisBps(after, ref),
  };
}

/** Move a pool to a new spot price without changing its depth (k held fixed). */
export function repriceTo(p: Reserves, price: number): Reserves {
  const k = p.rTok * p.rUsd;
  return { rTok: Math.sqrt(k / price), rUsd: Math.sqrt(k * price) };
}

// ── Distribution ────────────────────────────────────────────────────────────

/** The clock the whole product runs on. */
export const EPOCH_MS = 15 * 60_000;

/** Fixed supply. A holder's claim is their share of it, nothing more. */
export const SUPPLY = 100_000_000;

/**
 * Cut retained to pay the keepers that run the bots and land the sweep. The
 * rest — every cent of it — goes to holders.
 */
export const KEEPER_BPS = 1_000;

/** Epoch boundaries are wall-clock quarter hours, not per-user timers. */
export function epochStart(ts: number): number {
  return Math.floor(ts / EPOCH_MS) * EPOCH_MS;
}

export function epochIndex(ts: number): number {
  return Math.floor(ts / EPOCH_MS);
}

/** Split an epoch's realized profit into the keeper cut and the holder pot. */
export function splitEpoch(net: number): { keeper: number; holders: number } {
  const keeper = Math.max(0, net) * (KEEPER_BPS / 10_000);
  return { keeper, holders: Math.max(0, net) - keeper };
}

/** What a balance of `bal` mm earns from a pot of `holders`. */
export function shareOf(holders: number, bal: number): number {
  return holders * (bal / SUPPLY);
}
