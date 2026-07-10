import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const siteUrl = "https://hoodmoon.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HoodMoon — Hold Longer. Earn More.",
    template: "%s — HoodMoon",
  },
  description:
    "HoodMoon is the community token of Robinhood Chain that rewards long-term holders through Uniswap v4 Hooks. Simply holding unlocks onchain rewards.",
  keywords: [
    "HoodMoon",
    "Robinhood Chain",
    "Uniswap v4 Hooks",
    "community token",
    "holding rewards",
    "onchain rewards",
  ],
  openGraph: {
    title: "HoodMoon — Hold Longer. Earn More.",
    description:
      "The community token of Robinhood Chain that rewards long-term holders through Uniswap v4 Hooks.",
    url: siteUrl,
    siteName: "HoodMoon",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "HoodMoon — Hold Longer. Earn More.",
    description:
      "The community token of Robinhood Chain that rewards long-term holders through Uniswap v4 Hooks.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
