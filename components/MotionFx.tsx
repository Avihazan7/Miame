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

/**
 * Reveal "personalities" — each content type enters with its own gesture so the
 * page feels composed rather than uniform, while staying one coherent language:
 *   • v-head  — section titles settle down with a soft upward clip-wipe
 *   • v-zoom  — media / visual blocks bloom in from a gentle blurred zoom
 *   • v-tilt  — wide strips glide up with a barely-there lift
 * Everything else keeps the calm default rise. First match wins.
 */
const VARIANTS: Array<{ sel: string; v: string }> = [
  { sel: ".sec-head", v: "v-head" },
  {
    sel: ".specs-media,.stage,.feat-show-main,.map-embed,.tribute-calc,.importer-inner,.specs-table",
    v: "v-zoom"
  },
  { sel: ".stat-strip,.rental-strip", v: "v-tilt" }
];

function variantFor(el: Element): string | null {
  for (const { sel, v } of VARIANTS) {
    if (el.matches(sel)) return v;
  }
  return null;
}

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
      const v = variantFor(el);
      if (v) el.classList.add(v);
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
