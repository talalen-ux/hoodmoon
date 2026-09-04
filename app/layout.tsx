import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const siteUrl = "https://mm.markets";

const description =
  "mm watches every pool where tokenized stocks trade on Robinhood Chain and marks each one against the real share price. When a pool trades far above the stock, mm sells into it and hedges at the reference, booking the edge on the spot. The profit goes to holders every 15 minutes, on-chain.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "mm — the market maker for mispriced equities",
    template: "%s — mm",
  },
  description,
  keywords: [
    "mm",
    "market maker",
    "tokenized equities",
    "basis trade",
    "Robinhood Chain",
    "arbitrage",
    "on-chain distributions",
    "AMM",
  ],
  openGraph: {
    title: "mm — the market maker for mispriced equities",
    description:
      "When a pool trades far above the real stock price, mm sells into it. The profit goes to holders every 15 minutes, on-chain.",
    url: siteUrl,
    siteName: "mm",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "mm — the market maker for mispriced equities",
    description:
      "When a pool trades far above the real stock price, mm sells into it. Profit to holders every 15 minutes, on-chain.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#06090c",
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
