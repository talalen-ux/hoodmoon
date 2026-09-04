/** Formatting helpers for mm. */

export function usd(n: number, opts: { cents?: boolean } = {}): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (!opts.cents) {
    if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 10_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  })}`;
}

export function usdFull(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/** Dollars-and-cents, always. For anything a holder is actually owed. */
export function usdc(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** A share price: two decimals, no abbreviation. */
export function px(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** The unit the whole product is measured in. */
export function bps(n: number, signed = true): string {
  const s = signed && n > 0 ? "+" : "";
  return `${s}${Math.round(n)} bps`;
}

export function pct(n: number, signed = true, dp = 2): string {
  const s = signed && n > 0 ? "+" : "";
  return `${s}${n.toFixed(dp)}%`;
}

/** bps → the same number as a percentage, for people who read it that way. */
export function bpsAsPct(n: number, signed = true): string {
  return pct(n / 100, signed, 2);
}

export function qty(n: number): string {
  if (n >= 10_000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 100) return n.toFixed(1);
  return n.toFixed(2);
}

export function count(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** Token balances: big, round, no cents. */
export function tokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** ms remaining → "3h 12m" or "08:42". */
export function countdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** epoch ms → "14:35:02", the way a trade blotter stamps it. */
export function stamp(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

/** epoch ms → "14:30", for epoch boundaries. */
export function hhmm(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function shortAddr(a: string): string {
  if (a.length <= 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function shortTx(a: string): string {
  if (a.length <= 14) return a;
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
}

export function timeAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
