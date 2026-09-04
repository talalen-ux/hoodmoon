"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore, SUPPLY } from "@/lib/store";
import { usdc, tokens, shortAddr, pct } from "@/lib/format";
import { WalletIcon, CloseIcon, SplitIcon } from "./icons";

/** Mock RH Chain wallet. Mainnet swaps this for a real EVM connector. */
export function WalletButton() {
  const { state, dispatch } = useStore();
  const { user } = state;
  const [sheet, setSheet] = useState(false);
  const [menu, setMenu] = useState(false);

  const share = user.mm / SUPPLY;

  if (user.connected) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenu((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-edge bg-white/[0.03] py-1.5 pl-3 pr-2 text-sm transition-colors hover:border-edge-strong"
        >
          <span className="hidden font-mono text-xs text-accent tnum sm:inline">
            {tokens(user.mm)} mm
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-dim text-[10px] font-bold text-black">
            {user.address.slice(2, 4).toUpperCase()}
          </span>
        </button>
        <AnimatePresence>
          {menu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-edge bg-elevated p-3 shadow-2xl"
              >
                <p className="text-xs text-muted">Robinhood Chain · demo</p>
                <p className="mt-1 font-mono text-sm">{shortAddr(user.address)}</p>

                <div className="mt-3 rounded-lg border border-edge bg-white/[0.02] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted">Holdings</p>
                  <p className="font-mono text-lg font-semibold tnum">
                    {tokens(user.mm)} <span className="text-sm text-muted">mm</span>
                  </p>
                  <p className="text-[11px] text-muted">
                    {pct(share * 100, false, 3)} of supply — your cut of every sweep
                  </p>
                </div>

                <div className="mt-2 rounded-lg border border-accent/20 bg-accent/[0.06] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted">Claimable</p>
                  <p className="font-mono text-lg font-semibold text-accent tnum">
                    {usdc(user.claimable)}
                  </p>
                  <button
                    type="button"
                    disabled={user.claimable <= 0}
                    onClick={() => dispatch({ type: "CLAIM" })}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent py-2 text-xs font-semibold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <SplitIcon width={14} height={14} />
                    {user.claimable > 0 ? "Claim" : "Nothing to claim yet"}
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-muted">
                  <span>claimed to date</span>
                  <span className="font-mono tnum text-foreground">{usdc(user.paid)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: "DISCONNECT" });
                    setMenu(false);
                  }}
                  className="mt-3 w-full rounded-lg border border-edge py-2 text-sm text-muted transition-colors hover:border-down/40 hover:text-down"
                >
                  Disconnect
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setSheet(true)}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-shadow hover:shadow-[0_0_24px_rgba(0,229,154,0.45)]"
      >
        <WalletIcon width={16} height={16} />
        Connect
      </button>

      <AnimatePresence>
        {sheet && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSheet(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-t-2xl border border-edge bg-elevated p-6 sm:rounded-2xl"
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Connect to Robinhood Chain</h3>
                <button type="button" onClick={() => setSheet(false)} className="text-muted hover:text-foreground">
                  <CloseIcon />
                </button>
              </div>
              <p className="mb-5 text-xs text-muted">
                Holding mm is the whole position — the sweep finds you every
                quarter hour, whether or not you are watching.
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { name: "Robinhood Wallet", tag: "native", emoji: "🪶" },
                  { name: "MetaMask", tag: "", emoji: "🦊" },
                  { name: "Rabby", tag: "", emoji: "🐰" },
                ].map((w) => (
                  <button
                    key={w.name}
                    type="button"
                    onClick={() => {
                      dispatch({ type: "CONNECT" });
                      setSheet(false);
                    }}
                    className="flex items-center gap-3 rounded-xl border border-edge bg-white/[0.02] p-3 text-left transition-colors hover:border-accent/50 hover:bg-white/[0.04]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] text-xl">
                      {w.emoji}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium">{w.name}</span>
                      {w.tag && <span className="block text-xs text-accent">{w.tag}</span>}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
                Demo mode — connecting mints a mock holder with 250,000 mm. No
                real wallet, keys, or funds are involved.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
