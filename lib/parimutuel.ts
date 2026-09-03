/**
 * Pari-mutuel engine for Print.
 *
 * Every market is a mutual pool: bettors stake into buckets and the winning
 * bucket splits the whole pool (minus rake) pro-rata. No LPs, no market
 * makers — bettors are counterparty to each other. Different market kinds use
 * different bucket sets (a gap is a tight ±2% ladder; earnings is a wide ±10%
 * one), so the engine is generic over whatever `Bucket[]` a market carries.
 */

export type Bucket = {
  id: string;
  label: string;
  short: string;
  lo: number; // inclusive lower bound of the settling metric
  hi: number; // exclusive upper bound
  dir: "down" | "flat" | "up" | "neutral";
};

export type Stakes = Record<string, number>;

/** THE GAP — open vs where the token traded overnight (~3am). Tight ladder. */
export const GAP_BUCKETS: Bucket[] = [
  { id: "g0", label: "≤ −2%", short: "≤−2", lo: -Infinity, hi: -2, dir: "down" },
  { id: "g1", label: "−2% to −1%", short: "−2 / −1", lo: -2, hi: -1, dir: "down" },
  { id: "g2", label: "−1% to −0.3%", short: "−1 / −0.3", lo: -1, hi: -0.3, dir: "down" },
  { id: "g3", label: "flat ±0.3%", short: "flat", lo: -0.3, hi: 0.3, dir: "flat" },
  { id: "g4", label: "+0.3% to +1%", short: "+0.3 / +1", lo: 0.3, hi: 1, dir: "up" },
  { id: "g5", label: "+1% to +2%", short: "+1 / +2", lo: 1, hi: 2, dir: "up" },
  { id: "g6", label: "≥ +2%", short: "≥+2", lo: 2, hi: Infinity, dir: "up" },
];

/** THE CLOSE — direction and range on the cash session. */
export const CLOSE_BUCKETS: Bucket[] = [
  { id: "c0", label: "≤ −4%", short: "≤−4", lo: -Infinity, hi: -4, dir: "down" },
  { id: "c1", label: "−4% to −2%", short: "−4 / −2", lo: -4, hi: -2, dir: "down" },
  { id: "c2", label: "−2% to −1%", short: "−2 / −1", lo: -2, hi: -1, dir: "down" },
  { id: "c3", label: "flat ±1%", short: "flat", lo: -1, hi: 1, dir: "flat" },
  { id: "c4", label: "+1% to +2%", short: "+1 / +2", lo: 1, hi: 2, dir: "up" },
  { id: "c5", label: "+2% to +4%", short: "+2 / +4", lo: 2, hi: 4, dir: "up" },
  { id: "c6", label: "≥ +4%", short: "≥+4", lo: 4, hi: Infinity, dir: "up" },
];

/** EARNINGS — the wide post-print move. Seasonal marquee. */
export const EARN_BUCKETS: Bucket[] = [
  { id: "dd", label: "≤ −10%", short: "≤−10", lo: -Infinity, hi: -10, dir: "down" },
  { id: "d2", label: "−10% to −6%", short: "−10 / −6", lo: -10, hi: -6, dir: "down" },
  { id: "d1", label: "−6% to −3%", short: "−6 / −3", lo: -6, hi: -3, dir: "down" },
  { id: "fl", label: "−3% to +3%", short: "flat", lo: -3, hi: 3, dir: "flat" },
  { id: "u1", label: "+3% to +6%", short: "+3 / +6", lo: 3, hi: 6, dir: "up" },
  { id: "u2", label: "+6% to +10%", short: "+6 / +10", lo: 6, hi: 10, dir: "up" },
  { id: "uu", label: "≥ +10%", short: "≥+10", lo: 10, hi: Infinity, dir: "up" },
];

/** ROUNDS — fast 3-way on a token's move over a 15/30-min window. */
export const ROUND_BUCKETS: Bucket[] = [
  { id: "r0", label: "Down", short: "down", lo: -Infinity, hi: -0.25, dir: "down" },
  { id: "r1", label: "Flat", short: "flat", lo: -0.25, hi: 0.25, dir: "flat" },
  { id: "r2", label: "Up", short: "up", lo: 0.25, hi: Infinity, dir: "up" },
];

/** BREADTH — how many of the top 20 close green (0–20). */
export const BREADTH_BUCKETS: Bucket[] = [
  { id: "b0", label: "0–5 green", short: "0–5", lo: -0.5, hi: 5.5, dir: "down" },
  { id: "b1", label: "6–8 green", short: "6–8", lo: 5.5, hi: 8.5, dir: "down" },
  { id: "b2", label: "9–11 green", short: "9–11", lo: 8.5, hi: 11.5, dir: "flat" },
  { id: "b3", label: "12–14 green", short: "12–14", lo: 11.5, hi: 14.5, dir: "up" },
  { id: "b4", label: "15–20 green", short: "15–20", lo: 14.5, hi: 20.5, dir: "up" },
];

/** Which bucket a realized metric lands in, within a given bucket set. */
export function bucketFor(metric: number, buckets: Bucket[]): Bucket {
  return buckets.find((b) => metric >= b.lo && metric < b.hi) ?? buckets[Math.floor(buckets.length / 2)];
}

/** Kind-agnostic: sum whatever stakes exist. */
export function poolTotal(stakes: Stakes): number {
  let t = 0;
  for (const k in stakes) t += stakes[k] ?? 0;
  return t;
}

export function impliedProb(stakes: Stakes, id: string): number {
  const total = poolTotal(stakes);
  if (total <= 0) return 0;
  return (stakes[id] ?? 0) / total;
}

/** Gross return per $1 if this bucket wins. Infinite when a bucket is empty. */
export function payoutMultiple(stakes: Stakes, id: string, rakeBps: number): number {
  const stake = stakes[id] ?? 0;
  if (stake <= 0) return Infinity;
  const net = poolTotal(stakes) * (1 - rakeBps / 10_000);
  return net / stake;
}

/** Honest quote — your own stake moves the odds, so price the post-bet pool. */
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

// Rake varies by product: anchors carry the revenue, rounds run cheap for retention.
export const RAKE = {
  gap: 300,
  close: 300,
  earnings: 300,
  macro: 250,
  breadth: 150,
  round: 100,
} as const;
