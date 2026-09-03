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

/** Print mark — a "P" beside a rising print tick. */
export function PrintMark(props: P) {
  return (
    <svg width={26} height={26} viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <path
        d="M6 24V8M6 8h6a4 4 0 0 1 0 8H6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 22l4.5-6 3 3 2.5-3.5"
        stroke="var(--color-accent)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The Gap — the seam between the overnight token level and the 9:30 open. */
export function GapIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M3 15h7" opacity="0.55" />
      <path d="M14 9h7" />
      <path d="M12 20V4M12 4l-3 3M12 4l3 3" />
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
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function CalendarIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function LockIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
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

export function LayersIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" opacity="0.5" />
    </svg>
  );
}

export function ScaleIcon(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v18M7 7h10" />
      <path d="M7 7 4 13a3 3 0 0 0 6 0L7 7ZM17 7l-3 6a3 3 0 0 0 6 0l-3-6Z" />
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

export function ChevronDown(props: P) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
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
