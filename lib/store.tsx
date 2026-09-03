"use client";

/**
 * Client-side demo store for Print. No chain calls — pools, bets, and
 * settlement are simulated so the whole lifecycle (open → locked → live →
 * settled) is visible in one sitting. The connected wallet is a mock
 * Robinhood Chain account funded with demo USDC. Real deployment swaps this
 * for RH Chain contracts + Chainlink Data Streams settlement.
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
  BUCKET_IDS,
  BUCKETS,
  RAKE_BPS,
  bucketForMove,
  poolTotal,
  settlePayout,
  type Stakes,
} from "./parimutuel";

export const GRADS: [string, string][] = [
  ["#27ee44", "#7df58f"],
  ["#00b0ff", "#40c4ff"],
  ["#ff5252", "#ff8a80"],
  ["#ffab00", "#ffd740"],
  ["#e040fb", "#b388ff"],
  ["#1de9b6", "#64ffda"],
  ["#ff6e40", "#ffab91"],
  ["#448aff", "#82b1ff"],
];

export type Bet = {
  id: string;
  poolId: string;
  bucket: string;
  bettor: string;
  amount: number;
  ts: number;
};

export type Pool = {
  id: string;
  symbol: string;
  company: string;
  emoji: string;
  grad: number;
  sector: string;
  prevClose: number;
  impliedVol: number; // options-implied expected move, %
  closeTime: number;
  printTime: number;
  settleTime: number;
  rakeBps: number;
  stakes: Stakes;
  bets: Bet[];
  actualMove?: number;
  winner?: string;
};

export type Position = { staked: Record<string, number> };
export type HistoryItem = {
  poolId: string;
  symbol: string;
  bucket: string;
  staked: number;
  payout: number;
  won: boolean;
  ts: number;
};

export type User = {
  connected: boolean;
  address: string;
  balance: number;
  positions: Record<string, Position>;
  history: HistoryItem[];
};

export type PoolStatus = "open" | "locked" | "live" | "settled";

export function statusOf(pool: Pool, now: number): PoolStatus {
  if (pool.winner || now >= pool.settleTime) return "settled";
  if (now >= pool.printTime) return "live";
  if (now >= pool.closeTime) return "locked";
  return "open";
}

type State = { pools: Pool[]; user: User; now: number };

const MIN = 60_000;
const HOUR = 3_600_000;

let idc = 1;
const uid = () => `${Date.now().toString(36)}${(idc++).toString(36)}`;
const botAddr = () =>
  "0x" +
  Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

const SKEWS: Record<string, number[]> = {
  hypeUp: [3, 5, 9, 22, 26, 18, 17],
  balanced: [4, 8, 16, 40, 16, 8, 8],
  downLean: [11, 15, 18, 33, 11, 7, 5],
  binary: [16, 14, 11, 14, 11, 14, 20],
};

function buildStakes(total: number, skew: number[]): Stakes {
  const sum = skew.reduce((a, b) => a + b, 0);
  const stakes: Stakes = {};
  BUCKET_IDS.forEach((id, i) => {
    const jitter = 0.8 + Math.random() * 0.4;
    stakes[id] = Math.round((total * skew[i]) / sum * jitter);
  });
  return stakes;
}

function seedBets(pool: Pool, count: number, now: number): Bet[] {
  const bets: Bet[] = [];
  for (let i = 0; i < count; i++) {
    const bucket = weightedBucket(pool.stakes);
    bets.push({
      id: uid(),
      poolId: pool.id,
      bucket,
      bettor: botAddr(),
      amount: Math.round(50 + Math.random() * 4000),
      ts: now - Math.floor(Math.random() * 30 * MIN),
    });
  }
  return bets.sort((a, b) => b.ts - a.ts);
}

function weightedBucket(stakes: Stakes): string {
  const total = poolTotal(stakes) || 1;
  let r = Math.random() * total;
  for (const id of BUCKET_IDS) {
    r -= stakes[id] ?? 0;
    if (r <= 0) return id;
  }
  return "fl";
}

function gaussian(sd: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
}

type Seed = {
  sym: string;
  co: string;
  emoji: string;
  grad: number;
  sector: string;
  px: number;
  iv: number;
  close: number; // offset minutes from now (negative = past)
  size: number;
  skew: keyof typeof SKEWS;
  move?: number; // preset realized move for already-settled pools
};

const SEED: Seed[] = [
  { sym: "NVDA", co: "NVIDIA", emoji: "🟩", grad: 0, sector: "Semis", px: 178.4, iv: 8.5, close: 8, size: 1_940_000, skew: "hypeUp" },
  { sym: "HOOD", co: "Robinhood Markets", emoji: "🪶", grad: 1, sector: "Fintech", px: 112.6, iv: 9.2, close: 52, size: 720_000, skew: "hypeUp" },
  { sym: "TSLA", co: "Tesla", emoji: "🚗", grad: 2, sector: "Autos", px: 340.1, iv: 7.8, close: 145, size: 1_120_000, skew: "binary" },
  { sym: "AMD", co: "Advanced Micro Devices", emoji: "🔴", grad: 2, sector: "Semis", px: 168.9, iv: 8.1, close: 320, size: 430_000, skew: "balanced" },
  { sym: "COIN", co: "Coinbase", emoji: "🟦", grad: 1, sector: "Crypto", px: 305.2, iv: 11.4, close: -10, size: 560_000, skew: "binary" },
  { sym: "AMZN", co: "Amazon", emoji: "📦", grad: 3, sector: "Retail", px: 218.7, iv: 6.9, close: -258, size: 880_000, skew: "hypeUp" },
  { sym: "PLTR", co: "Palantir", emoji: "🔮", grad: 4, sector: "Software", px: 62.3, iv: 12.6, close: 1500, size: 260_000, skew: "hypeUp" },
  { sym: "META", co: "Meta Platforms", emoji: "♾️", grad: 4, sector: "Internet", px: 745.8, iv: 6.4, close: 2880, size: 300_000, skew: "balanced" },
  { sym: "AAPL", co: "Apple", emoji: "🍎", grad: 2, sector: "Hardware", px: 232.5, iv: 4.8, close: 4320, size: 210_000, skew: "balanced" },
  // Settled — visible outcomes.
  { sym: "MSFT", co: "Microsoft", emoji: "🪟", grad: 1, sector: "Software", px: 505.3, iv: 5.2, close: -300, size: 1_310_000, skew: "hypeUp", move: 7.2 },
  { sym: "NFLX", co: "Netflix", emoji: "🎬", grad: 2, sector: "Streaming", px: 1180.4, iv: 9.7, close: -1500, size: 1_620_000, skew: "hypeUp", move: 13.4 },
  { sym: "GOOGL", co: "Alphabet", emoji: "🔎", grad: 5, sector: "Internet", px: 205.1, iv: 5.6, close: -1700, size: 910_000, skew: "downLean", move: -4.1 },
  { sym: "CRM", co: "Salesforce", emoji: "☁️", grad: 1, sector: "Software", px: 265.9, iv: 6.1, close: -1600, size: 410_000, skew: "balanced", move: -1.2 },
];

function seedPools(now: number): Pool[] {
  return SEED.map((s, i) => {
    const closeTime = now + s.close * MIN;
    const printTime = closeTime + 20 * MIN;
    const settleTime = printTime + 4 * HOUR;
    const stakes = buildStakes(s.size, SKEWS[s.skew]);
    const pool: Pool = {
      id: `${s.sym.toLowerCase()}_${i}`,
      symbol: s.sym,
      company: s.co,
      emoji: s.emoji,
      grad: s.grad,
      sector: s.sector,
      prevClose: s.px,
      impliedVol: s.iv,
      closeTime,
      printTime,
      settleTime,
      rakeBps: RAKE_BPS,
      stakes,
      bets: [],
    };
    pool.bets = seedBets(pool, 6 + Math.floor(Math.random() * 6), now);
    if (s.move !== undefined) {
      pool.actualMove = s.move;
      pool.winner = bucketForMove(s.move).id;
    }
    return pool;
  });
}

function emptyState(): State {
  return {
    pools: [],
    user: { connected: false, address: "", balance: 0, positions: {}, history: [] },
    now: 0,
  };
}

type Action =
  | { type: "HYDRATE"; state: State }
  | { type: "CONNECT" }
  | { type: "DISCONNECT" }
  | { type: "BET"; poolId: string; bucket: string; amount: number }
  | { type: "TICK"; now: number };

const MAX_BETS = 40;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "CONNECT":
      return {
        ...state,
        user: {
          connected: true,
          address: botAddr(),
          balance: 10_000,
          positions: {},
          history: [],
        },
      };

    case "DISCONNECT":
      return {
        ...state,
        user: { connected: false, address: "", balance: 0, positions: {}, history: [] },
      };

    case "BET": {
      const { user } = state;
      const pool = state.pools.find((p) => p.id === action.poolId);
      if (!pool || !user.connected) return state;
      if (statusOf(pool, state.now) !== "open") return state;
      const amount = Math.min(action.amount, user.balance);
      if (amount <= 0) return state;
      const bet: Bet = {
        id: uid(),
        poolId: pool.id,
        bucket: action.bucket,
        bettor: user.address,
        amount,
        ts: state.now,
      };
      const stakes = { ...pool.stakes, [action.bucket]: (pool.stakes[action.bucket] ?? 0) + amount };
      const pos = state.user.positions[pool.id] ?? { staked: {} };
      const staked = { ...pos.staked, [action.bucket]: (pos.staked[action.bucket] ?? 0) + amount };
      return {
        ...state,
        pools: state.pools.map((p) =>
          p.id === pool.id ? { ...p, stakes, bets: [bet, ...p.bets].slice(0, MAX_BETS) } : p
        ),
        user: {
          ...user,
          balance: user.balance - amount,
          positions: { ...user.positions, [pool.id]: { staked } },
        },
      };
    }

    case "TICK": {
      const now = action.now;
      let user = state.user;
      const pools = state.pools.map((pool) => {
        const wasSettled = !!pool.winner;
        const status = statusOf(pool, now);

        // Auto-settle a pool whose window has elapsed.
        if (status === "settled" && !wasSettled) {
          const move = +gaussian(pool.impliedVol * 0.75).toFixed(2);
          const winner = bucketForMove(move).id;
          const settled = { ...pool, actualMove: move, winner };
          user = creditSettlement(user, settled);
          return settled;
        }

        // Bots trickle bets into open pools.
        if (status === "open" && Math.random() < 0.55) {
          const bucket = weightedBucket(pool.stakes);
          const amount = Math.round(50 + Math.random() * 3500);
          const bet: Bet = { id: uid(), poolId: pool.id, bucket, bettor: botAddr(), amount, ts: now };
          return {
            ...pool,
            stakes: { ...pool.stakes, [bucket]: (pool.stakes[bucket] ?? 0) + amount },
            bets: [bet, ...pool.bets].slice(0, MAX_BETS),
          };
        }
        return pool;
      });
      return { ...state, now, pools, user };
    }

    default:
      return state;
  }
}

/** Credit a user's winning positions when a pool settles; record history. */
function creditSettlement(user: User, pool: Pool): User {
  const pos = user.positions[pool.id];
  if (!pos || !pool.winner) return user;
  let balance = user.balance;
  const history = [...user.history];
  for (const [bucket, staked] of Object.entries(pos.staked)) {
    const payout = settlePayout(pool.stakes, bucket, staked, pool.winner, pool.rakeBps);
    balance += payout;
    history.unshift({
      poolId: pool.id,
      symbol: pool.symbol,
      bucket,
      staked,
      payout,
      won: bucket === pool.winner,
      ts: pool.settleTime,
    });
  }
  const positions = { ...user.positions };
  delete positions[pool.id];
  return { ...user, balance, positions, history };
}

const KEY = "print.v1";

type Ctx = { state: State; dispatch: React.Dispatch<Action>; ready: boolean };
const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, emptyState);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const now = Date.now();
    let next: State | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) next = { ...(JSON.parse(raw) as State), now };
    } catch {
      next = null;
    }
    dispatch({ type: "HYDRATE", state: next ?? { pools: seedPools(now), user: emptyState().user, now } });
  }, []);

  useEffect(() => {
    if (!booted.current || state.now === 0) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }, [state]);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const period = reduce ? 4000 : 1500;
    const t = setInterval(() => dispatch({ type: "TICK", now: Date.now() }), period);
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

export { BUCKETS };
