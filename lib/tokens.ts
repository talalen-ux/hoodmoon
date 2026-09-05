/**
 * The tokens tide lists, and how they are drawn.
 *
 * Colour is identity here: every bin chart, position card and sparkline keys
 * off the token's own hue, so a glance at the board is enough to know what
 * you are looking at. `logo` is an optional real image — drop a file into
 * `public/logos/` and register it, and the avatar uses it instead of the
 * lettered tile. Kept as an explicit map so no symbol triggers a 404 probe.
 */
export type TokenMeta = { name: string; color: string; logo?: string };

export const TOKENS: Record<string, TokenMeta> = {
  PEPE: { name: "Pepe", color: "#4bab4b" },
  WIF: { name: "dogwifhat", color: "#d8a25e" },
  BONK: { name: "Bonk", color: "#f6a01a" },
  POPCAT: { name: "Popcat", color: "#e0806a" },
  MOG: { name: "Mog Coin", color: "#c78ae0" },
  BRETT: { name: "Brett", color: "#3f7fd8" },
  TURBO: { name: "Turbo", color: "#e2564f" },
  SPX: { name: "SPX6900", color: "#5fbf8f" },
  MEW: { name: "cat in a dogs world", color: "#8f7ae5" },
  GIGA: { name: "Gigachad", color: "#7d8b99" },
  PONKE: { name: "Ponke", color: "#c96f3a" },
  MICHI: { name: "Michi", color: "#dfc14a" },
  DOGE: { name: "Dogecoin", color: "#c3a634" },
  SHIB: { name: "Shiba Inu", color: "#e4761b" },
};

export const QUOTE = "USDC";

export function tokenMeta(symbol: string): TokenMeta {
  return TOKENS[symbol] ?? { name: symbol, color: "#7d8b99" };
}
