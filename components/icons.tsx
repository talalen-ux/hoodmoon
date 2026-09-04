import type { SVGProps, ReactElement } from "react";

type P = SVGProps<SVGSVGElement>;
export type IconType = (props: P) => ReactElement;

const base: P = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

/**
 * The mm mark — the whole trade in one glyph: a dashed line where the stock
 * really is, a solid line where the pool has run to, and an arrow pushing the
 * second down onto the first.
 */
export function MmMark(props: P) {
  return (
    <svg width={28} height={28} viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <path
        d="M4 22h24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 3"
        opacity="0.5"
      />
      <path d="M8 9h16" stroke="var(--color-rich)" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M16 11v8m0 0-3.2-3.2M16 19l3.2-3.2"
        stroke="var(--color-accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The gap between two prices — the thing mm gets paid for. */
export function BasisIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8h8" />
      <path d="M13 17h8" opacity="0.55" />
      <path d="M12 8v9" strokeDasharray="2 2" />
    </svg>
  );
}

/** Watching every pool. */
export function RadarIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" opacity="0.4" />
      <circle cx="12" cy="12" r="5" opacity="0.7" />
      <path d="M12 12 18.5 7" />
      <circle cx="16.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A fill landing. */
export function BoltIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

/** The quarter-hour clock. */
export function ClockIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

/** The sweep: one pot going out to many holders. */
export function SplitIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v6" />
      <path d="M12 9c0 3-6 3-6 6v3" />
      <path d="M12 9c0 3 6 3 6 6v3" />
      <circle cx="12" cy="3.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="6" cy="19" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="18" cy="19" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Hedged — the position is covered on the other side. */
export function ShieldIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v5.5c0 4.3-3 7.6-7 9.5-4-1.9-7-5.2-7-9.5V6l7-3Z" />
      <path d="M9.2 12.2 11.4 14.4 15 10.6" />
    </svg>
  );
}

export function LayersIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" opacity="0.5" />
    </svg>
  );
}

export function PoolIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="12" cy="7" rx="8" ry="3.2" />
      <path d="M4 7v10c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2V7" />
      <path d="M4 12c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2" opacity="0.5" />
    </svg>
  );
}

export function CheckIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function TrendUpIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M3 17 9 11l4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

export function ArrowDownIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4v15M12 19l-6-6M12 19l6-6" />
    </svg>
  );
}

export function ArrowUpIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20V5M12 5 6 11M12 5l6 6" />
    </svg>
  );
}

export function WalletIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18" opacity="0.4" />
      <circle cx="16.5" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CloseIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function BackIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function LinkIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M12.5 6.5 14 5a3.54 3.54 0 0 1 5 5l-1.5 1.5" />
      <path d="M11.5 17.5 10 19a3.54 3.54 0 0 1-5-5l1.5-1.5" />
    </svg>
  );
}

export function XIcon(props: P) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
    </svg>
  );
}
