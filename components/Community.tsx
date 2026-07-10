"use client";

import { SectionHeading, Stagger, StaggerItem } from "./motion";

const quotes = [
  {
    quote:
      "Finally a token where doing nothing is the strategy. I hold, the Hook does the rest.",
    name: "Placeholder — early community member",
  },
  {
    quote:
      "The incentives just make sense. Long-term holders shouldn't be exit liquidity.",
    name: "Placeholder — Robinhood Chain builder",
  },
  {
    quote:
      "Clean mechanics, no staking rituals, everything verifiable onchain. That's how it should work.",
    name: "Placeholder — DeFi researcher",
  },
];

export function Community() {
  return (
    <section id="community" className="bg-surface py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Community"
          title="Built for Long-Term Holders"
          lede="HoodMoon is designed for participants who believe communities become stronger when incentives favor commitment over constant speculation."
        />

        <Stagger className="mt-16 grid gap-6 md:grid-cols-3">
          {quotes.map(({ quote, name }) => (
            <StaggerItem key={name}>
              <figure className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-edge bg-card p-8">
                <blockquote className="text-balance text-base leading-relaxed text-foreground/90">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="h-8 w-8 rounded-full bg-gradient-to-br from-accent/50 to-glow/20"
                  />
                  <span className="text-xs text-muted">{name}</span>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
