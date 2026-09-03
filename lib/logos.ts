/**
 * Ticker identity for avatars.
 *
 * LOGOS: real logo files. Drop an image into `public/logos/` (e.g. NVDA.svg)
 * and map it here; the avatar renders it in place of the tile. Kept as an
 * explicit registry so there are no 404 probes for symbols without a file.
 *
 * BRANDS: each ticker's brand color. Used to render a clean monogram tile
 * (ticker initials on the brand color) — a finance-app placeholder, not a
 * reproduction of any logo — whenever no real logo file is registered.
 */
export const LOGOS: Record<string, string> = {};

export const BRANDS: Record<string, string> = {
  NVDA: "#76b900",
  TSLA: "#e82127",
  AAPL: "#3a3a3c",
  HOOD: "#00c805",
  COIN: "#0052ff",
  AMD: "#ed1c24",
  META: "#0866ff",
  AMZN: "#ff9900",
  MSFT: "#0067b8",
  GOOGL: "#4285f4",
  PLTR: "#111827",
  NFLX: "#e50914",
  SOFI: "#00a0df",
  MARA: "#ea580c",
  MU: "#004990",
};
