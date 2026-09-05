/** Formatting helpers for tide. */

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

/** Dollars and cents, always — for anything a user is actually owed. */
export function usdc(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Same, but always carrying its sign — for PnL, where the sign is the point. */
export function signedUsd(n: number): string {
  const s = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${s}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const SUBS = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n: number) => String(n).split("").map((d) => SUBS[+d]).join("");

/**
 * A token price, at whatever scale the token happens to live.
 *
 * Memecoins routinely trade with five or more leading zeros, where plain
 * decimals turn into an unreadable smear and abbreviations lose the digits
 * that matter. Below a thousandth this switches to the notation the market
 * already uses — $0.0₅9512 — which keeps four significant figures no matter
 * how small the number gets.
 */
export function price(p: number): string {
  if (!isFinite(p) || p <= 0) return "$0.00";
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) {
    // Trim to four significant figures, but never past cents — "$12.4" reads
    // like a typo where "$12.40" reads like a price.
    const t = p.toFixed(4).replace(/(\.\d\d[1-9]*)0+$/, "$1");
    return `$${t}`;
  }
  if (p >= 0.001) return `$${p.toPrecision(4).replace(/0+$/, "")}`;
  const exp = Math.floor(Math.log10(p));
  const zeros = -exp - 1;
  const digits = Math.round(p * Math.pow(10, exp < 0 ? -exp + 3 : 3))
    .toString()
    .slice(0, 4);
  return `$0.0${sub(zeros)}${digits}`;
}

/** Token amounts: big balances round, small ones keep their precision. */
export function amount(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (abs >= 1) return n.toFixed(2);
  return n.toPrecision(3);
}

export function pct(n: number, signed = true, dp = 2): string {
  const s = signed && n > 0 ? "+" : "";
  return `${s}${n.toFixed(dp)}%`;
}

/** A percentage that may be enormous — APRs, mostly. Kept legible. */
export function bigPct(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100_000) return `${(n / 1000).toFixed(0)}k%`;
  if (abs >= 1000) return `${n.toFixed(0)}%`;
  return `${n.toFixed(1)}%`;
}

export function bps(n: number): string {
  return `${n.toFixed(n < 10 ? 2 : 0)} bps`;
}

/** A fee rate, written the way a pool advertises it. */
export function feePct(bpsValue: number): string {
  return `${(bpsValue / 100).toFixed(2)}%`;
}

export function count(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** ms → "3h 12m" or "08:42". */
export function duration(ms: number): string {
  if (ms <= 0) return "0m";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function stamp(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
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

export function shortAddr(a: string): string {
  return a.length <= 12 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function shortTx(a: string): string {
  return a.length <= 14 ? a : `${a.slice(0, 8)}…${a.slice(-6)}`;
}
