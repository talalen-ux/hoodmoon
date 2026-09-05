"use client";

import { TideMark } from "./icons";
import { WalletButton } from "./WalletButton";

export function Nav({ onHome, onPositions }: { onHome: () => void; onPositions: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
          aria-label="tide home"
        >
          <TideMark />
          <span className="text-[19px] font-bold lowercase tracking-tight">tide</span>
          <span className="hidden rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline">
            RH Chain
          </span>
        </button>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Main">
          <button onClick={onHome} className="transition-colors hover:text-foreground">
            Pools
          </button>
          <button onClick={onPositions} className="transition-colors hover:text-foreground">
            My positions
          </button>
          <a href="#how" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#onchain" className="transition-colors hover:text-foreground">
            On-chain
          </a>
        </nav>

        <WalletButton />
      </div>
    </header>
  );
}
