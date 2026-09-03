import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const siteUrl = "https://print.markets";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Print — trade the earnings reaction, on-chain",
    template: "%s — Print",
  },
  description:
    "Print runs pari-mutuel pools on post-earnings moves, settled on-chain the instant the print lands. Pick a bucket — ±3%, ±6%, ±10% — before the pool closes. No LPs, no market makers: bettors are counterparty to each other. Built on Robinhood Chain, settled off Chainlink Data Streams.",
  keywords: [
    "Print",
    "earnings",
    "prediction market",
    "pari-mutuel",
    "Robinhood Chain",
    "Chainlink Data Streams",
    "on-chain betting",
    "NVDA earnings",
  ],
  openGraph: {
    title: "Print — trade the earnings reaction, on-chain",
    description:
      "Pari-mutuel pools on the post-earnings move, settled on-chain the instant the print lands. Built on Robinhood Chain.",
    url: siteUrl,
    siteName: "Print",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Print — trade the earnings reaction, on-chain",
    description: "Pari-mutuel earnings-print markets on Robinhood Chain.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#06080a",
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
