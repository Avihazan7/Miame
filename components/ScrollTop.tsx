"use client";

import { useEffect } from "react";

/**
 * ScrollTop — on first load, return the page to the very top.
 *
 * Browsers (and bfcache) restore the previous scroll position on refresh or
 * back-navigation, which left visitors landing in the middle of the page.
 * We force the top on mount, but never override an explicit deep-link anchor
 * (e.g. /#partner) so shared section links keep working.
 */
export default function ScrollTop() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  return null;
}
