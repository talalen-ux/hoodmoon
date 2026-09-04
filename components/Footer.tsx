import { MmMark } from "./icons";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-edge bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <MmMark width={22} height={22} />
          <span className="text-sm font-bold lowercase">mm</span>
          <span className="ml-2 text-xs text-muted">
            the market maker for mispriced equities on Robinhood Chain
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#distributions" className="transition-colors hover:text-foreground">Distributions</a>
          <a href="#fills" className="transition-colors hover:text-foreground">Fills</a>
          <a href="#" className="transition-colors hover:text-foreground">Docs</a>
        </div>
      </div>
      <div className="border-t border-edge">
        <p className="mx-auto max-w-7xl px-4 py-4 text-[11px] leading-relaxed text-muted/70 sm:px-6">
          Demo build — every pool, reference price, fill and distribution on this
          page is simulated in your browser. No chain is read or written, no
          wallet is connected, and no funds are involved. Venue names are
          placeholders. Past distributions are simulated and are not a forecast;
          a strategy that has been profitable is not a promise that it will be.
          Not investment advice. Trading tokenized equities may be restricted in
          your jurisdiction — making a production deployment compliant is the
          operator&apos;s responsibility.
        </p>
      </div>
    </footer>
  );
}
