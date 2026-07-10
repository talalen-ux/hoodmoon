# HoodMoon — Landing Page

Premium landing page for **HoodMoon**, the community token of Robinhood Chain that rewards long-term holders through Uniswap v4 Hooks.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) for all animation
- [Geist](https://vercel.com/font) Sans & Mono (bundled locally — no runtime font fetches)
- Original hand-drawn SVG icons, canvas-based orbital hero background

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Production

```bash
npm run build
npm start
```

Other scripts: `npm run typecheck`, `npm run lint`.

## Structure

```
app/
  layout.tsx        # metadata, fonts, SEO
  page.tsx          # section composition
  globals.css       # Tailwind v4 theme tokens (colors, fonts)
components/
  Navbar.tsx        # sticky blur nav + mobile menu
  Hero.tsx          # headline + CTAs over the orbital canvas
  OrbitalField.tsx  # canvas particle animation (parallax, reduced-motion aware)
  TrustBanner.tsx   # chain / hooks / permissionless / community row
  WhyHoodMoon.tsx   # three value cards
  HowItWorks.tsx    # animated reward timeline
  HooksSection.tsx  # Uniswap v4 Hooks flow diagram
  Tokenomics.tsx    # supply + animated allocation rings
  LiveMetrics.tsx   # count-up stat tiles
  Community.tsx     # placeholder testimonials
  FAQ.tsx           # animated accordion
  Footer.tsx
  motion.tsx        # shared FadeIn / Stagger / SectionHeading primitives
  icons.tsx         # original SVG icon set
```

## Design Notes

- Dark-first palette: `#000000` background, `#111111` cards, `rgba(255,255,255,0.06)` hairline borders, `#00C805` accent with `#39FF63` glow — green is used sparingly, for emphasis only.
- All scroll reveals, counters, and the hero canvas respect `prefers-reduced-motion`.
- No UI libraries; every component is handcrafted.
