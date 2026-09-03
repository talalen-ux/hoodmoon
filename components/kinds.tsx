import type { MarketKind } from "@/lib/store";
import {
  GapIcon,
  ClockIcon,
  BoltIcon,
  LayersIcon,
  CalendarIcon,
  TrendUpIcon,
  type IconType,
} from "./icons";

export type KindMeta = {
  label: string;
  tag: string;
  Icon: IconType;
  blurb: string;
};

export const KIND_META: Record<MarketKind, KindMeta> = {
  gap: {
    label: "The Gap",
    tag: "settles 9:30 · the open",
    Icon: GapIcon,
    blurb:
      "The token trades all night; the stock doesn't. Where does the real market open versus where the token drifted overnight? The one market that can only exist on a 24/7-token chain.",
  },
  close: {
    label: "The Close",
    tag: "settles 4:00 · the session",
    Icon: ClockIcon,
    blurb: "Direction and range on the cash session, settled at the bell.",
  },
  round: {
    label: "Rounds",
    tag: "15–30 min · always closing",
    Icon: BoltIcon,
    blurb: "Fast rotating pools cycling the tickers. Low rake — this is retention, not revenue.",
  },
  breadth: {
    label: "Breadth",
    tag: "daily · top-20 green",
    Icon: LayersIcon,
    blurb: "How many of the top 20 close green? One number, settled at 4:00.",
  },
  macro: {
    label: "Macro",
    tag: "fixed-minute print",
    Icon: CalendarIcon,
    blurb: "CPI, jobs, FOMC — high-attention one-offs that punctuate the calendar.",
  },
  earnings: {
    label: "Earnings",
    tag: "seasonal marquee",
    Icon: TrendUpIcon,
    blurb: "The wide post-print move. Four dense weeks a quarter — the peak, not the engine.",
  },
};
