import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const siteUrl = "https://print.markets";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Print — trade the gap, on-chain",
    template: "%s — Print",
  },
  description:
    "The token trades all night; the stock doesn't. Print runs pari-mutuel pools on the daily gap — where the real market opens at 9:30 versus where the token drifted overnight — plus the close, rotating rounds, and earnings as the seasonal peak. No LPs, no market makers: bettors are counterparty to each other. Built on Robinhood Chain, settled off Chainlink Data Streams.",
  keywords: [
    "Print",
    "the gap",
    "prediction market",
    "pari-mutuel",
    "Robinhood Chain",
    "Chainlink Data Streams",
    "on-chain betting",
    "overnight gap",
    "earnings",
  ],
  openGraph: {
    title: "Print — trade the gap, on-chain",
    description:
      "Pari-mutuel markets on the seam between a 24/7 token and the 9:30 open — the gap, the close, and rounds all day. Built on Robinhood Chain.",
    url: siteUrl,
    siteName: "Print",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Print — trade the gap, on-chain",
    description: "Pari-mutuel markets on the daily gap, settled on Robinhood Chain.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a120d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
