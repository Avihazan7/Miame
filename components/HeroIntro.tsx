"use client";

import { useEffect } from "react";

/**
 * HeroIntro — orchestrates the cinematic entrance lifecycle.
 *
 * The intro CLASSES are added before first paint by the inline gate in
 * layout.tsx (so there is no flash and no-JS visitors are unaffected). This
 * component's only job is to retire those classes once the sequence has
 * finished, handing the hero back to its calm idle state (floaty + the
 * cursor-driven ambient spotlight).
 */
export default function HeroIntro() {
  useEffect(() => {
    const root = document.documentElement;
    const full = root.classList.contains("intro-full");
    const quick = root.classList.contains("intro-quick");
    if (!full && !quick) return;

    const window_ = full ? 4600 : 1500;
    const t = setTimeout(() => {
      root.classList.remove("intro-full", "intro-quick", "intro-go");
      root.classList.add("intro-done");
    }, window_);
    return () => clearTimeout(t);
  }, []);

  return null;
}
