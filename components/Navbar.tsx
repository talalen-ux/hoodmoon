"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoonMark } from "./icons";
import { EASE } from "./motion";

const links = [
  { label: "Rewards", href: "#rewards" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Tokenomics", href: "#tokenomics" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500 ${
        scrolled
          ? "border-edge bg-black/70 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6"
      >
        {/* Left: logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-80"
          aria-label="HoodMoon home"
        >
          <MoonMark className="text-foreground" />
          <span className="text-sm font-semibold tracking-[0.18em]">
            HOODMOON
          </span>
        </a>

        {/* Center: links */}
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-muted transition-colors duration-300 hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right: CTA */}
        <div className="flex items-center gap-3">
          <a
            href="#buy"
            className="hidden rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black transition-shadow duration-300 hover:shadow-[0_0_24px_rgba(204,255,0,0.45)] md:inline-block"
          >
            Buy Token
          </a>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground md:hidden"
          >
            <span className="relative block h-3 w-5">
              <span
                className={`absolute left-0 top-0 h-px w-5 bg-current transition-transform duration-300 ${
                  open ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[6px] h-px w-5 bg-current transition-opacity duration-300 ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[12px] h-px w-5 bg-current transition-transform duration-300 ${
                  open ? "-translate-y-[6px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden border-t border-edge bg-black/90 backdrop-blur-xl md:hidden"
          >
            <ul className="flex flex-col gap-1 px-6 py-4">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-2 py-3 text-base text-muted transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <a
                  href="#buy"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold text-black"
                >
                  Buy Token
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
