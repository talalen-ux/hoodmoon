"use client";

import { PrintMark } from "./icons";
import { WalletButton } from "./WalletButton";

export function Nav({ onHome }: { onHome: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
          aria-label="Print home"
        >
          <PrintMark className="text-foreground" />
          <span className="text-[17px] font-bold tracking-tight">Print</span>
          <span className="hidden rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline">
            RH Chain
          </span>
        </button>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Main">
          <button onClick={onHome} className="transition-colors hover:text-foreground">
            Markets
          </button>
          <a href="#gap" className="transition-colors hover:text-foreground">
            The Gap
          </a>
          <a href="#rounds" className="transition-colors hover:text-foreground">
            Rounds
          </a>
          <a href="#how" className="transition-colors hover:text-foreground">
            How it works
          </a>
        </nav>

        <WalletButton />
      </div>
    </header>
  );
}
