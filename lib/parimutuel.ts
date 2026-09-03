/**
 * Pari-mutuel engine for Print.
 *
 * Every earnings pool is a mutual pool: bettors stake into signed % buckets
 * of the post-print move. There are no LPs and no market makers — bettors are
 * counterparty to each other. Winners split the entire pool (minus the house
 * rake) pro-rata to their stake in the winning bucket. Odds are therefore
 * implied by the pool itself and drift as money comes in, right up to close.
 */

export type Bucket = {
  id: string;
  label: string;
  short: string;
  lo: number; // inclusive lower bound (% move)
  hi: number; // exclusive upper bound
  dir: "down" | "flat" | "up";
};

// Seven signed buckets at the ±3 / ±6 / ±10 breakpoints from the brief.
export const BUCKETS: Bucket[] = [
  { id: "dd", label: "≤ −10%", short: "≤−10", lo: -Infinity, hi: -10, dir: "down" },
  { id: "d2", label: "−10% to −6%", short: "−10 / −6", lo: -10, hi: -6, dir: "down" },
  { id: "d1", label: "−6% to −3%", short: "−6 / −3", lo: -6, hi: -3, dir: "down" },
  { id: "fl", label: "−3% to +3%", short: "flat", lo: -3, hi: 3, dir: "flat" },
  { id: "u1", label: "+3% to +6%", short: "+3 / +6", lo: 3, hi: 6, dir: "up" },
  { id: "u2", label: "+6% to +10%", short: "+6 / +10", lo: 6, hi: 10, dir: "up" },
  { id: "uu", label: "≥ +10%", short: "≥+10", lo: 10, hi: Infinity, dir: "up" },
];

export const BUCKET_IDS = BUCKETS.map((b) => b.id);

export type Stakes = Record<string, number>;

/** Which bucket a realized move lands in. */
export function bucketForMove(move: number): Bucket {
  return BUCKETS.find((b) => move >= b.lo && move < b.hi) ?? BUCKETS[3];
}

export function poolTotal(stakes: Stakes): number {
  return BUCKET_IDS.reduce((a, id) => a + (stakes[id] ?? 0), 0);
}

/** Share of the pool sitting in a bucket → the crowd's implied probability. */
export function impliedProb(stakes: Stakes, id: string): number {
  const total = poolTotal(stakes);
  if (total <= 0) return 0;
  return (stakes[id] ?? 0) / total;
}

/**
 * Gross return per $1 if this bucket wins, at the current pool. Includes the
 * returned stake (2.0× = double your money). Infinite when a bucket is empty.
 */
export function payoutMultiple(stakes: Stakes, id: string, rakeBps: number): number {
  const stake = stakes[id] ?? 0;
  if (stake <= 0) return Infinity;
  const net = poolTotal(stakes) * (1 - rakeBps / 10_000);
  return net / stake;
}

/**
 * Honest quote for staking `amount` into a bucket: your own money moves the
 * odds, so we price against the post-bet pool.
 */
export function quote(
  stakes: Stakes,
  id: string,
  amount: number,
  rakeBps: number
): { multiple: number; grossIfWin: number; profitIfWin: number; newProb: number } {
  const stake = (stakes[id] ?? 0) + amount;
  const total = poolTotal(stakes) + amount;
  const net = total * (1 - rakeBps / 10_000);
  const share = stake > 0 ? amount / stake : 0;
  const grossIfWin = share * net;
  return {
    multiple: amount > 0 ? grossIfWin / amount : 0,
    grossIfWin,
    profitIfWin: grossIfWin - amount,
    newProb: total > 0 ? stake / total : 0,
  };
}

/** Settle a position: what a stake in `bucket` pays given the winning bucket. */
export function settlePayout(
  stakes: Stakes,
  bucket: string,
  stakeInBucket: number,
  winner: string,
  rakeBps: number
): number {
  if (bucket !== winner) return 0;
  const winStake = stakes[winner] ?? 0;
  if (winStake <= 0) return 0;
  const net = poolTotal(stakes) * (1 - rakeBps / 10_000);
  return (stakeInBucket / winStake) * net;
}

export const RAKE_BPS = 300; // 3% house rake
