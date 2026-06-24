"use client";

import { useEffect } from "react";

/**
 * MotionFx — brings the page to life as you scroll.
 *
 * Auto-tags content blocks (section heads, cards, media, rows…) and reveals
 * them with a soft rise + fade as they enter the viewport, cascading by their
 * order within each group. Intentionally driven from one place so the section
 * components stay clean. No-JS and reduced-motion visitors simply see all
 * content immediately (nothing is ever hidden without JS).
 */
const SELECTORS = [
  ".sec-head",
  ".card",
  ".feat-card",
  ".feat-show-main",
  ".feat-show-detail",
  ".stat-strip",
  ".partner-card",
  ".patent",
  ".elig-card",
  ".tribute-calc",
  ".life-card",
  ".testride-card",
  ".soon-card",
  ".flagship",
  ".dealer",
  ".map-embed",
  ".specs-table",
  ".specs-media",
  ".importer-inner",
  ".about-wrap",
  ".sim",
  ".rental-strip"
].join(",");

export default function MotionFx() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(SELECTORS));
    if (!nodes.length) return;

    // group siblings so cascades feel local, not page-wide
    const counters = new Map<Element, number>();
    nodes.forEach((el) => {
      const parent = el.parentElement || document.body;
      const i = counters.get(parent) ?? 0;
      counters.set(parent, i + 1);
      el.style.setProperty("--reveal-i", String(Math.min(i, 6)));
      el.classList.add("reveal");
    });

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    nodes.forEach((el) => io.observe(el));

    // safety: anything still hidden after load gets revealed
    const failsafe = window.setTimeout(() => {
      nodes.forEach((el) => el.classList.add("in"));
    }, 2600);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return null;
}
