"use client";

/**
 * Client-side demo store for Print v2. No chain calls — every market is a
 * simulated pari-mutuel pool. The product is built on a daily clock:
 *
 *   • THE GAP   — settles at the 9:30 open. Where does the stock open vs where
 *                 the token traded overnight (~3am)? Only tradeable on a chain
 *                 whose token runs 24/7 against a 9:30–4:00 underlying.
 *   • THE CLOSE — settles at 4:00. Direction and range on the cash session.
 *   • ROUNDS    — rotating 15/30-min pools, always something closing. Low rake.
 *   • MACRO     — CPI / jobs / FOMC one-offs at a fixed minute.
 *   • BREADTH   — how many of the top 20 close green.
 *   • EARNINGS  — the wide post-print move; seasonal marquee.
 *
 * The connected wallet is a mock Robinhood Chain account funded with demo USDC.
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
  BREADTH_BUCKETS,
  CLOSE_BUCKETS,
  EARN_BUCKETS,
  GAP_BUCKETS,
  ROUND_BUCKETS,
  RAKE,
  bucketFor,
  poolTotal,
  settlePayout,
  type Bucket,
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

export type MarketKind = "gap" | "close" | "round" | "macro" | "breadth" | "earnings";

export type Bet = {
  id: string;
  marketId: string;
  bucket: string;
  bettor: string;
  amount: number;
  ts: number;
};

export type Market = {
  id: string;
  kind: MarketKind;
  symbol: string; // ticker, or a short code for macro/breadth
  name: string; // company / event name
  emoji: string;
  grad: number;
  title: string; // the question
  metricLabel: string; // units of the settling number
  refLabel: string; // context line (e.g. "token @ 3am $178.40 · prev close $176.10")
  buckets: Bucket[];
  closeTime: number;
  settleTime: number;
  rakeBps: number;
  stakes: Stakes;
  bets: Bet[];
  headline?: boolean;
  metric?: number; // realized settling number
  winner?: string;
};

export type Position = { staked: Record<string, number> };
export type User = {
  connected: boolean;
  address: string;
  balance: number;
  positions: Record<string, Position>;
};

export type MarketStatus = "open" | "locked" | "settled";

export function statusOf(m: Market, now: number): MarketStatus {
  if (m.winner || now >= m.settleTime) return "settled";
  if (now >= m.closeTime) return "locked";
  return "open";
}

type State = { markets: Market[]; user: User; now: number };

const MIN = 60_000;

let idc = 1;
const uid = () => `${Date.now().toString(36)}${(idc++).toString(36)}`;
const botAddr = () =>
  "0x" + Array.from({ length: 40 }, () => "0123456789abcdef"[(Math.random() * 16) | 0]).join("");

function gaussian(sd: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
}

type Tk = { sym: string; co: string; emoji: string; grad: number; px: number };
const TICKERS: Tk[] = [
  { sym: "NVDA", co: "NVIDIA", emoji: "🟩", grad: 0, px: 178.4 },
  { sym: "TSLA", co: "Tesla", emoji: "🚗", grad: 2, px: 340.1 },
  { sym: "AAPL", co: "Apple", emoji: "🍎", grad: 2, px: 232.5 },
  { sym: "HOOD", co: "Robinhood", emoji: "🪶", grad: 1, px: 112.6 },
  { sym: "COIN", co: "Coinbase", emoji: "🟦", grad: 1, px: 305.2 },
  { sym: "AMD", co: "AMD", emoji: "🔴", grad: 2, px: 168.9 },
  { sym: "META", co: "Meta", emoji: "♾️", grad: 4, px: 745.8 },
  { sym: "AMZN", co: "Amazon", emoji: "📦", grad: 3, px: 218.7 },
  { sym: "MSFT", co: "Microsoft", emoji: "🪟", grad: 1, px: 505.3 },
  { sym: "GOOGL", co: "Alphabet", emoji: "🔎", grad: 5, px: 205.1 },
  { sym: "PLTR", co: "Palantir", emoji: "🔮", grad: 4, px: 62.3 },
  { sym: "NFLX", co: "Netflix", emoji: "🎬", grad: 2, px: 1180.4 },
  { sym: "SOFI", co: "SoFi", emoji: "💸", grad: 5, px: 24.8 },
  { sym: "MARA", co: "MARA Holdings", emoji: "⛏️", grad: 3, px: 21.4 },
];
const tkBy = (sym: string) => TICKERS.find((t) => t.sym === sym)!;

function seedStakes(total: number, buckets: Bucket[], center: number, spread: number): Stakes {
  // Weight buckets by a bell curve centered on `center` (bucket index).
  const stakes: Stakes = {};
  let sum = 0;
  const w = buckets.map((_, i) => {
    const x = (i - center) / spread;
    return Math.exp(-0.5 * x * x) + 0.05;
  });
  w.forEach((x) => (sum += x));
  buckets.forEach((b, i) => {
    stakes[b.id] = Math.round((total * w[i]) / sum * (0.85 + Math.random() * 0.3));
  });
  return stakes;
}

function weightedBucket(stakes: Stakes, buckets: Bucket[]): string {
  const total = poolTotal(stakes) || 1;
  let r = Math.random() * total;
  for (const b of buckets) {
    r -= stakes[b.id] ?? 0;
    if (r <= 0) return b.id;
  }
  return buckets[0].id;
}

function seedBets(m: Market, count: number, now: number): Bet[] {
  const out: Bet[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      id: uid(),
      marketId: m.id,
      bucket: weightedBucket(m.stakes, m.buckets),
      bettor: botAddr(),
      amount: Math.round(40 + Math.random() * 2600),
      ts: now - ((Math.random() * 25 * MIN) | 0),
    });
  }
  return out.sort((a, b) => b.ts - a.ts);
}

let roundSeq = 1;

function makeRound(now: number, closeInMin: number): Market {
  const t = TICKERS[(Math.random() * TICKERS.length) | 0];
  const dur = Math.random() < 0.5 ? 15 : 30;
  const closeTime = now + closeInMin * MIN;
  const total = 8_000 + Math.random() * 60_000;
  const m: Market = {
    id: `round_${roundSeq++}_${now.toString(36)}`,
    kind: "round",
    symbol: t.sym,
    name: `${dur}-min round`,
    emoji: t.emoji,
    grad: t.grad,
    title: `${t.sym} — up, flat, or down this round?`,
    metricLabel: "token move over the round",
    refLabel: `${dur}-minute pari-mutuel · 1% rake · token @ $${t.px.toFixed(2)}`,
    buckets: ROUND_BUCKETS,
    closeTime,
    settleTime: closeTime + MIN,
    rakeBps: RAKE.round,
    stakes: {},
    bets: [],
  };
  m.stakes = seedStakes(total, ROUND_BUCKETS, 1, 1.1);
  m.bets = seedBets(m, 3 + ((Math.random() * 5) | 0), now);
  return m;
}

function baseMarket(
  now: number,
  kind: MarketKind,
  tk: Tk,
  closeOffMin: number,
  settleOffMin: number,
  total: number,
  buckets: Bucket[],
  center: number,
  spread: number,
  fields: Partial<Market>
): Market {
  const closeTime = now + closeOffMin * MIN;
  const m: Market = {
    id: `${kind}_${tk.sym.toLowerCase()}_${(idc++).toString(36)}`,
    kind,
    symbol: tk.sym,
    name: tk.co,
    emoji: tk.emoji,
    grad: tk.grad,
    title: "",
    metricLabel: "",
    refLabel: "",
    buckets,
    closeTime,
    settleTime: now + settleOffMin * MIN,
    rakeBps: RAKE[kind],
    stakes: seedStakes(total, buckets, center, spread),
    bets: [],
    ...fields,
  };
  m.bets = seedBets(m, 5 + ((Math.random() * 6) | 0), now);
  return m;
}

function seedMarkets(now: number): Market[] {
  const out: Market[] = [];

  // ── THE GAP — the headline anchor. Overnight token drift vs the 9:30 open.
  const gapSpecs: [string, number, number, number, boolean, number?][] = [
    // sym, drift% (token moved overnight), closeInMin, pool, headline, presetGap?
    ["NVDA", 1.8, 7, 640_000, true],
    ["TSLA", -2.3, 7, 410_000, false],
    ["HOOD", 0.9, 52, 180_000, false],
    ["COIN", 3.1, 52, 150_000, false],
    ["AAPL", -0.4, 112, 120_000, false],
    ["MSFT", 0.6, 112, 96_000, false],
  ];
  for (const [sym, drift, closeIn, pool, headline] of gapSpecs) {
    const t = tkBy(sym);
    const overnight = t.px * (1 + drift / 100);
    const center = drift > 0 ? 4.2 : drift < -1 ? 1.6 : 3;
    out.push(
      baseMarket(now, "gap", t, closeIn, closeIn + 1, pool, GAP_BUCKETS, center, 1.3, {
        title: `Where does ${sym} open vs the overnight token?`,
        metricLabel: "open vs 3am token (%)",
        refLabel: `token @ 3am $${overnight.toFixed(2)} · prev close $${t.px.toFixed(2)} · overnight ${drift >= 0 ? "+" : ""}${drift.toFixed(1)}%`,
        headline,
      })
    );
  }
  // A settled gap from this morning, for the record.
  {
    const t = tkBy("AMD");
    const gm = baseMarket(now, "gap", t, -120, -119, 220_000, GAP_BUCKETS, 4, 1.3, {
      title: `Where did AMD open vs the overnight token?`,
      metricLabel: "open vs 3am token (%)",
      refLabel: `token @ 3am $${(t.px * 1.012).toFixed(2)} · prev close $${t.px.toFixed(2)}`,
    });
    gm.metric = 1.4;
    gm.winner = bucketFor(1.4, GAP_BUCKETS).id;
    out.push(gm);
  }

  // ── THE CLOSE — direction/range on the cash session, settles 4:00.
  for (const [sym, closeIn, pool] of [
    ["NVDA", 380, 320_000],
    ["TSLA", 380, 240_000],
    ["SOFI", 380, 70_000],
  ] as [string, number, number][]) {
    const t = tkBy(sym);
    out.push(
      baseMarket(now, "close", t, closeIn, closeIn + 1, pool, CLOSE_BUCKETS, 3, 1.4, {
        title: `${sym} — direction and range into the 4:00 close`,
        metricLabel: "session move (%)",
        refLabel: `prev close $${t.px.toFixed(2)} · settles 4:00 PM ET`,
      })
    );
  }

  // ── ROUNDS — always something closing (staggered short windows).
  out.push(makeRound(now, 0.6));
  out.push(makeRound(now, 4));
  out.push(makeRound(now, 11));
  out.push(makeRound(now, 23));

  // ── BREADTH — how many of the top 20 close green. Settles 4:00.
  {
    const t: Tk = { sym: "TOP20", co: "Top-20 breadth", emoji: "📊", grad: 1, px: 0 };
    out.push(
      baseMarket(now, "breadth", t, 380, 381, 130_000, BREADTH_BUCKETS, 2, 1.2, {
        title: "How many of the top 20 close green today?",
        metricLabel: "tickers closing green (0–20)",
        refLabel: "daily breadth round · 1.5% rake · settles 4:00 PM ET",
      })
    );
  }

  // ── MACRO — one-off at a fixed minute. Custom buckets vs consensus.
  {
    const macroBuckets: Bucket[] = [
      { id: "m0", label: "≤ 2.6% (cool)", short: "≤2.6", lo: -Infinity, hi: 2.65, dir: "up" },
      { id: "m1", label: "2.7% in-line", short: "2.7", lo: 2.65, hi: 2.75, dir: "flat" },
      { id: "m2", label: "2.8%", short: "2.8", lo: 2.75, hi: 2.85, dir: "flat" },
      { id: "m3", label: "2.9%", short: "2.9", lo: 2.85, hi: 2.95, dir: "down" },
      { id: "m4", label: "≥ 3.0% (hot)", short: "≥3.0", lo: 2.95, hi: Infinity, dir: "down" },
    ];
    const t: Tk = { sym: "CPI", co: "CPI · YoY", emoji: "🏛️", grad: 3, px: 0 };
    out.push(
      baseMarket(now, "macro", t, 1000, 1001, 480_000, macroBuckets, 1.5, 1.1, {
        title: "CPI — what prints for YoY headline?",
        metricLabel: "CPI YoY (%)",
        refLabel: "consensus 2.7% · drops 8:30 AM ET · high-attention one-off",
      })
    );
  }

  // ── EARNINGS — seasonal marquee. A couple upcoming + one settled.
  {
    const t = tkBy("NVDA");
    out.push(
      baseMarket(now, "earnings", t, 2880, 3120, 1_940_000, EARN_BUCKETS, 4.2, 1.5, {
        title: "NVDA earnings — the post-print move",
        metricLabel: "post-earnings move (%)",
        refLabel: "prints Wed 4:20 PM ET · seasonal marquee · prev close $178.40",
      })
    );
    const nf = tkBy("NFLX");
    const em = baseMarket(now, "earnings", nf, -1500, -1260, 1_620_000, EARN_BUCKETS, 4.5, 1.5, {
      title: "NFLX earnings — the post-print move",
      metricLabel: "post-earnings move (%)",
      refLabel: "printed after the close · prev close $1180.40",
    });
    em.metric = 13.4;
    em.winner = bucketFor(13.4, EARN_BUCKETS).id;
    out.push(em);
  }

  return out;
}

function emptyState(): State {
  return { markets: [], user: { connected: false, address: "", balance: 0, positions: {} }, now: 0 };
}

type Action =
  | { type: "HYDRATE"; state: State }
  | { type: "CONNECT" }
  | { type: "DISCONNECT" }
  | { type: "BET"; marketId: string; bucket: string; amount: number }
  | { type: "TICK"; now: number };

const MAX_BETS = 32;

/** Draw the realized settling metric for a market kind. */
function drawMetric(m: Market): number {
  switch (m.kind) {
    case "gap":
      return +gaussian(0.9).toFixed(2);
    case "close":
      return +gaussian(1.8).toFixed(2);
    case "round":
      return +gaussian(0.45).toFixed(2);
    case "breadth":
      return Math.max(0, Math.min(20, Math.round(10 + gaussian(4))));
    case "macro":
      return +(2.7 + gaussian(0.12)).toFixed(1);
    case "earnings":
      return +gaussian(6).toFixed(2);
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "CONNECT":
      return {
        ...state,
        user: { connected: true, address: botAddr(), balance: 10_000, positions: {} },
      };

    case "DISCONNECT":
      return { ...state, user: { connected: false, address: "", balance: 0, positions: {} } };

    case "BET": {
      const { user } = state;
      const m = state.markets.find((x) => x.id === action.marketId);
      if (!m || !user.connected || statusOf(m, state.now) !== "open") return state;
      const amount = Math.min(action.amount, user.balance);
      if (amount <= 0) return state;
      const bet: Bet = {
        id: uid(),
        marketId: m.id,
        bucket: action.bucket,
        bettor: user.address,
        amount,
        ts: state.now,
      };
      const stakes = { ...m.stakes, [action.bucket]: (m.stakes[action.bucket] ?? 0) + amount };
      const pos = user.positions[m.id] ?? { staked: {} };
      const staked = { ...pos.staked, [action.bucket]: (pos.staked[action.bucket] ?? 0) + amount };
      return {
        ...state,
        markets: state.markets.map((x) =>
          x.id === m.id ? { ...x, stakes, bets: [bet, ...x.bets].slice(0, MAX_BETS) } : x
        ),
        user: {
          ...user,
          balance: user.balance - amount,
          positions: { ...user.positions, [m.id]: { staked } },
        },
      };
    }

    case "TICK": {
      const now = action.now;
      let user = state.user;
      const spawned: Market[] = [];
      let markets = state.markets.map((m) => {
        const status = statusOf(m, now);

        if (status === "settled" && !m.winner) {
          const metric = drawMetric(m);
          const winner = bucketFor(metric, m.buckets).id;
          const settled = { ...m, metric, winner };
          user = creditSettlement(user, settled);
          // Rounds recycle so something is always closing.
          if (m.kind === "round") spawned.push(makeRound(now, 12 + Math.random() * 14));
          return settled;
        }

        if (status === "open" && Math.random() < (m.kind === "round" ? 0.7 : 0.45)) {
          const bucket = weightedBucket(m.stakes, m.buckets);
          const amount = Math.round(40 + Math.random() * (m.kind === "round" ? 1200 : 3200));
          const bet: Bet = { id: uid(), marketId: m.id, bucket, bettor: botAddr(), amount, ts: now };
          return {
            ...m,
            stakes: { ...m.stakes, [bucket]: (m.stakes[bucket] ?? 0) + amount },
            bets: [bet, ...m.bets].slice(0, MAX_BETS),
          };
        }
        return m;
      });
      // Retire fully-settled rounds older than a bit, keep the board tidy.
      markets = markets.filter(
        (m) => !(m.kind === "round" && m.winner && now - m.settleTime > 6 * MIN)
      );
      if (spawned.length) markets = [...markets, ...spawned];
      return { ...state, now, markets, user };
    }

    default:
      return state;
  }
}

function creditSettlement(user: User, m: Market): User {
  const pos = user.positions[m.id];
  if (!pos || !m.winner) return user;
  let balance = user.balance;
  for (const [bucket, staked] of Object.entries(pos.staked)) {
    balance += settlePayout(m.stakes, bucket, staked, m.winner, m.rakeBps);
  }
  const positions = { ...user.positions };
  delete positions[m.id];
  return { ...user, balance, positions };
}

const KEY = "print.v2";

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
    dispatch({ type: "HYDRATE", state: next ?? { markets: seedMarkets(now), user: emptyState().user, now } });
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
    const t = setInterval(() => dispatch({ type: "TICK", now: Date.now() }), reduce ? 4000 : 1400);
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
