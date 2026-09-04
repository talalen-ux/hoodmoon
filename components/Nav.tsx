"use client";

import { useStore, SESSION_LABEL, refIsLive } from "@/lib/store";
import { MmMark } from "./icons";
import { WalletButton } from "./WalletButton";

export function Nav({ onHome }: { onHome: () => void }) {
  const { state, ready } = useStore();
  const live = ready && refIsLive(state.session);

  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
          aria-label="mm home"
        >
          <MmMark className="text-foreground" />
          <span className="text-[19px] font-bold lowercase tracking-tight">mm</span>
          <span className="hidden rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline">
            RH Chain
          </span>
        </button>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Main">
          <button onClick={onHome} className="transition-colors hover:text-foreground">
            Board
          </button>
          <a href="#fills" className="transition-colors hover:text-foreground">
            Fills
          </a>
          <a href="#distributions" className="transition-colors hover:text-foreground">
            Distributions
          </a>
          <a href="#how" className="transition-colors hover:text-foreground">
            How it works
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {ready && (
            <span
              className="hidden items-center gap-1.5 rounded-full border border-edge px-2.5 py-1 text-[11px] text-muted lg:inline-flex"
              title={
                live
                  ? "The stock is printing — the pool has something to snap back to."
                  : "The stock is shut. The pool trades on regardless, and the basis runs wide."
              }
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulse-dot bg-up" : "bg-rich"}`}
              />
              {SESSION_LABEL[state.session]}
            </span>
          )}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
