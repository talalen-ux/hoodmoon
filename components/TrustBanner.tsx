"use client";

import { Stagger, StaggerItem } from "./motion";
import { ChainIcon, HookIcon, OpenIcon, CommunityIcon } from "./icons";

const items = [
  { icon: ChainIcon, label: "Built on Robinhood Chain" },
  { icon: HookIcon, label: "Powered by Uniswap v4 Hooks" },
  { icon: OpenIcon, label: "Permissionless" },
  { icon: CommunityIcon, label: "Community Owned" },
];

export function TrustBanner() {
  return (
    <section aria-label="Trust" className="border-y border-edge bg-surface">
      <Stagger className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-6 py-10 sm:py-12 lg:grid-cols-4">
        {items.map(({ icon: Icon, label }) => (
          <StaggerItem
            key={label}
            className="flex items-center justify-center gap-3 text-center"
          >
            <Icon className="shrink-0 text-accent" />
            <span className="text-sm font-medium text-muted">{label}</span>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
