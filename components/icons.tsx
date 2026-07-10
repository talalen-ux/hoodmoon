import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

/** HoodMoon mark: a crescent moon carved from a circle by an orbital arc. */
export function MoonMark(props: IconProps) {
  return (
    <svg width={28} height={28} viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <path
        d="M20.5 5.6A11.2 11.2 0 1 0 26.4 16 8.4 8.4 0 0 1 20.5 5.6Z"
        fill="currentColor"
      />
      <circle cx="27" cy="9" r="1.6" fill="#00C805" />
    </svg>
  );
}

export function ChainIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M12.5 6.5 14 5a3.54 3.54 0 0 1 5 5l-1.5 1.5" />
      <path d="M11.5 17.5 10 19a3.54 3.54 0 0 1-5-5l1.5-1.5" />
    </svg>
  );
}

export function HookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v9a4.5 4.5 0 1 1-9 0v-1" />
      <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none" />
      <path d="M16 8a5 5 0 0 1 5 5v1a5 5 0 0 1-5 5" opacity="0.5" />
    </svg>
  );
}

export function OpenIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8" />
      <path d="M12 3a15.3 15.3 0 0 1 0 18 15.3 15.3 0 0 1 0-18Z" />
    </svg>
  );
}

export function CommunityIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="16.5" cy="9.5" r="2.25" opacity="0.6" />
      <path d="M15.5 14.6a4.5 4.5 0 0 1 5 4.4" opacity="0.6" />
    </svg>
  );
}

export function RewardsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.25 10a2.75 2.4 0 1 1 2.75 2 2.75 2.4 0 1 0 2.75 2" />
    </svg>
  );
}

export function ConvictionIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 17.5 9.5 12l3.5 3.5L20 8.5" />
      <path d="M15.5 8.5H20V13" />
      <path d="M4 21h16" opacity="0.4" />
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18" opacity="0.4" />
      <circle cx="16.5" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SwapIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4v12" />
      <path d="m4 13 3 3 3-3" />
      <path d="M17 20V8" />
      <path d="m14 11 3-3 3 3" />
    </svg>
  );
}

export function DistributeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="2.25" />
      <path d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21" opacity="0.7" />
      <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="21" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="21" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4v16" />
      <path d="m6 14 6 6 6-6" />
    </svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
    </svg>
  );
}
