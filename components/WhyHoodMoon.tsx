"use client";

import { motion } from "framer-motion";
import { SectionHeading, Stagger, StaggerItem } from "./motion";
import { RewardsIcon, ConvictionIcon, CommunityIcon } from "./icons";

const cards = [
  {
    icon: RewardsIcon,
    title: "Passive Rewards",
    body: "Holding activates automated reward mechanisms through Uniswap v4 Hooks.",
  },
  {
    icon: ConvictionIcon,
    title: "Long-Term Alignment",
    body: "Designed to reward conviction rather than short-term speculation.",
  },
  {
    icon: CommunityIcon,
    title: "Community First",
    body: "Every holder contributes to a stronger and more resilient ecosystem.",
  },
];

export function WhyHoodMoon() {
  return (
    <section id="rewards" className="bg-background py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Why HoodMoon"
          title="Holding Should Be Rewarded."
        />

        <Stagger className="mt-16 grid gap-6 md:grid-cols-3">
          {cards.map(({ icon: Icon, title, body }) => (
            <StaggerItem key={title}>
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="group flex h-full flex-col gap-5 rounded-3xl border border-edge bg-card p-8 transition-colors duration-500 hover:border-accent/30"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-edge bg-white/[0.03] text-accent transition-shadow duration-500 group-hover:shadow-[0_0_24px_rgba(0,200,5,0.25)]">
                  <Icon width={22} height={22} />
                </span>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{body}</p>
              </motion.article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
