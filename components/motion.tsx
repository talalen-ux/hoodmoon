"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Fade + rise + de-blur on scroll into view. The workhorse reveal
 * used by nearly every section.
 */
export function FadeIn({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={
        reduce ? { opacity: 0 } : { opacity: 0, y, filter: "blur(6px)" }
      }
      whileInView={
        reduce
          ? { opacity: 1 }
          : { opacity: 1, y: 0, filter: "blur(0px)" }
      }
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const staggerParent: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE },
  },
};

/** Parent container that staggers its <StaggerItem> children. */
export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  );
}

/** Standard section heading block: eyebrow, title, optional lede. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "center" | "left";
}) {
  const alignCls =
    align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <FadeIn className={`flex flex-col gap-4 ${alignCls}`}>
      {eyebrow ? (
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {title}
      </h2>
      {lede ? (
        <p className="max-w-xl text-balance text-base leading-relaxed text-muted sm:text-lg">
          {lede}
        </p>
      ) : null}
    </FadeIn>
  );
}
