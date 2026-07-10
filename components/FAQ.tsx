"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeading, FadeIn, EASE } from "./motion";
import { ChevronIcon } from "./icons";

const faqs = [
  {
    q: "What are Uniswap v4 Hooks?",
    a: "Hooks are programmable extensions for Uniswap v4 liquidity pools. They let custom logic run at key points of a swap — before or after a trade — directly onchain. HoodMoon uses this to embed its reward mechanics inside the pool itself, with no external contracts or intermediaries.",
  },
  {
    q: "How do holding rewards work?",
    a: "When eligible trades interact with the Hook-enabled liquidity pool, HoodMoon's Hook logic executes and allocates rewards according to the protocol's rules. Rewards favor addresses that hold over longer periods, aligning incentives with long-term participation.",
  },
  {
    q: "Do I need to stake?",
    a: "No. There is no staking, locking, or deposit contract. Your tokens stay in your own wallet the entire time — simply holding is what makes you eligible.",
  },
  {
    q: "Are rewards automatic?",
    a: "Yes. Reward logic runs onchain as part of pool activity, so there are no manual claims or offchain processes required. Everything is transparent and verifiable on Robinhood Chain.",
  },
  {
    q: "How do I buy HOODMOON?",
    a: "HOODMOON trades on Robinhood Chain through its Uniswap v4 pool. Connect a wallet with funds on Robinhood Chain, swap for HOODMOON, and hold — that's it.",
  },
];

function Item({
  q,
  a,
  open,
  onToggle,
  id,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-card transition-colors duration-500 data-[open=true]:border-accent/25" data-open={open}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        id={`${id}-button`}
        className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
      >
        <span className="text-base font-medium text-foreground">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className={`shrink-0 transition-colors duration-300 ${
            open ? "text-accent" : "text-muted"
          }`}
        >
          <ChevronIcon />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-button`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <p className="px-6 pb-6 text-sm leading-relaxed text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-background py-28 sm:py-36">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="FAQ" title="Questions, answered." />

        <FadeIn delay={0.15} className="mt-14 flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <Item
              key={faq.q}
              id={`faq-${i}`}
              q={faq.q}
              a={faq.a}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
