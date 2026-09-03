/**
 * Real ticker logos. Drop files into `public/logos/` (e.g. NVDA.svg) and add
 * the mapping here — the avatar renders the image when a symbol is present,
 * and falls back to the emoji tile otherwise. Kept as an explicit registry so
 * there are no 404 probes for symbols that have no logo yet (CPI, TOP20, …).
 *
 * Example once files exist:
 *   NVDA: "/logos/NVDA.svg",
 *   TSLA: "/logos/TSLA.svg",
 */
export const LOGOS: Record<string, string> = {};
