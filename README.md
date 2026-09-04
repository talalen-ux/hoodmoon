# mm

**The market maker for mispriced equities on Robinhood Chain.**

Tokenized stocks trade around the clock in thin pools. The stocks they track
trade 09:30–16:00, five days a week. So the pools drift — sometimes a long way
— from what the shares are actually worth.

mm watches every pool where a tokenized equity trades and marks each one
against the real share price. **When a pool trades far above the stock, mm
sells into it**, hedging the same exposure at the reference so the edge is
booked at the fill rather than left to hope for reversion. It does the mirror
of that when a pool runs far below. **The profit goes to holders every 15
minutes, on-chain.**

This repository is the product surface: a live, self-contained simulation of
that book. No chain is read or written — every pool, reference price, fill and
distribution is generated in the browser.

## The mechanic

For a constant-product pool with reserves `(rTok, rUsd)` and `k = rTok · rUsd`:

```
pool price   P = rUsd / rTok
reference    R = the real stock print
basis        (P / R − 1), in basis points
```

Selling `x` tokens leaves the price at `k / (rTok + x)²`, so walking the pool
from `P` down to a target `T` is not a guess — it is

```
x = rTok · (√(P / T) − 1)
```

mm sizes every fade off that curve, capped by a per-clip limit, and stops
`LEAVE_BPS` short of fair on purpose: the last basis points cost more in
slippage than they collect, and a pool pinned exactly to the oracle stops
attracting the flow mm earns from. A trade is only taken when what survives the
pool's own fee and gas clears `MIN_NET` — which is why a thin pool on a high
fee tier can sit visibly rich and still read *too thin to cross*.

Everything is in [`lib/basis.ts`](lib/basis.ts), including the closed form for
the edge (`rUsd · ((m−1)/m)²`, where `m = √(P/R)`) that the sizing implies.

## The clock

Epoch boundaries are wall-clock quarter hours, so every holder is on the same
schedule whether or not they are watching. At each boundary the epoch's
realized profit — gross edge less gas — is swept, 10% is retained for the
keepers that run the bots and land the sweep, and the rest is paid to mm
holders in proportion to a fixed supply. There is nothing to stake, lock, or
vest.

## Why the quiet hours matter

The reference is frozen whenever the stock is shut. Overnight and at weekends
there is no underlying to arbitrage against, so the pools wander furthest —
exactly when Asia and the Gulf are awake and the US is asleep. The simulation
models this directly: reversion strength, flow pressure and volatility all key
off the New York session, so the board is quiet at noon in New York and busy at
three in the morning.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) for all animation
- [Geist](https://vercel.com/font) Sans & Mono (bundled locally — no runtime font fetches)
- Original hand-drawn SVG icons; no UI libraries

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm start
npm run typecheck
npm run lint
```

## Structure

```
app/
  layout.tsx        # metadata, fonts, SEO
  page.tsx          # intro gate → board / pool detail
  globals.css       # Tailwind v4 theme tokens
lib/
  basis.ts          # the engine: pool math, fade sizing, epoch split
  store.tsx         # the simulated book — pools, fills, epochs, holder
  format.ts         # bps / USD / price / countdown formatting
  logos.ts          # ticker logo registry + brand colors for the fallback tile
components/
  Intro.tsx         # splash: the two prices and the gap between them
  Nav.tsx           # sticky nav + session state + wallet
  Ticker.tsx        # basis tape across every watched pool
  Home.tsx          # hero, spotlight, board, fills, distributions, holders
  Pool.tsx          # scanner row + spotlight card
  PoolDetail.tsx    # one pool: basis chart, priced fade, book, its fills
  FillTape.tsx      # live blotter
  Epochs.tsx        # the 15-minute clock, the log, the summary
  WalletButton.tsx  # mock RH Chain wallet + claim
  primitives.tsx    # avatar, gauge, sparkline, pills, section heads
  icons.tsx         # original SVG icon set
```

## Calibration

The simulation is tuned against itself: `AVG_NET_PER_EPOCH`,
`AVG_FILLS_PER_EPOCH` and `AVG_VOLUME_PER_EPOCH` in `lib/store.tsx` are
measured from the engine's own behaviour across simulated hours of each
session, and the seeded history, lifetime totals and per-pool attribution are
all derived from them. The record therefore agrees with the epochs a visitor
watches settle, rather than quietly contradicting them.

## Design notes

- Near-black instrument-panel ground. One mint accent for mm's own numbers;
  amber → red for rich, blue for cheap, grey for fair. Rich is the only thing
  allowed to shout, because rich is where the money is.
- Every changing number is tabular-figure aligned, so nothing reflows on tick.
- Animation respects `prefers-reduced-motion` throughout.

## Disclaimer

Demo build. Every pool, reference price, fill and distribution is simulated
client-side; venue names are placeholders. Simulated past distributions are not
a forecast. Not investment advice. Trading tokenized equities may be restricted
in your jurisdiction — making a production deployment compliant is the
operator's responsibility.
