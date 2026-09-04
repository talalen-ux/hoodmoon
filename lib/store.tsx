"use client";

/**
 * Client-side simulation of the mm book. Nothing here touches a chain — every
 * pool, fill and distribution is generated locally so the product can be read
 * end to end without a wallet.
 *
 * The loop it simulates is the product:
 *
 *   1. WATCH   — index every pool where a tokenized equity trades, and mark
 *                each one against the real stock print.
 *   2. FADE    — when a pool runs far above the stock, sell into it; when it
 *                runs far below, buy out of it. Each fill is hedged at the
 *                reference, so the edge is realized on the spot rather than
 *                left to hope for reversion.
 *   3. SWEEP   — on every wall-clock quarter hour the epoch closes and its
 *                realized profit is paid to holders, pro rata.
 *
 * The interesting hours are the ones the stock market is shut. The pool keeps
 * trading through the night; the reference is frozen at the last print. That
 * is when the basis runs widest and mm does most of its work.
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
  BAND_BPS,
  COOLDOWN_MS,
  EPOCH_MS,
  SUPPLY,
  basisBps,
  epochIndex,
  epochStart,
  poolPrice,
  priceFade,
  repriceTo,
  shareOf,
  splitEpoch,
  stateOf,
  tvlAtRef,
  type PoolState,
} from "./basis";

export type Session = "regular" | "pre" | "after" | "overnight" | "weekend";

export const SESSION_LABEL: Record<Session, string> = {
  regular: "regular hours",
  pre: "pre-market",
  after: "after hours",
  overnight: "overnight",
  weekend: "weekend",
};

/** Is the underlying stock actually printing right now? */
export function refIsLive(s: Session): boolean {
  return s === "regular" || s === "pre" || s === "after";
}

/**
 * Session from New York wall-clock time. The whole premise depends on the
 * viewer's timezone being irrelevant — the stock keeps NYSE hours no matter
 * where the pool is being traded from.
 */
export function sessionAt(ts: number): Session {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(new Date(ts));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = get("weekday");
  if (day === "Sat" || day === "Sun") return "weekend";
  const mins = Number(get("hour")) % 24 * 60 + Number(get("minute"));
  if (mins >= 9 * 60 + 30 && mins < 16 * 60) return "regular";
  if (mins >= 4 * 60 && mins < 9 * 60 + 30) return "pre";
  if (mins >= 16 * 60 && mins < 20 * 60) return "after";
  return "overnight";
}

export type Pool = {
  id: string;
  symbol: string; // the underlying: NVDA
  token: string; // what trades in the pool: tNVDA
  name: string;
  venue: string;
  feeBps: number;
  rTok: number;
  rUsd: number;
  ref: number; // last real print of the stock
  refOpen: number; // where the stock closed / opened, for the day change
  /**
   * Standing order-flow pressure on this pool, as a per-tick drift. Tokenized
   * equities are bought far more than they are sold — holders want the
   * exposure, not the round trip — so demand leans one way and keeps leaning
   * that way for hours. It is what stops the pools sitting on the reference,
   * and it is the reason there is a business here at all.
   */
  drift: number;
  /** The lean this pool keeps coming back to. */
  driftBase: number;
  history: number[]; // recent basis, in bps, oldest first
  lastFillTs: number;
  fills: number; // fills mm has landed here
  volume: number; // notional mm has pushed through
  earned: number; // net edge this pool has produced
};

export type Fill = {
  id: string;
  tx: string;
  poolId: string;
  token: string;
  symbol: string;
  side: "sell" | "buy";
  ts: number;
  qty: number;
  avgPx: number;
  ref: number;
  bps: number; // basis mm faded into
  bpsAfter: number;
  notional: number;
  gross: number;
  fee: number;
  gas: number;
  net: number;
};

export type Epoch = {
  index: number;
  startTs: number;
  endTs: number;
  gross: number;
  fees: number;
  gas: number;
  net: number;
  keeper: number;
  holders: number;
  fills: number;
  volume: number;
  tx: string;
};

export type Live = {
  index: number;
  startTs: number;
  endTs: number;
  gross: number;
  fees: number;
  gas: number;
  net: number;
  fills: number;
  volume: number;
};

export type User = {
  connected: boolean;
  address: string;
  mm: number; // mm balance
  usdc: number;
  claimable: number;
  paid: number;
};

export type Lifetime = { distributed: number; fills: number; volume: number; epochs: number };

type State = {
  pools: Pool[];
  fills: Fill[];
  epochs: Epoch[]; // newest first
  live: Live;
  capital: number; // working capital in the vault
  lifetime: Lifetime;
  user: User;
  session: Session;
  now: number;
};

const MAX_FILLS = 40;
const MAX_EPOCHS = 24;
const HISTORY = 60;

let idc = 1;
const uid = () => `${Date.now().toString(36)}${(idc++).toString(36)}`;
const hex = (n: number) =>
  Array.from({ length: n }, () => "0123456789abcdef"[(Math.random() * 16) | 0]).join("");
const addr = () => `0x${hex(40)}`;
const txh = () => `0x${hex(64)}`;

function gaussian(sd: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
}

// ── Seed ────────────────────────────────────────────────────────────────────

type Spec = {
  sym: string;
  co: string;
  px: number;
  usd: number; // USDC side of the pool
  fee: number;
  venue: string;
  bps: number; // where the pool starts relative to the stock
  drift: number; // standing flow pressure, in bps per tick
};

/** The book at boot. A few pools already stretched, most inside the band. */
const SPECS: Spec[] = [
  { sym: "NVDA", co: "NVIDIA", px: 178.4, usd: 1_350_000, fee: 30, venue: "hoodswap v4", bps: 240, drift: 2.6 },
  { sym: "TSLA", co: "Tesla", px: 340.1, usd: 1_050_000, fee: 30, venue: "hoodswap v4", bps: -190, drift: -1.9 },
  { sym: "AAPL", co: "Apple", px: 232.5, usd: 940_000, fee: 30, venue: "hoodswap v4", bps: 60, drift: 0.5 },
  { sym: "HOOD", co: "Robinhood", px: 112.6, usd: 780_000, fee: 30, venue: "hoodswap v4", bps: 310, drift: 3.4 },
  { sym: "MSFT", co: "Microsoft", px: 505.3, usd: 700_000, fee: 30, venue: "openpool v3", bps: -40, drift: -0.4 },
  { sym: "COIN", co: "Coinbase", px: 305.2, usd: 580_000, fee: 30, venue: "hoodswap v4", bps: 175, drift: 2.1 },
  { sym: "META", co: "Meta", px: 745.8, usd: 530_000, fee: 30, venue: "openpool v3", bps: 20, drift: 0.2 },
  { sym: "AMZN", co: "Amazon", px: 218.7, usd: 480_000, fee: 30, venue: "hoodswap v4", bps: -95, drift: -1.1 },
  { sym: "AMD", co: "AMD", px: 168.9, usd: 400_000, fee: 30, venue: "openpool v3", bps: 130, drift: 1.6 },
  { sym: "GOOGL", co: "Alphabet", px: 205.1, usd: 360_000, fee: 30, venue: "hoodswap v4", bps: 45, drift: 0.4 },
  { sym: "PLTR", co: "Palantir", px: 62.3, usd: 280_000, fee: 60, venue: "mesa", bps: 420, drift: 5.4 },
  { sym: "NFLX", co: "Netflix", px: 1180.4, usd: 240_000, fee: 30, venue: "openpool v3", bps: -70, drift: -0.8 },
  { sym: "MU", co: "Micron", px: 118.7, usd: 200_000, fee: 60, venue: "mesa", bps: 265, drift: 3.6 },
  { sym: "SOFI", co: "SoFi", px: 24.8, usd: 140_000, fee: 60, venue: "mesa", bps: -230, drift: -3.1 },
  { sym: "MARA", co: "MARA Holdings", px: 21.4, usd: 100_000, fee: 60, venue: "mesa", bps: 560, drift: 6.2 },
  { sym: "RIVN", co: "Rivian", px: 15.9, usd: 78_000, fee: 60, venue: "mesa", bps: -120, drift: -2.2 },
];

/**
 * Calibration. These three numbers are not decoration: they are what the
 * engine above actually produces, measured over simulated hours of each
 * session, and everything the page shows about the past is derived from them.
 * The seeded history therefore lines up with the epochs the user watches
 * settle, instead of quietly contradicting them.
 *
 * Blended across a week — quiet US sessions, wide overnights, wider weekends.
 */
const AVG_NET_PER_EPOCH = 1_350;
const AVG_FILLS_PER_EPOCH = 40;
const AVG_VOLUME_PER_EPOCH = 160_000;

/** Epochs since launch — roughly nine weeks of quarter hours. */
const EPOCHS_SINCE_LAUNCH = 6_142;

function seedPool(s: Spec, now: number): Pool {
  const price = s.px * (1 + s.bps / 10_000);
  const rTok = s.usd / price;
  const history: number[] = [];
  let b = s.bps;
  for (let i = 0; i < HISTORY; i++) {
    b = b * 0.94 + gaussian(38);
    history.push(Math.round(b));
  }
  history[HISTORY - 1] = Math.round(s.bps);
  return {
    id: `p_${s.sym.toLowerCase()}`,
    symbol: s.sym,
    token: `t${s.sym}`,
    name: s.co,
    venue: s.venue,
    feeBps: s.fee,
    rTok,
    rUsd: s.usd,
    ref: s.px,
    refOpen: s.px * (1 - gaussian(0.008)),
    drift: s.drift,
    driftBase: s.drift,
    history,
    // Spread across one cooldown window, so the pools become eligible at
    // different moments instead of the whole book firing on the first tick.
    lastFillTs: now - Math.random() * COOLDOWN_MS,
    // Filled in by attributeHistory once the whole book is known.
    fills: 0,
    volume: 0,
    earned: 0,
  };
}

/**
 * Split the book's lifetime totals across the pools that produced them. A pool
 * earns in proportion to what it can absorb (its depth) and how hard flow
 * leans on it (its standing drift) — which is exactly what the live engine
 * rewards, so the record and the tape tell the same story.
 */
function attributeHistory(pools: Pool[], epochs: number): void {
  const weight = (p: Pool) => p.rUsd * (0.4 + Math.abs(p.driftBase));
  const total = pools.reduce((a, p) => a + weight(p), 0);
  const net = epochs * AVG_NET_PER_EPOCH;
  const fills = epochs * AVG_FILLS_PER_EPOCH;
  const volume = epochs * AVG_VOLUME_PER_EPOCH;
  for (const p of pools) {
    const w = weight(p) / total;
    p.earned = net * w;
    p.volume = volume * w;
    p.fills = Math.round(fills * w);
  }
}

/** A plausible record of the last few hours of quarter-hourly sweeps. */
function seedEpochs(now: number): Epoch[] {
  const out: Epoch[] = [];
  const cur = epochIndex(now);
  for (let i = 1; i <= 16; i++) {
    const index = cur - i;
    const startTs = index * EPOCH_MS;
    // Right-skewed: most quarter hours are ordinary, a few catch a dislocation.
    const scale = Math.max(0.15, 0.35 + Math.abs(gaussian(0.85)));
    const net = AVG_NET_PER_EPOCH * scale;
    const fills = Math.max(1, Math.round(AVG_FILLS_PER_EPOCH * (0.5 + scale * 0.6)));
    const gas = fills * 0.42;
    const gross = net + gas;
    const fees = gross * (0.1 + Math.random() * 0.12);
    const { keeper, holders } = splitEpoch(net);
    out.push({
      index,
      startTs,
      endTs: startTs + EPOCH_MS,
      gross,
      fees,
      gas,
      net,
      keeper,
      holders,
      fills,
      volume: AVG_VOLUME_PER_EPOCH * scale * (0.8 + Math.random() * 0.4),
      tx: txh(),
    });
  }
  return out;
}

function freshLive(now: number): Live {
  const startTs = epochStart(now);
  // The epoch in flight is partly done — seed it to match the elapsed slice.
  const frac = Math.min(1, (now - startTs) / EPOCH_MS);
  const scale = Math.max(0.2, 0.4 + Math.abs(gaussian(0.7)));
  const gross = frac * AVG_NET_PER_EPOCH * scale;
  const fills = Math.round(frac * AVG_FILLS_PER_EPOCH * scale);
  return {
    index: epochIndex(now),
    startTs,
    endTs: startTs + EPOCH_MS,
    gross,
    fees: gross * 0.16,
    gas: fills * 0.42,
    net: gross - fills * 0.42,
    fills,
    volume: frac * AVG_VOLUME_PER_EPOCH * scale,
  };
}

function seedFills(pools: Pool[], now: number): Fill[] {
  const out: Fill[] = [];
  for (let i = 0; i < 14; i++) {
    const p = pools[(Math.random() * pools.length) | 0];
    const side: "sell" | "buy" = Math.random() < 0.72 ? "sell" : "buy";
    const bps = (side === "sell" ? 1 : -1) * (BAND_BPS + Math.random() * 380);
    const notional = 8_000 + Math.random() * 190_000;
    const qty = notional / p.ref;
    const gross = notional * Math.abs(bps / 10_000) * 0.42;
    out.push({
      id: uid(),
      tx: txh(),
      poolId: p.id,
      token: p.token,
      symbol: p.symbol,
      side,
      ts: now - ((Math.random() * 14 * 60_000) | 0),
      qty,
      avgPx: p.ref * (1 + bps / 10_000 / 2),
      ref: p.ref,
      bps,
      bpsAfter: bps * 0.16,
      notional,
      gross,
      fee: gross * 0.18,
      gas: 0.42,
      net: gross - 0.42,
    });
  }
  return out.sort((a, b) => b.ts - a.ts);
}

function seed(now: number): State {
  const pools = SPECS.map((s) => seedPool(s, now));
  attributeHistory(pools, EPOCHS_SINCE_LAUNCH);
  const epochs = seedEpochs(now);
  return {
    pools,
    fills: seedFills(pools, now),
    epochs,
    live: freshLive(now),
    // Enough to carry a full clip in every pool at once, plus hedge margin.
    // It is the book mm trades, not a pot that the distributions come out of.
    capital: 6_800_000,
    lifetime: {
      distributed: splitEpoch(EPOCHS_SINCE_LAUNCH * AVG_NET_PER_EPOCH).holders,
      fills: pools.reduce((a, p) => a + p.fills, 0),
      volume: pools.reduce((a, p) => a + p.volume, 0),
      epochs: EPOCHS_SINCE_LAUNCH,
    },
    user: emptyUser(),
    session: sessionAt(now),
    now,
  };
}

function emptyUser(): User {
  return { connected: false, address: "", mm: 0, usdc: 0, claimable: 0, paid: 0 };
}

function emptyState(): State {
  return {
    pools: [],
    fills: [],
    epochs: [],
    live: { index: 0, startTs: 0, endTs: 0, gross: 0, fees: 0, gas: 0, net: 0, fills: 0, volume: 0 },
    capital: 0,
    lifetime: { distributed: 0, fills: 0, volume: 0, epochs: 0 },
    user: emptyUser(),
    session: "regular",
    now: 0,
  };
}

// ── Derived ─────────────────────────────────────────────────────────────────

export function poolBasis(p: Pool): number {
  return basisBps(p, p.ref);
}

export function poolStateOf(p: Pool): PoolState {
  return stateOf(poolBasis(p));
}

export function poolMid(p: Pool): number {
  return poolPrice(p);
}

export function poolTvl(p: Pool): number {
  return tvlAtRef(p, p.ref);
}

/** What mm would do to this pool right now, if anything. */
export function pending(p: Pool, capital: number) {
  return priceFade(p, p.ref, p.feeBps, Math.min(capital * 0.05, 400_000));
}

// ── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "HYDRATE"; state: State }
  | { type: "CONNECT" }
  | { type: "DISCONNECT" }
  | { type: "CLAIM" }
  | { type: "TICK"; now: number };

/**
 * How hard the outside world pulls a pool back toward the stock.
 *
 * With the stock open, anyone can hedge in the real market, so a crowd of
 * arbitrageurs competes with mm and the pool snaps back on its own. Once the
 * bell goes there is nothing to hedge against and the pool is free to wander —
 * which is why a standing bid that would be worth 90 bps at noon is worth
 * several hundred at three in the morning.
 */
function reversion(session: Session): number {
  return session === "regular"
    ? 0.085
    : session === "pre" || session === "after"
      ? 0.055
      : session === "weekend"
        ? 0.024
        : 0.03;
}

/** How strongly standing flow leans on a pool, relative to its own base. */
function driftScale(session: Session): number {
  return session === "regular" ? 1 : session === "weekend" ? 1.5 : session === "overnight" ? 1.25 : 1.1;
}

function poolVol(session: Session): number {
  return session === "regular"
    ? 0.0005
    : session === "weekend"
      ? 0.0011
      : session === "overnight"
        ? 0.0007
        : 0.0006;
}

function refVol(session: Session): number {
  return session === "regular" ? 0.0007 : session === "pre" || session === "after" ? 0.0003 : 0;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "CONNECT":
      return {
        ...state,
        user: {
          connected: true,
          address: addr(),
          mm: 250_000,
          usdc: 0,
          claimable: 0,
          paid: 0,
        },
      };

    case "DISCONNECT":
      return { ...state, user: emptyUser() };

    case "CLAIM": {
      const { user } = state;
      if (!user.connected || user.claimable <= 0) return state;
      return {
        ...state,
        user: {
          ...user,
          usdc: user.usdc + user.claimable,
          paid: user.paid + user.claimable,
          claimable: 0,
        },
      };
    }

    case "TICK": {
      const now = action.now;
      const session = sessionAt(now);
      const live = { ...state.live };
      const newFills: Fill[] = [];
      const rev = reversion(session);
      const ds = driftScale(session);
      const pv = poolVol(session);
      const rv = refVol(session);
      const clip = Math.min(state.capital * 0.05, 400_000);

      const pools = state.pools.map((p0) => {
        let p = { ...p0 };

        // The stock only moves while it is open.
        if (rv > 0) p.ref = +(p.ref * (1 + gaussian(rv))).toFixed(4);

        // Standing flow wanders over hours, not seconds — a pool that has been
        // bid all evening usually still is a minute later.
        p.drift = Math.max(-8, Math.min(8, p.drift + (p.driftBase - p.drift) * 0.004 + gaussian(0.08)));

        // The pool always moves: its standing bid, ordinary noise, the pull of
        // whatever arbitrage the session allows, and the occasional size print
        // that knocks it well off the stock. That is mm's raw material.
        let px = poolPrice(p);
        const shock = Math.random() < 0.005 ? gaussian(0.01) : 0;
        px = px * (1 + (p.drift / 10_000) * ds + gaussian(pv) + shock) + (p.ref - px) * rev;
        if (px > 0) {
          const r = repriceTo(p, px);
          p.rTok = r.rTok;
          p.rUsd = r.rUsd;
        }

        // mm's turn.
        const bps = basisBps(p, p.ref);
        if (Math.abs(bps) >= BAND_BPS && now - p.lastFillTs >= COOLDOWN_MS) {
          const f = priceFade(p, p.ref, p.feeBps, clip);
          if (f) {
            const notional = f.qty * p.ref;
            newFills.push({
              id: uid(),
              tx: txh(),
              poolId: p.id,
              token: p.token,
              symbol: p.symbol,
              side: f.side,
              ts: now,
              qty: f.qty,
              avgPx: f.avgPx,
              ref: p.ref,
              bps,
              bpsAfter: f.bpsAfter,
              notional,
              gross: f.gross,
              fee: f.fee,
              gas: f.gas,
              net: f.net,
            });
            p.rTok = f.after.rTok;
            p.rUsd = f.after.rUsd;
            p.lastFillTs = now;
            p.fills += 1;
            p.volume += notional;
            p.earned += f.net;

            live.gross += f.gross;
            live.fees += f.fee;
            live.gas += f.gas;
            live.net += f.net;
            live.fills += 1;
            live.volume += notional;
          }
        }

        p.history = [...p.history, Math.round(basisBps(p, p.ref))].slice(-HISTORY);
        return p;
      });

      let { epochs, lifetime, user } = state;
      let nextLive = live;

      // Quarter-hour boundary: close the epoch, sweep it, pay it out.
      const idx = epochIndex(now);
      if (idx > live.index && live.startTs > 0) {
        const { keeper, holders } = splitEpoch(live.net);
        const closed: Epoch = {
          index: live.index,
          startTs: live.startTs,
          endTs: live.startTs + EPOCH_MS,
          gross: live.gross,
          fees: live.fees,
          gas: live.gas,
          net: live.net,
          keeper,
          holders,
          fills: live.fills,
          volume: live.volume,
          tx: txh(),
        };
        epochs = [closed, ...epochs].slice(0, MAX_EPOCHS);
        lifetime = {
          distributed: lifetime.distributed + holders,
          fills: lifetime.fills + closed.fills,
          volume: lifetime.volume + closed.volume,
          epochs: lifetime.epochs + 1,
        };
        if (user.connected) {
          user = { ...user, claimable: user.claimable + shareOf(holders, user.mm) };
        }
        const startTs = epochStart(now);
        nextLive = {
          index: idx,
          startTs,
          endTs: startTs + EPOCH_MS,
          gross: 0,
          fees: 0,
          gas: 0,
          net: 0,
          fills: 0,
          volume: 0,
        };
      }

      return {
        ...state,
        now,
        session,
        pools,
        fills: newFills.length ? [...newFills, ...state.fills].slice(0, MAX_FILLS) : state.fills,
        live: nextLive,
        epochs,
        lifetime,
        user,
      };
    }

    default:
      return state;
  }
}

// ── Provider ────────────────────────────────────────────────────────────────

const KEY = "mm.v1";
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
        // A stale save has an epoch that closed while nobody was watching;
        // restart the clock rather than replay hours of empty quarter hours.
        if (saved.pools?.length && epochIndex(now) - saved.live.index < 4) {
          next = { ...saved, now, session: sessionAt(now) };
        }
      }
    } catch {
      next = null;
    }
    dispatch({ type: "HYDRATE", state: next ?? seed(now) });
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

export { SUPPLY, EPOCH_MS, BAND_BPS };
