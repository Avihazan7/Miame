"use client";

// components/CardSpotlight.tsx — the near-field light.
//
// One passive, rAF-throttled pointermove listener for the whole document. It
// resolves the surface under the cursor with closest(), writes the pointer's
// position on THAT element as two custom properties, and lets the stylesheet
// draw the gradient. React never re-renders; this component returns null and
// exists only to own the listener's lifecycle.
//
// It backs off exactly where the page-level spotlight does: coarse pointers have
// no hover to follow, and a visitor who asked for reduced motion is not shown a
// light that chases them.

import { useEffect } from "react";
import { SPOTLIGHT_SELECTOR, SPOTLIGHT_VARS } from "@/lib/spotlight";

export default function CardSpotlight() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    // The RAW client coordinates and the surface under them. The rect read that
    // turns them into element-local ones happens in paint(), once a frame —
    // pointermove fires many times between frames, and doing the read here would
    // be a forced layout per event, which is precisely the jank this defends against.
    let pending: { el: HTMLElement; cx: number; cy: number } | null = null;
    // The last surface we lit. Kept so it can be dimmed when the pointer leaves
    // it — without this, every card the cursor ever crossed stays lit.
    let lit: HTMLElement | null = null;

    const paint = () => {
      raf = 0;
      const next = pending;
      pending = null;
      if (lit && lit !== next?.el) {
        lit.style.setProperty(SPOTLIGHT_VARS.on, "0");
        lit = null;
      }
      if (!next) return;
      const r = next.el.getBoundingClientRect();
      next.el.style.setProperty(SPOTLIGHT_VARS.x, `${next.cx - r.left}px`);
      next.el.style.setProperty(SPOTLIGHT_VARS.y, `${next.cy - r.top}px`);
      next.el.style.setProperty(SPOTLIGHT_VARS.on, "1");
      lit = next.el;
    };

    const onMove = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target.closest(SPOTLIGHT_SELECTOR) : null;
      if (target instanceof HTMLElement) {
        pending = { el: target, cx: e.clientX, cy: e.clientY };
      } else {
        pending = null;
      }
      if (!raf) raf = requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
      lit?.style.setProperty(SPOTLIGHT_VARS.on, "0");
    };
  }, []);

  return null;
}
