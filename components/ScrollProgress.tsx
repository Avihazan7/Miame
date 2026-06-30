"use client";

import { useEffect } from "react";

/**
 * ScrollProgress — a slim תכלת ribbon along the top edge that fills as you move
 * through the page, giving the long scroll a sense of flow and momentum. RTL: it
 * grows from the reading start (right) toward the end (left). Sets a single CSS
 * var (--sp, 0→1); the bar itself is pure CSS. rAF-throttled, and it quietly
 * stands down for reduced-motion visitors.
 */
export default function ScrollProgress() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const root = document.documentElement;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = root.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      root.style.setProperty("--sp", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true" />;
}
