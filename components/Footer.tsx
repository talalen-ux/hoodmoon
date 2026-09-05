import { TideMark } from "./icons";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-edge bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <TideMark width={22} height={22} />
          <span className="text-sm font-bold lowercase">tide</span>
          <span className="ml-2 text-xs text-muted">liquidity that follows the price</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#onchain" className="transition-colors hover:text-foreground">On-chain</a>
          <a href="#" className="transition-colors hover:text-foreground">Docs</a>
        </div>
      </div>
      <div className="border-t border-edge">
        <p className="mx-auto max-w-7xl px-4 py-4 text-[11px] leading-relaxed text-muted/70 sm:px-6">
          Demo build — every pool, price, swap, fee and position on this page is
          simulated in your browser, and the clock runs at 90&times; real time so
          a minute of watching is roughly an hour and a half of pool activity.
          No chain is read or written and no funds are involved. Token names are real; the prices are plausible starting
          points, not market data, and everything after the first tick is
          invented. Providing liquidity to memecoin pools can and frequently
          does lose money, including when the position shows a profit. Nothing
          here is investment advice.
        </p>
      </div>
    </footer>
  );
}
