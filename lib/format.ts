/** Formatting helpers for Print. */

export function usd(n: number, opts: { cents?: boolean } = {}): string {
  const abs = Math.abs(n);
  if (!opts.cents) {
    if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (abs >= 10_000) return `$${(n / 1_000).toFixed(0)}K`;
    if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  }
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  })}`;
}

export function usdFull(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function pct(n: number, signed = true): string {
  const s = signed && n > 0 ? "+" : "";
  return `${s}${n.toFixed(1)}%`;
}

export function mult(n: number): string {
  if (!isFinite(n)) return "∞";
  if (n >= 100) return `${n.toFixed(0)}×`;
  if (n >= 10) return `${n.toFixed(1)}×`;
  return `${n.toFixed(2)}×`;
}

export function prob(p: number): string {
  return `${Math.round(p * 100)}%`;
}

/** ms remaining → "2d 4h", "3h 12m", "08:42", or "closing". */
export function countdown(ms: number): string {
  if (ms <= 0) return "closed";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** epoch ms → "Wed 4:20 PM". */
export function clockLabel(ts: number): string {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${DAYS[d.getDay()]} ${h}:${String(m).padStart(2, "0")} ${ap}`;
}

export function dayLabel(ts: number): string {
  const d = new Date(ts);
  return `${DAYS[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function shortAddr(a: string): string {
  if (a.length <= 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function timeAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
