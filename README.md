# tide

**LP the memecoins without the guesswork.** One-tap concentrated liquidity on
Robinhood Chain, with the one number nobody else puts on the front of the card:
whether providing liquidity actually beat holding.

Concentrated liquidity earns real fees on the tokens that actually trade — and
quietly loses money if you pick the wrong range, drift out of it, or never check
what impermanent loss took. Every LP interface shows fees earned. Fees are the
flattering half of the story.

This repository is the product surface: a self-contained simulation of the whole
thing. No chain is read or written — every pool, price, swap, fee and position is
generated in the browser, and the clock runs at 90× real time.

## Binned liquidity

A pool is a ladder of discrete price bins. Bin `i` sits at exactly

```
p(i) = (1 + binStep) ^ i
```

and is a **constant-sum** pool at that single price: swapping inside a bin moves
no price at all, which is why binned liquidity quotes memecoins far better than a
curve does. Price only moves when a bin is emptied and the pool steps to the next
one. (This is the Liquidity Book design that Meteora's DLMM descends from — the
faithful EVM translation of "Meteora style", rather than Uniswap v3 ticks.)

That gives the model a very useful property: a bin holds base or quote purely as
a function of where price is relative to it.

```
bins below the active bin  → all quote  (their base has been bought)
bins above the active bin  → all base   (their quote has been spent)
the active bin             → both, split by how far through it price is
```

So a position never needs its reserves tracked trade by trade. It is fully
described by how much liquidity it put in each bin — `l[]`, measured in quote at
that bin's own price — and the current price derives the rest. Every holding, and
therefore every number in the P&L panel, falls out of that exactly rather than by
approximation.

All of it is in [`lib/bins.ts`](lib/bins.ts).

## The number the product exists for

Everything is in quote, and this identity is asserted by the tests at every
price, bin step and range width:

```
total = pricePnl + impermanentLoss + fees - costs
```

`netVsHold = fees - costs + impermanentLoss` is what retail actually needs and
almost never gets. Above zero, providing liquidity beat simply holding the two
tokens. Below it, the position lost to doing nothing — **however green the total
looks**, because a rising price flatters an LP and a falling one hides the
damage. Price movement is deliberately quarantined below that line: you would
have had it whether or not you ever deposited, so it says nothing about whether
LPing was the right call.

Two properties the engine guarantees, both verified numerically:

- `impermanentLoss <= 0` everywhere. It is the cost of the pool trading against
  you and can never be an edge. Getting this right required marking both the
  position and the hold basket at the **active bin's price** rather than at the
  continuous price used for charting — a bin is constant-sum, so its own price is
  the only price anything can actually be traded at, and mixing the two marks
  introduced a sub-bin mismatch that made drifting downward inside the entry bin
  look marginally profitable.
- A tighter range loses more to impermanent loss than a wide one on the same
  move — roughly 4× more at ±8 bins versus ±60. That is the entire trade-off
  behind the presets, and it is a measured result, not a claim.

## Honest yield

`feeReturn` returns the period return and the annualised figure as **separate
fields**, and the UI leads with the period. Annualising a memecoin pool's good
hour is how retail ends up staring at four-digit APRs nobody has ever been paid:
$12 of fees on $1,000 in an hour is a real 1.2% and a headline 10,512% APR. Both
appear on the pool page, next to each other, with the assumption spelled out.

## Presets

Four, each a real liquidity shape underneath, each with its downside written on
the card rather than buried in docs.

| Preset | Shape | What it does | What it costs |
|---|---|---|---|
| **Tight** | curve, ±8 bins | Most fees while price sits still | Out of range after a few percent, and the most impermanent loss |
| **Follow** | spot, ±22 bins, recentering | In range almost always, earns through a trend | Every recenter is a real swap: fees, gas, and it locks in the loss so far |
| **Wide** | spot, ±60 bins | Survives most candles unattended | Lowest fees per dollar |
| **Bid ladder** | bidask, quote-only below price | Get paid to wait for a lower price; no entry swap | Being filled means price fell |

## Safety

An explicit checklist of facts read off the chain — ownership renounced,
liquidity locked, no transfer tax, largest holder, pool age — and deliberately
**no score**. A score invites people to read a judgement into what is really a
list of checks, and the checks do not add up to "safe": a token can pass every
one and still go to zero, which is the normal outcome. Depositing into a pool
that fails any check requires an explicit acknowledgement.

## What would run on-chain

Unlike a basis desk or an RWA product, nothing here needs to be trusted:

- **No oracle** — the pool is the price.
- **No custodian** — the tokens are native, not a claim on an issuer.
- **No hedge leg** — so no broker, no margin account, no jurisdiction.

Enforced by contract: bins, swaps, fee accrual, the variable fee, your position
and its range, and the rebalance rule committed at deposit. Recentering is a
**permissionless crank with a bounty** — anyone can call it, the contract checks
the rule was satisfied — so there is no privileged keeper and nobody who can move
your funds. Off-chain: only the indexer behind the charts (public events, anyone
can rebuild it) and this interface (pinnable to IPFS).

## Stack

- [Next.js 15](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) for all animation
- [Geist](https://vercel.com/font) Sans & Mono (bundled locally)
- Original hand-drawn SVG icons; no UI libraries

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm start
npm run typecheck
```

## Structure

```
app/
  layout.tsx        # metadata, fonts, SEO
  page.tsx          # intro gate → pools / pool detail / positions
  globals.css       # Tailwind v4 theme tokens
lib/
  bins.ts           # the engine: bin geometry, shapes, holdings, P&L, fees
  store.tsx         # the simulated book — pools, swaps, positions, rebalancing
  format.ts         # subscript-zero memecoin prices, signed P&L, durations
  tokens.ts         # token identity and colour
components/
  Intro.tsx         # splash: one honest bin chart
  Home.tsx          # hero, pool board, presets, how it works, on-chain
  PoolDetail.tsx    # bin chart, deposit flow, yield, safety, swap tape
  Position.tsx      # position cards and the P&L panel
  Positions.tsx     # portfolio view
  primitives.tsx    # BinChart, sparkline, avatars, Portal
  Nav / Footer / WalletButton / icons
```

## Design notes

- Colour carries meaning: cyan is USDC below the price, violet the token above
  it, bright is the bin price is in. Green means earning, amber means idle.
- In the bin chart, pool depth and your position are drawn on **separate
  scales** — on one axis a retail position against a multi-million-dollar pool
  is a flat line one pixel high. The caption says so.
- Ages and fee windows are reported in **simulated** time, so "0.6% of fees over
  1h 12m" rather than an implied yield over 48 real seconds.
- Overlays render through a `Portal`. Any ancestor with `backdrop-filter`
  becomes the containing block for `position: fixed`, which silently clipped the
  wallet modal to the height of the sticky header.

## Disclaimer

Demo build. Every pool, price, swap, fee and position is simulated client-side.
Token names are real; the prices are plausible starting points, not market data,
and everything after the first tick is invented. Providing liquidity to memecoin
pools can and frequently does lose money, including when the position shows a
profit. Nothing here is investment advice.
