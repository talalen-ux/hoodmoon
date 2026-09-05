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
 * The tide mark — a row of liquidity bins peaking at the active price.
 * It is the product's one real picture, shrunk to a logo.
 */
export function TideMark(props: P) {
  return (
    <svg width={28} height={28} viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <rect x="3" y="18" width="3.6" height="9" rx="1.3" fill="var(--color-quote)" opacity="0.75" />
      <rect x="8.6" y="13.5" width="3.6" height="13.5" rx="1.3" fill="var(--color-quote)" />
      <rect x="14.2" y="7" width="3.6" height="20" rx="1.3" fill="currentColor" />
      <rect x="19.8" y="13.5" width="3.6" height="13.5" rx="1.3" fill="var(--color-base)" />
      <rect x="25.4" y="18" width="3.6" height="9" rx="1.3" fill="var(--color-base)" opacity="0.75" />
    </svg>
  );
}

/** Bins — the shape of a position. */
export function BinsIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20v-5M8.7 20v-9M13.3 20V6M18 20v-9M22 20v-5" />
    </svg>
  );
}

/** Liquidity that follows the price. */
export function TideIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 9c2-2.2 4-2.2 6 0s4 2.2 6 0 4-2.2 6 0" />
      <path d="M2.5 15c2-2.2 4-2.2 6 0s4 2.2 6 0 4-2.2 6 0" opacity="0.5" />
    </svg>
  );
}

export function ShieldIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v5.5c0 4.3-3 7.6-7 9.5-4-1.9-7-5.2-7-9.5V6l7-3Z" />
      <path d="M9.2 12.2 11.4 14.4 15 10.6" />
    </svg>
  );
}

export function ScaleIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v18M6 7h12" />
      <path d="M6 7 3 13a3 3 0 0 0 6 0L6 7ZM18 7l-3 6a3 3 0 0 0 6 0l-3-6Z" />
    </svg>
  );
}

export function BoltIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

export function ClockIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function AlertIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.5 2.8 20h18.4L12 4.5Z" />
      <path d="M12 10v4.2M12 17.4h.01" />
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

export function CrossIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
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

export function PlusIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function InfoIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}
