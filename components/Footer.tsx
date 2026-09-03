import { PrintMark } from "./icons";

export function Footer() {
  return (
    <footer className="mt-8 border-t border-edge bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <PrintMark width={22} height={22} />
          <span className="text-sm font-bold">Print</span>
          <span className="ml-2 text-xs text-muted">earnings-print markets on Robinhood Chain</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#calendar" className="transition-colors hover:text-foreground">Calendar</a>
          <a href="#" className="transition-colors hover:text-foreground">Docs</a>
          <a href="#" className="transition-colors hover:text-foreground">X</a>
        </div>
      </div>
      <div className="border-t border-edge">
        <p className="mx-auto max-w-6xl px-4 py-4 text-[11px] leading-relaxed text-muted/70 sm:px-6">
          Demo build — pools, bets, and settlement are simulated client-side and
          no real funds are involved. Not investment advice. Prediction markets
          may be restricted in your jurisdiction; a production deployment is the
          operator&apos;s responsibility to make compliant. Settlement shown as
          Chainlink Data Streams is illustrative.
        </p>
      </div>
    </footer>
  );
}
