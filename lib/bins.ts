/**
 * Binned liquidity — the engine behind tide.
 *
 * A pool is a ladder of discrete price bins. Bin `i` sits at exactly
 *
 *   p(i) = (1 + binStep) ^ i
 *
 * and is a *constant-sum* pool at that single price: swapping inside a bin
 * moves no price at all, which is why binned liquidity quotes memecoins so
 * much better than a curve does. Price only moves when a bin is emptied and
 * the pool steps to the next one.
 *
 * That gives the whole model a very useful property. A bin holds base (X) or
 * quote (Y) purely as a function of where the price is relative to it:
 *
 *   bins below the active bin   → all quote  (their base has been bought)
 *   bins above the active bin   → all base   (their quote has been spent)
 *   the active bin              → both, split by how far through it price is
 *
 * So a position does not need its reserves tracked trade by trade. It is
 * fully described by how much liquidity it put in each bin — `l[]`, measured
 * in quote at that bin's own price — and the current price derives the rest.
 * Every holding, and therefore every number in the PnL panel, falls out of
 * that exactly rather than by approximation.
 */

/** Bin width, in basis points. 100 = each bin is 1% above the last. */
export type BinStep = number;

export function stepRatio(binStep: BinStep): number {
  return 1 + binStep / 10_000;
}

/** The price of bin `id`. Trades inside it execute here, with no slippage. */
export function binPrice(id: number, binStep: BinStep): number {
  return Math.pow(stepRatio(binStep), id);
}

/** The bin containing `price` — the active bin when the pool sits there. */
export function binIdAt(price: number, binStep: BinStep): number {
  return Math.floor(Math.log(price) / Math.log(stepRatio(binStep)));
}

/**
 * How far price has travelled through its bin, in [0, 1).
 *
 * This is the share of that bin's base which has already been bought, so it
 * is also the share of its liquidity now sitting in quote. At 0 the bin is
 * untouched base; approaching 1 it has been fully converted and the pool is
 * about to step up.
 */
export function binProgress(price: number, binStep: BinStep): number {
  const r = Math.log(price) / Math.log(stepRatio(binStep));
  return r - Math.floor(r);
}

// ── Liquidity shapes ────────────────────────────────────────────────────────

/**
 * How a deposit is spread across the bins it covers.
 *
 * `spot` is flat, `curve` piles into the middle, `bidask` pushes to the
 * edges. They are not cosmetic: shape decides how much of a position is
 * earning at any given price, and how violently its composition flips when
 * price runs.
 */
export type Shape = "spot" | "curve" | "bidask";

/** Normalised weights across `n` bins, summing to 1. */
export function shapeWeights(n: number, shape: Shape): number[] {
  if (n <= 0) return [];
  if (n === 1) return [1];
  const mid = (n - 1) / 2;
  const raw = Array.from({ length: n }, (_, i) => {
    switch (shape) {
      case "spot":
        return 1;
      case "curve": {
        // Bell over the range; σ chosen so the tails still hold real size.
        const z = (i - mid) / (n / 4.5);
        return Math.exp(-0.5 * z * z);
      }
      case "bidask": {
        // Weighted to the extremes — the further from centre, the more.
        return 0.12 + Math.abs(i - mid) / mid;
      }
    }
  });
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((w) => w / sum);
}

// ── Positions ───────────────────────────────────────────────────────────────

/**
 * A position is its per-bin liquidity and nothing else.
 *
 * `l[k]` is the liquidity in bin `lo + k`, denominated in quote at that bin's
 * own price. Holdings, value and impermanent loss are all derived from it and
 * the current price, so there is no per-trade state to drift out of sync.
 */
export type BinLiquidity = {
  lo: number; // lowest bin id, inclusive
  binStep: BinStep;
  l: number[]; // quote-denominated liquidity, index 0 = bin `lo`
};

export const hiBin = (b: BinLiquidity): number => b.lo + b.l.length - 1;

export function totalLiquidity(b: BinLiquidity): number {
  return b.l.reduce((a, x) => a + x, 0);
}

/**
 * Spread a deposit over `[lo, hi]`.
 *
 * Quote can only be placed at or below the active bin, and base only at or
 * above it — anywhere else the deposit would be an instant donation to
 * arbitrage. So the two sides are weighted over their own halves of the range
 * and meet in the active bin, which is the only one that holds both.
 */
export function buildPosition(args: {
  binStep: BinStep;
  activeBin: number;
  lo: number;
  hi: number;
  shape: Shape;
  amountBase: number;
  amountQuote: number;
  price: number;
}): BinLiquidity {
  const { binStep, activeBin, lo, hi, shape, amountBase, amountQuote } = args;
  const n = hi - lo + 1;
  const w = shapeWeights(n, shape);
  const l = new Array<number>(n).fill(0);

  // Quote side: bins lo..min(active, hi).
  const qHi = Math.min(activeBin, hi);
  if (amountQuote > 0 && qHi >= lo) {
    const idx = [];
    for (let i = lo; i <= qHi; i++) idx.push(i - lo);
    const sum = idx.reduce((a, k) => a + w[k], 0) || 1;
    for (const k of idx) l[k] += amountQuote * (w[k] / sum);
  }

  // Base side: bins max(active, lo)..hi, valued at each bin's own price.
  const bLo = Math.max(activeBin, lo);
  if (amountBase > 0 && bLo <= hi) {
    const idx = [];
    for (let i = bLo; i <= hi; i++) idx.push(i - lo);
    const sum = idx.reduce((a, k) => a + w[k], 0) || 1;
    for (const k of idx) l[k] += amountBase * (w[k] / sum) * binPrice(lo + k, binStep);
  }

  return { lo, binStep, l };
}

/** What a position is actually holding, at a given price. */
export type Holdings = { base: number; quote: number };

export function holdingsAt(b: BinLiquidity, price: number): Holdings {
  const active = binIdAt(price, b.binStep);
  const frac = binProgress(price, b.binStep);
  let base = 0;
  let quote = 0;
  for (let k = 0; k < b.l.length; k++) {
    const id = b.lo + k;
    const li = b.l[k];
    if (li <= 0) continue;
    if (id < active) {
      // Its base was bought on the way up; the bin is all quote now.
      quote += li;
    } else if (id > active) {
      // Never reached, so still the base it was seeded with.
      base += li / binPrice(id, b.binStep);
    } else {
      // Mid-conversion: `frac` of it has been sold into quote.
      quote += li * frac;
      base += (li * (1 - frac)) / binPrice(id, b.binStep);
    }
  }
  return { base, quote };
}

/** Position value in quote, excluding fees. */
export function valueAt(b: BinLiquidity, price: number): number {
  const h = holdingsAt(b, price);
  return h.base * price + h.quote;
}

/** True when price sits inside the position — the only time it earns. */
export function inRange(b: BinLiquidity, price: number): boolean {
  const active = binIdAt(price, b.binStep);
  return active >= b.lo && active <= hiBin(b);
}

/** A position's share of the pool's liquidity in the bin at `price`. */
export function shareOfActiveBin(
  b: BinLiquidity,
  poolLiquidityInBin: number,
  price: number
): number {
  if (poolLiquidityInBin <= 0) return 0;
  const k = binIdAt(price, b.binStep) - b.lo;
  if (k < 0 || k >= b.l.length) return 0;
  return Math.min(1, b.l[k] / poolLiquidityInBin);
}

// ── Dynamic fee ─────────────────────────────────────────────────────────────

/**
 * Fee charged on a swap, in bps: a fixed base plus a term that climbs with
 * how violently the pool has been stepping between bins.
 *
 * This is the part that makes memecoin LPing survivable. Volatility is
 * precisely when impermanent loss is worst, so it had better also be when the
 * pool charges the most — a flat fee gets picked off on exactly the candles
 * that hurt. `volatility` is an accumulator measured in bins crossed.
 *
 * The shape follows Liquidity Book's variable fee; the constants here are
 * tuned for this demo rather than lifted from any deployment.
 */
export const VAR_FEE_K = 6;
export const VAR_FEE_CAP_BPS = 400;

export function variableFeeBps(volatility: number, binStep: BinStep): number {
  const scale = binStep / 100;
  return Math.min(VAR_FEE_CAP_BPS, VAR_FEE_K * volatility * volatility * scale * scale);
}

export function totalFeeBps(baseFeeBps: number, volatility: number, binStep: BinStep): number {
  return baseFeeBps + variableFeeBps(volatility, binStep);
}

// ── PnL ─────────────────────────────────────────────────────────────────────

/**
 * The decomposition the whole product exists to show.
 *
 * Everything is in quote. The identity that has to hold, and is asserted in
 * the tests, is
 *
 *   total = pricePnl + impermanentLoss + fees - costs
 *
 * `costs` is what it took to keep the position alive: the swap fees and gas
 * of every rebalance. A strategy that follows the price is not free, and a
 * panel that quietly omitted the following would flatter it.
 *
 * `netVsHold` is the number retail actually needs and almost never gets:
 * fees earned, less costs, less what the rebalancing along the curve cost.
 * Above zero,
 * providing liquidity beat simply holding the two tokens. Below it, the
 * position lost to doing nothing — however green the total looks, because a
 * rising price flatters an LP and a falling one hides the damage.
 */
export type Pnl = {
  entryValue: number;
  currentValue: number; // position only, fees excluded
  fees: number;
  holdValue: number; // the same tokens, never deposited
  pricePnl: number;
  impermanentLoss: number; // ≤ 0 for any price move away from entry
  costs: number; // rebalance swap fees + gas, cumulative
  netVsHold: number; // fees - costs + impermanentLoss
  total: number;
  totalPct: number;
  netVsHoldPct: number;
};

export function computePnl(args: {
  entry: Holdings;
  entryPrice: number;
  position: BinLiquidity;
  price: number;
  feesBase: number;
  feesQuote: number;
  costs?: number;
}): Pnl {
  const { entry, entryPrice, position, price, feesBase, feesQuote } = args;
  const costs = args.costs ?? 0;

  /*
   * Mark everything at the active bin's price, not at the continuous price
   * the simulation carries around for charting.
   *
   * In a binned pool that is the honest mark: a bin is constant-sum, so the
   * bin's own price is the only price anything can actually be traded at.
   * Valuing the position's composition — which converts at discrete bin
   * prices — against a continuously varying mark introduces a sub-bin
   * mismatch, and that mismatch has a sign: drifting down inside the entry
   * bin made an LP look very slightly *better* off than holding, which is not
   * a real edge and must never be, since impermanent loss is exactly the cost
   * of the pool trading against you. Marking both sides at the same executable
   * price removes it, and `impermanentLoss <= 0` holds everywhere.
   */
  const mark = binPrice(binIdAt(price, position.binStep), position.binStep);
  const entryMark = binPrice(binIdAt(entryPrice, position.binStep), position.binStep);

  const entryValue = entry.base * entryMark + entry.quote;
  const h = holdingsAt(position, price);
  const currentValue = h.base * mark + h.quote;
  const fees = feesBase * mark + feesQuote;
  // What the same tokens would be worth if they had never been deposited.
  const holdValue = entry.base * mark + entry.quote;
  const pricePnl = holdValue - entryValue;
  // Everything the curve did to the composition, however many rebalances ago.
  const impermanentLoss = currentValue - holdValue;
  const netVsHold = fees - costs + impermanentLoss;
  const total = currentValue + fees - costs - entryValue;
  return {
    entryValue,
    currentValue,
    fees,
    holdValue,
    pricePnl,
    impermanentLoss,
    costs,
    netVsHold,
    total,
    totalPct: entryValue > 0 ? (total / entryValue) * 100 : 0,
    netVsHoldPct: entryValue > 0 ? (netVsHold / entryValue) * 100 : 0,
  };
}

// ── Honest yield ────────────────────────────────────────────────────────────

/**
 * Fee return over the window actually observed, and the annualised figure —
 * kept deliberately separate.
 *
 * Annualising a memecoin pool's good hour is how retail ends up staring at
 * four-digit APRs that no one has ever been paid. The UI leads with `period`
 * and the window it covers; `apr` exists so the headline number can be shown
 * next to what it assumes.
 */
export function feeReturn(feesQuote: number, positionValue: number, windowMs: number) {
  const period = positionValue > 0 ? (feesQuote / positionValue) * 100 : 0;
  const yearFraction = windowMs / (365 * 24 * 60 * 60 * 1000);
  return { period, apr: yearFraction > 0 ? period / yearFraction : 0, windowMs };
}
