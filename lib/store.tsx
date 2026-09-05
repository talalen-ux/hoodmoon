"use client";

/**
 * Client-side simulation of the tide book. No chain is read or written —
 * every pool, price, swap, fee and position is generated in the browser.
 *
 * What it simulates is the loop the real product would run on-chain:
 *
 *   1. Pools quote a memecoin against USDC in discrete bins. Price walks;
 *      volume follows volatility, because that is when people actually trade.
 *   2. Each swap pays a fee that climbs with volatility, split across the bins
 *      it crossed in proportion to the liquidity sitting in them.
 *   3. A position earns only from the bins price is actually in. Out of range
 *      it earns nothing, which is the single fact retail LPing gets wrong.
 *   4. Follow positions recenter when price leaves them — and pay for it, in
 *      swap fees and gas, every time.
 *
 * The prices are real-ish starting points for recognisable tokens; everything
 * after tick zero is invented. Nothing here is market data.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import {
  binIdAt,
  binPrice,
  buildPosition,
  computePnl,
  holdingsAt,
  hiBin,
  inRange,
  shapeWeights,
  totalFeeBps,
  valueAt,
  type BinLiquidity,
  type Holdings,
  type Shape,
} from "./bins";

// ── Presets ─────────────────────────────────────────────────────────────────

export type PresetId = "tight" | "follow" | "wide" | "bid";

export type Preset = {
  id: PresetId;
  label: string;
  tagline: string;
  /** What it actually does, without the marketing. */
  body: string;
  /** The honest downside. Every preset has one. */
  risk: string;
  shape: Shape;
  halfWidth: number; // bins either side of the active bin
  follow: boolean; // recenter when price leaves the range
  oneSided: boolean; // quote only, placed below price
};

export const PRESETS: Preset[] = [
  {
    id: "tight",
    label: "Tight",
    tagline: "Earns hardest, breaks first",
    body: "Liquidity packed into a narrow band around the current price. While price stays put this collects the most fees of any preset, because your share of the active bin is at its largest.",
    risk: "A move of a few percent takes it out of range, and it stops earning entirely until price comes back. It also takes the most impermanent loss when price runs.",
    shape: "curve",
    halfWidth: 8,
    follow: false,
    oneSided: false,
  },
  {
    id: "follow",
    label: "Follow",
    tagline: "Recenters itself as price moves",
    body: "A medium band that recenters on the price whenever it drifts out. In practice it is in range almost all the time, so it keeps earning through a trend instead of going idle.",
    risk: "Each recenter is a real swap: it pays fees and gas, and it locks in the impermanent loss up to that point instead of leaving it to recover. Choppy markets rebalance most and cost most.",
    shape: "spot",
    halfWidth: 22,
    follow: true,
    oneSided: false,
  },
  {
    id: "wide",
    label: "Wide",
    tagline: "Rarely out of range",
    body: "Spread thin across a broad band. It survives most memecoin candles without needing attention and takes far less impermanent loss than a tight range on the same move.",
    risk: "Your share of any single bin is small, so fees per dollar are the lowest here. On a token that just chops sideways, a tight range would have earned considerably more.",
    shape: "spot",
    halfWidth: 60,
    follow: false,
    oneSided: false,
  },
  {
    id: "bid",
    label: "Bid ladder",
    tagline: "Get paid to wait for a lower price",
    body: "USDC only, laddered below the current price. If price never falls that far you simply hold your USDC and earn nothing; if it does, you are filled into the token gradually, and paid fees on the way down.",
    risk: "Being filled means price fell — you end up holding a token that is worth less than when you set the ladder. This is a way to buy a dip you already wanted, not a way to avoid one.",
    shape: "bidask",
    halfWidth: 45,
    follow: false,
    oneSided: true,
  },
];

export const presetById = (id: PresetId): Preset => PRESETS.find((p) => p.id === id)!;

// ── Safety ──────────────────────────────────────────────────────────────────

/**
 * Facts about a token that anyone can read off the chain and reproduce.
 *
 * Deliberately not a score. A score invites people to read judgement into
 * what is really just a list of checks, and the checks do not add up to
 * "safe" — a token can pass every one of these and still go to zero, which
 * is the normal outcome. The UI states each fact and lets the user decide.
 */
export type Safety = {
  ownershipRenounced: boolean;
  liquidityLocked: boolean;
  lockedPct: number;
  noTransferTax: boolean;
  topHolderPct: number; // largest non-pool holder
  ageDays: number;
};

export function safetyFlags(s: Safety): { failed: number; total: number } {
  const checks = [
    s.ownershipRenounced,
    s.liquidityLocked,
    s.noTransferTax,
    s.topHolderPct < 10,
    s.ageDays >= 7,
  ];
  return { failed: checks.filter((c) => !c).length, total: checks.length };
}

// ── Pools ───────────────────────────────────────────────────────────────────

export type Pool = {
  id: string;
  symbol: string;
  binStep: number;
  baseFeeBps: number;
  price: number;
  price24hAgo: number;
  /** Volatility accumulator, in bins crossed. Drives the variable fee. */
  volatility: number;
  tvl: number;
  volume24h: number;
  fees24h: number;
  /** Recent price, oldest first — for the sparkline. */
  history: number[];
  safety: Safety;
  createdAt: number;
};

/** The pool's liquidity in a single bin, from its overall depth and shape. */
export function poolLiquidityInBin(pool: Pool, binId: number): number {
  const active = binIdAt(pool.price, pool.binStep);
  const spread = 45; // other LPs cluster within roughly this many bins
  const d = Math.abs(binId - active);
  if (d > spread) return 0;
  const z = d / (spread / 2.2);
  const w = Math.exp(-0.5 * z * z);
  // Normalise so the whole profile sums to the pool's TVL.
  let norm = 0;
  for (let k = -spread; k <= spread; k++) {
    const zz = Math.abs(k) / (spread / 2.2);
    norm += Math.exp(-0.5 * zz * zz);
  }
  return (pool.tvl * w) / norm;
}

export function currentFeeBps(pool: Pool): number {
  return totalFeeBps(pool.baseFeeBps, pool.volatility, pool.binStep);
}

/** Fee return over the last 24h, and what annualising it would claim. */
export function poolYield(pool: Pool) {
  const period = pool.tvl > 0 ? (pool.fees24h / pool.tvl) * 100 : 0;
  return { period, apr: period * 365 };
}

// ── Positions ───────────────────────────────────────────────────────────────

export type Position = {
  id: string;
  poolId: string;
  symbol: string;
  preset: PresetId;
  bins: BinLiquidity;
  entry: Holdings;
  entryPrice: number;
  openedAt: number;
  feesBase: number;
  feesQuote: number;
  costs: number; // rebalance swap fees + gas
  rebalances: number;
  lastRebalance: number;
  ticksInRange: number;
  ticksTotal: number;
  closed?: { at: number; value: number };
};

/**
 * How old a position is in the market's terms, not the browser's.
 *
 * The simulation runs at TIME_SCALE, so a minute of watching is an hour and a
 * half of pool activity. Reporting "1.1% of fees in 48 seconds" would imply a
 * yield nobody has ever earned; every age and fee window on screen is
 * therefore scaled to the time the pool thinks has passed.
 */
export function simAge(p: Position, now: number): number {
  return Math.max(0, now - p.openedAt) * TIME_SCALE;
}

export function timeInRange(p: Position): number {
  return p.ticksTotal > 0 ? (p.ticksInRange / p.ticksTotal) * 100 : 0;
}

export function positionPnl(p: Position, price: number) {
  return computePnl({
    entry: p.entry,
    entryPrice: p.entryPrice,
    position: p.bins,
    price,
    feesBase: p.feesBase,
    feesQuote: p.feesQuote,
    costs: p.costs,
  });
}

export type Swap = {
  id: string;
  poolId: string;
  symbol: string;
  ts: number;
  side: "buy" | "sell";
  sizeQuote: number;
  feeBps: number;
  feeQuote: number;
};

export type User = { connected: boolean; address: string; usdc: number };

type State = {
  pools: Pool[];
  positions: Position[];
  swaps: Swap[];
  user: User;
  now: number;
};

// ── Seed ────────────────────────────────────────────────────────────────────

const MAX_SWAPS = 160;
const HISTORY = 72;
const DAY = 86_400_000;

let idc = 1;
const uid = () => `${Date.now().toString(36)}${(idc++).toString(36)}`;
const hex = (n: number) =>
  Array.from({ length: n }, () => "0123456789abcdef"[(Math.random() * 16) | 0]).join("");
const addr = () => `0x${hex(40)}`;

function gaussian(sd: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
}

type Spec = {
  sym: string;
  px: number;
  tvl: number;
  volMult: number; // 24h volume as a multiple of TVL
  binStep: number;
  baseFee: number;
  vol: number; // how violent this token is
  chg: number; // 24h change, as a fraction
  safety: Safety;
};

const SAFE: Safety = {
  ownershipRenounced: true,
  liquidityLocked: true,
  lockedPct: 100,
  noTransferTax: true,
  topHolderPct: 3.1,
  ageDays: 420,
};

const SPECS: Spec[] = [
  { sym: "PEPE", px: 0.0000095, tvl: 3_400_000, volMult: 2.4, binStep: 50, baseFee: 50, vol: 0.9, chg: 0.062, safety: { ...SAFE, topHolderPct: 4.2, ageDays: 610 } },
  { sym: "WIF", px: 0.62, tvl: 2_150_000, volMult: 3.1, binStep: 80, baseFee: 80, vol: 1.15, chg: -0.048, safety: { ...SAFE, topHolderPct: 5.8, ageDays: 520 } },
  { sym: "BONK", px: 0.0000185, tvl: 1_820_000, volMult: 2.8, binStep: 50, baseFee: 50, vol: 1.0, chg: 0.031, safety: { ...SAFE, topHolderPct: 6.4, ageDays: 580 } },
  { sym: "DOGE", px: 0.1624, tvl: 1_640_000, volMult: 1.4, binStep: 25, baseFee: 30, vol: 0.55, chg: 0.012, safety: { ...SAFE, topHolderPct: 2.4, ageDays: 900 } },
  { sym: "POPCAT", px: 0.284, tvl: 940_000, volMult: 4.2, binStep: 100, baseFee: 100, vol: 1.5, chg: 0.118, safety: { ...SAFE, topHolderPct: 7.9, ageDays: 380 } },
  { sym: "SHIB", px: 0.0000098, tvl: 880_000, volMult: 1.2, binStep: 25, baseFee: 30, vol: 0.5, chg: -0.008, safety: { ...SAFE, topHolderPct: 3.3, ageDays: 880 } },
  { sym: "BRETT", px: 0.0452, tvl: 720_000, volMult: 3.5, binStep: 100, baseFee: 100, vol: 1.35, chg: -0.072, safety: { ...SAFE, topHolderPct: 8.6, ageDays: 340 } },
  { sym: "MOG", px: 0.0000012, tvl: 610_000, volMult: 3.8, binStep: 100, baseFee: 100, vol: 1.45, chg: 0.094, safety: { ...SAFE, topHolderPct: 9.2, ageDays: 400 } },
  { sym: "SPX", px: 0.552, tvl: 540_000, volMult: 4.6, binStep: 100, baseFee: 100, vol: 1.6, chg: 0.152, safety: { ...SAFE, topHolderPct: 6.1, ageDays: 300 } },
  { sym: "TURBO", px: 0.0032, tvl: 410_000, volMult: 5.1, binStep: 125, baseFee: 120, vol: 1.7, chg: -0.096, safety: { ...SAFE, topHolderPct: 11.4, ageDays: 290 } },
  { sym: "MEW", px: 0.0035, tvl: 330_000, volMult: 4.4, binStep: 125, baseFee: 120, vol: 1.6, chg: 0.041, safety: { ...SAFE, topHolderPct: 12.8, ageDays: 250 } },
  { sym: "GIGA", px: 0.0114, tvl: 280_000, volMult: 5.6, binStep: 125, baseFee: 120, vol: 1.85, chg: 0.223, safety: { ...SAFE, topHolderPct: 9.7, ageDays: 190 } },
  { sym: "PONKE", px: 0.212, tvl: 190_000, volMult: 6.2, binStep: 150, baseFee: 150, vol: 2.1, chg: -0.164, safety: { ...SAFE, liquidityLocked: false, lockedPct: 42, topHolderPct: 14.6, ageDays: 120 } },
  { sym: "MICHI", px: 0.0318, tvl: 140_000, volMult: 7.4, binStep: 200, baseFee: 180, vol: 2.4, chg: 0.318, safety: { ...SAFE, ownershipRenounced: false, liquidityLocked: false, lockedPct: 18, topHolderPct: 21.3, ageDays: 11 } },
];

function seedPool(s: Spec, now: number): Pool {
  const history: number[] = [];
  let p = s.px / (1 + s.chg);
  for (let i = 0; i < HISTORY; i++) {
    p *= 1 + s.chg / HISTORY + gaussian(0.004 * s.vol);
    history.push(p);
  }
  history[HISTORY - 1] = s.px;
  const volume24h = s.tvl * s.volMult;
  return {
    id: `p_${s.sym.toLowerCase()}`,
    symbol: s.sym,
    binStep: s.binStep,
    baseFeeBps: s.baseFee,
    price: s.px,
    price24hAgo: s.px / (1 + s.chg),
    volatility: 1.2 + Math.random() * s.vol * 2,
    tvl: s.tvl,
    volume24h,
    // Averaged over the day, using the same curve the pool charges live —
    // base fee plus the surcharge at a typical volatility for this token — so
    // the board's 24h figure and the pool's current fee tell one story.
    fees24h: volume24h * (totalFeeBps(s.baseFee, 2.4 * s.vol, s.binStep) / 10_000),
    history,
    safety: s.safety,
    createdAt: now - s.safety.ageDays * DAY,
  };
}

function seedState(now: number): State {
  return {
    pools: SPECS.map((s) => seedPool(s, now)),
    positions: [],
    swaps: [],
    user: { connected: false, address: "", usdc: 0 },
    now,
  };
}

function emptyState(): State {
  return { pools: [], positions: [], swaps: [], user: { connected: false, address: "", usdc: 0 }, now: 0 };
}

// ── Opening a position ──────────────────────────────────────────────────────

/**
 * Turn a plain "put $X into WIF on Follow" into actual bins.
 *
 * Balanced presets need roughly half the deposit as base, so they take a swap
 * on the way in — charged here, not hidden, because it is the user's money.
 * A bid ladder needs no swap at all: it is quote sitting below the price,
 * which is the whole appeal.
 */
export function openPosition(args: {
  pool: Pool;
  preset: Preset;
  amountUsd: number;
  now: number;
}): Position {
  const { pool, preset, amountUsd, now } = args;
  const active = binIdAt(pool.price, pool.binStep);

  let lo: number;
  let hi: number;
  let amountQuote: number;
  let amountBase: number;
  let entryCost = 0;

  if (preset.oneSided) {
    // Entirely below price: no swap, no base.
    lo = active - preset.halfWidth;
    hi = active - 1;
    amountQuote = amountUsd;
    amountBase = 0;
  } else {
    lo = active - preset.halfWidth;
    hi = active + preset.halfWidth;
    // Half the deposit is swapped into the token, paying the pool's fee.
    const half = amountUsd / 2;
    const swapFee = half * (currentFeeBps(pool) / 10_000);
    entryCost = swapFee;
    amountQuote = half;
    amountBase = (half - swapFee) / pool.price;
  }

  const bins = buildPosition({
    binStep: pool.binStep,
    activeBin: active,
    lo,
    hi,
    shape: preset.shape,
    amountBase,
    amountQuote,
    price: pool.price,
  });

  const entry = holdingsAt(bins, pool.price);
  return {
    id: uid(),
    poolId: pool.id,
    symbol: pool.symbol,
    preset: preset.id,
    bins,
    entry,
    entryPrice: pool.price,
    openedAt: now,
    feesBase: 0,
    feesQuote: 0,
    costs: entryCost,
    rebalances: 0,
    lastRebalance: 0,
    ticksInRange: 0,
    ticksTotal: 0,
  };
}

/**
 * Recenter a Follow position on the current price.
 *
 * The position is rebuilt from what it is actually holding now, so whatever
 * impermanent loss it had accumulated is realised at this moment rather than
 * left open to recover. The swap back to a balanced split costs the pool fee,
 * and landing the transaction costs gas; both go on the position's tab.
 */
export const REBALANCE_GAS = 0.18;

function rebalance(pos: Position, pool: Pool, now: number): Position {
  const preset = presetById(pos.preset);
  const active = binIdAt(pool.price, pool.binStep);
  const h = holdingsAt(pos.bins, pool.price);
  const value = h.base * pool.price + h.quote;

  // Bring the composition back to balanced; only the imbalance gets swapped.
  const targetQuote = value / 2;
  const swapNotional = Math.abs(h.quote - targetQuote);
  const swapFee = swapNotional * (currentFeeBps(pool) / 10_000);
  const net = value - swapFee - REBALANCE_GAS;
  if (net <= 0) return pos;

  const bins = buildPosition({
    binStep: pool.binStep,
    activeBin: active,
    lo: active - preset.halfWidth,
    hi: active + preset.halfWidth,
    shape: preset.shape,
    amountBase: net / 2 / pool.price,
    amountQuote: net / 2,
    price: pool.price,
  });

  return {
    ...pos,
    bins,
    costs: pos.costs + swapFee + REBALANCE_GAS,
    rebalances: pos.rebalances + 1,
    lastRebalance: now,
  };
}

// ── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "HYDRATE"; state: State }
  | { type: "CONNECT" }
  | { type: "DISCONNECT" }
  | { type: "OPEN"; poolId: string; preset: PresetId; amountUsd: number }
  | { type: "CLOSE"; positionId: string }
  | { type: "TICK"; now: number };

const TICK_MS = 1500;
/** Simulated minutes that pass per tick, so a session shows a real session. */
const TIME_SCALE = 90;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "CONNECT":
      return { ...state, user: { connected: true, address: addr(), usdc: 5_000 } };

    case "DISCONNECT":
      return { ...state, user: { connected: false, address: "", usdc: 0 }, positions: [] };

    case "OPEN": {
      const pool = state.pools.find((p) => p.id === action.poolId);
      if (!pool || !state.user.connected) return state;
      const amount = Math.min(action.amountUsd, state.user.usdc);
      if (amount <= 0) return state;
      const pos = openPosition({
        pool,
        preset: presetById(action.preset),
        amountUsd: amount,
        now: state.now,
      });
      return {
        ...state,
        positions: [pos, ...state.positions],
        user: { ...state.user, usdc: state.user.usdc - amount },
      };
    }

    case "CLOSE": {
      const pos = state.positions.find((p) => p.id === action.positionId);
      if (!pos || pos.closed) return state;
      const pool = state.pools.find((p) => p.id === pos.poolId)!;
      // Everything comes out as USDC, so the token side is sold at the pool fee.
      const h = holdingsAt(pos.bins, pool.price);
      const baseValue = h.base * pool.price;
      const exitFee = baseValue * (currentFeeBps(pool) / 10_000);
      const fees = pos.feesBase * pool.price + pos.feesQuote;
      const proceeds = baseValue - exitFee + h.quote + fees;
      return {
        ...state,
        positions: state.positions.map((p) =>
          p.id === pos.id
            ? { ...p, costs: p.costs + exitFee, closed: { at: state.now, value: proceeds } }
            : p
        ),
        user: { ...state.user, usdc: state.user.usdc + proceeds },
      };
    }

    case "TICK": {
      const now = action.now;
      const dtMin = (TICK_MS / 60_000) * TIME_SCALE;
      const newSwaps: Swap[] = [];

      const pools = state.pools.map((p0) => {
        const p = { ...p0 };
        const spec = SPECS.find((s) => s.sym === p.symbol)!;
        const before = binIdAt(p.price, p.binStep);

        // Memecoins trend, chop, and occasionally fall off a cliff.
        const drift = gaussian(0.0016 * spec.vol);
        const jump = Math.random() < 0.012 ? gaussian(0.05 * spec.vol) : 0;
        p.price = Math.max(1e-12, p.price * (1 + drift + jump));

        const after = binIdAt(p.price, p.binStep);
        const crossed = Math.abs(after - before);

        // Volatility decays toward calm and spikes on every bin crossed.
        p.volatility = Math.max(0, p.volatility * 0.94 + crossed * 1.8);

        // Volume tracks volatility — nobody trades a flat chart.
        const baseFlow = (p.volume24h / (24 * 60)) * dtMin;
        const sizeQuote = baseFlow * (0.5 + Math.random() * 0.6 + p.volatility * 0.16);
        const feeBps = currentFeeBps(p);
        const feeQuote = sizeQuote * (feeBps / 10_000);

        p.fees24h = p.fees24h * 0.999 + feeQuote;
        p.volume24h = p.volume24h * 0.999 + sizeQuote * 0.001 * 24;
        p.history = [...p.history, p.price].slice(-HISTORY);

        // A tick is a couple of simulated minutes of flow, not one trade. Break
        // it into individual swaps so the tape shows trades at sizes a real
        // pool sees, while the totals stay exactly what the pool earned.
        const parts = 2 + ((Math.random() * 3) | 0);
        const weights = Array.from({ length: parts }, () => 0.4 + Math.random());
        const wsum = weights.reduce((a, b) => a + b, 0);
        for (let i = 0; i < parts; i++) {
          const share = weights[i] / wsum;
          newSwaps.push({
            id: uid(),
            poolId: p.id,
            symbol: p.symbol,
            ts: now - Math.round((parts - 1 - i) * 900),
            // Net direction follows the price, but not every trade agrees.
            side: Math.random() < 0.72 ? (after >= before ? "buy" : "sell") : after >= before ? "sell" : "buy",
            sizeQuote: sizeQuote * share,
            feeBps,
            feeQuote: feeQuote * share,
          });
        }

        // Stash this tick's swap on the pool so positions can be paid from it.
        (p as Pool & { _tick?: TickInfo })._tick = {
          before,
          after,
          feeQuote,
          rose: p.price >= p0.price,
        };
        return p;
      });

      let positions = state.positions.map((pos) => {
        if (pos.closed) return pos;
        const pool = pools.find((p) => p.id === pos.poolId) as Pool & { _tick?: TickInfo };
        if (!pool?._tick) return pos;
        const t = pool._tick;

        let next = { ...pos, ticksTotal: pos.ticksTotal + 1 };
        if (inRange(pos.bins, pool.price)) next.ticksInRange += 1;

        // Fees go to the bins price actually crossed, split by liquidity share.
        const from = Math.min(t.before, t.after);
        const to = Math.max(t.before, t.after);
        let poolShare = 0;
        let mine = 0;
        for (let id = from; id <= to; id++) {
          const poolL = poolLiquidityInBin(pool, id);
          if (poolL <= 0) continue;
          poolShare += poolL;
          const k = id - pos.bins.lo;
          if (k >= 0 && k < pos.bins.l.length) mine += Math.min(pos.bins.l[k], poolL);
        }
        if (poolShare > 0 && mine > 0) {
          const cut = t.feeQuote * (mine / poolShare);
          // Fees are paid in whatever token the trader put in.
          if (t.rose) next.feesQuote += cut;
          else next.feesBase += cut / pool.price;
        }

        const preset = presetById(next.preset);
        if (preset.follow && !inRange(next.bins, pool.price) && now - next.lastRebalance > 4000) {
          next = rebalance(next, pool, now);
        }
        return next;
      });

      // Drop the scratch field so it never reaches storage or the UI.
      const clean = pools.map((p) => {
        const c = { ...p } as Pool & { _tick?: TickInfo };
        delete c._tick;
        return c as Pool;
      });

      return {
        ...state,
        now,
        pools: clean,
        positions,
        swaps: newSwaps.length ? [...newSwaps, ...state.swaps].slice(0, MAX_SWAPS) : state.swaps,
      };
    }

    default:
      return state;
  }
}

type TickInfo = { before: number; after: number; feeQuote: number; rose: boolean };

// ── Provider ────────────────────────────────────────────────────────────────

const KEY = "tide.v1";
const SAVE_MS = 8_000;

type Ctx = { state: State; dispatch: React.Dispatch<Action>; ready: boolean };
const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, emptyState);
  const booted = useRef(false);
  const lastSave = useRef(0);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const now = Date.now();
    let next: State | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as State;
        if (saved.pools?.length) next = { ...saved, now };
      }
    } catch {
      next = null;
    }
    dispatch({ type: "HYDRATE", state: next ?? seedState(now) });
  }, []);

  useEffect(() => {
    if (!booted.current || state.now === 0) return;
    if (state.now - lastSave.current < SAVE_MS) return;
    lastSave.current = state.now;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota — the sim is disposable */
    }
  }, [state]);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setInterval(
      () => dispatch({ type: "TICK", now: Date.now() }),
      reduce ? TICK_MS * 3 : TICK_MS
    );
    return () => clearInterval(t);
  }, []);

  const value = useMemo(() => ({ state, dispatch, ready: state.now !== 0 }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export { binIdAt, binPrice, hiBin, holdingsAt, inRange, valueAt, shapeWeights, TIME_SCALE };
