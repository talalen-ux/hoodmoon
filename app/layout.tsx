import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const siteUrl = "https://tide.markets";

const description =
  "tide is one-tap concentrated liquidity on the highest-volume memecoins, built on Robinhood Chain. Pick a preset instead of a bin range, see the on-chain checks before you deposit, and read one honest number on every position: fees earned less impermanent loss and costs — whether you actually beat holding.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "tide — LP the memecoins without the guesswork",
    template: "%s — tide",
  },
  description,
  keywords: [
    "tide",
    "liquidity provision",
    "concentrated liquidity",
    "binned liquidity",
    "memecoins",
    "Robinhood Chain",
    "impermanent loss",
    "DLMM",
  ],
  openGraph: {
    title: "tide — LP the memecoins without the guesswork",
    description:
      "One tap to a position. One number that tells you whether you actually beat holding.",
    url: siteUrl,
    siteName: "tide",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "tide — LP the memecoins without the guesswork",
    description:
      "One-tap concentrated liquidity on memecoins, with an honest impermanent-loss number on every position.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0812",
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
